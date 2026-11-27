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
  Easy: "text-[#7ee2a8]",
  Medium: "text-[#f5c46b]",
  Hard: "text-[#ff8f8f]",
};
