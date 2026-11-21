"use client";

/**
 * Optional tailoring for an interview, shown in the role brief's start panel: questions
 * about the saved resume, and/or steered toward a target job's description.
 */

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export interface TargetJob {
  label: string | null; // set when the job came from the jobs board
  text: string;
}

export const MIN_JOB_CHARS = 80;

export function TailorOptions({
  resumeName,
  useResume,
  onUseResume,
  job,
  onJob,
}: {
  resumeName: string | null | undefined; // undefined while loading, null when none is saved
  useResume: boolean;
  onUseResume: (v: boolean) => void;
  job: TargetJob | null;
  onJob: (job: TargetJob | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-white/[0.08] pt-4">
      <span className="text-[12.5px] text-white/45">Tailor it (optional)</span>

      <label className="flex cursor-pointer items-start gap-2.5 has-[:disabled]:cursor-default">
        <Checkbox checked={useResume} onCheckedChange={(v) => onUseResume(v === true)} disabled={!resumeName} className="mt-0.5 border-white/25" />
        <span className="min-w-0 text-[13.5px] leading-[1.4]">
          Ask about my resume
          <span className="block truncate text-[12.5px] text-white/45">
            {resumeName === undefined ? (
              "Checking for a resume…"
            ) : resumeName ? (
              resumeName
            ) : (
              <>
                <Link href="/dashboard/resume" className="text-white/70 underline underline-offset-2 hover:text-[#f0f0f0]">
                  Upload a resume
                </Link>{" "}
                to get questions about your projects
              </>
            )}
          </span>
        </span>
      </label>

      {job?.label && !editing ? (
        <div className="flex items-start justify-between gap-2 rounded-[10px] bg-white/[0.04] px-3 py-2.5 text-[13px]">
          <span className="min-w-0">
            <span className="block text-[12px] text-white/45">Target job</span>
            <span className="block truncate">{job.label}</span>
          </span>
          <button type="button" onClick={() => onJob(null)} aria-label="Remove the target job" className="cursor-pointer rounded p-0.5 text-white/45 hover:text-[#f0f0f0]">
            <X className="size-4" />
          </button>
        </div>
      ) : job || editing ? (
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="target-job" className="text-[12.5px] text-white/45">
              Target job description
            </label>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                onJob(null);
              }}
              className="cursor-pointer text-[12px] text-white/45 hover:text-[#f0f0f0]"
            >
              Remove
            </button>
          </div>
          <Textarea
            id="target-job"
            value={job?.text ?? ""}
            onChange={(e) => onJob({ label: null, text: e.target.value })}
            rows={5}
            maxLength={8000}
            placeholder="Paste the job description and Zara will focus on what it asks for."
            className="mt-1.5 border-white/12 text-[13px]"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="flex w-fit cursor-pointer items-center gap-1.5 text-[13px] text-white/70 hover:text-[#f0f0f0]">
          <Plus className="size-3.5" /> Add a target job
        </button>
      )}
    </div>
  );
}
