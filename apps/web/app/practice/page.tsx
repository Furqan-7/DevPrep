"use client";

import { useRef, useState } from "react";

export default function PracticePage() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });

            const formData = new FormData();
            formData.append("audio", blob, "recording.webm");

            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            setTranscript(data.transcript);
            console.log("User said:", data.transcript);
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Practice Session</h1>
            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <button onClick={startRecording} disabled={isRecording}>
                    Start Recording
                </button>
                <button onClick={stopRecording} disabled={!isRecording}>
                    Stop Recording
                </button>
            </div>
            {transcript && (
                <div style={{ marginTop: "1rem" }}>
                    <strong>Transcript:</strong>
                    <p>{transcript}</p>
                </div>
            )}
        </div>
    );
}