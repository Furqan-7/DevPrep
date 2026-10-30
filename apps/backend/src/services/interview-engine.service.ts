import { prisma } from "@repo/database";
import { streamGeminiContent } from "../lib/gemini";

export const TOTAL_QUESTIONS = 10;

export interface TurnResult {
    isComplete: boolean;
    score: number;
    nextQuestion: string | null;
    interviewerMessage: string;
    questionNum: number;
    totalQuestions: number;
}

export interface ProcessTurnInput {
    sessionId: number;
    candidateAnswer: string;
    currentQuestionText?: string;
    onSpokenChunk: (chunk: string) => void;
    /** Fired as soon as the spoken block is complete, before metrics parsing and DB writes. */
    onSpokenEnd?: () => void;
}

interface CachedQuestion {
    id: number;
    order: number;
    question: string;
    answer: string | null;
}

interface CachedSession {
    id: number;
    userId: number;
    role: string;
    difficulty: string;
    introduction: string | null;
    status: string;
    currentQues: number;
    questions: CachedQuestion[];
    candidateName: string | null;
    touchedAt: number;
}

// Live interviews hit the engine once per turn. Keeping the session state in memory
// removes two database round trips from the critical path before Gemini can start.
const SESSION_CACHE_TTL_MS = 60 * 60 * 1000;
const sessionCache = new Map<number, CachedSession>();

function pruneSessionCache() {
    const cutoff = Date.now() - SESSION_CACHE_TTL_MS;
    for (const [id, entry] of sessionCache) {
        if (entry.touchedAt < cutoff) sessionCache.delete(id);
    }
}

async function loadSession(sessionId: number): Promise<CachedSession | null> {
    const cached = sessionCache.get(sessionId);
    if (cached) {
        cached.touchedAt = Date.now();
        return cached;
    }

    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
            questions: { orderBy: { order: "asc" } },
        },
    });
    if (!session) return null;

    // Candidate identity context (no relation on InterviewSession schema)
    const candidateUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true },
    });

    const entry: CachedSession = {
        id: session.id,
        userId: session.userId,
        role: session.role,
        difficulty: session.difficulty,
        introduction: session.introduction ?? null,
        status: session.status,
        currentQues: session.currentQues,
        questions: session.questions.map((q: any) => ({
            id: q.id,
            order: q.order,
            question: q.question,
            answer: q.answer ?? null,
        })),
        candidateName: candidateUser?.username ?? null,
        touchedAt: Date.now(),
    };
    pruneSessionCache();
    sessionCache.set(sessionId, entry);
    return entry;
}

/**
 * Authoritative Interview Engine.
 * Single source of truth for:
 * - Session progress & question history
 * - Answer evaluation & scoring
 * - Next question generation & spoken delivery
 * - Database persistence & consistency
 */
