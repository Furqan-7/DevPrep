"use client";

/**
 * Resume tools: upload a PDF resume (stored as text), check it against a job description
 * like an applicant tracking system would, and draft a cover letter for that job. The same
 * resume can tailor mock interviews from a role's page.
 */

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, FileText, Loader2, Mic, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppPage, EmptyState, PanelTitle, panel } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useSignedIn } from "@/hooks/useSignedIn";
import { ApiError, signInHref } from "@/lib/api";
import { deleteResume, getResume, matchResume, uploadResume, writeCoverLetter, type Resume, type ResumeMatch } from "@/lib/career";
import { formatDate } from "@/lib/interview/report";
import { cn } from "@/lib/utils";

const HERE = "/dashboard/resume";
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_JOB_CHARS = 80;

const matchLabel = (score: number) => (score >= 80 ? "Strong match" : score >= 50 ? "Partial match" : "Weak match");

export function ResumeView() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [resume, setResume] = useState<Resume | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState<"match" | "letter" | null>(null);
  const [match, setMatch] = useState<ResumeMatch | null>(null);
  const [letter, setLetter] = useState("");

  const fail = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.kind === "auth") return router.replace(signInHref(HERE));
    toast.error(err instanceof ApiError ? err.message : fallback);
  };

  useEffect(() => {
    if (!signedIn) return;
    getResume()
      .then(setResume)
      .catch((err: unknown) => {
        setResume(null);
        if (err instanceof ApiError && err.kind === "auth") router.replace(signInHref(HERE));
      });
  }, [signedIn, router]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Upload your resume as a PDF.");
    if (file.size > MAX_BYTES) return toast.error("That PDF is over 5 MB.");
    setUploading(true);
    try {
      setResume(await uploadResume(file));
      setMatch(null);
      setLetter("");
      toast.success("Resume saved");
    } catch (err) {
      fail(err, "Couldn't upload your resume.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    try {
      await deleteResume();
      setResume(null);
      setMatch(null);
      setLetter("");
    } catch (err) {
      fail(err, "Couldn't remove your resume.");
    }
  };

  const run = async (kind: "match" | "letter") => {
    setBusy(kind);
    try {
      if (kind === "match") setMatch(await matchResume(job.trim()));
      else setLetter(await writeCoverLetter(job.trim()));
    } catch (err) {
      fail(err, kind === "match" ? "Couldn't check your resume." : "Couldn't write the letter.");
    } finally {
      setBusy(null);
    }
  };

  if (signedIn === false) {
    return (
      <AppPage>
        <EmptyState title="Sign in to use your resume" body="Upload it once to check it against jobs, write cover letters and get interviews about your own projects.">
          <Button asChild>
            <Link href={signInHref(HERE)}>Sign in</Link>
          </Button>
        </EmptyState>
      </AppPage>
    );
  }

  const jobReady = job.trim().length >= MIN_JOB_CHARS;

  return (
    <AppPage title="Resume" description="Check how well your resume fits a job, draft a cover letter for it, and get interview questions about your own projects.">
      <Toaster position="bottom-center" />
      <div className="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className={panel}>
          <PanelTitle>Your resume</PanelTitle>
          <div className="p-5">
            {resume === undefined ? (
              <Skeleton className="h-[180px]" />
            ) : resume ? (
              <SavedResume resume={resume} uploading={uploading} onReplace={upload} onRemove={remove} />
            ) : (
              <Dropzone uploading={uploading} onFile={upload} />
            )}
          </div>
        </section>

        <section className={panel}>
          <PanelTitle>Check it against a job</PanelTitle>
          <div className="grid gap-3 p-5">
            <Label htmlFor="job-text" className="text-[12.5px] font-normal text-muted-foreground">
              Job description
            </Label>
            <Textarea id="job-text" value={job} onChange={(e) => setJob(e.target.value)} rows={7} maxLength={8000} placeholder="Paste the full job description: responsibilities, requirements, nice-to-haves." className="text-[13.5px]" />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => run("match")} disabled={!resume || !jobReady || !!busy}>
                {busy === "match" ? <Loader2 className="animate-spin" /> : null} Check match
              </Button>
              <Button variant="outline" onClick={() => run("letter")} disabled={!resume || !jobReady || !!busy} className="border-white/12 bg-transparent">
                {busy === "letter" ? <Loader2 className="animate-spin" /> : null} Write cover letter
              </Button>
              <span className="text-[12.5px] text-muted-foreground">{!resume ? "Upload your resume first." : !jobReady && job ? `At least ${MIN_JOB_CHARS} characters.` : ""}</span>
            </div>
          </div>
          {match ? <MatchResult match={match} /> : null}
          {letter ? <CoverLetter letter={letter} /> : null}
        </section>
      </div>
    </AppPage>
  );
}

