import { prisma } from "@repo/database";
import { PASS_THRESHOLD, SKILL_KEYS, SKILL_LABELS, findRole, resolveRole, INTERVIEW_ROLES, type SkillKey } from "../lib/roles";
import {
    aggregateSkills,
    nextStepFor,
    recurringGaps,
    reportSkillScores,
    type RecurringGapRow,
    type SkillAggregate,
} from "./feedback-report.service";

/**
 * Read side of the feedback API. Response shapes mirror apps/frontend/types/feedback.ts
 * (documented in docs/feedback-api.md). Every query is scoped to the authenticated user.
 */

const reportInclude = {
    session: {
        select: {
            questions: {
                where: { order: { gte: 1 }, answer: { not: null } },
                orderBy: { order: "asc" as const },
                select: { question: true, score: true, strongerAnswer: true },
            },
        },
    },
};

type ReportRow = {
    id: number;
    sessionId: number;
    roleSlug: string;
    overallScore: number;
    technical: number;
    communication: number;
    problemSolving: number;
    systemDesign: number;
    confidence: number;
    summary: string;
    topics: string[];
    gaps: unknown;
    durationMin: number;
    createdAt: Date;
    updatedAt: Date;
    session: { questions: { question: string; score: number | null; strongerAnswer: string | null }[] };
};

export function toFeedbackSession(report: ReportRow) {
    const role = resolveRole(report.roleSlug);
    return {
        id: String(report.sessionId),
        createdAt: report.createdAt.toISOString(),
        durationMin: report.durationMin,
        role: role.title,
        category: role.track,
        roleId: role.slug,
        score: report.overallScore,
        skillScores: reportSkillScores(report),
        topics: report.topics.length ? report.topics : [role.track],
        feedbackNote: report.summary || null,
        questions: report.session.questions.map((q) => ({
            text: q.question,
            // Live per-question scores are 0-10; the feedback API is 0-100
            score: (q.score ?? 0) * 10,
            strongerAnswer: q.strongerAnswer,
        })),
    };
}

async function readyReports(userId: number, extra: Record<string, unknown> = {}, take?: number) {
    return (await prisma.interviewReport.findMany({
        where: { userId, status: "READY", ...extra },
        orderBy: { createdAt: "desc" },
        include: reportInclude,
        ...(take ? { take } : {}),
    })) as unknown as ReportRow[];
}

function weakestSkill(skills: Record<SkillKey, SkillAggregate>): SkillKey | null {
    let weakest: SkillKey | null = null;
    for (const key of SKILL_KEYS) {
        const avg = skills[key].average;
        if (avg !== null && (weakest === null || avg < (skills[weakest].average ?? Infinity))) weakest = key;
    }
    return weakest;
}

// ── Goal ─────────────────────────────────────────────────────────────────────

function toGoal(goal: { targetScore: number; targetDate: Date | null; label: string } | null) {
    if (!goal) return null;
    return {
        targetScore: goal.targetScore,
        targetDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : null,
        label: goal.label,
    };
}

export async function getGoal(userId: number) {
    return toGoal(await prisma.feedbackGoal.findUnique({ where: { userId } }));
}

export async function putGoal(userId: number, input: { targetScore: number; targetDate: string | null; label: string }) {
    const data = {
        targetScore: input.targetScore,
        targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null,
        label: input.label,
    };
    return toGoal(await prisma.feedbackGoal.upsert({ where: { userId }, create: { userId, ...data }, update: data }));
}

// ── All feedback ─────────────────────────────────────────────────────────────

export async function getSummary(userId: number) {
    const [reports, goal] = await Promise.all([
        prisma.interviewReport.findMany({
            where: { userId, status: "READY" },
            orderBy: { createdAt: "desc" },
            select: {
                overallScore: true, technical: true, communication: true, problemSolving: true,
                systemDesign: true, confidence: true, gaps: true, createdAt: true, updatedAt: true,
            },
        }),
        getGoal(userId),
    ]);

    const total = reports.length;
    const scores = reports.map((r: any) => r.overallScore as number);
    return {
        totalSessions: total,
        averageScore: total ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / total) * 10) / 10 : null,
        passRate: total ? Math.round((scores.filter((s: number) => s >= PASS_THRESHOLD).length / total) * 10000) / 10000 : null,
        passThreshold: PASS_THRESHOLD,
        weakestSkill: total ? weakestSkill(aggregateSkills(reports)) : null,
        lastUpdatedAt: total ? reports.reduce((latest: Date, r: any) => (r.updatedAt > latest ? r.updatedAt : latest), reports[0]!.updatedAt).toISOString() : null,
        goal,
    };
}

export interface SessionQuery {
    category?: string;
    q?: string;
    sort?: "newest" | "oldest";
    cursor?: string;
    limit?: number;
}

