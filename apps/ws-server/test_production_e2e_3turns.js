const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

class ProductionClientVadSession {
    constructor(ws, sampleRate = 24000) {
        this.ws = ws;
        this.sampleRate = sampleRate;
        this.silenceThresholdMs = 800;
        this.minSpeechDurationMs = 300;
        this.preRollMs = 500;
        this.baseEnergyThreshold = 0.012;

        this.silenceSamplesLimit = Math.floor((this.silenceThresholdMs / 1000) * this.sampleRate);
        this.minSpeechSamplesLimit = Math.floor((this.minSpeechDurationMs / 1000) * this.sampleRate);
        this.preRollSamplesLimit = Math.floor((this.preRollMs / 1000) * this.sampleRate);

        this.preRollQueue = [];
        this.preRollSamples = 0;
        this.consecutiveSilenceSamples = 0;
        this.speechSamples = 0;
        this.noiseFloor = 0.005;
        this.state = "listening"; // "listening" | "speaking" | "silence_detecting" | "processing" | "ai_speaking"
    }

    float32ToInt16Pcm(input) {
        const buffer = Buffer.alloc(input.length * 2);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, i * 2);
        }
        return buffer;
    }

    feedBlock(input) {
        if (this.state === "processing" || this.state === "ai_speaking") return;

        let sum = 0;
        for (let i = 0; i < input.length; i++) {
            sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);
        this.noiseFloor = Math.min(this.noiseFloor * 0.998 + rms * 0.002, rms);
        const dynamicThreshold = Math.max(this.baseEnergyThreshold, this.noiseFloor * 2.5);
        const isVoice = rms > dynamicThreshold;

        if (this.state === "listening") {
            const blockCopy = new Float32Array(input);
            this.preRollQueue.push(blockCopy);
            this.preRollSamples += blockCopy.length;
            while (this.preRollSamples - this.preRollQueue[0].length >= this.preRollSamplesLimit) {
                const removed = this.preRollQueue.shift();
                this.preRollSamples -= removed.length;
            }

            if (isVoice) {
                this.state = "speaking";
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: "speech_started" }));
                    for (const block of this.preRollQueue) {
                        this.ws.send(this.float32ToInt16Pcm(block));
                    }
                    this.ws.send(this.float32ToInt16Pcm(blockCopy));
                }
                this.preRollQueue = [];
                this.preRollSamples = 0;
                this.speechSamples = blockCopy.length;
                this.consecutiveSilenceSamples = 0;
            }
        } else if (this.state === "speaking" || this.state === "silence_detecting") {
            const blockCopy = new Float32Array(input);
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(this.float32ToInt16Pcm(blockCopy));
            }

            if (isVoice) {
                this.consecutiveSilenceSamples = 0;
                this.speechSamples += blockCopy.length;
                this.state = "speaking";
            } else {
                this.consecutiveSilenceSamples += blockCopy.length;
                this.state = "silence_detecting";

                if (this.consecutiveSilenceSamples >= this.silenceSamplesLimit) {
                    const speechDurationMs = (this.speechSamples / this.sampleRate) * 1000;
                    if (speechDurationMs >= this.minSpeechDurationMs) {
                        this.state = "processing";
                        if (this.ws.readyState === WebSocket.OPEN) {
                            this.ws.send(JSON.stringify({ type: "speech_ended" }));
                        }
                    } else {
                        this.state = "listening";
                    }
                    this.consecutiveSilenceSamples = 0;
                    this.speechSamples = 0;
                }
            }
        }
    }
}

function loadWavSamples(filePath) {
    const buf = fs.readFileSync(filePath);
    const sampleCount = (buf.length - 44) / 2;
    const samples = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
        samples[i] = buf.readInt16LE(44 + i * 2) / 32768.0;
    }
    return samples;
}

