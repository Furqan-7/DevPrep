"use client";

/**
 * Optional tailoring for an interview, shown in the role brief's start panel: questions
 * about the saved resume, and/or steered toward a target job's description.
 */

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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
  job: string | null; // target job description, null when not added
  onJob: (job: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2">
      <span className="text-[12px] font-medium text-white/55">
        Tailor it <span className="font-normal text-white/35">· optional</span>
      </span>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/[0.12] has-[:disabled]:cursor-default has-[:disabled]:hover:border-white/[0.06] has-[[data-state=checked]]:border-[#4d7cff]/50 has-[[data-state=checked]]:bg-[#4d7cff]/[0.08]">
        <Checkbox checked={useResume} onCheckedChange={(v) => onUseResume(v === true)} disabled={!resumeName} className="mt-0.5 border-white/25 data-[state=checked]:border-[#4d7cff] data-[state=checked]:bg-[#4d7cff] data-[state=checked]:text-white" />
        <span className="min-w-0 text-[13.5px] font-medium leading-[1.4] text-white">
          Ask about my resume
          <span className="block truncate text-[12px] font-normal text-white/45">
            {resumeName === undefined ? (
              "Checking for a resume…"
            ) : resumeName ? (
              resumeName
            ) : (
              <>
                <Link href="/dashboard/resume" className="text-white/70 underline underline-offset-2 hover:text-white">
                  Upload a resume
                </Link>{" "}
                to get questions about your projects
              </>
            )}
          </span>
        </span>
      </label>

      {job !== null || editing ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <label htmlFor="target-job" className="text-[13px] font-medium text-white">
              Target job description
            </label>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                onJob(null);
              }}
              className="cursor-pointer text-[12px] text-white/45 hover:text-white"
            >
              Remove
            </button>
          </div>
          <Textarea
            id="target-job"
            value={job ?? ""}
            onChange={(e) => onJob(e.target.value)}
            rows={5}
            maxLength={8000}
            placeholder="Paste the job description and Zara will focus on what it asks for."
            className="mt-2 border-white/[0.08] bg-black/20 text-[13px]"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/[0.1] px-3 py-2.5 text-[13px] text-white/60 transition-colors hover:border-white/20 hover:text-white">
          <Plus className="size-3.5" /> Add a target job
        </button>
      )}
    </div>
  );
}
