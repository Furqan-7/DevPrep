import { prisma, ApplicationStage } from "@repo/database";
import type { Request, Response } from "express";
import { z } from "zod";
import { intParam, parseBody, userIdOf } from "../lib/request";

/** Job application tracker: every job the user is following, grouped by stage. */

const optionalText = (max: number) =>
    z.string().trim().max(max).nullish().transform((v) => v || null);

const fields = {
    company: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(160),
    url: z.string().trim().url().max(500).nullish().or(z.literal("")).transform((v) => v || null),
    location: optionalText(120),
    notes: optionalText(4000),
    stage: z.nativeEnum(ApplicationStage),
};

const createSchema = z.object({ ...fields, jobId: optionalText(64), stage: fields.stage.default(ApplicationStage.SAVED) });
const updateSchema = z.object(fields).partial();

const select = {
    id: true,
    jobId: true,
    company: true,
    title: true,
    url: true,
    location: true,
    notes: true,
    stage: true,
    createdAt: true,
    updatedAt: true,
} as const;

export const listApplications = async (_req: Request, res: Response) => {
    try {
        const applications = await prisma.application.findMany({
            where: { userId: userIdOf(res) },
            orderBy: { updatedAt: "desc" },
            select,
        });
        return res.json({ success: true, applications });
    } catch (err: any) {
        console.error("[listApplications]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load your applications." });
    }
};

export const createApplication = async (req: Request, res: Response) => {
    const body = parseBody(createSchema, req, res);
    if (!body) return;
    try {
        const application = await prisma.application.create({ data: { ...body, userId: userIdOf(res) }, select });
        return res.status(201).json({ success: true, application });
    } catch (err: any) {
        // Saving a job from the board twice returns the existing entry.
        if (err?.code === "P2002" && body.jobId) {
            const existing = await prisma.application.findFirst({ where: { userId: userIdOf(res), jobId: body.jobId }, select });
            if (existing) return res.json({ success: true, application: existing });
        }
        console.error("[createApplication]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't save this application." });
    }
};

export const updateApplication = async (req: Request, res: Response) => {
    const id = intParam(req, "id");
    if (!id) return res.status(400).json({ success: false, message: "Invalid application id." });
    const body = parseBody(updateSchema, req, res);
    if (!body) return;
    try {
        const { count } = await prisma.application.updateMany({ where: { id, userId: userIdOf(res) }, data: body });
        if (count === 0) return res.status(404).json({ success: false, message: "Application not found." });
        const application = await prisma.application.findUnique({ where: { id }, select });
        return res.json({ success: true, application });
    } catch (err: any) {
        console.error("[updateApplication]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't update this application." });
    }
};

export const deleteApplication = async (req: Request, res: Response) => {
    const id = intParam(req, "id");
    if (!id) return res.status(400).json({ success: false, message: "Invalid application id." });
    try {
        const { count } = await prisma.application.deleteMany({ where: { id, userId: userIdOf(res) } });
        if (count === 0) return res.status(404).json({ success: false, message: "Application not found." });
        return res.json({ success: true });
    } catch (err: any) {
        console.error("[deleteApplication]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't delete this application." });
    }
};
