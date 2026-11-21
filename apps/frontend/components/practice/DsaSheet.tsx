"use client";

/**
 * DSA sheet: company-tagged problems with filters, solved checkboxes and notes, saved to the
 * user's account. Progress kept in this browser by the old sheet is moved to the account once.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, ExternalLink, NotebookPen, Search } from "lucide-react";
import { toast } from "sonner";
import { AppPage, EmptyState, panel } from "@/components/app/AppPage";
import { FilterSelect } from "@/components/app/FilterSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY_LOGO, DSA_COMPANIES, DSA_PROBLEMS, DSA_TOPICS, leetcodeSlug, type DsaProblem } from "@/data/dsa";
import { useSignedIn } from "@/hooks/useSignedIn";
import { ApiError, signInHref } from "@/lib/api";
import { DIFFICULTY_TONE, listCodingProblems, listProblemProgress, updateProblemProgress, type ProblemProgress } from "@/lib/practice";
import { cn } from "@/lib/utils";

const HERE = "/dashboard/dsa";
const LEGACY_SOLVED = "tp_solved";
const LEGACY_NOTES = "tp_notes";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;
const STATUSES = ["All", "Solved", "Unsolved"] as const;
const TOPICS = ["All", ...DSA_TOPICS];
const COMPANIES = ["All", ...DSA_COMPANIES];

/** Moves the old localStorage progress to the account, then forgets it. */
async function importLegacyProgress(): Promise<ProblemProgress[]> {
  const solved: number[] = JSON.parse(localStorage.getItem(LEGACY_SOLVED) ?? "[]");
  const notes: Record<string, string> = JSON.parse(localStorage.getItem(LEGACY_NOTES) ?? "{}");
  const ids = new Set([...solved, ...Object.keys(notes).map(Number)].filter((id) => DSA_PROBLEMS.some((p) => p.id === id)));
  const saved = await Promise.all([...ids].map((id) => updateProblemProgress(id, { solved: solved.includes(id), note: notes[id] || null })));
  localStorage.removeItem(LEGACY_SOLVED);
  localStorage.removeItem(LEGACY_NOTES);
  return saved;
}

