/**
 * Client for the post-interview feedback API (apps/backend report.controller.ts):
 * the session report, interview history and single-question retries.
 */

import api from "@/lib/api";
import { ROLES, roleSlug } from "@/data/roles";

export interface Rubric {
  relevance: number;
  depth: number;
  clarity: number;
  evidence: number;
}

export interface AnswerEvaluation {
  score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  betterAnswer: string;
  rubric: Rubric;
  fixedGaps?: string[];
}

export interface Attempt {
  id: number;
  answer: string;
  score: number;
  evaluation: AnswerEvaluation;
  createdAt: string;
}

export interface ReportQuestion {
  id: number;
  order: number;
  question: string;
  answer: string | null;
  score: number | null;
  evaluation: AnswerEvaluation | null;
  attempts: Attempt[];
}

export interface SessionReport {
  overallScore: number;
  technical: number;
  communication: number;
  confidence: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  createdAt: string;
}

export interface SessionDetail {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  createdAt: string;
  report: SessionReport | null;
  questions: ReportQuestion[];
}

export interface SessionSummary {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  createdAt: string;
  answered: number;
  totalQuestions: number;
  overallScore: number | null;
}

export interface AttemptResult {
  attempt: Attempt;
  previousScore: number;
  attemptsLeft: number;
}

export const MAX_ATTEMPTS = 5;

export type ApiErrorKind = "auth" | "not_found" | "no_answers" | "limit" | "invalid" | "network" | "server";
export class ReportApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string) {
    super(message);
  }
}

function toError(err: unknown): ReportApiError {
  const e = err as { response?: { status?: number; data?: { message?: string } }; request?: unknown };
  const status = e.response?.status;
  const message = e.response?.data?.message;
  if (!e.response) return new ReportApiError("network", "Can't reach the server. Check your connection and try again.");
  // MiddleWhere answers 411 (no token), 403 (expired) or 404 with "Invalid Token".
  if (status === 411 || status === 403 || status === 401 || message === "Invalid Token") {
    return new ReportApiError("auth", "Please sign in again.");
  }
  if (status === 404) return new ReportApiError("not_found", message ?? "Not found.");
  if (status === 409) return new ReportApiError("no_answers", message ?? "Nothing to review yet.");
  if (status === 429) return new ReportApiError("limit", message ?? "No retries left for this question.");
  if (status === 400) return new ReportApiError("invalid", message ?? "Something about that request wasn't right.");
  return new ReportApiError("server", message ?? "Something went wrong. Please try again.");
}

async function call<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    return (await p).data;
  } catch (err) {
    throw toError(err);
  }
}

export const getSession = (id: number) =>
  call(api.get<{ session: SessionDetail }>(`/api/interview/sessions/${id}`)).then((d) => d.session);

export const createReport = (id: number) =>
  call(api.post<{ session: SessionDetail }>(`/api/interview/sessions/${id}/report`)).then((d) => d.session);

export const listSessions = () =>
  call(api.get<{ sessions: SessionSummary[] }>("/api/interview/sessions")).then((d) => d.sessions);

export const submitAttempt = (questionId: number, answer: string) =>
  call(api.post<AttemptResult>(`/api/interview/questions/${questionId}/attempts`, { answer }));

/** Sends a recording to the frontend's /api/transcribe route and returns the text. */
export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, "answer.webm");
  let res: Response;
  try {
    res = await fetch("/api/transcribe", { method: "POST", body: form });
  } catch {
    throw new ReportApiError("network", "Can't reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { transcript?: string };
  if (!res.ok || typeof data.transcript !== "string") {
    throw new ReportApiError("server", "We couldn't transcribe that recording. Please try again.");
  }
  return data.transcript.trim();
}

/* ───────── display helpers ───────── */

const TITLES = new Map(ROLES.map((r) => [roleSlug(r.title), r.title as string]));

/** Sessions store the role slug ("frontend-engineer"); show the catalogue title. */
export function roleTitle(slug: string): string {
  return TITLES.get(slug) ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export const questionLabel = (order: number) => (order === 0 ? "Intro" : `Q${order}`);

/** Latest score for a question: its newest retry, else the original evaluation. */
export function currentScore(q: ReportQuestion): number | null {
  return q.attempts.at(-1)?.score ?? q.score;
}

export type Band = "hi" | "mid" | "lo";
export const band = (score10: number): Band => (score10 >= 8 ? "hi" : score10 >= 5 ? "mid" : "lo");

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days < 1 && new Date().getDate() === d.getDate()) return `Today, ${time}`;
  if (days < 2) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

const LEVEL_LABELS: Record<string, string> = { fresher: "Fresher", "mid-level": "Mid-level", senior: "Senior" };

/** Display label for a session's level ("difficulty"); older sessions stored "medium". */
export function levelLabel(difficulty: string): string {
  return LEVEL_LABELS[difficulty] ?? difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
