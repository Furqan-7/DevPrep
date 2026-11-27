/** Client for the overview (insights.controller.ts) and admin stats (admin.controller.ts). */

import api, { call } from "@/lib/api";
import type { Rubric } from "@/lib/interview/report";

export interface Insights {
  stats: {
    interviews: number;
    averageScore: number | null;
    codingTotal: number;
    codingSolved: number;
    currentStreak: number;
    longestStreak: number;
  };
  trend: { sessionId: number; role: string; date: string; score: number }[];
  activity: { date: string; count: number }[];
  rubric: (Rubric & { answers: number }) | null;
  readiness: { role: string; score: number; interviews: number; lastAt: string }[];
  nextSteps: { sessionId: number | null; items: string[] };
}

export interface AdminStats {
  totals: { users: number; interviews: number; reports: number; applications: number; codingSubmissions: number; resumes: number };
  activeUsers: { week: number; month: number };
  interviewsPerDay: { date: string; count: number }[];
  roles: { role: string; interviews: number; reports: number; averageScore: number | null }[];
  recent: { id: number; user: string; role: string; difficulty: string; status: string; score: number | null; createdAt: string }[];
}

// The sidebar and the overview both read insights on the same page load; sharing one
// request (per signed-in token, for a short while) saves a round trip and a DB scan.
const CACHE_MS = 30_000;
let cached: { token: string | null; at: number; promise: Promise<Insights> } | null = null;

export function getInsights(options: { fresh?: boolean } = {}): Promise<Insights> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!options.fresh && cached && cached.token === token && Date.now() - cached.at < CACHE_MS) return cached.promise;
  const promise = call(api.get<{ insights: Insights }>("/api/insights", { params: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone } })).then((d) => d.insights);
  const entry = { token, at: Date.now(), promise };
  cached = entry;
  // never keep a failed request around
  promise.catch(() => {
    if (cached === entry) cached = null;
  });
  return promise;
}

export const clearInsightsCache = () => {
  cached = null;
};

export const getAdminStats = () => call(api.get<{ stats: AdminStats }>("/api/admin/stats")).then((d) => d.stats);
