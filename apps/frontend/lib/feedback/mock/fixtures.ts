/* MOCK: delete when backend exists */

import type {
  FeedbackGoal,
  FeedbackSession,
  FeedbackSummary,
  RecurringGap,
  RoleFeedback,
  RoleFeedbackQuestionHighlight,
  WeeklyFrequency,
} from "@/types/feedback";

export const KNOWN_ROLES = [
  { category: "Frontend", roleId: "frontend", slug: "frontend" },
  { category: "Backend", roleId: "backend", slug: "backend" },
  { category: "System Design", roleId: "system-design", slug: "system-design" },
  { category: "Behavioral", roleId: "behavioral", slug: "behavioral" },
  { category: "Mobile", roleId: "mobile", slug: "mobile" },
  { category: "Cloud", roleId: "cloud", slug: "cloud" },
];

const skills = ["technicalDepth", "communication", "problemSolving", "systemDesign", "confidence"];

function session(
  id: string,
  createdAt: string,
  role: string,
  category: string,
  score: number,
  skillScores: number[],
  roleId?: string,
): FeedbackSession {
  const resolvedRoleId =
    roleId ??
    KNOWN_ROLES.find((r) => r.category.toLowerCase() === category.toLowerCase())?.roleId ??
    category.toLowerCase().replace(/\s+/g, "-");
  return {
    id,
    createdAt,
    durationMin: 28,
    role,
    category,
    roleId: resolvedRoleId,
    score,
    skillScores: Object.fromEntries(skills.map((skill, index) => [skill, skillScores[index] ?? score])),
    topics: [category],
    feedbackNote: "Review the strongest tradeoff in your answer and make the outcome measurable.",
    questions: [
      {
        text: "Walk through your technical approach and the architectural tradeoffs you considered.",
        score: Math.min(100, score + 4),
        strongerAnswer: "State the constraints upfront, compare the alternatives, and justify the selected approach with quantifiable outcomes.",
      },
      {
        text: "How would you diagnose edge failures and system bottlenecks under load?",
        score: Math.max(0, score - 6),
        strongerAnswer: "Trace request boundaries using distributed spans, evaluate p99 metrics rather than averages, and inspect downstream circuit breakers.",
      },
    ],
  };
}

export const zeroSessions: FeedbackSession[] = [];

export const oneSession: FeedbackSession[] = [
  session("mock-one", "2026-10-01T10:00:00.000Z", "Frontend Engineer", "Frontend", 72, [74, 70, 72, 68, 76]),
];

export const twelveSessions: FeedbackSession[] = [
  session("mock-01", "2026-07-01T10:00:00.000Z", "Frontend Engineer", "Frontend", 62, [60, 66, 62, 58, 64]),
  session("mock-02", "2026-07-08T10:00:00.000Z", "Backend Engineer", "Backend", 65, [68, 62, 64, 60, 66]),
  session("mock-03", "2026-07-15T10:00:00.000Z", "System Design", "System Design", 68, [64, 66, 68, 72, 64]),
  session("mock-04", "2026-07-22T10:00:00.000Z", "Engineering Manager", "Behavioral", 71, [62, 76, 68, 64, 74]),
  session("mock-05", "2026-08-01T10:00:00.000Z", "Frontend Engineer", "Frontend", 70, [72, 70, 68, 64, 72]),
  session("mock-06", "2026-08-08T10:00:00.000Z", "Backend Engineer", "Backend", 73, [74, 70, 72, 68, 74]),
  session("mock-07", "2026-08-15T10:00:00.000Z", "System Design", "System Design", 75, [72, 70, 74, 80, 70]),
  session("mock-08", "2026-08-22T10:00:00.000Z", "Engineering Manager", "Behavioral", 77, [70, 82, 74, 70, 78]),
  session("mock-09", "2026-09-01T10:00:00.000Z", "Frontend Engineer", "Frontend", 76, [78, 74, 76, 70, 78]),
  session("mock-10", "2026-09-08T10:00:00.000Z", "Backend Engineer", "Backend", 79, [80, 76, 78, 74, 80]),
  session("mock-11", "2026-09-15T10:00:00.000Z", "System Design", "System Design", 81, [78, 76, 82, 84, 78]),
  session("mock-12", "2026-09-22T10:00:00.000Z", "iOS Engineer", "Mobile", 84, [76, 88, 82, 76, 84]),
];

export const mockGoal: FeedbackGoal = {
  targetScore: 85,
  targetDate: "2026-12-01",
  label: "Reach a consistent interview-ready score",
};

