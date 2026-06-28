// app/api/transcribe/route.ts
import Groq, { toFile } from "groq-sdk";

// Allow up to 60 s for the Groq Whisper call (default Next.js limit is too short)
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audio = formData.get("audio") as File;

        if (!audio) {
            return Response.json({ error: "No audio file provided" }, { status: 400 });
        }

        // Convert Web API File → Node.js-compatible file for the SDK
        const audioBuffer = Buffer.from(await audio.arrayBuffer());

        // Guard against empty recordings (user hit stop immediately)
        if (audioBuffer.byteLength < 1000) {
            return Response.json({ transcript: "" });
        }

        const file = await toFile(audioBuffer, "recording.webm", { type: "audio/webm" });

        // whisper-large-v3-turbo: same accuracy as v3, ~3× faster → avoids timeouts
        const transcription = await groq.audio.transcriptions.create({
            file,
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en",
        });

        return Response.json({ transcript: transcription.text });
    } catch (err: unknown) {
        console.error("Transcription error:", err);
        const message =
            err instanceof Error ? err.message : "Transcription failed";
        const isTimeout = message.toLowerCase().includes("timeout");
        return Response.json(
            { error: isTimeout ? "Transcription timed out — please try a shorter answer." : message },
            { status: 500 }
        );
    }
}