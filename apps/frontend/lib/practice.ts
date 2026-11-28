/** Client for the coding round (apps/backend coding.controller.ts). */

import api, { call } from "@/lib/api";

export interface CodingTest {
  args: unknown[];
  expected: unknown;
}

export interface CodingProblem {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  statement: string[];
  constraints: string[];
  functionName: string;
  starterCode: string;
  exampleCount: number;
  tests: CodingTest[];
}

export interface CodeReview {
  score: number;
  verdict: string;
  timeComplexity: string;
  spaceComplexity: string;
  strengths: string[];
  improvements: string[];
  followUp: string;
}

export interface Submission {
  id: number;
  problem: string;
  language: string;
  code: string;
  passed: number;
  total: number;
  score: number;
  review: CodeReview;
  createdAt: string;
}

export const listCodingProblems = () => call(api.get<{ problems: CodingProblem[] }>("/api/coding/problems")).then((d) => d.problems);

export const listSubmissions = (problem?: string) =>
  call(api.get<{ submissions: Submission[] }>("/api/coding/submissions", { params: problem ? { problem } : undefined })).then((d) => d.submissions);

export const submitSolution = (input: { problem: string; code: string; passed: number; total: number }) =>
  call(api.post<{ submission: Submission }>("/api/coding/submissions", { ...input, language: "javascript" })).then((d) => d.submission);

export const DIFFICULTY_TONE: Record<CodingProblem["difficulty"], string> = {
  Easy: "text-[#6ee7b7]",
  Medium: "text-[#fcd34d]",
  Hard: "text-[#fca5a5]",
};

/** Pill styles for a difficulty label. */
export const DIFFICULTY_CHIP: Record<CodingProblem["difficulty"], string> = {
  Easy: "bg-[#34d399]/10 text-[#6ee7b7] ring-[#34d399]/20",
  Medium: "bg-[#fbbf24]/10 text-[#fcd34d] ring-[#fbbf24]/20",
  Hard: "bg-[#f87171]/10 text-[#fca5a5] ring-[#f87171]/20",
};