export function getMockSummary(sessions: FeedbackSession[]): FeedbackSummary {
  const averageScore =
    sessions.length > 0 ? sessions.reduce((total, current) => total + current.score, 0) / sessions.length : null;
  return {
    totalSessions: sessions.length,
    averageScore,
    passRate: sessions.length > 0 ? sessions.filter((item) => item.score >= 70).length / sessions.length : null,
    passThreshold: 70,
    weakestSkill: sessions.length > 0 ? "technicalDepth" : null,
    lastUpdatedAt: sessions.at(-1)?.createdAt ?? null,
    goal: sessions.length > 0 ? mockGoal : null,
  };
}

export const mockGaps: RecurringGap[] = [
  { skill: "technicalDepth", occurrences: 4, latestScore: 68, note: "Explain constraints before choosing a tool." },
  { skill: "systemDesign", occurrences: 3, latestScore: 70, note: "Cover failure recovery and operational tradeoffs." },
];

export const mockFrequency: WeeklyFrequency[] = [
  { weekStart: "2026-08-03", sessionCount: 0 },
  { weekStart: "2026-08-10", sessionCount: 2 },
  { weekStart: "2026-08-17", sessionCount: 1 },
  { weekStart: "2026-08-24", sessionCount: 0 },
  { weekStart: "2026-08-31", sessionCount: 2 },
];

export function getMockRoleFeedback(sessions: FeedbackSession[], roleId: string): RoleFeedback {
  const normalizedId = roleId.toLowerCase().trim();
  const roleMeta = KNOWN_ROLES.find((item) => item.roleId === normalizedId || item.slug === normalizedId);
  if (!roleMeta) {
    const error = new Error(`Role "${roleId}" not found`);
    (error as unknown as { code: string }).code = "not_found";
    throw error;
  }

  const roleSessions = sessions
    .filter((s) => s.roleId === roleMeta.roleId || s.category.toLowerCase().replace(/\s+/g, "-") === roleMeta.roleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const latestSession = roleSessions[0] ?? null;
  const passThreshold = 70;

  const perSkill = skills.map((skillKey) => {
    const values = roleSessions
      .map((s) => s.skillScores[skillKey])
      .filter((v): v is number => typeof v === "number");
    const latest = latestSession ? (latestSession.skillScores[skillKey] ?? null) : null;
    const average = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
    const label = skillKey.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    return {
      key: skillKey,
      label,
      latest,
      average,
      sessionCount: values.length,
    };
  });

  const strengths: RoleFeedbackQuestionHighlight[] = roleSessions
    .flatMap((s) =>
      s.questions.map((q) => ({
        question: q.text,
        score: q.score,
        sessionId: s.id,
        strongerAnswer: q.strongerAnswer,
      })),
    )
    .filter((q) => q.score >= passThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const gaps: RoleFeedbackQuestionHighlight[] = roleSessions
    .flatMap((s) =>
      s.questions.map((q) => ({
        question: q.text,
        score: q.score,
        sessionId: s.id,
        strongerAnswer: q.strongerAnswer,
      })),
    )
    .filter((q) => q.score < passThreshold)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const recurringGaps: RecurringGap[] = [];
  if (roleSessions.length > 1) {
    for (const skillKey of skills) {
      const below = roleSessions.filter((s) => (s.skillScores[skillKey] ?? 100) < passThreshold);
      if (below.length >= 2) {
        const latest = roleSessions[0]?.skillScores[skillKey] ?? 0;
        recurringGaps.push({
          skill: skillKey,
          occurrences: below.length,
          latestScore: latest,
          note: `Cover failure recovery and operational tradeoffs in ${skillKey.replace(/([A-Z])/g, " $1").toLowerCase()}.`,
        });
      }
    }
  }

  const lowestSkill = [...perSkill].sort((a, b) => (a.latest ?? 0) - (b.latest ?? 0))[0];
  const nextStep = latestSession
    ? `Launch a 20-min targeted drill on ${lowestSkill?.label ?? roleMeta.category}`
    : `Start your first ${roleMeta.category} interview with Zara`;

  const otherCategories = KNOWN_ROLES.filter((item) => item.roleId !== roleMeta.roleId).map((item) => ({
    category: item.category,
    roleId: item.roleId,
    slug: item.slug,
  }));

  return {
    category: roleMeta.category,
    roleId: roleMeta.roleId,
    slug: roleMeta.slug,
    passThreshold,
    sessions: roleSessions,
    latestSession,
    perSkill,
    strengths,
    gaps,
    recurringGaps,
    nextStep,
    otherCategories,
  };
}
