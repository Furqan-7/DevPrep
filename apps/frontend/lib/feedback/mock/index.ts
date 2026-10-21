import type {
  FeedbackGoal,
  FeedbackGoalResponse,
  FeedbackSession,
  FeedbackSummary,
  FeedbackSessionsResponse,
  FeedbackFrequencyResponse,
  RecurringGap,
} from "@/types/feedback";
import {
  getMockSummary,
  mockFrequency,
  mockGaps,
  mockGoal,
  oneSession,
  twelveSessions,
  zeroSessions,
} from "./fixtures";

export type MockScenario = "zero" | "one" | "twelve";

function sessionsForScenario(): FeedbackSession[] {
  const scenario = process.env.NEXT_PUBLIC_FEEDBACK_MOCK_SCENARIO;
  if (scenario === "one") return oneSession;
  if (scenario === "twelve") return twelveSessions;
  return zeroSessions;
}

export async function getSummary(): Promise<FeedbackSummary> {
  return getMockSummary(sessionsForScenario());
}

export async function getSessions(params: {
  category?: string;
  q?: string;
  sort?: string;
  cursor?: string;
  limit?: number;
}): Promise<FeedbackSessionsResponse> {
  const query = params.q?.toLowerCase().trim();
  const sessions = sessionsForScenario()
    .filter((item) => !params.category || item.category === params.category)
    .filter((item) => !query || `${item.role} ${item.category} ${item.topics.join(" ")}`.toLowerCase().includes(query))
    .sort((a, b) => (params.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  return { sessions: sessions.slice(0, params.limit ?? sessions.length), nextCursor: null };
}

export async function getGaps(): Promise<RecurringGap[]> {
  return sessionsForScenario().length > 1 ? mockGaps : [];
}

export async function getFrequency(): Promise<FeedbackFrequencyResponse> {
  return { weeks: sessionsForScenario().length > 1 ? mockFrequency : [] };
}

export async function getGoal(): Promise<FeedbackGoalResponse> {
  return { goal: sessionsForScenario().length > 1 ? mockGoal : null };
}

export async function putGoal(goal: FeedbackGoal): Promise<FeedbackGoalResponse> {
  return { goal };
}

