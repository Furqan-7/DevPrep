import path from "path";
import dotenv from "dotenv";
import Groq, { toFile } from "groq-sdk";

// Load environment variables (checking local, backend, frontend, and package .env files)
dotenv.config();
if (!process.env.GROQ_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../../backend/.env") });
}
if (!process.env.GROQ_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../../frontend/.env") });
}
if (!process.env.GROQ_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../../../packages/database/.env") });
}

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
    console.warn("[transcription.service] WARNING: GROQ_API_KEY is not defined in any .env file!");
} else {
    console.log("[transcription.service] GROQ_API_KEY loaded successfully.");
}

const groq = new Groq({ apiKey: groqApiKey });

// whisper-large-v3-turbo is several times faster than whisper-large-v3 with near-identical
// accuracy for English speech, which matters on the live interview critical path.
const STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";
const STT_LANGUAGE = process.env.GROQ_STT_LANGUAGE || "en";

export function getFileInfoFromMimeType(mimeType: string): { filename: string; type: string } {
    const lower = (mimeType || "").toLowerCase();
    if (lower.includes("webm")) {
        return { filename: "interview_audio.webm", type: "audio/webm" };
    }
    if (lower.includes("mp4") || lower.includes("m4a") || lower.includes("aac")) {
        return { filename: "interview_audio.m4a", type: "audio/mp4" };
    }
    if (lower.includes("ogg")) {
        return { filename: "interview_audio.ogg", type: "audio/ogg" };
    }
    if (lower.includes("wav")) {
        return { filename: "interview_audio.wav", type: "audio/wav" };
    }
    return { filename: "interview_audio.webm", type: "audio/webm" };
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{ text: string; latencyMs: number }> {
    const { filename, type } = getFileInfoFromMimeType(mimeType);
    const startTime = Date.now();

    const file = await toFile(audioBuffer, filename, { type });
    const transcription = await groq.audio.transcriptions.create({
        file,
        model: STT_MODEL,
        language: STT_LANGUAGE,
        temperature: 0,
        response_format: "json",
    });

    const latencyMs = Date.now() - startTime;
    const text = (transcription.text ?? "").trim();
    return { text, latencyMs };
}
