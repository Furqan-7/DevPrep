/**
 * Client for practice progress (apps/backend progress.controller.ts and
 * coding.controller.ts): the DSA sheet and the coding round.
 */

import api, { call } from "@/lib/api";

export interface ProblemProgress {
  problemId: number;
  solved: boolean;
  solvedAt: string | null;
  note: string | null;
}

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

export const listProblemProgress = () => call(api.get<{ progress: ProblemProgress[] }>("/api/progress/problems")).then((d) => d.progress);

export const updateProblemProgress = (problemId: number, change: { solved?: boolean; note?: string | null }) =>
  call(api.put<{ progress: ProblemProgress }>(`/api/progress/problems/${problemId}`, change)).then((d) => d.progress);

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
