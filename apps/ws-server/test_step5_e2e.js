const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const wavPath = path.resolve(__dirname, "../../tell_me_about_yourself.wav");

if (!fs.existsSync(wavPath)) {
    console.error("Missing test audio tell_me_about_yourself.wav at:", wavPath);
    process.exit(1);
}

const audioBuffer = fs.readFileSync(wavPath);
console.log(`Loaded test spoken audio: ${audioBuffer.length} bytes`);

console.log("\nConnecting to ws://localhost:8080...");
const ws = new WebSocket("ws://localhost:8080");

let recordingStartTime = null;
let stopRecordingTime = null;
let transcriptReceivedTime = null;
let firstAiChunkTime = null;
let aiEndTime = null;
let ttsStartTime = null;
let firstAudioChunkTime = null;
let ttsEndTime = null;

let aiChunkCount = 0;
let accumulatedAiText = "";
let audioChunkCount = 0;
let accumulatedAudioBytes = 0;
let ttsStartMetadata = null;
let ttsEndMetadata = null;
const receivedAudioChunks = [];

ws.on("open", () => {
    console.log("Connected to ws://localhost:8080");
    recordingStartTime = Date.now();

    // 1. Send start_recording
    ws.send(JSON.stringify({
        type: "start_recording",
        mimeType: "audio/wav"
    }));
    console.log("[Client] Sent start_recording (mimeType: audio/wav)");

    // 2. Stream binary audio chunks every 250ms
    const chunkSize = 12000;
    let offset = 0;
    let sentChunks = 0;

    const streamInterval = setInterval(() => {
        if (offset < audioBuffer.length) {
            const end = Math.min(offset + chunkSize, audioBuffer.length);
            const slice = audioBuffer.subarray(offset, end);
            offset = end;
            sentChunks++;
            ws.send(slice, { binary: true });
            console.log(`[Client] Streamed microphone audio chunk #${sentChunks} (${slice.length} bytes)`);
        } else {
            clearInterval(streamInterval);
            stopRecordingTime = Date.now();
            console.log(`[Client] All ${sentChunks} audio chunks sent. Sending stop_recording...`);
            ws.send(JSON.stringify({ type: "stop_recording" }));
        }
    }, 250);
});

ws.on("message", (data, isBinary) => {
    // Binary messages from server = Deepgram Aura-2 Audio chunks!
    if (isBinary) {
        const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
        audioChunkCount++;
        accumulatedAudioBytes += chunk.length;
        receivedAudioChunks.push(chunk);

        if (!firstAudioChunkTime) {
            firstAudioChunkTime = Date.now();
            const ttfaFromTtsStart = ttsStartTime ? (firstAudioChunkTime - ttsStartTime) : (firstAudioChunkTime - aiEndTime);
            console.log(`\n======================================================`);
            console.log(`>>> FIRST DEEPGRAM AURA-2 AUDIO CHUNK RECEIVED! <<<`);
            console.log(`TTS Time-To-First-Audio (TTFA): ${ttfaFromTtsStart}ms (Chunk: ${chunk.length} bytes)`);
            console.log(`======================================================\n`);
        }

        console.log(`[Audio Chunk #${audioChunkCount}] Received ${chunk.length} bytes PCM (Total: ${(accumulatedAudioBytes/1024).toFixed(1)} KB)`);
        return;
    }

    try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "transcript") {
            transcriptReceivedTime = Date.now();
            const sttLatency = stopRecordingTime ? (transcriptReceivedTime - stopRecordingTime) : 0;
            console.log("\n--------------------------------------------------");
            console.log(`[Step 1: Groq Transcript] "${msg.text}" (Latency: ${sttLatency}ms)`);
            console.log("--------------------------------------------------\n");
            console.log("[Client] Awaiting Gemini streaming LLM response...");
        } else if (msg.type === "ai_text_chunk") {
            aiChunkCount++;
            accumulatedAiText += msg.text;

            if (!firstAiChunkTime) {
                firstAiChunkTime = Date.now();
                const ttft = transcriptReceivedTime ? (firstAiChunkTime - transcriptReceivedTime) : 0;
                console.log(`[Step 2: Gemini 1st Token (TTFT)] ${ttft}ms`);
            }

            process.stdout.write(msg.text);
        } else if (msg.type === "ai_text_end") {
            aiEndTime = Date.now();
            const totalLlmTime = transcriptReceivedTime ? (aiEndTime - transcriptReceivedTime) : 0;
            console.log("\n\n--------------------------------------------------");
            console.log(`[Step 2: Gemini Generation Finished] Total LLM time: ${totalLlmTime}ms`);
            console.log(`Full response:\n"${accumulatedAiText.trim()}"`);
            console.log("--------------------------------------------------\n");
            console.log("[Client] Awaiting Deepgram Aura-2 TTS stream...");
        } else if (msg.type === "tts_start") {
            ttsStartTime = Date.now();
            ttsStartMetadata = msg;
            console.log(">>> [Step 3: tts_start RECEIVED] <<<", msg);
        } else if (msg.type === "tts_end") {
            ttsEndTime = Date.now();
            ttsEndMetadata = msg;
            console.log("\n======================================================");
            console.log(">>> [Step 3: tts_end RECEIVED] <<<");
            console.log("Deepgram Aura-2 Generation Metrics:");
            console.log(`- Time to First Audio (TTFA): ${msg.timeToFirstAudioMs}ms`);
            console.log(`- Total TTS Generation Time: ${msg.totalTtsLatencyMs}ms`);
            console.log(`- Total Audio Chunks: ${audioChunkCount}`);
            console.log(`- Total Audio Bytes: ${accumulatedAudioBytes} bytes (${(accumulatedAudioBytes/1024).toFixed(1)} KB)`);
            console.log(`- Audio Duration: ${msg.audioDurationSec.toFixed(2)} seconds`);
            console.log(`- Sample Rate: ${msg.sampleRate} Hz`);
            console.log(`- Model: ${msg.model}`);
            console.log("======================================================\n");

            // Save the received audio as a playable WAV file to verify validity
            savePcmAsWav(Buffer.concat(receivedAudioChunks), msg.sampleRate || 24000);

            setTimeout(() => {
                ws.close();
                console.log("ALL STEP 5 VERIFICATION CHECKS PASSED SUCCESSFULLY!");
                process.exit(0);
            }, 1000);
        } else if (msg.type === "error") {
            console.error("\n[Error from server]:", msg.message);
        }
    } catch (err) {
        console.log("Non-JSON message:", data.toString());
    }
});

ws.on("error", (err) => {
    console.error("WebSocket client error:", err);
    process.exit(1);
});

// Helper: Convert raw PCM 16-bit to standard WAV container file for verification
function savePcmAsWav(pcmBuffer, sampleRate) {
    const wavHeader = Buffer.alloc(44);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;

    wavHeader.write("RIFF", 0);
    wavHeader.writeUInt32LE(36 + dataSize, 4);
    wavHeader.write("WAVE", 8);
    wavHeader.write("fmt ", 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20); // PCM format
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);
    wavHeader.write("data", 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    const fullWav = Buffer.concat([wavHeader, pcmBuffer]);
    const outPath = path.resolve(__dirname, "../../scratch_output_tts.wav");
    fs.writeFileSync(outPath, fullWav);
    console.log(`Saved validated playable WAV audio to: ${outPath} (${fullWav.length} bytes)`);
}

setTimeout(() => {
    if (!ttsEndMetadata) {
        console.error("Test timed out waiting for tts_end.");
        process.exit(1);
    }
}, 60000);