export function DsaSheet() {
  const router = useRouter();
  const params = useSearchParams();
  const signedIn = useSignedIn();
  const [progress, setProgress] = useState<Map<number, ProblemProgress>>(new Map());
  const [inCodingRound, setInCodingRound] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("All");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("All");
  const [topic, setTopic] = useState(() => (TOPICS.includes(params.get("topic") ?? "") ? params.get("topic")! : "All"));
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  useEffect(() => {
    listCodingProblems()
      .then((p) => setInCodingRound(new Set(p.map((x) => x.slug))))
      .catch(() => {}); // the "Solve" links are optional
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    (async () => {
      let rows = await listProblemProgress();
      if (rows.length === 0 && (localStorage.getItem(LEGACY_SOLVED) || localStorage.getItem(LEGACY_NOTES))) rows = await importLegacyProgress();
      if (alive) setProgress(new Map(rows.map((r) => [r.problemId, r])));
    })().catch((err: unknown) => {
      if (err instanceof ApiError && err.kind === "auth") router.replace(signInHref(HERE));
      else toast.error("Couldn't load your progress.");
    });
    return () => {
      alive = false;
    };
  }, [signedIn, router]);

  const save = async (id: number, change: { solved?: boolean; note?: string | null }) => {
    if (!signedIn) return router.push(signInHref(HERE));
    const before = progress.get(id);
    const optimistic: ProblemProgress = { problemId: id, solved: before?.solved ?? false, solvedAt: before?.solvedAt ?? null, note: before?.note ?? null, ...change };
    setProgress((m) => new Map(m).set(id, optimistic));
    try {
      const row = await updateProblemProgress(id, change);
      setProgress((m) => new Map(m).set(id, row));
    } catch (err) {
      setProgress((m) => {
        const next = new Map(m);
        if (before) next.set(id, before);
        else next.delete(id);
        return next;
      });
      toast.error(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    }
  };

  const solved = (p: DsaProblem) => progress.get(p.id)?.solved ?? false;
  const q = query.trim().toLowerCase();
  const rows = DSA_PROBLEMS.filter(
    (p) =>
      (company === "All" || p.companies.includes(company)) &&
      (difficulty === "All" || p.difficulty === difficulty) &&
      (topic === "All" || p.topic === topic) &&
      (status === "All" || (status === "Solved") === solved(p)) &&
      (!q || p.name.toLowerCase().includes(q)),
  );

  const byDifficulty = useMemo(
    () =>
      (["Easy", "Medium", "Hard"] as const).map((d) => {
        const all = DSA_PROBLEMS.filter((p) => p.difficulty === d);
        return { d, total: all.length, done: all.filter((p) => progress.get(p.id)?.solved).length };
      }),
    [progress],
  );
  const doneCount = [...progress.values()].filter((p) => p.solved).length;
  const filtered = company !== "All" || difficulty !== "All" || topic !== "All" || status !== "All" || q;

  return (
    <AppPage title="DSA sheet" description="Problems asked at top companies, by how often they come up. Tick them off as you solve them and keep notes on each.">
      <Toaster position="bottom-center" />
      {signedIn === false ? (
        <p className="m-0 mb-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13.5px] text-muted-foreground">
          <Link href={signInHref(HERE)} className="text-foreground underline underline-offset-4">
            Sign in
          </Link>{" "}
          to save your progress and notes.
        </p>
      ) : null}

      <div className={cn(panel, "grid grid-cols-2 sm:grid-cols-4")}>
        <div className="px-5 py-4">
          <p className="m-0 text-[12.5px] text-muted-foreground">Solved</p>
          <p className="m-0 mt-1.5 text-[26px] font-medium tabular-nums tracking-[-0.03em]">
            {doneCount}
            <span className="text-[15px] text-muted-foreground">/{DSA_PROBLEMS.length}</span>
          </p>
        </div>
        {byDifficulty.map(({ d, total, done }, i) => (
          <div key={d} className={cn("border-white/[0.06] px-5 py-4", i === 0 ? "border-l" : "sm:border-l", i >= 1 && "border-t sm:border-t-0", i === 2 && "border-l")}>
            <p className={cn("m-0 text-[12.5px]", DIFFICULTY_TONE[d])}>{d}</p>
            <p className="m-0 mt-1.5 text-[15px] tabular-nums">
              {done}
              <span className="text-muted-foreground">/{total}</span>
            </p>
            <Progress value={(done / total) * 100} aria-label={`${d} solved`} className="mt-2 h-1 bg-white/[0.06] [&>[data-slot=progress-indicator]]:bg-white/60" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search problems" aria-label="Search problems" className="h-9 border-white/10 bg-white/[0.02] pl-9" />
        </div>
        <FilterSelect label="Company" value={company} options={COMPANIES} onChange={setCompany} />
        <FilterSelect label="Difficulty" value={difficulty} options={DIFFICULTIES} onChange={setDifficulty} />
        <FilterSelect label="Topic" value={topic} options={TOPICS} onChange={setTopic} />
        <FilterSelect label="Status" value={status} options={STATUSES} onChange={setStatus} />
      </div>

      <div className={cn(panel, "mt-3")}>
        {rows.length === 0 ? (
          <EmptyState title="No problems match these filters">
            {filtered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setCompany("All");
                  setDifficulty("All");
                  setTopic("All");
                  setStatus("All");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent [&>th]:text-[12.5px] [&>th]:font-normal [&>th]:text-muted-foreground">
                <TableHead className="w-10 pl-5">
                  <span className="sr-only">Solved</span>
                </TableHead>
                <TableHead>Problem</TableHead>
                <TableHead className="hidden md:table-cell">Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="hidden sm:table-cell">Asked</TableHead>
                <TableHead className="pr-5 text-right">Practice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  progress={progress.get(p.id)}
                  codingSlug={inCodingRound.has(leetcodeSlug(p)) ? leetcodeSlug(p) : null}
                  onSolved={(v) => save(p.id, { solved: v })}
                  onNote={(note) => save(p.id, { note })}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppPage>
  );
}

function ProblemRow({
  problem: p,
  progress,
  codingSlug,
  onSolved,
  onNote,
}: {
  problem: DsaProblem;
  progress?: ProblemProgress;
  codingSlug: string | null;
  onSolved: (solved: boolean) => void;
  onNote: (note: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const solved = progress?.solved ?? false;
  const link = "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12.5px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-foreground";

  return (
    <TableRow className="border-white/[0.06]">
      <TableCell className="pl-5">
        <Checkbox checked={solved} onCheckedChange={(v) => onSolved(v === true)} aria-label={`Mark ${p.name} as solved`} />
      </TableCell>
      <TableCell>
        <span className={cn("font-medium", solved && "text-muted-foreground line-through decoration-white/30")}>{p.name}</span>
        <span className="mt-1 flex flex-wrap gap-2.5 text-[11.5px] text-muted-foreground">
          {p.companies.map((c) => (
            <span key={c} className="inline-flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny favicons from a fixed list */}
              {COMPANY_LOGO[c] ? <img src={COMPANY_LOGO[c]} alt="" width={12} height={12} className="size-3 rounded-[2px]" /> : null}
              {c}
            </span>
          ))}
        </span>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">{p.topic}</TableCell>
      <TableCell className={DIFFICULTY_TONE[p.difficulty]}>{p.difficulty}</TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className="flex gap-1" aria-label={`Asked ${["rarely", "sometimes", "often"][p.frequency - 1]}`} title={`Asked ${["rarely", "sometimes", "often"][p.frequency - 1]}`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={cn("size-1.5 rounded-full", n <= p.frequency ? "bg-white/70" : "bg-white/15")} />
          ))}
        </span>
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-0.5">
          {codingSlug ? (
            <Link href={`/dashboard/coding/${codingSlug}`} className={cn(link, "text-[#bec8ff] hover:text-[#cfd6ff]")}>
              <Code2 className="size-3.5" /> Solve
            </Link>
          ) : null}
          <a href={p.leetcode} target="_blank" rel="noreferrer" className={link}>
            LeetCode <ExternalLink className="size-3" />
          </a>
          <a href={p.gfg} target="_blank" rel="noreferrer" className={cn(link, "hidden lg:inline-flex")}>
            GfG <ExternalLink className="size-3" />
          </a>
          <Popover
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (o) setDraft(progress?.note ?? "");
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={progress?.note ? `Edit note on ${p.name}` : `Add a note to ${p.name}`} className={cn("size-7", progress?.note ? "text-[#bec8ff]" : "text-white/50")}>
                <NotebookPen className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent data-theme="dark" align="end" className="w-80 border-white/10">
              <p className="m-0 text-[13px] font-medium">Note on {p.name}</p>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} rows={5} placeholder="Approach, edge cases, what tripped you up…" className="mt-2 text-[13px]" />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onNote(draft.trim() || null);
                    setOpen(false);
                  }}
                >
                  Save note
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TableCell>
    </TableRow>
  );
}
