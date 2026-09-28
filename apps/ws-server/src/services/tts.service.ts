import path from "path";
import dotenv from "dotenv";
import WebSocket from "ws";

// Load environment variables (checking local, backend, frontend, database)
dotenv.config();
if (!process.env.DEEPGRAM_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../../backend/.env") });
}
if (!process.env.DEEPGRAM_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../../../packages/database/.env") });
}
if (!process.env.DEEPGRAM_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../../frontend/.env") });
}

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
    console.warn("[tts.service] WARNING: DEEPGRAM_API_KEY is not defined in any .env file!");
} else {
    console.log("[tts.service] DEEPGRAM_API_KEY loaded successfully.");
}

export interface TTSResult {
    timeToFirstAudioMs: number;
    totalDurationMs: number;
    totalBytes: number;
    audioDurationSec: number;
    sampleRate: number;
    encoding: string;
    model: string;
    firstAudioTimestamp?: number;
    firstTextSentMs?: number;
    firstTextSentTimestamp?: number | null;
}

const DEFAULT_MODEL = "aura-2-thalia-en";
const SAMPLE_RATE = 24000;
const ENCODING = "linear16";

/**
 * Clean text for spoken TTS by removing markdown formatting
 */
export function cleanTextForSpeech(text: string): string {
    return text
        .replace(/[*#_`]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links with text
        .replace(/\n+/g, " ")
        .trim();
}

/**
 * Incremental Text Chunker: Buffers streaming LLM tokens into natural spoken sentences
 * and clauses suitable for immediate TTS synthesis without waiting for the full LLM completion.
 */
export class TextChunker {
    private onChunk: (chunk: string) => void;
    private buffer: string = "";
    private minWords: number;
    private maxChars: number;

    constructor(onChunk: (chunk: string) => void, options: { minWords?: number; maxChars?: number } = {}) {
        this.onChunk = onChunk;
        this.minWords = options.minWords ?? 2;
        this.maxChars = options.maxChars ?? 100;
    }

    public feed(token: string) {
        this.buffer += token;
        this.process(false);
    }

    public flush() {
        this.process(true);
    }

    private process(force: boolean) {
        if (!this.buffer.trim()) {
            this.buffer = "";
            return;
        }

        if (force) {
            const remaining = this.buffer.trim();
            if (remaining) {
                this.onChunk(remaining);
            }
            this.buffer = "";
            return;
        }

        // Match sentence boundary: . ? ! followed by whitespace
        const sentenceRegex = /([.?!]+)(\s+)/g;
        let match: RegExpExecArray | null;

        while ((match = sentenceRegex.exec(this.buffer)) !== null) {
            const punctIndex = match.index;
            const punct = match[1] || "";

            // Don't break on decimal numbers like "React 18.2" or "version 3.1"
            const prevChar = punctIndex > 0 ? this.buffer[punctIndex - 1] : "";
            if (punct === "." && prevChar && /\d/.test(prevChar)) {
                const nextChar = punctIndex + 1 < this.buffer.length ? this.buffer[punctIndex + 1] : "";
                if (nextChar && /\d/.test(nextChar)) {
                    continue;
                }
            }

            const cutIndex = punctIndex + punct.length;
            const candidate = this.buffer.slice(0, cutIndex).trim();
            const wordCount = candidate.split(/\s+/).filter(Boolean).length;

            // Only emit if sentence meets minimum word count for natural intonation
            if (wordCount >= this.minWords) {
                const rest = this.buffer.slice(cutIndex).trimStart();
                this.onChunk(candidate);
                this.buffer = rest;
                // Re-process remaining buffer in case multiple sentences are present
                this.process(false);
                return;
            }
        }

        // Fallback: If buffer exceeds maxChars and no sentence punctuation arrived, break at clause
        if (this.buffer.length >= this.maxChars) {
            const clauseRegex = /([,;:])(\s+)/g;
            let lastClauseIndex = -1;
            while ((match = clauseRegex.exec(this.buffer)) !== null) {
                if (match[1]) {
                    lastClauseIndex = match.index + match[1].length;
                }
            }

            if (lastClauseIndex !== -1 && lastClauseIndex >= 30) {
                const clause = this.buffer.slice(0, lastClauseIndex).trim();
                const rest = this.buffer.slice(lastClauseIndex).trimStart();
                if (clause) {
                    this.onChunk(clause);
                    this.buffer = rest;
                    return;
                }
            }

            // Extreme fallback: break at last whitespace before maxChars
            const lastSpace = this.buffer.lastIndexOf(" ");
            if (lastSpace >= 40) {
                const chunk = this.buffer.slice(0, lastSpace).trim();
                const rest = this.buffer.slice(lastSpace).trimStart();
                if (chunk) {
                    this.onChunk(chunk);
                    this.buffer = rest;
                }
            }
        }
    }
}

/**
 * Manages an open, persistent Deepgram WebSocket TTS session for the duration of an AI turn.
 * Accepts incremental text chunks via sendTextChunk() as Gemini produces them,
 * and streams linear16 audio chunks to onAudioChunk() immediately.
 */
export class DeepgramStreamingTtsSession {
    private apiKey: string;
    private model: string;
    private sampleRate: number;
    private onAudioChunk: (chunk: Buffer) => void;

    private ws: WebSocket | null = null;
    private isOpen: boolean = false;
    private pendingText: string[] = [];
    private hasFinished: boolean = false;
    private startTime: number = Date.now();
    private firstAudioTime: number | null = null;
    private firstTextSentTime: number | null = null;
    private totalBytes: number = 0;
    private audioChunksCount: number = 0;
    private timeoutId: NodeJS.Timeout | null = null;

    private resolvePromise: ((res: TTSResult) => void) | null = null;
    private rejectPromise: ((err: any) => void) | null = null;

    constructor(options: {
        model?: string;
        sampleRate?: number;
        onAudioChunk: (chunk: Buffer) => void;
    }) {
        this.apiKey = process.env.DEEPGRAM_API_KEY || "";
        this.model = options.model || DEFAULT_MODEL;
        this.sampleRate = options.sampleRate || SAMPLE_RATE;
        this.onAudioChunk = options.onAudioChunk;
    }

    public start() {
        if (!this.apiKey) {
            throw new Error("DEEPGRAM_API_KEY is not configured.");
        }

        this.startTime = Date.now();
        const url = `wss://api.deepgram.com/v1/speak?model=${encodeURIComponent(this.model)}&encoding=${ENCODING}&sample_rate=${this.sampleRate}`;
        
        console.log(`[DeepgramSession] Initiating persistent WS connection to: ${url}`);
        this.ws = new WebSocket(url, {
            headers: {
                "Authorization": `Token ${this.apiKey}`
            }
        });

        this.timeoutId = setTimeout(() => {
            if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
                console.warn("[DeepgramSession] Session timed out after 60s.");
                this.ws.close();
            }
            if (this.rejectPromise) {
                this.rejectPromise(new Error("Deepgram TTS session timed out after 60s"));
            }
        }, 60000);

        this.ws.on("open", () => {
            const connectDuration = Date.now() - this.startTime;
            console.log(`[DeepgramSession] WS Connected in ${connectDuration}ms`);
            this.isOpen = true;

            // Flush any text chunks that were queued while WS was connecting
            while (this.pendingText.length > 0) {
                const text = this.pendingText.shift();
                if (text) {
                    this._sendSpeak(text);
                }
            }

            // If Gemini finished before WS opened, send Flush immediately
            if (this.hasFinished) {
                this._sendFlush();
            }
        });

        this.ws.on("message", (data: WebSocket.RawData, isBinary: boolean) => {
            if (isBinary) {
                const chunk = Buffer.isBuffer(data)
                    ? data
                    : Array.isArray(data)
                    ? Buffer.concat(data)
                    : Buffer.from(data as ArrayBuffer);

                this.audioChunksCount++;
                this.totalBytes += chunk.length;

                if (!this.firstAudioTime) {
                    this.firstAudioTime = Date.now();
                    const ttfa = this.firstTextSentTime
                        ? this.firstAudioTime - this.firstTextSentTime
                        : this.firstAudioTime - this.startTime;
                    console.log(`[DeepgramSession] Time-to-first-audio (TTFA): ${ttfa}ms (${chunk.length} bytes, chunk #${this.audioChunksCount})`);
                }

                // Forward audio chunk to browser immediately
                this.onAudioChunk(chunk);
            } else {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === "Flushed") {
                        console.log(`[DeepgramSession] Received 'Flushed' acknowledgment. All audio chunks received.`);
                        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                            this.ws.send(JSON.stringify({ type: "Close" }));
                            this.ws.close();
                        }
                    }
                } catch {
                    // Non-JSON message from Deepgram
                }
            }
        });

        this.ws.on("close", (code) => {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }

            const totalDurationMs = Date.now() - this.startTime;
            const timeToFirstAudioMs = (this.firstAudioTime && this.firstTextSentTime)
                ? this.firstAudioTime - this.firstTextSentTime
                : (this.firstAudioTime ? this.firstAudioTime - this.startTime : totalDurationMs);
            const audioDurationSec = this.totalBytes / (this.sampleRate * 2);

            console.log(`[DeepgramSession] Stream completed. Total chunks: ${this.audioChunksCount}, bytes: ${this.totalBytes} (~${audioDurationSec.toFixed(2)}s audio), total duration: ${totalDurationMs}ms`);

            if (this.resolvePromise) {
                this.resolvePromise({
                    timeToFirstAudioMs,
                    totalDurationMs,
                    totalBytes: this.totalBytes,
                    audioDurationSec,
                    sampleRate: this.sampleRate,
                    encoding: ENCODING,
                    model: this.model,
                    firstAudioTimestamp: this.firstAudioTime || Date.now(),
                    firstTextSentMs: this.firstTextSentTime ? this.firstTextSentTime - this.startTime : undefined,
                    firstTextSentTimestamp: this.firstTextSentTime || null,
                });
            }
        });

        this.ws.on("error", (err) => {
            console.error("[DeepgramSession] WebSocket Error:", err);
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
            if (this.rejectPromise) {
                this.rejectPromise(err);
            }
        });
    }

    public sendTextChunk(text: string) {
        const cleaned = cleanTextForSpeech(text);
        if (!cleaned) return;

        if (!this.firstTextSentTime) {
            this.firstTextSentTime = Date.now();
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
                    console.warn("[DeepgramSession] Session timed out after 60s of active synthesis.");
                    this.ws.close();
                }
                if (this.rejectPromise) {
                    this.rejectPromise(new Error("Deepgram TTS session timed out after 60s of active synthesis"));
                }
            }, 60000);
        }

        if (this.isOpen && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this._sendSpeak(cleaned);
        } else {
            this.pendingText.push(cleaned);
        }
    }

    private _sendSpeak(text: string) {
        console.log(`[DeepgramSession] Sending Speak: "${text.slice(0, 60)}${text.length > 60 ? "..." : ""}"`);
        this.ws?.send(JSON.stringify({ type: "Speak", text }));
    }

    private _sendFlush() {
        console.log("[DeepgramSession] Sending Flush to finalize audio generation...");
        this.ws?.send(JSON.stringify({ type: "Flush" }));
    }

    public finish(): Promise<TTSResult> {
        this.hasFinished = true;
        if (this.isOpen && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this._sendFlush();
        }

        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });
    }

    public abort() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.ws) {
            try {
                this.ws.removeAllListeners();
                if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                    this.ws.close();
                }
            } catch {}
            this.ws = null;
        }
        this.isOpen = false;
        if (this.rejectPromise) {
            this.rejectPromise(new Error("Deepgram TTS session aborted"));
            this.rejectPromise = null;
        }
        this.resolvePromise = null;
    }
}

/**
 * Standard complete text-to-speech helper (retained for backward compatibility and fallback testing)
 */
export async function streamTextToSpeech(
    text: string,
    onAudioChunk: (chunk: Buffer) => void,
    model: string = DEFAULT_MODEL
): Promise<TTSResult> {
    const session = new DeepgramStreamingTtsSession({
        model,
        sampleRate: SAMPLE_RATE,
        onAudioChunk,
    });
    session.start();
    session.sendTextChunk(text);
    return await session.finish();
}
