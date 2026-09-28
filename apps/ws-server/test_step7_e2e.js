const path = require("path");
const fs = require("fs");
const WebSocket = require(path.resolve(__dirname, "node_modules/ws"));

class ClientVadSession {
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
        this.state = "listening";
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
                this.ws.send(JSON.stringify({ type: "speech_started" }));
                for (const block of this.preRollQueue) {
                    this.ws.send(this.float32ToInt16Pcm(block));
                }
                this.ws.send(this.float32ToInt16Pcm(blockCopy));
                this.preRollQueue = [];
                this.preRollSamples = 0;
                this.speechSamples = blockCopy.length;
                this.consecutiveSilenceSamples = 0;
            }
        } else if (this.state === "speaking" || this.state === "silence_detecting") {
            const blockCopy = new Float32Array(input);
            this.ws.send(this.float32ToInt16Pcm(blockCopy));

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
                        this.ws.send(JSON.stringify({ type: "speech_ended" }));
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

async function runStep7Test() {
    console.log(`\n======================================================`);
    console.log(`STEP 7 END-TO-END VERIFICATION TEST`);
    console.log(`Testing Concurrent Gemini Streaming + Deepgram Aura-2 TTS`);
    console.log(`======================================================\n`);

    return new Promise((resolve, reject) => {
        const ws = new WebSocket("ws://localhost:8080");
        const vad = new ClientVadSession(ws, 24000);

        let t_user_stop = null;
        let t_processing_started = null;
        let t_transcript = null;
        let t_tts_start = null;
        let t_first_ai_text_chunk = null;
        let t_first_audio_chunk = null;
        let t_ai_text_end = null;
        let t_tts_end = null;

        let transcriptText = "";
        let aiChunks = [];
        let totalAudioBytes = 0;
        let audioChunkCount = 0;
        let serverTtsMetrics = null;

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Step 7 test timed out after 90s"));
        }, 90000);

        ws.on("open", () => {
            console.log(`[Client] Connected to ws://localhost:8080`);
            ws.send(JSON.stringify({
                type: "start_recording",
                mimeType: "audio/wav",
                sampleRate: 24000
            }));

            // Feed speech audio: "Tell me about yourself and your experience with React."
            const wavPath = path.resolve("C:/Users/Admin/.gemini/antigravity-ide/brain/b95b19d2-ff82-44b1-ab9a-937a74e9d9cb/scratch/test_vad_a.wav");
            const samples = loadWavSamples(wavPath);
            console.log(`[Client] Streaming speech turn (${path.basename(wavPath)}, ${(samples.length / 24000).toFixed(2)}s)...`);

            vad.state = "listening";
            const blockSize = 1024;
            let offset = 0;

            const interval = setInterval(() => {
                if (offset < samples.length) {
                    const block = samples.subarray(offset, Math.min(offset + blockSize, samples.length));
                    vad.feedBlock(block);
                    offset += blockSize;
                } else {
                    // Feed silence until VAD triggers speech_ended
                    const silence = new Float32Array(blockSize);
                    vad.feedBlock(silence);

                    if (vad.state === "processing") {
                        clearInterval(interval);
                        t_user_stop = Date.now();
                        console.log(`\n[VAD Event] speech_ended triggered at timestamp ${t_user_stop}`);
                    }
                }
            }, 10);
        });

        ws.on("message", (data, isBinary) => {
            const now = Date.now();

            if (isBinary) {
                audioChunkCount++;
                totalAudioBytes += data.length;

                if (!t_first_audio_chunk) {
                    t_first_audio_chunk = now;
                    const latencyFromStop = t_first_audio_chunk - t_user_stop;
                    console.log(`\n>>> [AUDIO ARRIVED IN BROWSER] <<<`);
                    console.log(` -> Timestamp: ${t_first_audio_chunk}`);
                    console.log(` -> Latency from user-stop: ${latencyFromStop}ms`);
                    console.log(` -> Is Gemini STILL generating response? ${t_ai_text_end === null ? "YES (CONCURRENT!)" : "NO"}\n`);
                }
                return;
            }

            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === "processing_started") {
                    t_processing_started = now;
                    console.log(`[Server] processing_started (+${now - t_user_stop}ms)`);
                } else if (msg.type === "transcript") {
                    t_transcript = now;
                    transcriptText = msg.text;
                    console.log(`[Server] transcript: "${msg.text}" (+${now - t_user_stop}ms)`);
                } else if (msg.type === "tts_start") {
                    t_tts_start = now;
                    console.log(`[Server] tts_start (${msg.model}, ${msg.sampleRate}Hz) (+${now - t_user_stop}ms)`);
                } else if (msg.type === "ai_text_chunk") {
                    if (!t_first_ai_text_chunk) {
                        t_first_ai_text_chunk = now;
                    }
                    aiChunks.push(msg.text);
                    console.log(`[Server] ai_text_chunk #${aiChunks.length}: "${msg.text.trim()}" (+${now - t_user_stop}ms)`);
                } else if (msg.type === "ai_text_end") {
                    t_ai_text_end = now;
                    console.log(`[Server] ai_text_end (+${now - t_user_stop}ms, total tokens latency: ${msg.totalLatencyMs}ms)`);
                } else if (msg.type === "tts_end") {
                    t_tts_end = now;
                    serverTtsMetrics = msg;
                    console.log(`[Server] tts_end (+${now - t_user_stop}ms, total TTS latency: ${msg.totalTtsLatencyMs}ms)`);

                    clearTimeout(timeout);
                    ws.close();

                    resolve({
                        t_user_stop,
                        t_processing_started,
                        t_transcript,
                        t_tts_start,
                        t_first_ai_text_chunk,
                        t_first_audio_chunk,
                        t_ai_text_end,
                        t_tts_end,
                        transcriptText,
                        aiChunks,
                        totalAudioBytes,
                        audioChunkCount,
                        serverTtsMetrics,
                    });
                }
            } catch {}
        });

        ws.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

