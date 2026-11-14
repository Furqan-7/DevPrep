import { prisma } from "@repo/database";
import type { Request, Response } from "express";
import { z } from "zod";
import { evaluateAttempt, evaluateSession, type AnswerEvaluation } from "../services/evaluation.service";
import { forgetSession, TOTAL_QUESTIONS } from "../services/interview-engine.service";

/**
 * Post-interview feedback: the session report (per-answer rubric feedback plus an
 * overall assessment), the user's interview history, and retries of single questions.
 * All routes run behind MiddleWhere, so res.locals.userId is set.
 */

const MAX_ATTEMPTS_PER_QUESTION = 5;
const MAX_ANSWER_CHARS = 4000;

const attemptSchema = z.object({ answer: z.string().trim().min(1).max(MAX_ANSWER_CHARS) });

const userIdOf = (res: Response) => Number(res.locals.userId);
const idParam = (req: Request) => {
    const n = Number(req.params.id);
    return Number.isInteger(n) && n > 0 ? n : null;
};
const parseList = (s: string | null | undefined): string[] => {
    if (!s) return [];
    try {
        const v = JSON.parse(s);
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
        return s.split("\n").map((x) => x.trim()).filter(Boolean);
    }
};
const hasAnswer = (a: string | null): a is string => !!a && a.trim().length > 0;

/* ───────── shared loader + serializer ───────── */

const sessionInclude = {
    questions: {
        orderBy: { order: "asc" as const },
        include: { attempts: { orderBy: { createdAt: "asc" as const } } },
    },
    report: true,
};

async function loadOwnedSession(sessionId: number, userId: number) {
    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId }, include: sessionInclude });
    // Same response for "missing" and "someone else's", so ids can't be probed.
    return session && session.userId === userId ? session : null;
}

type LoadedSession = NonNullable<Awaited<ReturnType<typeof loadOwnedSession>>>;

function serialize(session: LoadedSession) {
    const report = session.report;
    return {
        id: session.id,
        role: session.role,
        difficulty: session.difficulty,
        status: session.status,
        createdAt: session.createdAt,
        report: report
            ? {
                  overallScore: report.overallScore,
                  technical: report.technical,
                  communication: report.communication,
                  confidence: report.confidence,
                  summary: report.summary,
                  strengths: parseList(report.strengths),
                  improvements: parseList(report.improvements),
                  createdAt: report.createdAt,
              }
            : null,
        questions: session.questions
            // Placeholder rows for questions Zara never got to ask have no answer and are left out.
            .filter((q) => hasAnswer(q.answer) || q.order <= session.currentQues)
            .map((q) => {
                const evaluation = (q.evaluation as AnswerEvaluation | null) ?? null;
                return {
                    id: q.id,
                    order: q.order,
                    question: q.question,
                    answer: hasAnswer(q.answer) ? q.answer : null,
                    // Only rubric scores are shown; the quick live score is not.
                    score: evaluation ? evaluation.score : null,
                    evaluation,
                    attempts: q.attempts.map((a) => ({
                        id: a.id,
                        answer: a.answer,
                        score: a.score,
                        evaluation: a.evaluation,
                        createdAt: a.createdAt,
                    })),
                };
            }),
    };
}

/* ───────── GET /sessions ───────── */

export const listSessions = async (_req: Request, res: Response) => {
    try {
        const sessions = await prisma.interviewSession.findMany({
            where: { userId: userIdOf(res) },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                report: { select: { overallScore: true } },
                questions: { select: { answer: true } },
            },
        });
        return res.json({
            success: true,
            sessions: sessions.map((s) => ({
                id: s.id,
                role: s.role,
                difficulty: s.difficulty,
                status: s.status,
                createdAt: s.createdAt,
                answered: s.questions.filter((q) => hasAnswer(q.answer)).length,
                totalQuestions: TOTAL_QUESTIONS + 1, // intro + technical questions
                overallScore: s.report?.overallScore ?? null,
            })),
        });
    } catch (err: any) {
        console.error("[listSessions]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load your interviews." });
    }
};

/* ───────── GET /sessions/:id ───────── */

export const getSession = async (req: Request, res: Response) => {
    const id = idParam(req);
    if (!id) return res.status(400).json({ success: false, message: "Invalid session id." });
    try {
        const session = await loadOwnedSession(id, userIdOf(res));
        if (!session) return res.status(404).json({ success: false, message: "Interview not found." });
        return res.json({ success: true, session: serialize(session) });
    } catch (err: any) {
        console.error("[getSession]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load this interview." });
    }
};

/* ───────── POST /sessions/:id/report ───────── */

// One generation per session at a time; concurrent requests share the same promise.
const inFlight = new Map<number, Promise<void>>();

