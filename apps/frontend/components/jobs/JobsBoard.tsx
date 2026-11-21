"use client";

/**
 * Jobs board: open roles filtered by category, type and search. Each job can be saved to
 * the application tracker, practised as a tailored mock interview, or applied to.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, ExternalLink, Mic, Search } from "lucide-react";
import { toast } from "sonner";
import { AppPage, EmptyState, panel } from "@/components/app/AppPage";
import { FilterSelect } from "@/components/app/FilterSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { HARDCODED_JOBS, practiceRoleFor } from "@/data/jobs";
import { ApiError, signInHref } from "@/lib/api";
import { createApplication, listApplications } from "@/lib/career";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/job";
import { CompanyLogo } from "./CompanyLogo";

const HERE = "/dashboard/jobs";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "startup", label: "Startups" },
  { value: "company", label: "Companies" },
  { value: "faang", label: "FAANG" },
  { value: "hft", label: "HFT" },
] as const;

const TYPES = ["All", "Full-time", "Remote", "Contract", "Internship"] as const;
const typeValue = (t: (typeof TYPES)[number]) => t.toLowerCase() as Job["type"];
const typeLabel = (t: Job["type"]) => TYPES.find((x) => typeValue(x) === t) ?? t;

function postedLabel(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function JobsBoard() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("all");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    listApplications()
      .then((apps) => setSaved(new Set(apps.map((a) => a.jobId).filter((id): id is string => !!id))))
      .catch(() => {}); // saved markers are optional
  }, []);

  const save = async (job: Job) => {
    if (!localStorage.getItem("token")) return router.push(signInHref(HERE));
    setSaving(job.id);
    try {
      await createApplication({ jobId: job.id, company: job.company, title: job.title, url: job.applyUrl, location: job.location });
      setSaved((s) => new Set(s).add(job.id));
      toast.success(`Saved ${job.title}`, { action: { label: "Open tracker", onClick: () => router.push("/dashboard/applications") } });
    } catch (err) {
      if (err instanceof ApiError && err.kind === "auth") return router.push(signInHref(HERE));
      toast.error(err instanceof ApiError ? err.message : "Couldn't save this job.");
    } finally {
      setSaving(null);
    }
  };

  const q = query.trim().toLowerCase();
  const jobs = HARDCODED_JOBS.filter(
    (j) =>
      (category === "all" || j.category === category) &&
      (type === "All" || j.type === typeValue(type)) &&
      (!q || `${j.title} ${j.company} ${j.location} ${j.skills.join(" ")}`.toLowerCase().includes(q)),
  ).sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  return (
    <AppPage title="Jobs" description="Open roles at startups, product companies, FAANG and trading firms. Save one to track it, or practise an interview built from it.">
      <Toaster position="bottom-center" />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, company or skill" aria-label="Search jobs" className="h-9 border-white/10 bg-white/[0.02] pl-9" />
        </div>
        <FilterSelect label="Type" value={type} options={TYPES} onChange={setType} />
      </div>
      <div role="tablist" aria-label="Company type" className="mt-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const on = category === c.value;
          const n = c.value === "all" ? HARDCODED_JOBS.length : HARDCODED_JOBS.filter((j) => j.category === c.value).length;
          return (
            <Button
              key={c.value}
              role="tab"
              aria-selected={on}
              variant={on ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c.value)}
              className={cn("h-8 rounded-full px-3.5 text-[13px]", !on && "border-white/10 bg-transparent text-white/70 hover:text-foreground")}
            >
              {c.label}
              <span className={cn("tabular-nums text-[11.5px]", on ? "text-primary-foreground/55" : "text-white/35")}>{n}</span>
            </Button>
          );
        })}
      </div>

      <div className={cn(panel, "mt-5")}>
        {jobs.length === 0 ? (
          <EmptyState title="No jobs match" body="Try another search or company type." />
        ) : (
          <ul className="m-0 list-none p-0">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} saved={saved.has(job.id)} saving={saving === job.id} onSave={() => save(job)} />
            ))}
          </ul>
        )}
      </div>
    </AppPage>
  );
}

function JobRow({ job, saved, saving, onSave }: { job: Job; saved: boolean; saving: boolean; onSave: () => void }) {
  return (
    <li className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 last:border-b-0 md:flex-row md:items-center md:gap-5">
      <div className="flex min-w-0 flex-1 gap-3.5">
        <CompanyLogo company={job.company} domain={job.companyDomain} letter={job.companyLetter} />
        <div className="min-w-0">
          <p className="m-0 text-[14.5px] font-medium leading-[1.35] tracking-[-0.01em]">{job.title}</p>
          <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">
            <span className="text-white/80">{job.company}</span> · {job.location}
            {job.salary ? ` · ${job.salary}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-white/12 px-1.5 py-px text-[11.5px] text-white/75">{typeLabel(job.type)}</span>
            {job.skills.map((s) => (
              <span key={s} className="rounded border border-white/[0.07] px-1.5 py-px text-[11.5px] text-white/55">
                {s}
              </span>
            ))}
            <span className="ml-1 text-[11.5px] text-muted-foreground">{postedLabel(job.postedAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5 md:justify-end">
        {saved ? (
          <Button asChild variant="ghost" size="sm" className="text-[#bec8ff]">
            <Link href="/dashboard/applications">
              <BookmarkCheck /> Saved
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onSave} disabled={saving}>
            <Bookmark /> Save
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="border-white/12 bg-transparent">
          <Link href={`/dashboard/ai-interview/${practiceRoleFor(job)}?job=${job.id}`}>
            <Mic /> Practise
          </Link>
        </Button>
        <Button asChild size="sm">
          <a href={job.applyUrl} target="_blank" rel="noreferrer">
            Apply <ExternalLink />
          </a>
        </Button>
      </div>
    </li>
  );
}