function Dropzone({ uploading, onFile }: { uploading: boolean; onFile: (f: File | undefined) => void }) {
  const [over, setOver] = useState(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    onFile(e.dataTransfer.files[0]);
  };
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-ring",
        over ? "border-white/40 bg-white/[0.04]" : "border-white/15 hover:border-white/30",
      )}
    >
      {uploading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <Upload className="size-5 text-muted-foreground" />}
      <span className="mt-3 text-[14px] font-medium">{uploading ? "Reading your resume…" : "Upload your resume"}</span>
      <span className="mt-1 text-[12.5px] text-muted-foreground">PDF up to 5 MB. Drop it here or click to choose.</span>
      <input type="file" accept="application/pdf" className="sr-only" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  );
}

function SavedResume({ resume, uploading, onReplace, onRemove }: { resume: Resume; uploading: boolean; onReplace: (f: File | undefined) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/[0.05]">
          <FileText className="size-5 text-white/70" />
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-[14px] font-medium">{resume.fileName}</p>
          <p className="m-0 mt-0.5 text-[12.5px] text-muted-foreground">
            {resume.words} words · updated {formatDate(resume.updatedAt)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => input.current?.click()} disabled={uploading} className="border-white/12 bg-transparent">
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Replace
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove} disabled={uploading} className="text-muted-foreground">
          Remove
        </Button>
        <input ref={input} type="file" accept="application/pdf" className="sr-only" tabIndex={-1} onChange={(e) => onReplace(e.target.files?.[0])} />
      </div>
      <details className="group mt-4 rounded-lg bg-white/[0.03]">
        <summary className="cursor-pointer px-3.5 py-2.5 text-[12.5px] text-muted-foreground hover:text-foreground">What DevPrep read from it</summary>
        <pre className="m-0 max-h-[280px] overflow-y-auto whitespace-pre-wrap px-3.5 pb-3 font-sans text-[12.5px] leading-[1.55] text-white/70">{resume.text}</pre>
      </details>
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="m-0 text-[13px] leading-[1.5] text-white/75">Turn on &ldquo;Ask about my resume&rdquo; on any role to get questions about your own projects.</p>
        <Button asChild variant="outline" size="sm" className="mt-3 border-white/12 bg-transparent">
          <Link href="/dashboard/ai-interview">
            <Mic /> Choose a role
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MatchResult({ match }: { match: ResumeMatch }) {
  return (
    <div className="border-t border-white/[0.06] p-5">
      <div className="flex items-center gap-4">
        <span className="text-[44px] font-medium leading-none tabular-nums tracking-[-0.04em]">{match.score}</span>
        <div>
          <p className={cn("m-0 text-[14px] font-medium", match.score >= 80 ? "text-[#7ee2a8]" : match.score >= 50 ? "text-[#f5c46b]" : "text-[#ff8f8f]")}>{matchLabel(match.score)}</p>
          <p className="m-0 mt-1 text-[13.5px] leading-[1.5] text-white/75">{match.summary}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SkillList title="On your resume" items={match.matchedSkills} tone="text-white/80 border-white/12" />
        <SkillList title="Missing or hard to find" items={match.missingSkills} tone="text-[#ffc7a6] border-[#ffc7a6]/25" />
      </div>
      {match.suggestions.length ? (
        <>
          <h3 className="m-0 mt-5 text-[13px] font-medium">Edits for this job</h3>
          <ol className="m-0 mt-2 grid list-decimal gap-1.5 pl-5 text-[13.5px] leading-[1.55] text-white/80">
            {match.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

function SkillList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <h3 className="m-0 text-[12.5px] font-normal text-muted-foreground">{title}</h3>
      {items.length ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
          {items.map((s) => (
            <li key={s} className={cn("rounded border px-1.5 py-0.5 text-[12px]", tone)}>
              {s}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-2 text-[12.5px] text-muted-foreground">None</p>
      )}
    </div>
  );
}

function CoverLetter({ letter }: { letter: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="border-t border-white/[0.06] p-5">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-medium">Cover letter</h3>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="m-0 mt-1 text-[12.5px] text-muted-foreground">A draft from your resume. Read it through and make it yours before sending.</p>
      <div className="mt-3 whitespace-pre-wrap rounded-lg bg-white/[0.03] px-4 py-3.5 text-[13.5px] leading-[1.65] text-white/85">{letter}</div>
    </div>
  );
}