async function generateReport(session: LoadedSession) {
    const pairs = session.questions
        .filter((q) => hasAnswer(q.answer))
        .map((q) => ({ order: q.order, question: q.question, answer: q.answer as string }));

    const result = await evaluateSession(session.role, session.difficulty, pairs);
    const scores = [...result.answers.values()].map((e) => e.score);
    const overallScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10);

    const updates = session.questions
        .filter((q) => result.answers.has(q.order))
        .map((q) => {
            const evaluation = result.answers.get(q.order)!;
            return prisma.interviewQuestion.update({
                where: { id: q.id },
                data: { score: evaluation.score, evaluation: evaluation as object },
            });
        });

    await prisma.$transaction([
        ...updates,
        prisma.interviewReport.create({
            data: {
                sessionId: session.id,
                overallScore,
                technical: result.overall.technical,
                communication: result.overall.communication,
                confidence: result.overall.confidence,
                summary: result.overall.summary,
                strengths: JSON.stringify(result.overall.strengths),
                improvements: JSON.stringify(result.overall.improvements),
            },
        }),
        // Generating a report ends the interview, including one the candidate left early.
        prisma.interviewSession.update({ where: { id: session.id }, data: { status: "completed" } }),
    ]);
    forgetSession(session.id);
}

export const createReport = async (req: Request, res: Response) => {
    const id = idParam(req);
    if (!id) return res.status(400).json({ success: false, message: "Invalid session id." });
    const userId = userIdOf(res);
    try {
        let session = await loadOwnedSession(id, userId);
        if (!session) return res.status(404).json({ success: false, message: "Interview not found." });
        if (session.report) return res.json({ success: true, session: serialize(session) });
        if (!session.questions.some((q) => hasAnswer(q.answer))) {
            return res.status(409).json({ success: false, message: "Answer at least one question to get a report." });
        }

        let job = inFlight.get(id);
        if (!job) {
            job = generateReport(session).finally(() => inFlight.delete(id));
            inFlight.set(id, job);
        }
        await job;

        session = await loadOwnedSession(id, userId);
        return res.json({ success: true, session: serialize(session!) });
    } catch (err: any) {
        // A request that lost a race with another process: the report exists now.
        if (err?.code === "P2002") {
            const session = await loadOwnedSession(id, userId);
            if (session?.report) return res.json({ success: true, session: serialize(session) });
        }
        console.error("[createReport]", err?.message ?? err);
        return res.status(502).json({ success: false, message: "Couldn't generate your report right now. Please try again." });
    }
};

/* ───────── POST /questions/:id/attempts ───────── */

export const createAttempt = async (req: Request, res: Response) => {
    const id = idParam(req);
    if (!id) return res.status(400).json({ success: false, message: "Invalid question id." });
    const parsed = attemptSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: `Answer must be 1–${MAX_ANSWER_CHARS} characters.` });
    }

    try {
        const question = await prisma.interviewQuestion.findUnique({
            where: { id },
            include: {
                session: { include: { report: { select: { id: true } } } },
                attempts: { orderBy: { createdAt: "asc" } },
            },
        });
        if (!question || question.session.userId !== userIdOf(res)) {
            return res.status(404).json({ success: false, message: "Question not found." });
        }
        if (!question.session.report || !question.evaluation) {
            return res.status(409).json({ success: false, message: "Get the interview report before retrying a question." });
        }
        if (question.attempts.length >= MAX_ATTEMPTS_PER_QUESTION) {
            return res.status(429).json({ success: false, message: `You've retried this question ${MAX_ATTEMPTS_PER_QUESTION} times.` });
        }

        // Compare against the most recent try, so "fixed" reflects the last feedback read.
        const last = question.attempts.at(-1);
        const previous = (last?.evaluation ?? question.evaluation) as unknown as AnswerEvaluation;
        const evaluation = await evaluateAttempt(
            question.session.role,
            question.session.difficulty,
            question.question,
            parsed.data.answer,
            previous.gaps ?? [],
        );

        const attempt = await prisma.answerAttempt.create({
            data: { questionId: id, answer: parsed.data.answer, score: evaluation.score, evaluation: evaluation as object },
        });

        return res.json({
            success: true,
            attempt: { id: attempt.id, answer: attempt.answer, score: attempt.score, evaluation, createdAt: attempt.createdAt },
            previousScore: last?.score ?? (question.evaluation as unknown as AnswerEvaluation).score,
            attemptsLeft: MAX_ATTEMPTS_PER_QUESTION - question.attempts.length - 1,
        });
    } catch (err: any) {
        console.error("[createAttempt]", err?.message ?? err);
        return res.status(502).json({ success: false, message: "Couldn't score your answer right now. Please try again." });
    }
};
