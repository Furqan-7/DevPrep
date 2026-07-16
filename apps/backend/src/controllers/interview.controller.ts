import { prisma } from "@repo/database";
import { InterviewQuestions, InterviewSessionSchema } from "../types";
import { generateJSON } from "../lib/gemini";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });


const TOTAL_QUESTIONS = 10;

interface NextQuestionResponse {
    question: string;
}

interface EvalResponse {
    score: number;          // internal only, never shown to user mid-interview
    interviewerMessage: string; // what the interviewer actually says out loud
    nextQuestion: string | null;
}



export const startInterview = async (req: Request, res: Response) => {

    try {
        const userId = res.locals.userId;
        console.log("[generate] raw userId from locals:", userId, "| parsed:", parseInt(userId, 10));

        const Response = InterviewSessionSchema.safeParse(req.body);
        if (!Response.success) {
            return res.status(411).json({
                message: "Invalid Format",
                success: false
            })
        };
        const { role, difficulty, introduction } = Response.data;

        console.log("user Id " + userId + " data " + Response.data);

        let session: any;
        try {
            session = await prisma.interviewSession.create({
                data: {
                    userId: parseInt(userId, 10),
                    role: role,
                    difficulty: difficulty,
                    introduction: introduction,
                    status: "active",
                    currentQues: 0,
                }
            });
        } catch (dbError: any) {
            console.error("[/api/interview/generate] DB error creating session:", dbError?.message ?? dbError);
            return res.status(503).json({
                success: false,
                message: "Unable to start your interview right now. Please try again in a moment.",
            });
        }

        try {
            await prisma.interviewQuestion.create({
                data: {
                    sessionId: session.id,
                    order: 0,
                    question: "Tell me about yourself.",
                    answer: introduction ?? null,
                }
            });
        } catch (dbError: any) {
            console.error("[/api/interview/generate] DB error creating intro question:", dbError?.message ?? dbError);
            return res.status(503).json({
                success: false,
                message: "Unable to start your interview right now. Please try again in a moment.",
            });
        }

        const prompt = `
You are a senior technical interviewer for a "${role}" role at "${difficulty}" difficulty.
The candidate just introduced themselves: "${introduction || "(no introduction given)"}"

Generate the FIRST real interview question (order 1), using their introduction as light
context if relevant. Keep it focused and not overly long.

Respond ONLY with valid JSON, no markdown, no preamble:
{ "question": "string" }
        `.trim();

        let question: string;
        try {
            const result = await generateJSON<NextQuestionResponse>(prompt);
            question = result.question;
        } catch (aiError: any) {
            console.error("[/api/interview/generate] AI generation error:", aiError?.message ?? aiError);
            return res.status(502).json({
                success: false,
                message: "Failed to generate interview question. Please try again.",
            });
        }

        try {
            await prisma.interviewQuestion.create({
                data: { sessionId: session.id, order: 1, question },
            });

            await prisma.interviewSession.update({
                where: { id: session.id },
                data: { currentQues: 1 },
            });
        } catch (dbError: any) {
            console.error("[/api/interview/generate] DB error saving first question:", dbError?.message ?? dbError);
            return res.status(503).json({
                success: false,
                message: "Unable to start your interview right now. Please try again in a moment.",
            });
        }

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            questionNum: 1,
            totalQuestions: TOTAL_QUESTIONS,
            question
        });

    } catch (error: any) {
        // Catch-all: log full error server-side, never expose internals to client
        console.error("[/api/interview/generate] Unexpected error:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong starting your interview. Please try again.",
        });
    }
};


export const submitAnswer = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const Response = InterviewQuestions.safeParse(req.body);

        if (!Response.success) {
            return res.status(402).json({
                success: false,
                error: Response.error.issues.map((i: any) => i.message).join(", ")
            });
        }

        const { sessionId, answer } = Response.data;


        const sessionIdNum = parseInt(sessionId, 10);
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionIdNum },
            include: { questions: { orderBy: { "order": "asc" } } },
        });


        if (!session) return res.status(404).json({
            success: false,
            error: "Session Not Found"
        });

        if (session.status === "completed") {
            return res.status(400).json({
                success: false,
                error: "Session Already Completed"
            });
        }

        const currentQues = session.questions.find(
            (q: any) => q.order === session.currentQues
        );

        if (!currentQues) {
            return res.status(500).json({
                success: false,
                error: "No Question Found"
            });
        }

        const isLastQuestion = session.currentQues >= TOTAL_QUESTIONS;

        const history = session.questions
            .filter((q: any) => q.order > 0 && q.answer)
            .map((q: any) => `Q${q.order}: ${q.question}\nA${q.order}: ${q.answer}`)
            .join("\n\n");



        const prompt = `
You are a senior technical interviewer conducting a LIVE interview for a "${session.role}" role at "${session.difficulty}" difficulty.
You are speaking directly to the candidate. Be natural, warm, and conversational — like a real human interviewer.

Conversation so far:
${history || "(this is the first question)"}

You just asked: "${currentQues.question}"
Candidate answered: "${answer}"

Your job:
1. EVALUATE internally (score 0-10, hidden from candidate).
2. RESPOND naturally as the interviewer. Your response should:
   - Acknowledge the answer briefly and naturally ("Got it", "That's a good point", "Interesting", "Right", etc.)
   - If the answer was WRONG or INCOMPLETE: gently correct or clarify it in simple terms, as a good mentor would. Don't say "that's wrong" — say "Actually, one thing worth noting is..." or "To add to that..." etc.
   - If the answer was GOOD: affirm briefly, maybe build on it with one sentence.
   - Then NATURALLY transition to the next question using a connector phrase like "Let's move on to...", "Building on that...", "Here's another one for you..." etc.
   - NEVER say "I will now evaluate your answer", "Moving to question X", "Score:", or anything robotic.
   - Keep your message to 3-5 sentences MAX. Concise and natural.
3. ${isLastQuestion
                ? "This was the FINAL question. End the interview warmly — tell the candidate they did well and that their report is being prepared. Set nextQuestion to null."
                : "Generate the NEXT question that flows naturally from the conversation."
            }

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "score": number,
  "interviewerMessage": "string",
  "nextQuestion": "string | null"
}
`.trim();



        const result = await generateJSON<EvalResponse>(prompt);

        await prisma.interviewQuestion.update({
            where: { id: currentQues.id },
            data: {
                answer,
                score: result.score,
                // store the interviewer message as feedback for the report later
                feedback: result.interviewerMessage,
            },
        });

        if (isLastQuestion) {
            await prisma.interviewSession.update({
                where: { id: session.id },
                data: { status: "completed" },
            });

            return res.json({
                isComplete: true,
                interviewerMessage: result.interviewerMessage, // "Great session, your report is being prepared..."
                sessionId: session.id,
            });
        }

        const nextOrder = session.currentQues + 1;

        await prisma.interviewQuestion.create({
            data: { sessionId: session.id, order: nextOrder, question: result.nextQuestion! },
        });

        await prisma.interviewSession.update({
            where: { id: session.id },
            data: { currentQues: nextOrder },
        });

        return res.json({
            isComplete: false,
            interviewerMessage: result.interviewerMessage, // speak this to the user
            questionNum: nextOrder,
            totalQuestions: TOTAL_QUESTIONS,
            question: result.nextQuestion, // next question is ALREADY embedded in interviewerMessage
        });
    } catch (error: any) {
        console.error("[/api/interview/answer] ERROR:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            error: error?.message ?? "Internal server error",
        });
    }
};


export const interviewFeedback = async (req: Request, res: Response) => {

}
