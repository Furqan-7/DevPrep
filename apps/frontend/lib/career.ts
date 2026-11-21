/**
 * Client for the career tools (apps/backend resume.controller.ts and
 * application.controller.ts): the saved resume, resume-vs-job match, cover letters
 * and the job application tracker.
 */

import api, { call } from "@/lib/api";

export interface Resume {
  fileName: string;
  text: string;
  words: number;
  updatedAt: string;
}

export interface ResumeMatch {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

export const STAGES = ["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export interface Application {
  id: number;
  jobId: string | null;
  company: string;
  title: string;
  url: string | null;
  location: string | null;
  notes: string | null;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationInput = Pick<Application, "company" | "title"> & Partial<Pick<Application, "jobId" | "url" | "location" | "notes" | "stage">>;

export const getResume = () => call(api.get<{ resume: Resume | null }>("/api/resume")).then((d) => d.resume);

export const uploadResume = (file: File) =>
  call(
    api.put<{ resume: Resume }>("/api/resume", file, {
      headers: { "Content-Type": "application/pdf", "X-File-Name": encodeURIComponent(file.name) },
    }),
  ).then((d) => d.resume);

export const deleteResume = () => call(api.delete("/api/resume"));

export const matchResume = (jobDescription: string) =>
  call(api.post<{ match: ResumeMatch }>("/api/resume/match", { jobDescription })).then((d) => d.match);

export const writeCoverLetter = (jobDescription: string) =>
  call(api.post<{ letter: string }>("/api/resume/cover-letter", { jobDescription })).then((d) => d.letter);

export const listApplications = () => call(api.get<{ applications: Application[] }>("/api/applications")).then((d) => d.applications);

export const createApplication = (input: ApplicationInput) =>
  call(api.post<{ application: Application }>("/api/applications", input)).then((d) => d.application);

export const updateApplication = (id: number, input: Partial<ApplicationInput>) =>
  call(api.patch<{ application: Application }>(`/api/applications/${id}`, input)).then((d) => d.application);

export const deleteApplication = (id: number) => call(api.delete(`/api/applications/${id}`));
