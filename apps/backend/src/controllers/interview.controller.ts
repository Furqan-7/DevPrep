import { prisma } from "@repo/database";
import { InterviewQuestions, InterviewSessionSchema } from "../types";
import { processInterviewTurn, TOTAL_QUESTIONS } from "../services/interview-engine.service";
import type { Level } from "../data/question-bank";
import { planInterview } from "../data/question-bank/planner";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });

// The levels the role page sends as "difficulty", as the question bank names them
const BANK_LEVELS: Record<string, Level> = { fresher: "fresher", "mid-level": "mid", senior: "senior" };

// Stored as question 1 when there is no planned question; the intro turn replaces it
const FIRST_QUESTION_FALLBACK = "Can you walk me through your technical background and a recent project you built?";

/**
 * Start a new interview session and initialize Question 1.
 */
export const startInterview = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(res.locals.userId, 10);
        const parseResult = InterviewSessionSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Invalid Request Format",
                success: false,
            });
        }
        const { role, difficulty, introduction, useResume, jobDescription } = parseResult.data;
        const level = BANK_LEVELS[difficulty];

        // Candidate username (and resume, when asked for) for AI context, and the bank
        // questions they were asked in earlier interviews so this one does not repeat them
        const [candidateUser, askedBefore] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { username: true, resume: useResume ? { select: { text: true } } : false },
            }),
            level
                ? prisma.interviewQuestion.findMany({
                    where: { session: { userId }, bankId: { not: null } },
                    select: { bankId: true },
                })
                : [],
        ]);
        const candidateName = candidateUser?.username ?? null;
        if (useResume && !candidateUser?.resume) {
            return res.status(409).json({ success: false, message: "Upload your resume before starting a resume-based interview." });
        }

        // Questions 1-10 from the question bank (in memory), or null for roles without a blueprint
        const plan = level
            ? planInterview({
                role,
                level,
                seenIds: new Set(askedBefore.map((q) => q.bankId!)),
                tailoring: Boolean(useResume || jobDescription),
            })
            : null;
        const first = plan?.[0];

        // Atomically create session with intro (order 0) and first technical question (order 1).
        // currentQues starts at 0 so the intro is the authoritative first spoken question.
        const session = await prisma.interviewSession.create({
            data: {
                userId,
                role,
                difficulty,
                introduction,
                resume: candidateUser?.resume?.text ?? null,
                jobDescription: jobDescription ?? null,
                status: "active",
                currentQues: 0,
                plan: plan ? plan.map((q) => q?.id ?? null) : undefined,
                questions: {
                    create: [
                        {
                            order: 0,
                            question: "Tell me about yourself.",
                            // Pre-populate with written intro if provided; will be overwritten by spoken answer
                            answer: introduction ?? null,
                        },
                        {
                            order: 1,
                            question: first?.question ?? FIRST_QUESTION_FALLBACK,
                            bankId: first?.id ?? null,
                        },
                    ],
                },
            },
        });

        // Return the intro question as the authoritative firstQuestion so the
        // ws-server speaks "Tell me about yourself." — not the technical question.
        return res.status(200).json({
            success: true,
            sessionId: session.id,
            questionNum: 0,
            totalQuestions: TOTAL_QUESTIONS,
            question: "Tell me about yourself.",
            candidateName,
        });
    } catch (error: any) {
        console.error("[/api/interview/generate] Error starting interview:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong starting your interview. Please try again.",
        });
    }
};

/**
 * Real-time SSE streaming turn processor.
 * Consumed by ws-server for zero-delay speech synthesis.
 */
export const streamInterviewTurn = async (req: Request, res: Response) => {
    try {
        const { sessionId, candidateAnswer, currentQuestion, speakingMs } = req.body;

        if (!sessionId || !candidateAnswer) {
            return res.status(400).json({
                success: false,
                error: "sessionId and candidateAnswer are required",
            });
        }

        const sessIdNum = parseInt(String(sessionId), 10);
        if (isNaN(sessIdNum)) {
            return res.status(400).json({ success: false, error: "Invalid sessionId" });
        }

        // Set up Server-Sent Events headers for low latency streaming
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        // Disable Nagle so each small SSE frame leaves immediately
        res.socket?.setNoDelay(true);
        if (typeof res.flushHeaders === "function") {
            res.flushHeaders();
        }

        const turnResult = await processInterviewTurn({
            sessionId: sessIdNum,
            candidateAnswer: String(candidateAnswer).trim(),
            currentQuestionText: currentQuestion ? String(currentQuestion).trim() : undefined,
            speakingMs: Number.isInteger(speakingMs) && speakingMs > 0 ? speakingMs : undefined,
            onSpokenChunk: (chunk: string) => {
                res.write(`data: ${JSON.stringify({ type: "spoken_chunk", text: chunk })}\n\n`);
            },
            onSpokenEnd: () => {
                res.write(`data: ${JSON.stringify({ type: "spoken_end" })}\n\n`);
            },
        });

        res.write(`data: ${JSON.stringify({ type: "turn_result", ...turnResult })}\n\n`);
        res.end();
    } catch (err: any) {
        console.error("[streamInterviewTurn] Error:", err?.message || err);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
        }
        res.write(`data: ${JSON.stringify({ type: "error", error: err?.message || "Turn generation failed" })}\n\n`);
        res.end();
    }
};

/**
 * Non-streaming legacy fallback for submitAnswer.
 * Delegates directly to authoritative processInterviewTurn.
 */
export const submitAnswer = async (req: Request, res: Response) => {
    try {
        const parseResult = InterviewQuestions.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: parseResult.error.issues.map((i: any) => i.message).join(", "),
            });
        }

        const { sessionId, answer } = parseResult.data;
        const sessIdNum = parseInt(sessionId, 10);

        let spokenAccumulator = "";
        const result = await processInterviewTurn({
            sessionId: sessIdNum,
            candidateAnswer: answer,
            onSpokenChunk: (chunk: string) => {
                spokenAccumulator += " " + chunk;
            },
        });

        return res.json({
            isComplete: result.isComplete,
            interviewerMessage: result.interviewerMessage || spokenAccumulator.trim(),
            questionNum: result.questionNum,
            totalQuestions: result.totalQuestions,
            question: result.nextQuestion,
        });
    } catch (error: any) {
        console.error("[/api/interview/answer] Error:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            error: error?.message ?? "Internal server error",
        });
    }
};
