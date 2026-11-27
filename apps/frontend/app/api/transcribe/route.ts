import Groq, { toFile } from "groq-sdk";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// Created on first use rather than at import, so building the app doesn't need the key.
let groq: Groq | null = null;

export async function POST(req: Request) {
    if (!process.env.GROQ_API_KEY) {
        console.error("Transcription error: GROQ_API_KEY is not set");
        return Response.json({ error: "Transcription is not configured" }, { status: 503 });
    }
    try {
        const formData = await req.formData();
        const audio = formData.get("audio");

        if (!(audio instanceof File) || audio.size === 0) {
            return Response.json({ error: "No audio file provided" }, { status: 400 });
        }
        if (audio.size > MAX_AUDIO_BYTES) {
            return Response.json({ error: "Recording is too long" }, { status: 413 });
        }

        const file = await toFile(Buffer.from(await audio.arrayBuffer()), "recording.webm", { type: "audio/webm" });
        groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
        const transcription = await groq.audio.transcriptions.create({
            file,
            model: "whisper-large-v3",
        });

        return Response.json({ transcript: transcription.text });
    } catch (err) {
        console.error("Transcription error:", err);
        return Response.json({ error: "Transcription failed" }, { status: 500 });
    }
}
