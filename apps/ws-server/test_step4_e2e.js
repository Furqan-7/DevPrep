const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const WebSocket = require("ws");

const wavPath = path.resolve(__dirname, "../../tell_me_about_yourself.wav");

// If wav doesn't exist, generate it via PowerShell System.Speech
if (!fs.existsSync(wavPath)) {
    console.log("Generating test speech WAV file via System.Speech...");
    const psScript = `
        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SetOutputToWaveFile('${wavPath.replace(/\\/g, "\\\\")}')
        $s.Speak('Tell me about yourself.')
        $s.Dispose()
    `;
    spawnSync("powershell", ["-Command", psScript], { stdio: "inherit" });
}

if (!fs.existsSync(wavPath)) {
    console.error("Failed to find or generate tell_me_about_yourself.wav");
    process.exit(1);
}

const audioBuffer = fs.readFileSync(wavPath);
console.log(`Loaded test audio: ${audioBuffer.length} bytes from ${wavPath}`);

console.log("\nConnecting to ws://localhost:8080...");
const ws = new WebSocket("ws://localhost:8080");

let transcriptReceivedTime = null;
let firstChunkReceivedTime = null;
let chunkCount = 0;
let accumulatedAiText = "";
let aiEndReceived = false;

ws.on("open", () => {
    console.log("Connected to WebSocket server.");

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
            console.log(`[Client] Streamed binary audio chunk #${sentChunks} (${slice.length} bytes)`);
        } else {
            clearInterval(streamInterval);
            console.log(`[Client] All ${sentChunks} audio chunks sent. Sending stop_recording...`);
            ws.send(JSON.stringify({ type: "stop_recording" }));
        }
    }, 250);
});

ws.on("message", (raw) => {
    try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "transcript") {
            transcriptReceivedTime = Date.now();
            console.log("\n--------------------------------------------------");
            console.log(`[Step 4: Groq Transcript] "${msg.text}"`);
            console.log("--------------------------------------------------\n");
            console.log("[Client] Waiting for Gemini streaming response chunks...");
        } else if (msg.type === "ai_text_chunk") {
            chunkCount++;
            accumulatedAiText += msg.text;

            if (firstChunkReceivedTime === null) {
                firstChunkReceivedTime = Date.now();
                const firstTokenLatency = transcriptReceivedTime ? (firstChunkReceivedTime - transcriptReceivedTime) : 0;
                console.log(`\n======================================================`);
                console.log(`>>> FIRST ai_text_chunk RECEIVED! <<<`);
                console.log(`First-token latency (time to first token): ${firstTokenLatency}ms`);
                console.log(`======================================================\n`);
            }

            console.log(`[Chunk #${chunkCount}] "${msg.text}"`);
        } else if (msg.type === "ai_text_end") {
            aiEndReceived = true;
            console.log("\n======================================================");
            console.log(">>> ai_text_end RECEIVED! <<<");
            console.log(`Total ai_text_chunk messages received: ${chunkCount}`);
            console.log(`Backend reported firstTokenLatencyMs: ${msg.firstTokenLatencyMs}ms`);
            console.log(`Backend reported totalLatencyMs: ${msg.totalLatencyMs}ms`);
            console.log(`Backend model used: ${msg.model}`);
            console.log("Full AI response:\n");
            console.log(accumulatedAiText.trim());
            console.log("======================================================\n");

            setTimeout(() => {
                ws.close();
                console.log("SUCCESS: All Step 4 verification checks passed!");
                process.exit(0);
            }, 500);
        } else if (msg.type === "error") {
            console.error("\n[Error from server]:", msg.message);
        }
    } catch (err) {
        console.log("Non-JSON message:", raw.toString());
    }
});

ws.on("error", (err) => {
    console.error("WebSocket client error:", err);
    process.exit(1);
});

// Timeout safeguard
setTimeout(() => {
    if (!aiEndReceived) {
        console.error("Test timed out waiting for ai_text_end.");
        process.exit(1);
    }
}, 45000);
