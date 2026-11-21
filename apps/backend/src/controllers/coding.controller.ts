import { prisma } from "@repo/database";
import type { Request, Response } from "express";
import { z } from "zod";
import { CODING_PROBLEMS, findCodingProblem } from "../data/coding-problems";
import { parseBody, userIdOf } from "../lib/request";
import { reviewSolution } from "../services/coding.service";

/** Coding round: the problem set, and submitted solutions with their AI review. */

const MAX_CODE_CHARS = 20000;

const submitSchema = z.object({
    problem: z.string().min(1).max(100),
    language: z.literal("javascript"),
    code: z.string().trim().min(1).max(MAX_CODE_CHARS),
    passed: z.number().int().min(0),
    total: z.number().int().min(1),
});

const select = { id: true, problem: true, language: true, code: true, passed: true, total: true, score: true, review: true, createdAt: true } as const;

export const listProblems = (_req: Request, res: Response) => {
    res.json({ success: true, problems: CODING_PROBLEMS });
};

/** The user's submissions, newest first; ?problem=slug narrows them to one problem. */
export const listSubmissions = async (req: Request, res: Response) => {
    const problem = typeof req.query.problem === "string" ? req.query.problem : undefined;
    try {
        const submissions = await prisma.codingSubmission.findMany({
            where: { userId: userIdOf(res), ...(problem ? { problem } : {}) },
            orderBy: { createdAt: "desc" },
            take: problem ? 20 : 200,
            select,
        });
        return res.json({ success: true, submissions });
    } catch (err: any) {
        console.error("[listSubmissions]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load your submissions." });
    }
};

export const createSubmission = async (req: Request, res: Response) => {
    const body = parseBody(submitSchema, req, res);
    if (!body) return;
    const problem = findCodingProblem(body.problem);
    if (!problem) return res.status(404).json({ success: false, message: "Problem not found." });
    if (body.total !== problem.tests.length || body.passed > body.total) {
        return res.status(400).json({ success: false, message: "Run the tests before submitting." });
    }

    try {
        const review = await reviewSolution(problem, body.code, body.passed, body.total);
        const submission = await prisma.codingSubmission.create({
            data: { ...body, userId: userIdOf(res), score: review.score, review: review as object },
            select,
        });
        return res.status(201).json({ success: true, submission });
    } catch (err: any) {
        console.error("[createSubmission]", err?.message ?? err);
        return res.status(502).json({ success: false, message: "Couldn't review your code right now. Please try again." });
    }
};
