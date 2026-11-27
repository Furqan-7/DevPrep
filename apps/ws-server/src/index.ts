import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import { WebSocket, WebSocketServer, RawData } from "ws";
import { transcribeAudio } from "./services/transcription.service";
import { prewarmAuthoritativeSession, streamAuthoritativeInterviewTurn } from "./services/authoritative-interview.service";
import { TextChunker, DeepgramStreamingTtsSession } from "./services/tts.service";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

const PORT = Number(process.env.PORT) || 8080;

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

interface ClientSession {
    sessionId?: number;
    token?: string;
    role?: string;
    difficulty?: string;
    currentQuestion?: string;
    mimeType: string;
    sampleRate: number;
    audioChunks: Buffer[];
    isRecording: boolean;
    isTranscribing: boolean;
    isGenerating: boolean;
    isSpeaking: boolean;
    currentTtsSession?: DeepgramStreamingTtsSession | null;
    prewarmedTtsSession?: DeepgramStreamingTtsSession | null;
    persistentTtsSession?: DeepgramStreamingTtsSession | null;
    /** Transcription started during the candidate's pause, for the audio received so far. */
    speculative?: SpeculativeTranscript | null;
    lastPrewarmAt?: number;
}

interface SpeculativeTranscript {
    /** Number of audio chunks it covers; any new chunk means the candidate kept talking. */
    chunks: number;
    result: Promise<{ text: string; latencyMs: number }>;
    startedAt: number;
}

// Backend prewarms are cheap but not free; one every few seconds per connection is plenty.
const PREWARM_INTERVAL_MS = 3000;

function prewarmBackend(session: ClientSession, force = false) {
    if (!session.sessionId) return;
    const now = Date.now();
    if (!force && session.lastPrewarmAt && now - session.lastPrewarmAt < PREWARM_INTERVAL_MS) return;
    session.lastPrewarmAt = now;
    prewarmAuthoritativeSession(session.sessionId, session.token);
}

/** The buffered turn as one audio file, plus its spoken length for pace stats. */
function buildTurnAudio(session: ClientSession): { audio: Buffer; mimeType: string; speakingMs?: number } {
    let audio: Buffer = Buffer.concat(session.audioChunks);
    let mimeType = session.mimeType;
    let speakingMs: number | undefined;
    // Answer length is only known for raw 16-bit mono PCM
    if (session.mimeType.includes("wav") || session.mimeType.includes("pcm")) {
        speakingMs = Math.round((audio.length / 2 / (session.sampleRate || 16000)) * 1000);
        audio = ensureWavHeader(audio, session.sampleRate || 16000);
        mimeType = "audio/wav";
    }
    return { audio, mimeType, speakingMs };
}

interface ActiveSessionRegistration {
    ws: WebSocket;
    sessionId: number;
    hasSpokenQuestion1: boolean;
    currentQuestion?: string;
}

// Global registry enforcing ONE active WebSocket connection and ONE Question 1 TTS per interview session
const activeSessionRegistry = new Map<number, ActiveSessionRegistration>();

function ensureWavHeader(buffer: Buffer, sampleRate: number = 16000, channels: number = 1, bitDepth: number = 16): Buffer {
    if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WAVE") {
        return buffer;
    }
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataLength = buffer.length;
    const fileLength = dataLength + 36;

    header.write("RIFF", 0);
    header.writeUInt32LE(fileLength, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // Linear PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataLength, 40);

    return Buffer.concat([header, buffer]) as any;
}

