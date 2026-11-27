import { prisma } from "@repo/database";
import type { Request, Response } from "express";
import { z } from "zod";
import { parseBody, userIdOf } from "../lib/request";
import { extractResumeText, matchResume, MAX_JOB_CHARS, writeCoverLetter } from "../services/career.service";

/**
 * The signed-in user's resume (uploaded as a PDF, stored as text) and the tools built on
 * it: a match check against a job description and a cover letter for that job.
 */

const jobSchema = z.object({ jobDescription: z.string().trim().min(80, "paste the full job description").max(MAX_JOB_CHARS) });

const serialize = (r: { fileName: string; text: string; updatedAt: Date }) => ({
    fileName: r.fileName,
    text: r.text,
    words: r.text.split(/\s+/).filter(Boolean).length,
    updatedAt: r.updatedAt,
});

const loadResume = (userId: number) => prisma.resume.findUnique({ where: { userId } });

export const getResume = async (_req: Request, res: Response) => {
    try {
        const resume = await loadResume(userIdOf(res));
        return res.json({ success: true, resume: resume ? serialize(resume) : null });
    } catch (err: any) {
        console.error("[getResume]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load your resume." });
    }
};

/** PUT with the PDF as the raw request body and its name in the X-File-Name header. */
export const uploadResume = async (req: Request, res: Response) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ success: false, message: "Upload your resume as a PDF." });
    }
    if (req.body.subarray(0, 5).toString() !== "%PDF-") {
        return res.status(400).json({ success: false, message: "That file isn't a PDF." });
    }

    let text: string;
    try {
        text = await extractResumeText(req.body);
    } catch {
        return res.status(422).json({ success: false, message: "Couldn't read any text from this PDF. If it's a scan, export it from your editor as a PDF instead." });
    }

    const header = req.header("x-file-name");
    const fileName = (header ? decodeURIComponent(header) : "resume.pdf").slice(0, 120);
    try {
        const userId = userIdOf(res);
        const resume = await prisma.resume.upsert({
            where: { userId },
            create: { userId, fileName, text },
            update: { fileName, text },
        });
        return res.json({ success: true, resume: serialize(resume) });
    } catch (err: any) {
        console.error("[uploadResume]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't save your resume." });
    }
};

export const deleteResume = async (_req: Request, res: Response) => {
    try {
        await prisma.resume.deleteMany({ where: { userId: userIdOf(res) } });
        return res.json({ success: true });
    } catch (err: any) {
        console.error("[deleteResume]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't remove your resume." });
    }
};

export const createMatch = async (req: Request, res: Response) => {
    const body = parseBody(jobSchema, req, res);
    if (!body) return;
    try {
        const resume = await loadResume(userIdOf(res));
        if (!resume) return res.status(409).json({ success: false, message: "Upload your resume first." });
        const match = await matchResume(resume.text, body.jobDescription);
        return res.json({ success: true, match });
    } catch (err: any) {
        console.error("[createMatch]", err?.message ?? err);
        return res.status(502).json({ success: false, message: "Couldn't check your resume right now. Please try again." });
    }
};

export const createCoverLetter = async (req: Request, res: Response) => {
    const body = parseBody(jobSchema, req, res);
    if (!body) return;
    try {
        const userId = userIdOf(res);
        const [resume, user] = await Promise.all([
            loadResume(userId),
            prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
        ]);
        if (!resume) return res.status(409).json({ success: false, message: "Upload your resume first." });
        const letter = await writeCoverLetter(resume.text, body.jobDescription, user?.username ?? "");
        return res.json({ success: true, letter });
    } catch (err: any) {
        console.error("[createCoverLetter]", err?.message ?? err);
        return res.status(502).json({ success: false, message: "Couldn't write the letter right now. Please try again." });
    }
};
