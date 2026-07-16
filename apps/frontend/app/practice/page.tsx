"use client";

import { useRef, useState } from "react";

export default function PracticePage() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startRecording = async () => {
        setTranscript(null);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // Release the mic
                streamRef.current?.getTracks().forEach((track) => track.stop());

                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const formData = new FormData();
                formData.append("audio", blob, "recording.webm");

                setIsTranscribing(true);
                try {
                    const res = await fetch("/api/transcribe", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        setError(data.error ?? "Transcription failed.");
                        return;
                    }

                    setTranscript(data.transcript);
                    console.log("User said:", data.transcript);
                } catch (err) {
                    console.error(err);
                    setError("Network error during transcription.");
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            setError("Could not access microphone. Check browser permissions.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Practice Session</h1>

            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <button onClick={startRecording} disabled={isRecording || isTranscribing}>
                    Start Recording
                </button>
                <button onClick={stopRecording} disabled={!isRecording}>
                    Stop Recording
                </button>
            </div>

            {isRecording && (
                <p style={{ marginTop: "1rem", color: "red" }}>
                    🔴 Recording...
                </p>
            )}

            {isTranscribing && (
                <p style={{ marginTop: "1rem", color: "gray" }}>
                    ⏳ Transcribing...
                </p>
            )}

            {error && (
                <div style={{ marginTop: "1rem", color: "red" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {transcript && (
                <div style={{ marginTop: "1rem" }}>
                    <strong>Transcript:</strong>
                    <p>{transcript}</p>
                </div>
            )}
        </div>
    );
}