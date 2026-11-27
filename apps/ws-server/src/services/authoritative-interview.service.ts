export interface TurnResult {
    isComplete: boolean;
    score: number;
    nextQuestion: string | null;
    interviewerMessage: string;
    questionNum: number;
    totalQuestions: number;
}

export interface AuthoritativeTurnInput {
    sessionId: number;
    candidateAnswer: string;
    currentQuestion?: string;
    /** Length of the candidate's spoken answer. */
    speakingMs?: number;
    token?: string;
    onChunk: (spokenChunk: string) => void;
    /** Called once the spoken text is complete (before metrics/DB work finishes). */
    onSpokenEnd?: () => void;
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Authoritative Interview Service Bridge for ws-server.
 * Connects directly to the backend Authoritative Interview Engine via SSE stream.
 * Ensures ws-server never invents its own questions or runs duplicate LLM calls.
 */
export async function streamAuthoritativeInterviewTurn(
    input: AuthoritativeTurnInput
): Promise<TurnResult> {
    const { sessionId, candidateAnswer, currentQuestion, speakingMs, token, onChunk, onSpokenEnd } = input;

    const endpoint = `${BACKEND_URL}/api/interview/turn-stream`;
    console.log(`[AuthoritativeService] Requesting turn stream from: ${endpoint} for session #${sessionId}`);

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["token"] = token;
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            sessionId,
            candidateAnswer,
            currentQuestion,
            speakingMs,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Authoritative engine responded with ${response.status}: ${errorText || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Unable to obtain stream reader from authoritative backend response");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let turnResult: TurnResult | null = null;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
                const trimmed = event.trim();
                if (!trimmed.startsWith("data:")) continue;

                const jsonStr = trimmed.replace(/^data:\s*/, "");
                if (!jsonStr) continue;

                try {
                    const data = JSON.parse(jsonStr);
                    if (data.type === "spoken_chunk" && typeof data.text === "string") {
                        onChunk(data.text);
                    } else if (data.type === "spoken_end") {
                        onSpokenEnd?.();
                    } else if (data.type === "turn_result") {
                        turnResult = {
                            isComplete: Boolean(data.isComplete),
                            score: typeof data.score === "number" ? data.score : 7,
                            nextQuestion: data.nextQuestion ?? null,
                            interviewerMessage: data.interviewerMessage || "",
                            questionNum: data.questionNum || 1,
                            totalQuestions: data.totalQuestions || 10,
                        };
                    } else if (data.type === "error") {
                        throw new Error(data.error || "Turn processing error from backend");
                    }
                } catch (parseErr: any) {
                    if (parseErr.message && !parseErr.message.includes("JSON")) {
                        throw parseErr;
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    if (!turnResult) {
        throw new Error("Turn stream ended without receiving final turn_result metadata");
    }

    return turnResult;
}

/**
 * Asks the backend to get ready for the next turn: load the session into its cache and
 * open its connection to Gemini. Fire and forget; it only ever saves time, so failures
 * are ignored. The request itself also keeps this server's connection to the backend warm.
 */
export function prewarmAuthoritativeSession(sessionId: number, token?: string): void {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["token"] = token;
    fetch(`${BACKEND_URL}/api/interview/prewarm`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(5000),
    })
        .then((res) => res.body?.cancel())
        .catch(() => {});
}