wss.on("connection", (client) => {
    console.log("[ws-server] New client connected");

    const session: ClientSession = {
        mimeType: "audio/webm;codecs=opus",
        sampleRate: 16000,
        audioChunks: [],
        isRecording: false,
        isTranscribing: false,
        isGenerating: false,
        isSpeaking: false,
        currentTtsSession: null,
        prewarmedTtsSession: null,
        persistentTtsSession: null,
    };

    // Opens Deepgram ahead of the reply, or replaces a prewarmed socket that has since closed
    // (long answers can outlive it), so the handshake is never on the critical path.
    const ensureTtsPrewarm = () => {
        if (session.prewarmedTtsSession && session.prewarmedTtsSession.isAlive()) return;
        try {
            session.prewarmedTtsSession = new DeepgramStreamingTtsSession({
                model: "flux-hannah-en",
                sampleRate: 24000,
                onAudioChunk: (audioChunk) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(audioChunk, { binary: true });
                    }
                },
            });
            session.prewarmedTtsSession.start();
        } catch (err) {
            session.prewarmedTtsSession = null;
            console.warn("[ws-server] Deepgram prewarm error:", err);
        }
    };

    client.on("message", async (data: RawData, isBinary: boolean) => {
        if (isBinary) {
            const chunk = Buffer.isBuffer(data)
                ? data
                : Array.isArray(data)
                ? Buffer.concat(data)
                : Buffer.from(data as ArrayBuffer);

            // Accumulate binary audio chunks while not transcribing
            if (!session.isTranscribing) {
                session.audioChunks.push(chunk);
            }
            return;
        }

        try {
            const parsedMessage = JSON.parse(data.toString());
            console.log("[ws-server] Received JSON message:", parsedMessage.type);

            // 1. Session Initialization & Question 1 Delivery
            if (parsedMessage.type === "init_session") {
                const sessId = parsedMessage.sessionId ? parseInt(String(parsedMessage.sessionId), 10) : undefined;
                if (!sessId || isNaN(sessId)) {
                    console.warn("[ws-server] init_session received without valid sessionId");
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "error", message: "Invalid or missing sessionId" }));
                    }
                    return;
                }

                // Check for existing connection for this session and close stale client connection
                const existing = activeSessionRegistry.get(sessId);
                if (existing && existing.ws !== client) {
                    console.log(`[ws-server] Superseding previous connection for session #${sessId}`);
                    try {
                        existing.ws.close(1000, "Superseded by new session connection");
                    } catch {}
                }

                session.sessionId = sessId;
                session.token = parsedMessage.token;
                session.role = parsedMessage.role;
                session.difficulty = parsedMessage.difficulty;
                session.currentQuestion = parsedMessage.firstQuestion;

                const alreadySpokeQ1 = existing ? existing.hasSpokenQuestion1 : false;

                activeSessionRegistry.set(sessId, {
                    ws: client,
                    sessionId: sessId,
                    hasSpokenQuestion1: alreadySpokeQ1,
                    currentQuestion: parsedMessage.firstQuestion,
                });

                console.log(`[ws-server] Initialized authoritative session #${sessId} for role: ${session.role}`);

                // Load the session into the backend cache while Zara greets the candidate
                prewarmBackend(session, true);

                // Speak Question 1 through production Deepgram TTS pipeline ONCE per session lifecycle
                if (parsedMessage.firstQuestion && !alreadySpokeQ1) {
                    const reg = activeSessionRegistry.get(sessId);
                    if (reg) reg.hasSpokenQuestion1 = true;

                    const greeting = `Hi, I'm Zara, your AI interviewer at DevPrep. ${parsedMessage.firstQuestion}`;
                    console.log(`[ws-server] Delivering authoritative Question 1: "${greeting}"`);

                    session.isSpeaking = true;
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "tts_start",
                            format: "linear16",
                            sampleRate: 24000,
                            channels: 1,
                            model: "flux-hannah-en",
                        }));
                        client.send(JSON.stringify({
                            type: "ai_text_chunk",
                            text: greeting,
                        }));
                    }

                    const ttsSession = new DeepgramStreamingTtsSession({
                        model: "flux-hannah-en",
                        sampleRate: 24000,
                        onAudioChunk: (audioChunk) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(audioChunk, { binary: true });
                            }
                        },
                    });
                    session.currentTtsSession = ttsSession;
                    ttsSession.start();
                    ttsSession.sendTextChunk(greeting);
                    const ttsResult = await ttsSession.finish();
                    session.currentTtsSession = null;

                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "ai_text_end",
                            model: "flux-hannah-en",
                        }));
                        client.send(JSON.stringify({
                            type: "tts_end",
                            timeToFirstAudioMs: ttsResult.timeToFirstAudioMs,
                            totalTtsLatencyMs: ttsResult.totalDurationMs,
                            totalBytes: ttsResult.totalBytes,
                            audioDurationSec: ttsResult.audioDurationSec,
                            sampleRate: ttsResult.sampleRate,
                            model: ttsResult.model,
                        }));
                    }
                    session.isSpeaking = false;
                }
                return;
            }

            if (parsedMessage.type === "start_recording" || parsedMessage.mimeType) {
                if (parsedMessage.mimeType) session.mimeType = parsedMessage.mimeType;
                if (parsedMessage.sampleRate) session.sampleRate = parsedMessage.sampleRate;
                session.audioChunks = [];
                session.speculative = null;
                session.isRecording = true;
                session.isTranscribing = false;
                session.isGenerating = false;
                session.isSpeaking = false;
                return;
            }

            if (parsedMessage.type === "speech_started") {
                console.log(`[VAD] speech_started. Resetting audio buffer.`);
                session.audioChunks = [];
                session.speculative = null;
                session.isRecording = true;
                session.isTranscribing = false;
                session.isGenerating = false;
                session.isSpeaking = false;

                // Abort any currently speaking TTS immediately
                if (session.currentTtsSession) {
                    session.currentTtsSession.abort();
                    session.currentTtsSession = null;
                    session.persistentTtsSession = null;
                }

                // Reuse the completed OPEN session; only abort an unusable prewarm.
                if (session.persistentTtsSession && session.persistentTtsSession.isAlive()) {
                    session.persistentTtsSession.prepareForNextTurn();
                    session.prewarmedTtsSession = session.persistentTtsSession;
                } else if (session.prewarmedTtsSession) {
                    session.prewarmedTtsSession.abort();
                    session.prewarmedTtsSession = null;
                    session.persistentTtsSession = null;
                }

                // Pre-warm a single Deepgram WebSocket during the candidate's turn
                ensureTtsPrewarm();

                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "speech_started" }));
                }
                return;
            }

            if (parsedMessage.type === "speech_cancelled") {
                // Client VAD decided the utterance was too short; drop buffered audio but keep the TTS prewarm.
                session.audioChunks = [];
                session.speculative = null;
                session.isRecording = false;
                return;
            }

            if (parsedMessage.type === "speech_paused") {
                // The candidate has paused long enough that they may be done. Start
                // transcribing what we have now; if they finish here, the transcript is
                // (nearly) ready when speech_ended arrives instead of starting then.
                if (session.isTranscribing || session.audioChunks.length === 0) return;
                if (session.speculative && session.speculative.chunks === session.audioChunks.length) return;

                const { audio, mimeType } = buildTurnAudio(session);
                const result = transcribeAudio(audio, mimeType);
                result.catch(() => {}); // awaited later, or dropped if they keep talking
                session.speculative = { chunks: session.audioChunks.length, result, startedAt: Date.now() };

                // Get the rest of the pipeline ready while transcription runs
                prewarmBackend(session);
                ensureTtsPrewarm();
                return;
            }

            if (parsedMessage.type === "speech_ended" || parsedMessage.type === "stop_recording") {
                console.log(`[ws-server] ${parsedMessage.type} received with ${session.audioChunks.length} audio chunks.`);
                session.isRecording = false;
                session.isTranscribing = true;

                // Abort any currently speaking TTS
                if (session.currentTtsSession) {
                    session.currentTtsSession.abort();
                    session.currentTtsSession = null;
                }

                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "processing_started" }));
                }

                if (session.audioChunks.length === 0) {
                    console.warn("[ws-server] No audio chunks accumulated before speech_ended.");
                    session.isTranscribing = false;
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "empty_speech" }));
                    }
                    return;
                }

                const { audio, mimeType, speakingMs } = buildTurnAudio(session);

                // Reuse the transcription started during the pause when no audio arrived
                // since; otherwise (or if it failed) transcribe the full turn now.
                const speculative = session.speculative;
                session.speculative = null;
                const reusable = speculative && speculative.chunks === session.audioChunks.length ? speculative : null;

                let transcriptText = "";
                let groqLatencyMs = 0;
                try {
                    const waitStart = Date.now();
                    let transcription: { text: string; latencyMs: number } | null = null;
                    if (reusable) {
                        transcription = await reusable.result.catch((err) => {
                            console.warn("[Groq Whisper] Speculative transcription failed, retrying:", err?.message || err);
                            return null;
                        });
                    }
                    const usedSpeculative = !!transcription;
                    if (!transcription) transcription = await transcribeAudio(audio, mimeType);
                    const { text, latencyMs } = transcription;
                    // Time the candidate actually waited for the transcript
                    groqLatencyMs = Date.now() - waitStart;
                    transcriptText = text ? text.trim() : "";
                    console.log(
                        usedSpeculative
                            ? `[Groq Whisper] Speculative transcript ready (${latencyMs}ms total, waited ${groqLatencyMs}ms): "${transcriptText}"`
                            : `[Groq Whisper] Transcribed in ${latencyMs}ms: "${transcriptText}"`,
                    );
                } catch (err: any) {
                    console.error("[Groq Whisper] Transcription failed:", err);
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "error",
                            message: err?.message || "Audio transcription failed",
                        }));
                    }
                    session.isTranscribing = false;
                    session.audioChunks = [];
                    return;
                } finally {
                    session.audioChunks = [];
                    session.isTranscribing = false;
                }

                // Guard against empty / silent turns
                if (!transcriptText || transcriptText.length === 0) {
                    console.log("[ws-server] Empty transcript detected. Returning safely to listening.");
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "empty_speech" }));
                    }
                    return;
                }

                // Emit live transcript to candidate UI
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "transcript",
                        text: transcriptText,
                    }));
                }

                // Enforce Authoritative Session
                if (!session.sessionId) {
                    console.warn("[ws-server] Turn rejected: No authoritative sessionId on connection.");
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "error",
                            message: "Interview session not initialized. Please refresh or start from interview session.",
                        }));
                    }
                    return;
                }

                // 2. Realtime TTS + Authoritative Processing Pipeline
                session.isGenerating = true;
                session.isSpeaking = true;

                try {
                    // Notify browser that TTS stream has started
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "tts_start",
                            format: "linear16",
                            sampleRate: 24000,
                            channels: 1,
                            model: "flux-hannah-en",
                        }));
                    }

                    // Obtain TTS session
                    const ttsSession = (session.prewarmedTtsSession && session.prewarmedTtsSession.isAlive())
                        ? session.prewarmedTtsSession
                        : new DeepgramStreamingTtsSession({
                            model: "flux-hannah-en",
                            sampleRate: 24000,
                            onAudioChunk: (audioChunk) => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(audioChunk, { binary: true });
                                }
                            },
                        });
                    if (ttsSession !== session.prewarmedTtsSession) {
                        ttsSession.start();
                    }
                    session.prewarmedTtsSession = null;
                    session.currentTtsSession = ttsSession;
                    session.persistentTtsSession = ttsSession;

                    const startTime = Date.now();
                    let firstTextSentTime: number | null = null;

                    // Text chunker sends natural spoken sentences to Deepgram and browser in realtime
                    const chunker = new TextChunker((sentenceChunk) => {
                        if (!firstTextSentTime) {
                            firstTextSentTime = Date.now();
                            console.log(`[TextChunker] 1st sentence ready in ${firstTextSentTime - startTime}ms: "${sentenceChunk}"`);
                        }

                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "ai_text_chunk",
                                text: sentenceChunk,
                            }));
                        }

                        ttsSession.sendTextChunk(sentenceChunk);
                    }, { minWords: 2, maxChars: 100 });

                    // Flush the final sentence to Deepgram the moment the spoken block ends,
                    // instead of waiting for the metrics block + DB persistence to finish.
                    let ttsFinished: Promise<Awaited<ReturnType<DeepgramStreamingTtsSession["finish"]>>> | null = null;
                    const endSpokenText = () => {
                        if (ttsFinished) return;
                        chunker.flush();
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "ai_text_end",
                                model: "authoritative-gemini",
                            }));
                        }
                        ttsFinished = ttsSession.finish();
                        // Avoid an unhandled rejection if the turn fails before we await it
                        ttsFinished.catch(() => {});
                    };

                    // Connect strictly to Authoritative Backend Engine
                    console.log(`[ws-server] Routing to Authoritative Backend Engine for session #${session.sessionId}`);
                    const turnResult = await streamAuthoritativeInterviewTurn({
                        sessionId: session.sessionId,
                        candidateAnswer: transcriptText,
                        currentQuestion: session.currentQuestion,
                        speakingMs,
                        token: session.token,
                        onChunk: (spokenToken) => {
                            chunker.feed(spokenToken);
                        },
                        onSpokenEnd: endSpokenText,
                    });

                    endSpokenText();

                    const ttsResult = await ttsFinished!;
                    session.currentTtsSession = null;

                    // Update authoritative question for the next turn
                    if (turnResult.nextQuestion) {
                        session.currentQuestion = turnResult.nextQuestion;
                        const reg = activeSessionRegistry.get(session.sessionId);
                        if (reg) reg.currentQuestion = turnResult.nextQuestion;
                    }

                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "tts_end",
                            timeToFirstAudioMs: ttsResult.timeToFirstAudioMs,
                            totalTtsLatencyMs: ttsResult.totalDurationMs,
                            totalBytes: ttsResult.totalBytes,
                            audioDurationSec: ttsResult.audioDurationSec,
                            sampleRate: ttsResult.sampleRate,
                            model: ttsResult.model,
                            groqLatencyMs,
                        }));

                        // Send turn_complete with authoritative next question and score
                        client.send(JSON.stringify({
                            type: "turn_complete",
                            nextQuestion: turnResult.nextQuestion,
                            questionNum: turnResult.questionNum,
                            totalQuestions: turnResult.totalQuestions,
                            score: turnResult.score,
                            isComplete: turnResult.isComplete,
                        }));
                    }
                } catch (err: any) {
                    console.error("[ws-server] Turn execution error:", err);
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "error",
                            message: err?.message || "Failed to process interview turn",
                        }));
                    }
                } finally {
                    session.isGenerating = false;
                    session.isSpeaking = false;
                    session.currentTtsSession = null;
                }
            }
        } catch (err) {
            console.error("[ws-server] Unhandled message error:", err);
        }
    });

    client.on("close", () => {
        console.log("[ws-server] Client disconnected");
        session.speculative = null;
        session.isRecording = false;
        session.isTranscribing = false;
        session.isGenerating = false;
        session.isSpeaking = false;
        if (session.currentTtsSession) {
            try {
                session.currentTtsSession.abort();
            } catch {}
            session.currentTtsSession = null;
            session.persistentTtsSession = null;
        }
        if (session.prewarmedTtsSession) {
            try {
                session.prewarmedTtsSession.abort();
            } catch {}
            session.prewarmedTtsSession = null;
        }
        if (session.persistentTtsSession) {
            try {
                session.persistentTtsSession.abort();
            } catch {}
            session.persistentTtsSession = null;
        }
        if (session.sessionId) {
            const reg = activeSessionRegistry.get(session.sessionId);
            if (reg && reg.ws === client) {
                activeSessionRegistry.delete(session.sessionId);
            }
        }
    });

    client.on("error", (err) => {
        console.error("[ws-server] Client error:", err);
    });
});

server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`[ws-server] Running on port ${PORT}`);
});
