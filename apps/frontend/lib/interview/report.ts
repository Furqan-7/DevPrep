/**
 * Client for the post-interview feedback API (apps/backend report.controller.ts):
 * the session report, interview history and single-question retries.
 */

import api, { ApiError, call } from "@/lib/api";
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

export interface AnswerDelivery {
  words: number;
  wpm: number | null;
  fillers: number;
}

/** Speaking pace and filler words across the interview's answers. */
export interface SessionDelivery {
  answers: number;
  words: number;
  wpm: number | null;
  fillersPer100Words: number;
  topFillers: { word: string; count: number }[];
}

export interface ReportQuestion {
  id: number;
  order: number;
  question: string;
  answer: string | null;
  delivery: AnswerDelivery | null;
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
  tailored: { resume: boolean; job: boolean };
  shareToken: string | null;
  delivery: SessionDelivery | null;
  report: SessionReport | null;
  questions: ReportQuestion[];
}

/** The read-only report behind a share link: scores and feedback, no answers. */
export interface SharedReport {
  candidate: string;
  role: string;
  difficulty: string;
  createdAt: string;
  report: SessionReport;
  delivery: SessionDelivery | null;
  questions: { order: number; question: string; score: number; verdict: string; rubric: Rubric }[];
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

// Errors are shared with the other API clients; the old name is kept for existing imports.
export { ApiError as ReportApiError, type ApiErrorKind } from "@/lib/api";

export const getSession = (id: number) =>
  call(api.get<{ session: SessionDetail }>(`/api/interview/sessions/${id}`)).then((d) => d.session);

export const createReport = (id: number) =>
  call(api.post<{ session: SessionDetail }>(`/api/interview/sessions/${id}/report`)).then((d) => d.session);

export const listSessions = () =>
  call(api.get<{ sessions: SessionSummary[] }>("/api/interview/sessions")).then((d) => d.sessions);

export const shareSession = (id: number) =>
  call(api.post<{ shareToken: string }>(`/api/interview/sessions/${id}/share`)).then((d) => d.shareToken);

export const unshareSession = (id: number) => call(api.delete(`/api/interview/sessions/${id}/share`));

export const getSharedReport = (token: string) =>
  call(api.get<{ report: SharedReport }>(`/api/public/reports/${encodeURIComponent(token)}`)).then((d) => d.report);

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
    throw new ApiError("network", "Can't reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { transcript?: string };
  if (!res.ok || typeof data.transcript !== "string") {
    throw new ApiError("server", "We couldn't transcribe that recording. Please try again.");
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
