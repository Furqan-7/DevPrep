import Groq, { toFile } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audio = formData.get("audio") as File;

        if (!audio) {
            return Response.json({ error: "No audio file provided" }, { status: 400 });
        }

        const audioBuffer = Buffer.from(await audio.arrayBuffer());
        const file = await toFile(audioBuffer, "recording.webm", { type: "audio/webm" });

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