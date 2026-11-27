import { prisma } from "@repo/database";
import type { Request, Response } from "express";
import { z } from "zod";
import { intParam, parseBody, userIdOf } from "../lib/request";

/** DSA sheet progress: which problems the user solved, and their notes on each. */

const updateSchema = z
    .object({
        solved: z.boolean().optional(),
        note: z.string().trim().max(2000).nullish(),
    })
    .refine((b) => b.solved !== undefined || b.note !== undefined, "send solved or note");

const serialize = (p: { problemId: number; solvedAt: Date | null; note: string | null }) => ({
    problemId: p.problemId,
    solved: p.solvedAt !== null,
    solvedAt: p.solvedAt,
    note: p.note,
});

export const listProblemProgress = async (_req: Request, res: Response) => {
    try {
        const rows = await prisma.problemProgress.findMany({ where: { userId: userIdOf(res) } });
        return res.json({ success: true, progress: rows.map(serialize) });
    } catch (err: any) {
        console.error("[listProblemProgress]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load your progress." });
    }
};

export const updateProblemProgress = async (req: Request, res: Response) => {
    const problemId = intParam(req, "problemId");
    if (!problemId) return res.status(400).json({ success: false, message: "Invalid problem id." });
    const body = parseBody(updateSchema, req, res);
    if (!body) return;

    const data = {
        ...(body.solved !== undefined ? { solvedAt: body.solved ? new Date() : null } : {}),
        ...(body.note !== undefined ? { note: body.note || null } : {}),
    };
    try {
        const userId = userIdOf(res);
        const row = await prisma.problemProgress.upsert({
            where: { userId_problemId: { userId, problemId } },
            create: { userId, problemId, ...data },
            update: data,
        });
        return res.json({ success: true, progress: serialize(row) });
    } catch (err: any) {
        console.error("[updateProblemProgress]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't save your progress." });
    }
};
