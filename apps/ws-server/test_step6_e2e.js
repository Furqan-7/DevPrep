const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

// Client-side VAD Simulator matching useRealtimeVoice.ts exactly
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
        this.state = "listening"; // "listening" | "speaking" | "silence_detecting" | "processing" | "ai_speaking"

        this.events = [];
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
        if (this.state === "processing" || this.state === "ai_speaking") {
            return;
        }

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
                this.events.push("speech_started");
                this.ws.send(JSON.stringify({ type: "speech_started" }));

                // Flush pre-roll buffer so initial phonemes are preserved
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
                        this.events.push("speech_ended");
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

async function runTestCase(caseName, wavFiles, options = {}) {
    console.log(`\n======================================================`);
    console.log(`RUNNING TEST: ${caseName}`);
    console.log(`======================================================`);

    return new Promise((resolve, reject) => {
        const ws = new WebSocket("ws://localhost:8080");
        const vad = new ClientVadSession(ws, 24000);

        let turnIndex = 0;
        let transcripts = [];
        let aiResponses = [];
        let ttsBytesTotal = 0;
        let receivedEvents = [];

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error(`Test ${caseName} timed out after 75s`));
        }, 75000);

        ws.on("open", () => {
            console.log(`[Test] Connected to ws://localhost:8080`);
            ws.send(JSON.stringify({
                type: "start_recording",
                mimeType: "audio/wav",
                sampleRate: 24000
            }));

            // Start feeding turn 0
            feedTurn(0);
        });

        function feedTurn(index) {
            turnIndex = index;
            const wavFile = wavFiles[index];
            const samples = loadWavSamples(wavFile);
            console.log(`[Test] Feeding Turn #${index + 1} (${path.basename(wavFile)}, ${(samples.length / 24000).toFixed(2)}s)...`);

            vad.state = "listening";
            const blockSize = 1024; // ~42ms

            // Feed samples in simulated real-time blocks
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
                        console.log(`[Test] Turn #${index + 1} speech completed. VAD successfully detected end of speech (~800ms silence).`);
                    }
                }
            }, 10); // slightly accelerated clock
        }

        let currentAiText = "";

        ws.on("message", (data, isBinary) => {
            if (isBinary) {
                ttsBytesTotal += data.length;
                return;
            }

            try {
                const msg = JSON.parse(data.toString());
                receivedEvents.push(msg.type);

                if (msg.type === "processing_started") {
                    console.log(`[Server Event] processing_started`);
                } else if (msg.type === "transcript") {
                    console.log(`[Server Event] transcript: "${msg.text}"`);
                    transcripts.push(msg.text);
                } else if (msg.type === "ai_text_chunk") {
                    currentAiText += msg.text;
                } else if (msg.type === "ai_text_end") {
                    console.log(`[Server Event] ai_text_end: "${currentAiText.trim().slice(0, 70)}..."`);
                    aiResponses.push(currentAiText.trim());
                    currentAiText = "";
                } else if (msg.type === "tts_start") {
                    console.log(`[Server Event] tts_start (${msg.model}, ${msg.sampleRate}Hz)`);
                    vad.state = "ai_speaking";
                } else if (msg.type === "tts_end") {
                    console.log(`[Server Event] tts_end (TTFA: ${msg.timeToFirstAudioMs}ms, Total TTS: ${msg.totalTtsLatencyMs}ms, Audio: ${msg.audioDurationSec.toFixed(2)}s)`);

                    // Turn is finished
                    if (turnIndex + 1 < wavFiles.length) {
                        console.log(`[Test] AI speaking finished. Microphone remaining active for Turn #${turnIndex + 2}...`);
                        // Simulate natural pause before next turn
                        setTimeout(() => {
                            feedTurn(turnIndex + 1);
                        }, 1000);
                    } else {
                        // All turns complete
                        clearTimeout(timeout);
                        ws.close();
                        resolve({
                            caseName,
                            transcripts,
                            aiResponses,
                            ttsBytesTotal,
                            receivedEvents,
                            success: true
                        });
                    }
                } else if (msg.type === "error") {
                    console.error(`[Server Error]:`, msg.message);
                }
            } catch (err) {
                // ignore
            }
        });

        ws.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

async function main() {
    const scratchDir = path.resolve("C:/Users/Admin/.gemini/antigravity-ide/brain/b95b19d2-ff82-44b1-ab9a-937a74e9d9cb/scratch");

    const results = [];

    // Case A: Normal sentence with natural pauses
    const resA = await runTestCase(
        "Case A: Normal sentence with natural pauses",
        [path.join(scratchDir, "test_vad_a.wav")]
    );
    results.push(resA);

    // Case B: Short pause between words
    const resB = await runTestCase(
        "Case B: Short pause between words",
        [path.join(scratchDir, "test_vad_b.wav")]
    );
    results.push(resB);

    // Case C: Very short response ("Yes.")
    const resC = await runTestCase(
        "Case C: Very short response (Yes)",
        [path.join(scratchDir, "test_vad_c_short.wav")]
    );
    results.push(resC);

    // Case D: Two separate turns without restarting the microphone
    const resD = await runTestCase(
        "Case D: Two separate turns without restarting the microphone",
        [
            path.join(scratchDir, "test_vad_d1.wav"),
            path.join(scratchDir, "test_vad_d2.wav")
        ]
    );
    results.push(resD);

    console.log(`\n======================================================`);
    console.log(`ALL STEP 6 E2E VAD TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`======================================================`);
    for (const r of results) {
        console.log(`- ${r.caseName}:`);
        r.transcripts.forEach((t, i) => console.log(`    Turn #${i+1} Transcript: "${t}"`));
        r.aiResponses.forEach((a, i) => console.log(`    Turn #${i+1} AI Response: "${a.slice(0, 80)}..."`));
    }
    process.exit(0);
}

main().catch((err) => {
    console.error("FATAL ERROR in Step 6 E2E Test:", err);
    process.exit(1);
});
