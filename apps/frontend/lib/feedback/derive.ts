import type { FeedbackSession, WeeklyFrequency } from "@/types/feedback";

export interface FeedbackTrendPoint {
  label: string;
  score: number;
}

export function deriveAverageScore(sessions: FeedbackSession[]): number | null {
  if (sessions.length === 0) return null;
  return sessions.reduce((total, session) => total + session.score, 0) / sessions.length;
}

export function derivePassRate(sessions: FeedbackSession[], threshold: number): number | null {
  if (sessions.length === 0) return null;
  return sessions.filter((session) => session.score >= threshold).length / sessions.length;
}

export function deriveWeakestSkill(sessions: FeedbackSession[]): string | null {
  const totals = new Map<string, { total: number; count: number }>();
  for (const session of sessions) {
    for (const [skill, score] of Object.entries(session.skillScores)) {
      const current = totals.get(skill) ?? { total: 0, count: 0 };
      totals.set(skill, { total: current.total + score, count: current.count + 1 });
    }
  }
  const weakest = [...totals.entries()]
    .map(([skill, value]) => ({ skill, average: value.total / value.count }))
    .sort((a, b) => a.average - b.average)[0];
  return weakest?.skill ?? null;
}

export function deriveTrend(
  sessions: FeedbackSession[],
  skill: string | null,
  locale: string,
  timeZone: string,
): FeedbackTrendPoint[] {
  return [...sessions]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((session) => ({
      label: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone }).format(
        new Date(session.createdAt),
      ),
      score: skill ? (session.skillScores[skill] ?? session.score) : session.score,
    }));
}

export function deriveWeeklyFrequency(
  sessions: FeedbackSession[],
  locale: string,
  timeZone: string,
): WeeklyFrequency[] {
  const weeks = new Map<string, number>();
  for (const session of sessions) {
    const date = new Date(session.createdAt);
    const day = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
    const key = date.toISOString().slice(0, 10);
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, sessionCount]) => ({ weekStart, sessionCount }))
    .map((week) => ({
      ...week,
      weekStart: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone }).format(
        new Date(`${week.weekStart}T00:00:00Z`),
      ),
    }));
}

