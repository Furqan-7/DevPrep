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

    // 1. Fetch authoritative session and question history
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!session) {
        throw new Error(`Interview session #${sessionId} not found`);
    }

    if (session.status === "completed") {
        const completionMsg = "This interview session has already concluded. Your performance report is ready.";
        onSpokenChunk(completionMsg);
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
    const currentQues = session.questions.find((q: any) => q.order === session.currentQues);
    const questionText = currentQues?.question || currentQuestionText || "Can you explain your experience in this domain?";
    const isLastQuestion = session.currentQues >= TOTAL_QUESTIONS;

    // 3. Build structured conversation history
    const history = session.questions
        .filter((q: any) => q.order > 0 && q.answer)
        .map((q: any) => `Q${q.order}: ${q.question}\nA${q.order}: ${q.answer}`)
        .join("\n\n");

    // 4. Construct prompt for single unified streaming generation
    const prompt = `You are Zara, DevPrep's professional, supportive, and conversational AI technical interviewer conducting a LIVE interview for a "${session.role}" role at "${session.difficulty}" difficulty.

Previous Interview Turns:
${history || "(This is the candidate's first answered question)"}

You just asked: "${questionText}"
Candidate's spoken answer: "${candidateAnswer}"

CRITICAL INSTRUCTIONS:
1. Provide your spoken response to the candidate enclosed strictly within [SPOKEN] and [/SPOKEN] tags.
   - Start immediately with [SPOKEN].
   - In 1 to 2 spoken sentences, naturally acknowledge and assess their answer (e.g. "That's a clear explanation of...", "Good point on...", or gently clarify if incomplete).
   ${isLastQuestion
     ? "- This was the FINAL interview question. Conclude the interview warmly in 1 sentence, thanking the candidate and informing them their report is ready."
     : `- Seamlessly transition and ask the NEXT relevant technical interview question suitable for this ${session.role} role.`
   }
   - Total spoken response MUST be 2 to 4 sentences maximum.
   - Formatted for natural human speech (NO markdown, NO bullets, NO asterisks, NO headers, NO robotic phrases like "Question 3:").
   - End spoken text with [/SPOKEN].

2. Immediately after [/SPOKEN], provide the internal evaluation metrics enclosed inside [METRICS] and [/METRICS] tags:
[METRICS]
Score: <integer from 0 to 10 evaluating the candidate's answer>
NextQuestion: <the exact new question you asked at the end of your spoken response, or "NONE" if final question>
IsComplete: <${isLastQuestion ? "true" : "false"}>
[/METRICS]`.trim();

    // 5. Stream Gemini tokens and filter [SPOKEN] block directly to onSpokenChunk in real time
    let spokenBuffer = "";
    let inSpokenTag = false;
    let spokenEnded = false;
    let fullResponse = "";
    let accumulatedSpoken = "";

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

    // 7. Atomic Database Persistence
    if (currentQues) {
        await prisma.interviewQuestion.update({
            where: { id: currentQues.id },
            data: {
                answer: candidateAnswer,
                score,
                feedback: spokenText,
            },
        });
    }

    if (isCompletedTurn) {
        await prisma.interviewSession.update({
            where: { id: session.id },
            data: { status: "completed" },
        });

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

    // Upsert avoids race conditions on duplicate turns
    await prisma.interviewQuestion.upsert({
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
    });

    await prisma.interviewSession.update({
        where: { id: session.id },
        data: { currentQues: nextOrder },
    });

    return {
        isComplete: false,
        score,
        nextQuestion: finalNextQuestion,
        interviewerMessage: spokenText,
        questionNum: nextOrder,
        totalQuestions: TOTAL_QUESTIONS,
    };
}
