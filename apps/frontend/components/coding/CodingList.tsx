"use client";

/** Coding round problem list, with the signed-in user's status and best review score on each. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, CircleCheck, CircleDashed, CircleDot, Code } from "lucide-react";
import { AppPage, EmptyState, panel } from "@/components/app/AppPage";
import { Ring, ease } from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import { DIFFICULTY_CHIP, listCodingProblems, listSubmissions, type CodingProblem, type Submission } from "@/lib/practice";
import { cn } from "@/lib/utils";

const LEVELS = ["All", "Easy", "Medium", "Hard"] as const;
type Level = (typeof LEVELS)[number];

export function CodingList() {
  const [problems, setProblems] = useState<CodingProblem[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");
  const [level, setLevel] = useState<Level>("All");

  useEffect(() => {
    let alive = true;
    listCodingProblems()
      .then((p) => alive && setProblems(p))
      .catch((err: unknown) => alive && setError(err instanceof ApiError ? err.message : "Couldn't load the problems."));
    if (localStorage.getItem("token")) {
      listSubmissions()
        .then((s) => alive && setSubmissions(s))
        .catch(() => {}); // statuses are optional; the list works without them
    }
    return () => {
      alive = false;
    };
  }, []);

  const status = useMemo(() => {
    const map = new Map<string, { solved: boolean; best: number }>();
    for (const s of submissions) {
      const prev = map.get(s.problem);
      map.set(s.problem, { solved: (prev?.solved ?? false) || s.passed === s.total, best: Math.max(prev?.best ?? 0, s.score) });
    }
    return map;
  }, [submissions]);

  const all = problems ?? [];
  const solved = all.filter((p) => status.get(p.slug)?.solved).length;
  const attempted = all.filter((p) => status.has(p.slug) && !status.get(p.slug)!.solved).length;
  const byLevel = (l: CodingProblem["difficulty"]) => {
    const list = all.filter((p) => p.difficulty === l);
    return { total: list.length, solved: list.filter((p) => status.get(p.slug)?.solved).length };
  };
  const shown = all.filter((p) => level === "All" || p.difficulty === level);

  return (
    <AppPage
      icon={Code}
      title="Coding round"
      description="Solve interview problems in JavaScript, run the tests in your browser, then get your code reviewed like a real interviewer would."
    >
      {error ? (
        <div className={panel}>
          <EmptyState title="The problems didn't load" body={error}>
            <Button variant="outline" onClick={() => location.reload()}>
              Try again
            </Button>
          </EmptyState>
        </div>
      ) : !problems ? (
        <div className="grid gap-3">
          <Skeleton className="h-[96px] rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-[420px] rounded-2xl bg-white/[0.04]" />
        </div>
      ) : (
        <div className="grid gap-4">
          {/* progress */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
            <div className={cn(panel, "flex items-center gap-4 p-4")}>
              <Ring value={all.length ? (solved / all.length) * 100 : 0} size={56} stroke={5} color="#34d399">
                <span className="text-[13px]">{solved}</span>
              </Ring>
              <div>
                <div className="text-[12.5px] text-white/45">Solved</div>
                <div className="text-[20px] font-semibold tracking-[-0.03em] text-white">
                  {solved}
                  <span className="text-[14px] font-medium text-white/35"> / {all.length}</span>
                </div>
                <div className="text-[12px] text-white/40">{attempted ? `${attempted} in progress` : "All tests passing"}</div>
              </div>
            </div>
            {(["Easy", "Medium", "Hard"] as const).map((l) => {
              const { total, solved: done } = byLevel(l);
              return (
                <div key={l} className={cn(panel, "p-4")}>
                  <div className="flex items-center justify-between">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset", DIFFICULTY_CHIP[l])}>{l}</span>
                    <span className="text-[12px] tabular-nums text-white/40">
                      {done}/{total}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className={cn("h-full rounded-full", l === "Easy" ? "bg-[#34d399]" : l === "Medium" ? "bg-[#fbbf24]" : "bg-[#f87171]")}
                      initial={{ width: 0 }}
                      animate={{ width: total ? `${(done / total) * 100}%` : "0%" }}
                      transition={{ duration: 0.9, ease }}
                    />
                  </div>
                </div>
              );
            })}
          </motion.section>

          {/* problems */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06, ease }} className={cn(panel, "overflow-hidden")}>
            <header className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 px-5 py-2">
              <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em]">Problems</h2>
              <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
                <TabsList className="h-7 bg-white/[0.04] p-0.5">
                  {LEVELS.map((l) => (
                    <TabsTrigger key={l} value={l} className="h-6 px-2.5 text-[12px]">
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </header>
            <div className="hidden grid-cols-[28px_minmax(0,1fr)_180px_90px_100px_20px] gap-4 border-y border-white/[0.05] bg-white/[0.015] px-5 py-2 text-[11.5px] font-medium text-white/35 md:grid">
              <span />
              <span>Problem</span>
              <span>Topic</span>
              <span>Difficulty</span>
              <span className="text-right">Best review</span>
              <span />
            </div>
            <ul className="m-0 list-none divide-y divide-white/[0.05] p-0">
              {shown.map((p, i) => {
                const s = status.get(p.slug);
                const Icon = s?.solved ? CircleCheck : s ? CircleDot : CircleDashed;
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/dashboard/coding/${p.slug}`}
                      className="group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:grid-cols-[28px_minmax(0,1fr)_180px_90px_100px_20px]"
                    >
                      <Icon aria-label={s?.solved ? "Solved" : s ? "Attempted" : "Not started"} className={cn("size-[18px]", s?.solved ? "text-[#34d399]" : s ? "text-[#fbbf24]" : "text-white/20")} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium text-white">
                          <span className="mr-2 text-[12px] tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
                          {p.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-white/40 md:hidden">
                          {p.topic} · {p.difficulty}
                        </span>
                      </span>
                      <span className="hidden truncate text-[12.5px] text-white/55 md:block">{p.topic}</span>
                      <span className="hidden md:block">
                        <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset", DIFFICULTY_CHIP[p.difficulty])}>{p.difficulty}</span>
                      </span>
                      <span className="text-right text-[13px] font-semibold tabular-nums text-white/80">{s ? `${s.best}/10` : <span className="font-normal text-white/30">—</span>}</span>
                      <ArrowUpRight className="hidden size-4 text-white/20 transition-colors group-hover:text-white md:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        </div>
      )}
    </AppPage>
  );
}
