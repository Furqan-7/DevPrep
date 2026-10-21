import type {
  FeedbackGoal,
  FeedbackSession,
  FeedbackSummary,
  RecurringGap,
  WeeklyFrequency,
} from "@/types/feedback";

const skills = ["technicalDepth", "communication", "problemSolving", "systemDesign", "confidence"];

function session(
  id: string,
  createdAt: string,
  role: string,
  category: string,
  score: number,
  skillScores: number[],
): FeedbackSession {
  return {
    id,
    createdAt,
    durationMin: 28,
    role,
    category,
    score,
    skillScores: Object.fromEntries(skills.map((skill, index) => [skill, skillScores[index] ?? score])),
    topics: [category],
    feedbackNote: "Review the strongest tradeoff in your answer and make the outcome measurable.",
    questions: [
      {
        text: "Walk through your approach and the tradeoffs you considered.",
        score: Math.max(0, score - 3),
        strongerAnswer: "State the constraint, compare the options, and explain why the chosen approach fits.",
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
  session("mock-12", "2026-09-22T10:00:00.000Z", "Engineering Manager", "Behavioral", 84, [76, 88, 82, 76, 84]),
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