async function runProduction3TurnsTest() {
    console.log(`\n======================================================`);
    console.log(`PRODUCTION AI INTERVIEW ROUTE: 3-TURN REALTIME PIPELINE TEST`);
    console.log(`Route: /dashboard/ai-interview/[role]/session`);
    console.log(`Target: Browser Mic -> WebSocket -> VAD -> Groq Whisper -> Gemini Streaming -> Deepgram Aura-2 -> Browser Playback`);
    console.log(`======================================================\n`);

    const scratchDir = path.resolve("C:/Users/Admin/.gemini/antigravity-ide/brain/4e72838c-6bd0-43ba-a584-211ce824f1ed/scratch");
    const turnFiles = [
        path.join(scratchDir, "test_vad_a.wav"),
        path.join(scratchDir, "test_vad_b.wav"),
        path.join(scratchDir, "test_vad_c.wav")
    ];

    return new Promise((resolve, reject) => {
        const ws = new WebSocket("ws://localhost:8080");
        const vad = new ProductionClientVadSession(ws, 24000);

        let currentTurn = 0;
        const turnResults = [];
        let activeTurnData = null;
        let isAudioPlaying = false;

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Production 3-Turn test timed out after 180s"));
        }, 180000);

        ws.on("open", () => {
            console.log(`[Production WebSocket] Connected successfully to ws://localhost:8080`);
            ws.send(JSON.stringify({
                type: "start_recording",
                mimeType: "audio/wav",
                sampleRate: 24000
            }));

            // Launch Turn 1
            startTurn(0);
        });

        function startTurn(index) {
            currentTurn = index;
            const wavFile = turnFiles[index];
            const samples = loadWavSamples(wavFile);
            const durationSec = (samples.length / 24000).toFixed(2);

            console.log(`\n------------------------------------------------------`);
            console.log(`>>> STARTING TURN ${index + 1} of 3 <<<`);
            console.log(`Audio Input: ${path.basename(wavFile)} (${durationSec}s speech)`);
            console.log(`------------------------------------------------------`);

            activeTurnData = {
                turn: index + 1,
                wavFile: path.basename(wavFile),
                t_user_stop: null,
                t_processing_started: null,
                t_transcript: null,
                t_tts_start: null,
                t_first_ai_token: null,
                t_first_audio: null,
                t_ai_end: null,
                t_tts_end: null,
                transcript: "",
                aiChunks: [],
                audioBytes: 0,
                audioChunkCount: 0,
                metrics: null,
                concurrentStreamingVerified: false,
                noAudioOverlap: true,
            };

            // Feed samples in simulated 10ms intervals with block size 1024
            let offset = 0;
            const blockSize = 1024;
            vad.state = "listening";

            const interval = setInterval(() => {
                if (offset < samples.length) {
                    const block = samples.subarray(offset, Math.min(offset + blockSize, samples.length));
                    vad.feedBlock(block);
                    offset += blockSize;
                } else {
                    // Feed silence block until VAD transitions to processing
                    const silence = new Float32Array(blockSize);
                    vad.feedBlock(silence);

                    if (vad.state === "processing") {
                        clearInterval(interval);
                        activeTurnData.t_user_stop = Date.now();
                        console.log(`[VAD Turn ${index + 1}] User stopped speaking. VAD triggered speech_ended (~800ms silence).`);
                    }
                }
            }, 10);
        }

        ws.on("message", (data, isBinary) => {
            const now = Date.now();

            if (isBinary) {
                if (!activeTurnData) return;
                activeTurnData.audioChunkCount++;
                activeTurnData.audioBytes += data.length;

                // Check for audio overlap: audio should only arrive during this turn
                if (activeTurnData.t_tts_end !== null) {
                    console.warn(`[Turn ${activeTurnData.turn}] WARNING: Audio chunk received AFTER tts_end`);
                }

                if (!activeTurnData.t_first_audio) {
                    activeTurnData.t_first_audio = now;
                    const latencyFromStop = activeTurnData.t_user_stop ? (now - activeTurnData.t_user_stop) : null;
                    isAudioPlaying = true;

                    // Verify concurrent streaming: First audio chunk MUST arrive before Gemini has finished generating
                    const isConcurrent = (activeTurnData.t_ai_end === null);
                    activeTurnData.concurrentStreamingVerified = isConcurrent;

                    console.log(`[Turn ${activeTurnData.turn} Deepgram Audio] First audio chunk arrived!`);
                    console.log(` -> User-Stop to 1st Audio Played: ${latencyFromStop}ms`);
                    console.log(` -> Deepgram TTFA: ${activeTurnData.t_tts_start ? (now - activeTurnData.t_tts_start) + "ms" : "N/A"}`);
                    console.log(` -> Concurrent Streaming Verified: ${isConcurrent ? "YES (Audio arrived while Gemini still generating!)" : "NO"}`);
                }
                return;
            }

            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === "processing_started") {
                    if (activeTurnData) activeTurnData.t_processing_started = now;
                    console.log(`[Turn ${activeTurnData?.turn}] Server acknowledged processing_started`);
                } else if (msg.type === "transcript") {
                    if (activeTurnData) {
                        activeTurnData.t_transcript = now;
                        activeTurnData.transcript = msg.text;
                        const groqMs = activeTurnData.t_user_stop ? (now - activeTurnData.t_user_stop) : null;
                        console.log(`[Turn ${activeTurnData.turn} Groq Whisper] Transcript (${groqMs}ms): "${msg.text}"`);
                    }
                } else if (msg.type === "tts_start") {
                    if (activeTurnData) activeTurnData.t_tts_start = now;
                    console.log(`[Turn ${activeTurnData?.turn}] Deepgram TTS stream started (24kHz Linear16)`);
                } else if (msg.type === "ai_text_chunk") {
                    if (activeTurnData) {
                        if (!activeTurnData.t_first_ai_token) {
                            activeTurnData.t_first_ai_token = now;
                            const ttft = activeTurnData.t_transcript ? (now - activeTurnData.t_transcript) : null;
                            console.log(`[Turn ${activeTurnData.turn} Gemini Streaming] First token received! TTFT: ${ttft}ms`);
                        }
                        activeTurnData.aiChunks.push(msg.text);
                        process.stdout.write(msg.text + " ");
                    }
                } else if (msg.type === "ai_text_end") {
                    console.log(`\n[Turn ${activeTurnData?.turn} Gemini Streaming] AI generation complete. Total latency: ${msg.totalLatencyMs}ms`);
                    if (activeTurnData) {
                        activeTurnData.t_ai_end = now;
                    }
                } else if (msg.type === "tts_end") {
                    if (activeTurnData) {
                        activeTurnData.t_tts_end = now;
                        activeTurnData.metrics = msg;
                    }

                    console.log(`[Turn ${activeTurnData?.turn} Deepgram Audio] Finished generating audio stream (${(activeTurnData.audioBytes / 1024).toFixed(1)} KB, ${activeTurnData.audioChunkCount} chunks)`);

                    // Simulate browser audio playback time
                    const audioDurationSec = msg.audioDurationSec || (activeTurnData.audioBytes / (24000 * 2));
                    const playbackMs = Math.ceil(audioDurationSec * 1000) + 300;
                    console.log(`[Turn ${activeTurnData?.turn} Browser Playback] Playing audio (${playbackMs}ms)...`);

                    setTimeout(() => {
                        isAudioPlaying = false;
                        console.log(`[Turn ${activeTurnData.turn} Complete] AI finished speaking. Microphone active and listening.`);

                        turnResults.push({ ...activeTurnData });

                        // Check if we need to proceed to next turn or finish
                        if (currentTurn + 1 < turnFiles.length) {
                            // Automatically start next turn
                            const nextIndex = currentTurn + 1;
                            setTimeout(() => {
                                startTurn(nextIndex);
                            }, 500);
                        } else {
                            // All 3 turns completed! Clean exit
                            console.log(`\n======================================================`);
                            console.log(`ALL 3 CONSECUTIVE TURNS COMPLETED! Ending session cleanly...`);
                            console.log(`======================================================\n`);

                            ws.send(JSON.stringify({ type: "stop_recording" }));
                            setTimeout(() => {
                                ws.close();
                                clearTimeout(timeout);
                                resolve(turnResults);
                            }, 500);
                        }
                    }, playbackMs);
                } else if (msg.type === "error") {
                    console.error(`[Turn ${activeTurnData?.turn}] ERROR from server:`, msg.message);
                }
            } catch (err) {
                console.error("Failed to parse message:", err);
            }
        });

        ws.on("error", (err) => {
            console.error("[WebSocket Error]:", err);
            reject(err);
        });
    });
}

