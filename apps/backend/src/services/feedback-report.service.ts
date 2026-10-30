import { prisma } from "@repo/database";
import { SchemaType, type ResponseSchema, type Schema } from "@google/generative-ai";
import { z } from "zod";
import { generateJSONWithModel } from "../lib/gemini";
import { PASS_THRESHOLD, SKILL_KEYS, SKILL_LABELS, resolveRole, type SkillKey } from "../lib/roles";

/**
 * Post-interview feedback.
 *
 * Runs off the live-interview critical path: once a session completes, a single
 * Gemini call grades the whole transcript (overall + 5 skills + per-question
 * stronger answers). The result is stored in InterviewReport and the per-role
 * RoleFeedback aggregate is recomputed.
 */

// Feedback quality matters more than speed here, so prefer the stronger flash models.
const FEEDBACK_MODELS = (process.env.GEMINI_FEEDBACK_MODELS || "gemini-3.5-flash,gemini-3.1-flash-lite,gemini-flash-lite-latest")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

const clampScore = (value: unknown, max: number) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(0, n))) : 0;
};

const ReportSchema = z.object({
    overallScore: z.number(),
    skills: z.object({
        technicalDepth: z.number(),
        communication: z.number(),
        problemSolving: z.number(),
        systemDesign: z.number(),
        confidence: z.number(),
    }),
    summary: z.string(),
    improvements: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    gaps: z.array(z.object({ skill: z.string(), note: z.string() })).default([]),
    questions: z.array(z.object({ order: z.number(), score: z.number(), strongerAnswer: z.string() })).default([]),
});
type GeminiReport = z.infer<typeof ReportSchema>;

const skillProperties: Record<string, Schema> = Object.fromEntries(
    SKILL_KEYS.map((key): [string, Schema] => [key, { type: SchemaType.INTEGER, description: `${SKILL_LABELS[key]} score 0-100` }]),
);

const RESPONSE_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        overallScore: { type: SchemaType.INTEGER, description: "Overall interview score 0-100" },
        skills: { type: SchemaType.OBJECT, properties: skillProperties, required: [...SKILL_KEYS] },
        summary: { type: SchemaType.STRING, description: "2-3 sentence feedback note addressed to the candidate" },
        improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        topics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        gaps: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    skill: { type: SchemaType.STRING, format: "enum", enum: [...SKILL_KEYS] },
                    note: { type: SchemaType.STRING },
                },
                required: ["skill", "note"],
            },
        },
        questions: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    order: { type: SchemaType.INTEGER },
                    score: { type: SchemaType.INTEGER, description: "0-10" },
                    strongerAnswer: { type: SchemaType.STRING },
                },
                required: ["order", "score", "strongerAnswer"],
            },
        },
    },
    required: ["overallScore", "skills", "summary", "improvements", "topics", "gaps", "questions"],
};

function buildPrompt(roleTitle: string, difficulty: string, qa: { order: number; question: string; answer: string; liveScore: number | null }[]) {
    const transcript = qa
        .map((q) => `Q${q.order}: ${q.question}\nCandidate answer: ${q.answer}\nLive score: ${q.liveScore ?? "n/a"}/10`)
        .join("\n\n");

    return `You are a senior interviewer writing the post-interview report for a "${roleTitle}" mock interview (${difficulty} difficulty).
The answers were transcribed from speech, so ignore filler words and minor transcription errors.

Transcript:
${transcript}

Write the report as JSON:
- overallScore: 0-100, calibrated so ${PASS_THRESHOLD} means "would likely pass this round".
- skills: 0-100 each for technicalDepth, communication, problemSolving, systemDesign (architecture/structured thinking; for non-technical roles judge how well answers are structured), confidence.
- summary: 2-3 sentences addressed to the candidate ("you"), specific to what they said. No generic praise.
- improvements: 2-4 short, concrete actions.
- topics: 2-5 short topic names that were covered (e.g. "Event loop", "CSS architecture").
- gaps: weaknesses actually shown in this interview, each tagged with one skill key and a one-sentence note.
- questions: one entry per question above, using its order number: score 0-10 for the answer, and strongerAnswer = 2-3 sentences describing what a strong answer would have covered.
Very short or empty answers must score low.`;
}