async function main() {
    const res = await runStep7Test();

    const groqTranscriptionLatency = res.serverTtsMetrics?.groqLatencyMs || (res.t_transcript - res.t_user_stop);
    const geminiTtft = res.serverTtsMetrics?.firstTokenLatencyMs;
    const firstTextToDeepgramLatency = res.serverTtsMetrics?.firstTextToDeepgramLatencyMs;
    const deepgramTtfa = res.serverTtsMetrics?.timeToFirstAudioMs;
    const userStopToFirstAudioLatency = res.t_first_audio_chunk - res.t_user_stop;
    const totalAiResponseDuration = res.t_tts_end - res.t_user_stop;
    const isConcurrent = res.t_first_audio_chunk < res.t_ai_text_end;

    console.log(`\n======================================================`);
    console.log(`STEP 7 BENCHMARK & CONCURRENCY REPORT`);
    console.log(`======================================================`);
    console.log(`1. Groq Transcription Latency: ${groqTranscriptionLatency}ms`);
    console.log(`2. Gemini Time-to-First-Token (TTFT): ${geminiTtft}ms`);
    console.log(`3. Gemini Request Start -> First Text Chunk to Deepgram: ${firstTextToDeepgramLatency}ms`);
    console.log(`4. Deepgram Time-to-First-Audio (TTFA): ${deepgramTtfa}ms`);
    console.log(`5. User-Turn Completion -> First Audio Played in Browser: ${userStopToFirstAudioLatency}ms`);
    console.log(`6. Total AI Response Duration: ${totalAiResponseDuration}ms`);
    console.log(`------------------------------------------------------`);
    console.log(`First Audio Chunk Timestamp:   ${res.t_first_audio_chunk}`);
    console.log(`Gemini Finished Timestamp:     ${res.t_ai_text_end}`);
    console.log(`Concurrently Running Verified: ${isConcurrent ? "YES (Audio arrived BEFORE Gemini completed!)" : "NO"}`);
    console.log(`Audio Chunks Received:         ${res.audioChunkCount} chunks (${res.totalAudioBytes} bytes, ~${(res.totalAudioBytes / 48000).toFixed(2)}s audio)`);
    console.log(`Complete Spoken AI Response:   "${res.aiChunks.join(" ").trim()}"`);
    console.log(`======================================================\n`);

    process.exit(0);
}

main().catch((err) => {
    console.error("FATAL ERROR in Step 7 Test:", err);
    process.exit(1);
});
