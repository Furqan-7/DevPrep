export type FeedbackSkillScore = Record<string, number>;

export interface FeedbackQuestion {
  text: string;
  score: number;
  strongerAnswer: string | null;
}

export interface FeedbackSession {
  id: string;
  createdAt: string;
  durationMin: number;
  role: string;
  category: string;
  score: number;
  skillScores: FeedbackSkillScore;
  topics: string[];
  feedbackNote: string | null;
  questions: FeedbackQuestion[];
}

export interface FeedbackSummary {
  totalSessions: number;
  averageScore: number | null;
  passRate: number | null;
  passThreshold: number;
  weakestSkill: string | null;
  lastUpdatedAt: string | null;
  goal: FeedbackGoal | null;
}

export interface RecurringGap {
  skill: string;
  occurrences: number;
  latestScore: number | null;
  note: string | null;
}

export interface WeeklyFrequency {
  weekStart: string;
  sessionCount: number;
}

export interface FeedbackGoal {
  targetScore: number;
  targetDate: string | null;
  label: string;
}

export interface FeedbackSessionsResponse {
  sessions: FeedbackSession[];
  nextCursor: string | null;
}

export interface FeedbackFrequencyResponse {
  weeks: WeeklyFrequency[];
}

export interface FeedbackGoalResponse {
  goal: FeedbackGoal | null;
}