/**
 * Generate (or regenerate) the report for a session. Safe to call more than once;
 * concurrent calls for the same session are coalesced.
 */
const inFlight = new Map<number, Promise<void>>();

export function generateSessionReport(sessionId: number): Promise<void> {
    const existing = inFlight.get(sessionId);
    if (existing) return existing;
    const run = runReport(sessionId).finally(() => inFlight.delete(sessionId));
    inFlight.set(sessionId, run);
    return run;
}

/** Fire-and-forget wrapper for request handlers and the live interview engine. */
export function queueSessionReport(sessionId: number) {
    generateSessionReport(sessionId).catch((err) => {
        console.error(`[FeedbackReport] Session #${sessionId} report failed:`, err?.message || err);
    });
}

async function runReport(sessionId: number) {
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!session) throw new Error(`Session #${sessionId} not found`);

    const answered = session.questions.filter((q: any) => q.order >= 1 && q.answer && q.answer.trim());
    if (answered.length === 0) {
        // Nothing to grade; leave no report so the session doesn't show as a 0 score.
        console.log(`[FeedbackReport] Session #${sessionId} has no answered questions; skipping report.`);
        return;
    }

    const role = resolveRole(session.role);
    const endedAt = session.completedAt ?? new Date();
    const durationMin = Math.max(1, Math.round((endedAt.getTime() - session.createdAt.getTime()) / 60000));

    await prisma.interviewReport.upsert({
        where: { sessionId },
        // Date the report by when the interview happened so trends and weekly frequency are right
        create: { sessionId, userId: session.userId, roleSlug: role.slug, status: "PENDING", durationMin, topics: [], createdAt: session.createdAt },
        update: { status: "PENDING", error: null, durationMin },
    });

    let report: GeminiReport;
    let modelUsed: string;
    try {
        const started = Date.now();
        const result = await generateJSONWithModel<unknown>(
            buildPrompt(
                role.title,
                session.difficulty,
                answered.map((q: any) => ({ order: q.order, question: q.question, answer: q.answer, liveScore: q.score })),
            ),
            { models: FEEDBACK_MODELS, responseSchema: RESPONSE_SCHEMA, temperature: 0.3 },
        );
        report = ReportSchema.parse(result.data);
        modelUsed = result.modelUsed;
        console.log(`[FeedbackReport] Session #${sessionId} graded by ${modelUsed} in ${Date.now() - started}ms`);
    } catch (err: any) {
        await prisma.interviewReport.update({
            where: { sessionId },
            data: { status: "FAILED", error: String(err?.message || err).slice(0, 2000) },
        });
        throw err;
    }

    const byOrder = new Map(report.questions.map((q) => [Math.round(q.order), q]));
    const validSkills = new Set<string>(SKILL_KEYS);
    const gaps = report.gaps
        .filter((g) => validSkills.has(g.skill) && g.note.trim())
        .map((g) => ({ skill: g.skill, note: g.note.trim() }));

    await prisma.$transaction([
        ...answered
            .filter((q: any) => byOrder.has(q.order))
            .map((q: any) => {
                const graded = byOrder.get(q.order)!;
                return prisma.interviewQuestion.update({
                    where: { id: q.id },
                    data: {
                        strongerAnswer: graded.strongerAnswer.trim() || null,
                        // Keep the live score if the interviewer already gave one
                        ...(q.score === null ? { score: clampScore(graded.score, 10) } : {}),
                    },
                });
            }),
        prisma.interviewReport.update({
            where: { sessionId },
            data: {
                status: "READY",
                overallScore: clampScore(report.overallScore, 100),
                technical: clampScore(report.skills.technicalDepth, 100),
                communication: clampScore(report.skills.communication, 100),
                problemSolving: clampScore(report.skills.problemSolving, 100),
                systemDesign: clampScore(report.skills.systemDesign, 100),
                confidence: clampScore(report.skills.confidence, 100),
                summary: report.summary.trim(),
                improvements: report.improvements.map((s) => s.trim()).filter(Boolean).join("\n"),
                topics: report.topics.map((t) => t.trim()).filter(Boolean).slice(0, 5),
                gaps,
                model: modelUsed,
                error: null,
            },
        }),
    ]);

    await recomputeRoleFeedback(session.userId, role.slug);
}

