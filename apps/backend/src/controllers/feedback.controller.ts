import type { Request, Response } from "express";
import { z } from "zod";
import * as feedback from "../services/feedback-query.service";

const SessionsQuery = z.object({
    category: z.string().max(80).optional(),
    q: z.string().max(120).optional(),
    sort: z.enum(["newest", "oldest"]).optional(),
    cursor: z.string().regex(/^\d+$/).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

const GoalBody = z.object({
    targetScore: z.number().int().min(1).max(100),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    label: z.string().trim().min(1).max(120),
});

const ROLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function handle(fn: (req: Request, res: Response, userId: number) => Promise<unknown>) {
    return async (req: Request, res: Response) => {
        try {
            await fn(req, res, res.locals.userId as number);
        } catch (err: any) {
            console.error(`[feedback] ${req.method} ${req.originalUrl} failed:`, err?.message || err);
            if (!res.headersSent) res.status(500).json({ message: "Feedback could not be loaded." });
        }
    };
}

export const getSummary = handle(async (_req, res, userId) => {
    res.json(await feedback.getSummary(userId));
});

export const getSessions = handle(async (req, res, userId) => {
    const parsed = SessionsQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "Invalid query" });
    res.json(await feedback.getSessions(userId, parsed.data));
});

export const getGaps = handle(async (_req, res, userId) => {
    res.json(await feedback.getGaps(userId));
});

export const getFrequency = handle(async (_req, res, userId) => {
    res.json(await feedback.getFrequency(userId));
});

export const getGoal = handle(async (_req, res, userId) => {
    res.json({ goal: await feedback.getGoal(userId) });
});

export const putGoal = handle(async (req, res, userId) => {
    const parsed = GoalBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid goal" });
    res.json({ goal: await feedback.putGoal(userId, parsed.data) });
});

export const getRoleFeedback = handle(async (req, res, userId) => {
    const roleId = String(req.params.roleId ?? "");
    if (roleId.length > 64 || !ROLE_ID.test(roleId)) return res.status(404).json({ message: "Role not found" });
    const data = await feedback.getRoleFeedback(userId, roleId);
    if (!data) return res.status(404).json({ message: "Role not found" });
    res.json(data);
});