export async function processInterviewTurn(input: ProcessTurnInput): Promise<TurnResult> {
    const { sessionId, candidateAnswer, currentQuestionText, onSpokenChunk } = input;

    const { onSpokenEnd } = input;

    // 1. Fetch authoritative session + question history (memory first, DB on miss)
    const session = await loadSession(sessionId);

    if (!session) {
        throw new Error(`Interview session #${sessionId} not found`);
    }

    if (session.status === "completed") {
        const completionMsg = "This interview session has already concluded. Your performance report is ready.";
        onSpokenChunk(completionMsg);
        onSpokenEnd?.();
        return {
            isComplete: true,
            score: 0,
            nextQuestion: null,
            interviewerMessage: completionMsg,
            questionNum: session.currentQues,
            totalQuestions: TOTAL_QUESTIONS,
        };
    }

    // 2. Identify current question being answered
    const currentQues = session.questions.find((q) => q.order === session.currentQues);
    const questionText = currentQues?.question || currentQuestionText || "Can you explain your experience in this domain?";
    // isLastQuestion fires at question 10 (the 10th technical question, order 10)
    const isLastQuestion = session.currentQues >= TOTAL_QUESTIONS;

    const candidateName = session.candidateName;

    // 3. Build structured conversation history (intro + all answered technical turns)
    const history = session.questions
        .filter((q) => q.order >= 0 && q.answer)   // include order:0 intro in history
        .map((q) => {
            const label = q.order === 0 ? "Introduction" : `Q${q.order}`;
            return `${label}: ${q.question}\nA${q.order === 0 ? "(Intro)" : q.order}: ${q.answer}`;
        })
        .join("\n\n");

    // Candidate context block injected once at the top of each prompt
    const candidateContext = [
        candidateName ? `Candidate name: ${candidateName}` : null,
        session.introduction ? `Candidate's written introduction: "${session.introduction}"` : null,
    ].filter(Boolean).join("\n");

    const isIntroTurn = session.currentQues === 0;

    // 4. Construct prompt for single unified streaming generation
    const prompt = `You are Zara, DevPrep's professional, supportive, and conversational AI technical interviewer conducting a LIVE interview for a "${session.role}" role at "${session.difficulty}" difficulty.
${
  candidateContext
    ? `\nCandidate Context:\n${candidateContext}\n`
    : ""
}
Previous Interview Turns:
${history || "(No previous turns — this is the start of the interview)"}

${
  isIntroTurn
    ? `The candidate just answered the opening introduction: "Tell me about yourself."
Candidate's spoken answer: "${candidateAnswer}"

INTRO TURN INSTRUCTIONS:
- In 1 sentence, warmly acknowledge their introduction.
${
  candidateName
    ? `- Address them by name (${candidateName}) in this response — this is the ONLY time you should use their name unprompted. Do NOT use their name in any subsequent question.`
    : "- If you naturally heard their name in their answer, you may use it once. Do not invent or guess a name."
}
- Immediately follow with the first technical interview question for the "${session.role}" role. Ask naturally without numbering it.
- Total spoken response: 2 to 3 sentences maximum.`
    : `You just asked: "${questionText}"
Candidate's spoken answer: "${candidateAnswer}"

RESPONSE INSTRUCTIONS:
- In 1 to 2 sentences, naturally acknowledge and assess their answer.
${
  isLastQuestion
    ? "- This was the FINAL interview question. Conclude the interview warmly, thanking the candidate and informing them their report is ready."
    : `- Seamlessly transition and ask the NEXT relevant technical interview question for the ${session.role} role.`
}
${
  candidateName
    ? `- NAME RULE: Do NOT address the candidate as "${candidateName}" in this response. Their name was already used in the post-introduction response. Only use their name again if it arises completely naturally and at least 3 technical questions have passed.`
    : ""
}
- Total spoken response: 2 to 4 sentences maximum.`
}

FORMATTING RULES (apply to ALL turns):
1. Provide your spoken response enclosed strictly within [SPOKEN] and [/SPOKEN] tags. Start immediately with [SPOKEN].
   - Natural human speech only. NO markdown, NO bullets, NO asterisks, NO headers, NO "Question N:" prefixes.
   - End spoken text with [/SPOKEN].

2. Immediately after [/SPOKEN], provide evaluation metrics enclosed in [METRICS] and [/METRICS]:
[METRICS]
Score: <integer 0-10 evaluating the candidate's answer>
NextQuestion: <the exact new question you asked in your spoken response, or "NONE" if final>
IsComplete: <${isLastQuestion ? "true" : "false"}>
[/METRICS]`.trim();

    // 5. Stream Gemini tokens and filter [SPOKEN] block directly to onSpokenChunk in real time
    let spokenBuffer = "";
    let inSpokenTag = false;
    let spokenEnded = false;
    let fullResponse = "";
    let accumulatedSpoken = "";
    let spokenEndSignalled = false;
    const signalSpokenEnd = () => {
        if (spokenEndSignalled) return;
        spokenEndSignalled = true;
        onSpokenEnd?.();
    };

    await streamGeminiContent({
        prompt,
        onChunk: (chunk: string) => {
            fullResponse += chunk;

            if (spokenEnded) return;

            spokenBuffer += chunk;

            if (!inSpokenTag) {
                const startIndex = spokenBuffer.indexOf("[SPOKEN]");
                if (startIndex !== -1) {
                    inSpokenTag = true;
                    spokenBuffer = spokenBuffer.substring(startIndex + 8);
                } else if (spokenBuffer.length > 25 && !spokenBuffer.includes("[")) {
                    // Fallback if model omitted tag and started talking immediately
                    inSpokenTag = true;
                }
            }

            if (inSpokenTag) {
                const endIndex = spokenBuffer.indexOf("[/SPOKEN]");
                const metricsIndex = spokenBuffer.indexOf("[METRICS]");
                const cutIndex = endIndex !== -1 ? endIndex : metricsIndex;

                if (cutIndex !== -1) {
                    const remainingSpoken = spokenBuffer.substring(0, cutIndex).trim();
                    if (remainingSpoken) {
                        onSpokenChunk(remainingSpoken);
                        accumulatedSpoken += " " + remainingSpoken;
                    }
                    spokenEnded = true;
                    spokenBuffer = "";
                    // Let TTS flush the final sentence now instead of waiting for
                    // the metrics block and database writes to finish.
                    signalSpokenEnd();
                } else {
                    // Safe streaming chunk threshold (leave room for incomplete tags)
                    if (spokenBuffer.length > 15) {
                        const emitChunk = spokenBuffer.substring(0, spokenBuffer.length - 15);
                        spokenBuffer = spokenBuffer.substring(spokenBuffer.length - 15);
                        if (emitChunk) {
                            onSpokenChunk(emitChunk);
                            accumulatedSpoken += emitChunk;
                        }
                    }
                }
            }
        },
    });

    // Flush any remaining spoken text
    if (!spokenEnded && spokenBuffer) {
        const cleanRemaining = spokenBuffer
            .replace(/\[\/?SPOKEN\]/g, "")
            .replace(/\[METRICS\][\s\S]*/, "")
            .trim();
        if (cleanRemaining) {
            onSpokenChunk(cleanRemaining);
            accumulatedSpoken += " " + cleanRemaining;
        }
    }
    signalSpokenEnd();

    const spokenText = accumulatedSpoken.trim() || "Thank you for your answer. Let's move on to the next topic.";

    // 6. Parse metrics and next question from the full response
    let score = 7;
    const scoreMatch = fullResponse.match(/Score:\s*(\d+)/i);
    if (scoreMatch && scoreMatch[1]) {
        score = Math.min(10, Math.max(0, parseInt(scoreMatch[1], 10)));
    }

    let nextQuestion: string | null = null;
    const nextQMatch = fullResponse.match(/NextQuestion:\s*([^\r\n\[]+)/i);
    if (nextQMatch && nextQMatch[1]) {
        const raw = nextQMatch[1].trim();
        if (raw.toUpperCase() !== "NONE" && raw.length > 5) {
            nextQuestion = raw;
        }
    }

    // Fallback: If not last question and nextQuestion wasn't parsed, extract last sentence with '?'
    const isCompletedTurn = isLastQuestion || fullResponse.toLowerCase().includes("iscomplete: true");
    if (!isCompletedTurn && !nextQuestion) {
        const questionMatch = spokenText.match(/([^.?!]+\?)\s*$/);
        if (questionMatch && questionMatch[1]) {
            nextQuestion = questionMatch[1].trim();
        } else {
            nextQuestion = "Can you share another example or best practice from your experience with this?";
        }
    }

    // 7. Atomic Database Persistence (single transaction, one round trip batch)
    const answerUpdate = currentQues
        ? [prisma.interviewQuestion.update({
            where: { id: currentQues.id },
            data: {
                answer: candidateAnswer,
                score,
                feedback: spokenText,
            },
        })]
        : [];
    if (currentQues) currentQues.answer = candidateAnswer;

    if (isCompletedTurn) {
        await prisma.$transaction([
            ...answerUpdate,
            prisma.interviewSession.update({
                where: { id: session.id },
                data: { status: "completed" },
            }),
        ]);
        sessionCache.delete(session.id);

        return {
            isComplete: true,
            score,
            nextQuestion: null,
            interviewerMessage: spokenText,
            questionNum: session.currentQues,
            totalQuestions: TOTAL_QUESTIONS,
        };
    }

    const nextOrder = session.currentQues + 1;
    const finalNextQuestion = nextQuestion!;

    try {
        // Upsert avoids race conditions on duplicate turns
        const results = await prisma.$transaction([
            ...answerUpdate,
            prisma.interviewQuestion.upsert({
                where: {
                    sessionId_order: {
                        sessionId: session.id,
                        order: nextOrder,
                    },
                },
                create: {
                    sessionId: session.id,
                    order: nextOrder,
                    question: finalNextQuestion,
                },
                update: {
                    question: finalNextQuestion,
                },
            }),
            prisma.interviewSession.update({
                where: { id: session.id },
                data: { currentQues: nextOrder },
            }),
        ]);

        const upserted = results[answerUpdate.length] as { id: number };
        session.questions = session.questions.filter((q) => q.order !== nextOrder);
        session.questions.push({ id: upserted.id, order: nextOrder, question: finalNextQuestion, answer: null });
        session.currentQues = nextOrder;
    } catch (err) {
        // Never let the cache drift from the database
        sessionCache.delete(session.id);
        throw err;
    }

    return {
        isComplete: false,
        score,
        nextQuestion: finalNextQuestion,
        interviewerMessage: spokenText,
        questionNum: nextOrder,
        totalQuestions: TOTAL_QUESTIONS,
    };
}