// ── Role aggregate ───────────────────────────────────────────────────────────

export interface SkillAggregate {
    average: number | null;
    latest: number | null;
    sessionCount: number;
}

export interface RecurringGapRow {
    skill: string;
    occurrences: number;
    latestScore: number | null;
    note: string | null;
}

type ReportForAggregate = {
    overallScore: number;
    technical: number;
    communication: number;
    problemSolving: number;
    systemDesign: number;
    confidence: number;
    gaps: unknown;
    createdAt: Date;
};

export function reportSkillScores(report: Pick<ReportForAggregate, "technical" | "communication" | "problemSolving" | "systemDesign" | "confidence">): Record<SkillKey, number> {
    return {
        technicalDepth: report.technical,
        communication: report.communication,
        problemSolving: report.problemSolving,
        systemDesign: report.systemDesign,
        confidence: report.confidence,
    };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const DRILL_MINUTES = 20;

/** Reports must be ordered newest first. */
export function aggregateSkills(reports: ReportForAggregate[]): Record<SkillKey, SkillAggregate> {
    const result = {} as Record<SkillKey, SkillAggregate>;
    for (const key of SKILL_KEYS) {
        const values = reports.map((r) => reportSkillScores(r)[key]);
        result[key] = {
            average: values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null,
            latest: values[0] ?? null,
            sessionCount: values.length,
        };
    }
    return result;
}

/** Skills that fell below the pass threshold in 2+ sessions. Reports must be ordered newest first. */
export function recurringGaps(reports: ReportForAggregate[]): RecurringGapRow[] {
    const rows: RecurringGapRow[] = [];
    for (const key of SKILL_KEYS) {
        const weak = reports.filter((r) => reportSkillScores(r)[key] < PASS_THRESHOLD);
        if (weak.length < 2) continue;
        let note: string | null = null;
        for (const r of reports) {
            const match = Array.isArray(r.gaps) ? (r.gaps as { skill: string; note: string }[]).find((g) => g.skill === key) : undefined;
            if (match) { note = match.note; break; }
        }
        rows.push({
            skill: key,
            occurrences: weak.length,
            latestScore: reports[0] ? reportSkillScores(reports[0])[key] : null,
            note,
        });
    }
    return rows.sort((a, b) => b.occurrences - a.occurrences || (a.latestScore ?? 0) - (b.latestScore ?? 0));
}

export function nextStepFor(roleTitle: string, durationMin: number, skills: Record<SkillKey, SkillAggregate>): string {
    let weakest: SkillKey | null = null;
    for (const key of SKILL_KEYS) {
        const avg = skills[key].average;
        if (avg === null) continue;
        if (weakest === null || avg < (skills[weakest].average ?? Infinity)) weakest = key;
    }
    if (!weakest) return `Take your first ${roleTitle} interview`;
    return `Run a ${durationMin}-min ${roleTitle} interview focused on ${SKILL_LABELS[weakest]}`;
}

export async function recomputeRoleFeedback(userId: number, roleSlug: string) {
    const role = resolveRole(roleSlug);
    const reports = await prisma.interviewReport.findMany({
        where: { userId, roleSlug: role.slug, status: "READY" },
        orderBy: { createdAt: "desc" },
        select: {
            overallScore: true, technical: true, communication: true, problemSolving: true,
            systemDesign: true, confidence: true, gaps: true, createdAt: true,
        },
    });

    const skills = aggregateSkills(reports);
    const scores = reports.map((r: any) => r.overallScore as number);
    const data = {
        sessionCount: reports.length,
        averageScore: scores.length ? round1(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
        latestScore: scores[0] ?? null,
        bestScore: scores.length ? Math.max(...scores) : null,
        skillAverages: skills as unknown as object,
        recurringGaps: recurringGaps(reports) as unknown as object,
        nextStep: nextStepFor(role.title, DRILL_MINUTES, skills),
        lastSessionAt: reports[0]?.createdAt ?? null,
    };

    await prisma.roleFeedback.upsert({
        where: { userId_roleSlug: { userId, roleSlug: role.slug } },
        create: { userId, roleSlug: role.slug, ...data },
        update: data,
    });
}
