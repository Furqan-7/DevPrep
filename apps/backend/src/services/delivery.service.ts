/**
 * Delivery stats for spoken answers: speaking pace (from the recorded answer length) and
 * filler words (from the transcript). Pure functions, computed when a report is read.
 */

// Multi-word fillers come first so "you know" isn't also counted as anything shorter.
const FILLERS = ["you know", "i mean", "sort of", "kind of", "um", "uh", "erm", "basically", "actually", "literally"];
const FILLER_RE = new RegExp(`\\b(${FILLERS.join("|")})\\b`, "gi");

export interface AnswerDelivery {
    words: number;
    wpm: number | null; // null when the answer's length wasn't recorded
    fillers: number;
}

export interface SessionDelivery {
    answers: number;
    words: number;
    wpm: number | null;
    fillersPer100Words: number;
    topFillers: { word: string; count: number }[];
}

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

export function answerDelivery(answer: string, speakingMs: number | null): AnswerDelivery {
    const words = countWords(answer);
    return {
        words,
        wpm: speakingMs && speakingMs > 0 ? Math.round(words / (speakingMs / 60000)) : null,
        fillers: answer.match(FILLER_RE)?.length ?? 0,
    };
}

export function sessionDelivery(answers: { answer: string; speakingMs: number | null }[]): SessionDelivery | null {
    if (answers.length === 0) return null;
    const words = answers.reduce((sum, a) => sum + countWords(a.answer), 0);

    // pace over the answers whose length was recorded
    const timed = answers.filter((a) => a.speakingMs && a.speakingMs > 0);
    const timedWords = timed.reduce((sum, a) => sum + countWords(a.answer), 0);
    const timedMs = timed.reduce((sum, a) => sum + a.speakingMs!, 0);

    const tally = new Map<string, number>();
    for (const a of answers) {
        for (const m of a.answer.match(FILLER_RE) ?? []) {
            const w = m.toLowerCase();
            tally.set(w, (tally.get(w) ?? 0) + 1);
        }
    }
    const fillers = [...tally.values()].reduce((a, b) => a + b, 0);

    return {
        answers: answers.length,
        words,
        wpm: timedMs > 0 ? Math.round(timedWords / (timedMs / 60000)) : null,
        fillersPer100Words: words ? Math.round((fillers / words) * 1000) / 10 : 0,
        topFillers: [...tally.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([word, count]) => ({ word, count })),
    };
}
