"use client";

export default function InterviewPage() {
    const startInterview = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;

            console.log("User said:", transcript);
        };

        recognition.onerror = (event) => {
            console.log("Speech Error:", event.error);
        };

        recognition.start();
    };

    return (
        <button onClick={startInterview}>
            Start Interview
        </button>
    );
}