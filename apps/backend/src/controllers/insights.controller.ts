import { prisma, Prisma } from "@repo/database";
import type { Request, Response } from "express";
import { dayKey, userIdOf } from "../lib/request";
import type { Rubric } from "../services/evaluation.service";

/**
 * Overview of the user's practice: headline numbers, score trend, daily activity for the
 * heatmap and streaks, rubric averages (where answers are weakest) and readiness per role.
 * Days are counted in the time zone given as ?tz= (an IANA name), defaulting to UTC.
 */

const TREND_LENGTH = 12;
const RUBRIC_SAMPLE = 60; // most recent evaluated answers
const READINESS_WEIGHTS = [3, 2, 1]; // newest report counts most
const ACTIVITY_DAYS = 371; // 53 weeks, one full heatmap

const DAY_MS = 24 * 60 * 60 * 1000;

/** Current and longest run of consecutive active days. A run stays current until a full day is missed. */
export function streaks(days: Set<string>, today: string, yesterday: string) {
    const sorted = [...days].sort();
    let longest = 0;
    let run = 0;
    let prev: number | null = null;
    for (const d of sorted) {
        const t = Date.parse(d);
        run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
        longest = Math.max(longest, run);
        prev = t;
    }
    let current = 0;
    if (days.has(today) || days.has(yesterday)) {
        let t = Date.parse(days.has(today) ? today : yesterday);
        while (days.has(new Date(t).toISOString().slice(0, 10))) {
            current++;
            t -= DAY_MS;
        }
    }
    return { current, longest };
}

export const getInsights = async (req: Request, res: Response) => {
    const userId = userIdOf(res);
    const tz = typeof req.query.tz === "string" ? req.query.tz : "UTC";
    const since = new Date(Date.now() - ACTIVITY_DAYS * DAY_MS);

    try {
        const [reports, evaluated, sessions, solved, submissions] = await Promise.all([
            prisma.interviewReport.findMany({
                where: { session: { userId } },
                orderBy: { createdAt: "asc" },
                select: { sessionId: true, overallScore: true, improvements: true, createdAt: true, session: { select: { role: true } } },
            }),
            prisma.interviewQuestion.findMany({
                where: { session: { userId }, evaluation: { not: Prisma.DbNull } },
                orderBy: { createdAt: "desc" },
                take: RUBRIC_SAMPLE,
                select: { evaluation: true },
            }),
            prisma.interviewSession.findMany({ where: { userId, createdAt: { gte: since } }, select: { createdAt: true } }),
            prisma.problemProgress.findMany({ where: { userId, solvedAt: { not: null } }, select: { solvedAt: true } }),
            prisma.codingSubmission.findMany({ where: { userId }, select: { problem: true, passed: true, total: true, createdAt: true } }),
        ]);

        // daily activity: interviews started, problems solved, code submitted
        const counts = new Map<string, number>();
        const bump = (d: Date) => {
            if (d < since) return;
            const k = dayKey(d, tz);
            counts.set(k, (counts.get(k) ?? 0) + 1);
        };
        sessions.forEach((s) => bump(s.createdAt));
        solved.forEach((p) => bump(p.solvedAt!));
        submissions.forEach((s) => bump(s.createdAt));
        const now = new Date();
        const streak = streaks(new Set(counts.keys()), dayKey(now, tz), dayKey(new Date(now.getTime() - DAY_MS), tz));

        // rubric averages across recent answers
        const rubrics = evaluated.map((q) => (q.evaluation as { rubric?: Rubric } | null)?.rubric).filter((r): r is Rubric => !!r);
        const avg = (k: keyof Rubric) => Math.round((rubrics.reduce((sum, r) => sum + r[k], 0) / rubrics.length) * 10) / 10;
        const rubric = rubrics.length
            ? { relevance: avg("relevance"), depth: avg("depth"), clarity: avg("clarity"), evidence: avg("evidence"), answers: rubrics.length }
            : null;

        // readiness per role: weighted mean of its last three reports
        const byRole = new Map<string, typeof reports>();
        for (const r of reports) byRole.set(r.session.role, [...(byRole.get(r.session.role) ?? []), r]);
        const readiness = [...byRole.entries()]
            .map(([role, list]) => {
                const recent = list.slice(-READINESS_WEIGHTS.length).reverse();
                const weights = READINESS_WEIGHTS.slice(0, recent.length);
                const score = Math.round(recent.reduce((sum, r, i) => sum + r.overallScore * weights[i]!, 0) / weights.reduce((a, b) => a + b, 0));
                return { role, score, interviews: list.length, lastAt: recent[0]!.createdAt };
            })
            .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

        const latest = reports.at(-1);
        const lastFive = reports.slice(-5);
        let nextSteps: string[] = [];
        try {
            nextSteps = latest ? JSON.parse(latest.improvements) : [];
        } catch {
            /* older reports stored plain text */
        }

        return res.json({
            success: true,
            insights: {
                stats: {
                    interviews: reports.length,
                    averageScore: lastFive.length ? Math.round(lastFive.reduce((s, r) => s + r.overallScore, 0) / lastFive.length) : null,
                    problemsSolved: solved.length,
                    codingSolved: new Set(submissions.filter((s) => s.passed === s.total).map((s) => s.problem)).size,
                    currentStreak: streak.current,
                    longestStreak: streak.longest,
                },
                trend: reports.slice(-TREND_LENGTH).map((r) => ({ sessionId: r.sessionId, role: r.session.role, date: r.createdAt, score: r.overallScore })),
                activity: [...counts.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
                rubric,
                readiness,
                nextSteps: { sessionId: latest?.sessionId ?? null, items: Array.isArray(nextSteps) ? nextSteps.slice(0, 3) : [] },
            },
        });
    } catch (err: any) {
        console.error("[getInsights]", err?.message ?? err);
        return res.status(500).json({ success: false, message: "Couldn't load your overview." });
    }
};