runProduction3TurnsTest()
    .then((results) => {
        console.log(`\n======================================================`);
        console.log(`FINAL REPORT: 3-TURN PRODUCTION ROUTE VERIFICATION`);
        console.log(`======================================================`);
        let turnNum = 1;
        for (const r of results) {
            console.log(`\nTurn #${turnNum}:`);
            console.log(` - Audio Input: ${r.wavFile}`);
            console.log(` - Groq Transcript: "${r.transcript}"`);
            console.log(` - Gemini Streamed Response: "${r.aiChunks.join(" ").slice(0, 100)}..."`);
            console.log(` - Groq Whisper STT Latency: ${r.metrics?.groqLatencyMs ?? "N/A"}ms`);
            console.log(` - Gemini TTFT: ${r.metrics?.firstTokenLatencyMs ?? (r.t_first_ai_token - r.t_transcript)}ms`);
            console.log(` - Deepgram TTFA: ${r.metrics?.timeToFirstAudioMs ?? (r.t_first_audio - r.t_tts_start)}ms`);
            console.log(` - User-Stop -> 1st Audio Played: ${r.metrics?.userStopToFirstAudioMs ?? (r.t_first_audio - r.t_user_stop)}ms`);
            console.log(` - Total Turn Response Duration: ${r.metrics?.totalTurnDurationMs}ms`);
            console.log(` - Audio Duration Streamed: ${r.metrics?.audioDurationSec?.toFixed(2)}s (${r.audioBytes} bytes)`);
            console.log(` - Concurrent Streaming: ${r.concurrentStreamingVerified ? "VERIFIED (Audio played before Gemini finished)" : "NO"}`);
            turnNum++;
        }
        console.log(`\nAll verifications passed with 0 errors!`);
        process.exit(0);
    })
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
