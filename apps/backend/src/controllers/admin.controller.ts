import { prisma } from "@repo/database";
import type { NextFunction, Request, Response } from "express";
import { userIdOf } from "../lib/request";

/**
 * Admin overview of how DevPrep is used. Admins are the accounts whose emails are listed
 * in ADMIN_EMAILS (comma-separated); everyone else gets 404, so the page isn't advertised.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 30;

const adminEmails = () =>
    new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));

/** Runs after MiddleWhere. */
export async function requireAdmin(_req: Request, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userIdOf(res) }, select: { email: true } });
        if (!user || !adminEmails().has(user.email.toLowerCase())) return res.status(404).json({ success: false, message: "Not found." });
        next();
    } catch (err: any) {
        console.error("[requireAdmin]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Something went wrong." });
    }
}

export const getAdminStats = async (_req: Request, res: Response) => {
    const now = Date.now();
    const seriesStart = new Date(now - (SERIES_DAYS - 1) * DAY_MS);
    seriesStart.setUTCHours(0, 0, 0, 0);

    try {
        const [users, interviews, reports, applications, submissions, resumes, recentSessions, activeWeek, activeMonth, roles, scores, latest] = await Promise.all([
            prisma.user.count(),
            prisma.interviewSession.count(),
            prisma.interviewReport.count(),
            prisma.application.count(),
            prisma.codingSubmission.count(),
            prisma.resume.count(),
            prisma.interviewSession.findMany({ where: { createdAt: { gte: seriesStart } }, select: { createdAt: true } }),
            prisma.interviewSession.findMany({ where: { createdAt: { gte: new Date(now - 7 * DAY_MS) } }, distinct: ["userId"], select: { userId: true } }),
            prisma.interviewSession.findMany({ where: { createdAt: { gte: new Date(now - 30 * DAY_MS) } }, distinct: ["userId"], select: { userId: true } }),
            prisma.interviewSession.groupBy({ by: ["role"], _count: { _all: true } }),
            prisma.interviewReport.findMany({ select: { overallScore: true, session: { select: { role: true } } } }),
            prisma.interviewSession.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { id: true, userId: true, role: true, difficulty: true, status: true, createdAt: true, report: { select: { overallScore: true } } },
            }),
        ]);

        // interviews per UTC day, including days with none
        const perDay = new Map<string, number>();
        for (let i = 0; i < SERIES_DAYS; i++) perDay.set(new Date(seriesStart.getTime() + i * DAY_MS).toISOString().slice(0, 10), 0);
        for (const s of recentSessions) {
            const k = s.createdAt.toISOString().slice(0, 10);
            perDay.set(k, (perDay.get(k) ?? 0) + 1);
        }

        // average report score per role
        const roleScores = new Map<string, number[]>();
        for (const r of scores) roleScores.set(r.session.role, [...(roleScores.get(r.session.role) ?? []), r.overallScore]);

        const names = new Map(
            (await prisma.user.findMany({ where: { id: { in: latest.map((s) => s.userId) } }, select: { id: true, username: true } })).map((u) => [u.id, u.username]),
        );

        return res.json({
            success: true,
            stats: {
                totals: { users, interviews, reports, applications, codingSubmissions: submissions, resumes },
                activeUsers: { week: activeWeek.length, month: activeMonth.length },
                interviewsPerDay: [...perDay.entries()].map(([date, count]) => ({ date, count })),
                roles: roles
                    .map((r) => {
                        const list = roleScores.get(r.role) ?? [];
                        return {
                            role: r.role,
                            interviews: r._count._all,
                            reports: list.length,
                            averageScore: list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null,
                        };
                    })
                    .sort((a, b) => b.interviews - a.interviews),
                recent: latest.map((s) => ({
                    id: s.id,
                    user: names.get(s.userId) ?? "Unknown",
                    role: s.role,
                    difficulty: s.difficulty,
                    status: s.status,
                    score: s.report?.overallScore ?? null,
                    createdAt: s.createdAt,
                })),
            },
        });
    } catch (err: any) {
        console.error("[getAdminStats]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load admin stats." });
    }
};
