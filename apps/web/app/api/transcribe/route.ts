import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


export async function POST(req: Request) {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    const transcription = await groq.audio.transcriptions.create({
        file: audio,
        model: "whisper-large-v3",
    });

    return Response.json({ transcript: transcription.text });
}