export async function getSessions(userId: number, query: SessionQuery) {
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const sort = query.sort === "oldest" ? "asc" : "desc";

    // category filters by track name; map it back to the role slugs in that track
    let roleFilter: Record<string, unknown> = {};
    if (query.category) {
        const slugs = INTERVIEW_ROLES.filter((r) => r.track === query.category || r.slug === query.category).map((r) => r.slug);
        roleFilter = { roleSlug: { in: slugs.length ? slugs : [query.category] } };
    }

    const search = query.q?.trim();
    if (search) {
        const lower = search.toLowerCase();
        const roleMatches = INTERVIEW_ROLES.filter((r) => `${r.title} ${r.track}`.toLowerCase().includes(lower)).map((r) => r.slug);
        Object.assign(roleFilter, {
            OR: [
                ...(roleMatches.length ? [{ roleSlug: { in: roleMatches } }] : []),
                { topics: { has: search } },
                { summary: { contains: search, mode: "insensitive" } },
            ],
        });
    }

    const cursorId = query.cursor ? parseInt(query.cursor, 10) : NaN;
    const rows = (await prisma.interviewReport.findMany({
        where: { userId, status: "READY", ...roleFilter },
        orderBy: [{ createdAt: sort }, { id: sort }],
        include: reportInclude,
        take: limit + 1,
        ...(Number.isFinite(cursorId) ? { cursor: { id: cursorId }, skip: 1 } : {}),
    })) as unknown as ReportRow[];

    const page = rows.slice(0, limit);
    return {
        sessions: page.map(toFeedbackSession),
        nextCursor: rows.length > limit ? String(page[page.length - 1]!.id) : null,
    };
}

export async function getGaps(userId: number): Promise<RecurringGapRow[]> {
    const reports = await prisma.interviewReport.findMany({
        where: { userId, status: "READY" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            overallScore: true, technical: true, communication: true, problemSolving: true,
            systemDesign: true, confidence: true, gaps: true, createdAt: true,
        },
    });
    return recurringGaps(reports).slice(0, 5);
}

const WEEKS = 8;

function startOfWeekUtc(date: Date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    d.setUTCDate(d.getUTCDate() - day);
    return d;
}

export async function getFrequency(userId: number) {
    const firstWeek = startOfWeekUtc(new Date());
    firstWeek.setUTCDate(firstWeek.getUTCDate() - (WEEKS - 1) * 7);

    const reports = await prisma.interviewReport.findMany({
        where: { userId, status: "READY", createdAt: { gte: firstWeek } },
        select: { createdAt: true },
    });

    const counts = new Map<string, number>();
    for (const r of reports) {
        const key = startOfWeekUtc(r.createdAt).toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const weeks = [];
    for (let i = 0; i < WEEKS; i++) {
        const d = new Date(firstWeek);
        d.setUTCDate(d.getUTCDate() + i * 7);
        const key = d.toISOString().slice(0, 10);
        weeks.push({ weekStart: key, sessionCount: counts.get(key) ?? 0 });
    }
    return { weeks };
}

// ── Role-specific feedback ───────────────────────────────────────────────────

const HIGHLIGHTS = 3;

/** Returns null for unknown roles (served as 404). */
export async function getRoleFeedback(userId: number, roleId: string) {
    const role = findRole(roleId);
    if (!role) return null;

    const [reports, stored, practiced] = await Promise.all([
        readyReports(userId, { roleSlug: role.slug }, 50),
        prisma.roleFeedback.findUnique({ where: { userId_roleSlug: { userId, roleSlug: role.slug } } }),
        prisma.roleFeedback.findMany({
            where: { userId, sessionCount: { gt: 0 }, roleSlug: { not: role.slug } },
            orderBy: { lastSessionAt: "desc" },
            select: { roleSlug: true },
        }),
    ]);

    const sessions = reports.map(toFeedbackSession);

    // Prefer the materialized aggregate; fall back to computing it if it is missing or stale
    const fresh = stored && stored.sessionCount === reports.length;
    const skills = fresh ? (stored.skillAverages as unknown as Record<SkillKey, SkillAggregate>) : aggregateSkills(reports);
    const gaps = fresh ? (stored.recurringGaps as unknown as RecurringGapRow[]) : recurringGaps(reports);
    const nextStep = fresh && stored.nextStep ? stored.nextStep : nextStepFor(role.title, 20, skills);

    const answered = sessions.flatMap((s) => s.questions.map((q) => ({ question: q.text, score: q.score, sessionId: s.id, strongerAnswer: q.strongerAnswer })));

    const otherSlugs = practiced.map((p: { roleSlug: string }) => p.roleSlug);
    const others = (otherSlugs.length ? otherSlugs : INTERVIEW_ROLES.filter((r) => r.slug !== role.slug).slice(0, 4).map((r) => r.slug))
        .map((slug: string) => resolveRole(slug))
        .map((r: { slug: string; track: string }) => ({ category: r.track, roleId: r.slug, slug: r.slug }));

    return {
        category: role.track,
        roleId: role.slug,
        slug: role.slug,
        passThreshold: PASS_THRESHOLD,
        sessions,
        latestSession: sessions[0] ?? null,
        perSkill: SKILL_KEYS.map((key) => ({
            key,
            label: SKILL_LABELS[key],
            latest: skills[key]?.latest ?? null,
            average: skills[key]?.average ?? null,
            sessionCount: skills[key]?.sessionCount ?? 0,
        })),
        strengths: answered.filter((q) => q.score >= PASS_THRESHOLD).sort((a, b) => b.score - a.score).slice(0, HIGHLIGHTS),
        gaps: answered.filter((q) => q.score < PASS_THRESHOLD).sort((a, b) => a.score - b.score).slice(0, HIGHLIGHTS),
        recurringGaps: gaps,
        nextStep,
        otherCategories: others,
    };
}
