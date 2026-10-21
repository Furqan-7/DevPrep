import type {
  FeedbackGoal,
  FeedbackGoalResponse,
  FeedbackSummary,
  FeedbackSessionsResponse,
  FeedbackFrequencyResponse,
  RecurringGap,
} from "@/types/feedback";

export type FeedbackApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: FeedbackApiError };

export type FeedbackApiErrorCode = "unauthorized" | "network" | "validation" | "server";

export interface FeedbackApiError {
  code: FeedbackApiErrorCode;
  message: string;
  status: number | null;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const useMock = process.env.NEXT_PUBLIC_FEEDBACK_MOCK === "true";

async function request<T>(path: string, init?: RequestInit): Promise<FeedbackApiResult<T>> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (response.status === 401) {
      return { ok: false, error: { code: "unauthorized", message: "Your session has expired.", status: 401 } };
    }
    if (!response.ok) {
      return { ok: false, error: { code: "server", message: "Feedback could not be loaded.", status: response.status } };
    }
    try {
      return { ok: true, data: (await response.json()) as T };
    } catch {
      return { ok: false, error: { code: "validation", message: "Feedback response was invalid.", status: response.status } };
    }
  } catch {
    return { ok: false, error: { code: "network", message: "Could not connect to feedback.", status: null } };
  }
}

async function mockRequest<T>(loader: () => Promise<T>): Promise<FeedbackApiResult<T>> {
  try {
    return { ok: true, data: await loader() };
  } catch {
    return { ok: false, error: { code: "server", message: "Feedback could not be loaded.", status: null } };
  }
}

export async function getSummary(): Promise<FeedbackApiResult<FeedbackSummary>> {
  if (useMock) {
    const mock = await import("./mock");
    return mockRequest(mock.getSummary);
  }
  return request<FeedbackSummary>("/api/feedback/summary");
}

export async function getSessions(params: {
  category?: string;
  q?: string;
  sort?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<FeedbackApiResult<FeedbackSessionsResponse>> {
  if (useMock) {
    const mock = await import("./mock");
    return mockRequest(() => mock.getSessions(params));
  }
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  return request<FeedbackSessionsResponse>(`/api/feedback/sessions?${query.toString()}`);
}

export async function getGaps(): Promise<FeedbackApiResult<RecurringGap[]>> {
  if (useMock) {
    const mock = await import("./mock");
    return mockRequest(mock.getGaps);
  }
  return request<RecurringGap[]>("/api/feedback/gaps");
}

export async function getFrequency(): Promise<FeedbackApiResult<FeedbackFrequencyResponse>> {
  if (useMock) {
    const mock = await import("./mock");
    return mockRequest(mock.getFrequency);
  }
  return request<FeedbackFrequencyResponse>("/api/feedback/frequency");
}

export async function getGoal(): Promise<FeedbackApiResult<FeedbackGoalResponse>> {
  if (useMock) {
    const mock = await import("./mock");
    return mockRequest(mock.getGoal);
  }
  return request<FeedbackGoalResponse>("/api/feedback/goal");
}

export async function putGoal(goal: FeedbackGoal): Promise<FeedbackApiResult<FeedbackGoalResponse>> {
  if (useMock) {
    const mock = await import("./mock");
    return mockRequest(() => mock.putGoal(goal));
  }
  return request<FeedbackGoalResponse>("/api/feedback/goal", { method: "PUT", body: JSON.stringify(goal) });
}

