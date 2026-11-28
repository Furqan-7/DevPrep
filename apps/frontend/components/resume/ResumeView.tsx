"use client";

/**
 * Resume tools: upload a PDF resume (stored as text), check it against a job description
 * like an applicant tracking system would, and draft a cover letter for that job. The same
 * resume can tailor mock interviews from a role's page.
 */

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, FileSearch, FileText, Loader2, Mic, PenLine, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AppPage, EmptyState, PanelTitle, panel } from "@/components/app/AppPage";
import { Ring } from "@/components/app/kit";
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
    <AppPage icon={FileText} title="Resume" description="Check how well your resume fits a job, draft a cover letter for it, and get interview questions about your own projects.">
      <Toaster position="bottom-center" />
      <div className="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className={panel}>
          <PanelTitle>Your resume</PanelTitle>
          <div className="p-5">
            {resume === undefined ? (
              <Skeleton className="h-[180px] rounded-xl bg-white/[0.04]" />
            ) : resume ? (
              <SavedResume resume={resume} uploading={uploading} onReplace={upload} onRemove={remove} />
            ) : (
              <Dropzone uploading={uploading} onFile={upload} />
            )}
          </div>
        </section>

        <section className={panel}>
          <PanelTitle aside={<span className="tabular-nums">{job.trim().length.toLocaleString()} / 8,000</span>}>Check it against a job</PanelTitle>
          <div className="grid gap-3 p-5">
            <Label htmlFor="job-text" className="text-[12.5px] font-medium text-white/55">
              Job description
            </Label>
            <Textarea
              id="job-text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              rows={8}
              maxLength={8000}
              placeholder="Paste the full job description: responsibilities, requirements, nice-to-haves."
              className="rounded-xl border-white/[0.08] bg-black/20 text-[13.5px] leading-[1.6]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => run("match")} disabled={!resume || !jobReady || !!busy} className="h-9 font-semibold">
                {busy === "match" ? <Loader2 className="animate-spin" /> : <FileSearch />} Check match
              </Button>
              <Button variant="outline" onClick={() => run("letter")} disabled={!resume || !jobReady || !!busy} className="h-9 border-white/[0.1] bg-white/[0.03]">
                {busy === "letter" ? <Loader2 className="animate-spin" /> : <PenLine />} Write cover letter
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
        "relative flex cursor-pointer flex-col items-center overflow-hidden rounded-xl border border-dashed px-6 py-12 text-center transition-colors focus-within:ring-2 focus-within:ring-ring",
        over ? "border-[#4d7cff]/60 bg-[#4d7cff]/[0.06]" : "border-white/[0.14] hover:border-white/30",
      )}
    >
      <span className="relative grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]">
        {uploading ? <Loader2 className="size-5 animate-spin text-white/70" /> : <Upload className="size-5 text-white/70" />}
      </span>
      <span className="relative mt-4 text-[14px] font-semibold">{uploading ? "Reading your resume…" : "Upload your resume"}</span>
      <span className="relative mt-1 text-[12.5px] text-muted-foreground">PDF up to 5 MB. Drop it here or click to choose.</span>
      <input type="file" accept="application/pdf" className="sr-only" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  );
}

function SavedResume({ resume, uploading, onReplace, onRemove }: { resume: Resume; uploading: boolean; onReplace: (f: File | undefined) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <span className="grid h-12 w-10 shrink-0 place-items-center rounded-lg border border-[#f87171]/25 bg-[#f87171]/10 text-[9.5px] font-bold tracking-wide text-[#fca5a5]">
          PDF
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-[14px] font-semibold">{resume.fileName}</p>
          <p className="m-0 mt-1 flex flex-wrap gap-1.5 text-[11.5px] text-white/55">
            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5">{resume.words} words</span>
            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5">Updated {formatDate(resume.updatedAt)}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => input.current?.click()} disabled={uploading} className="border-white/[0.1] bg-white/[0.03]">
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Replace
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove} disabled={uploading} className="text-muted-foreground hover:text-[#fca5a5]">
          <X /> Remove
        </Button>
        <input ref={input} type="file" accept="application/pdf" className="sr-only" tabIndex={-1} onChange={(e) => onReplace(e.target.files?.[0])} />
      </div>
      <details className="group mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
        <summary className="cursor-pointer px-3.5 py-2.5 text-[12.5px] text-muted-foreground hover:text-foreground">What DevPrep read from it</summary>
        <pre className="m-0 max-h-[280px] overflow-y-auto whitespace-pre-wrap px-3.5 pb-3 font-sans text-[12.5px] leading-[1.55] text-white/70">{resume.text}</pre>
      </details>
      <div className="relative mt-4 overflow-hidden rounded-xl border border-[#4d7cff]/20 bg-[#4d7cff]/[0.06] p-4">
        <p className="m-0 text-[13px] font-semibold text-white">Practise on your own projects</p>
        <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-white/60">Turn on &ldquo;Ask about my resume&rdquo; on any role and Zara asks about what you&rsquo;ve built.</p>
        <Button asChild size="sm" className="mt-3 h-8 font-semibold">
          <Link href="/dashboard/ai-interview">
            <Mic /> Choose a role
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MatchResult({ match }: { match: ResumeMatch }) {
  const color = match.score >= 80 ? "#34d399" : match.score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="border-t border-white/[0.06] p-5">
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Ring value={match.score} size={64} stroke={5} color={color}>
          <span className="text-[16px]">{match.score}</span>
        </Ring>
        <div className="min-w-0">
          <span className="inline-flex rounded-md px-2 py-0.5 text-[11.5px] font-semibold" style={{ background: `${color}1f`, color }}>
            {matchLabel(match.score)}
          </span>
          <p className="m-0 mt-1.5 text-[13.5px] leading-[1.5] text-white/75">{match.summary}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SkillList title="On your resume" items={match.matchedSkills} tone="bg-[#34d399]/10 text-[#6ee7b7] ring-[#34d399]/20" icon={<Check className="size-3" />} />
        <SkillList title="Missing or hard to find" items={match.missingSkills} tone="bg-[#fbbf24]/10 text-[#fcd34d] ring-[#fbbf24]/20" icon={<X className="size-3" />} />
      </div>
      {match.suggestions.length ? (
        <>
          <h3 className="m-0 mt-5 text-[13px] font-semibold">Edits for this job</h3>
          <ol className="m-0 mt-2.5 grid list-none gap-2 p-0">
            {match.suggestions.map((s, i) => (
              <li key={s} className="flex gap-2.5 text-[13.5px] leading-[1.55] text-white/80">
                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[11px] font-semibold text-white/70">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

function SkillList({ title, items, tone, icon }: { title: string; items: string[]; tone: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5">
      <h3 className="m-0 text-[12.5px] font-medium text-white/55">
        {title} <span className="tabular-nums text-white/30">{items.length}</span>
      </h3>
      {items.length ? (
        <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-1.5 p-0">
          {items.map((s) => (
            <li key={s} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] ring-1 ring-inset", tone)}>
              {icon}
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
        <h3 className="m-0 flex items-center gap-2 text-[13px] font-semibold">
          <PenLine className="size-3.5 text-white/50" /> Cover letter
        </h3>
        <Button variant="outline" size="sm" onClick={copy} className="h-8 border-white/[0.1] bg-white/[0.03]">
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="m-0 mt-1 text-[12.5px] text-muted-foreground">A draft from your resume. Read it through and make it yours before sending.</p>
      <div className="mt-3 whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-[#fafafa]/[0.03] px-5 py-4 text-[13.5px] leading-[1.7] text-white/85">{letter}</div>
    </div>
  );
}
