"use client";

/**
 * Reports: every interview session with its score, filterable by role and by whether it
 * has been scored. A score trend is drawn only within one role, since scores across
 * different roles aren't comparable: the selected role, or with "All roles" the most
 * recent role that has two reports.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight, FileChartColumn, Mic, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AppPage } from "@/components/app/AppPage";
import { Chip } from "@/components/app/kit";
import { roleColor } from "@/components/dashboard/nav";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, levelLabel, listSessions, roleTitle, ReportApiError, type SessionSummary } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { ScoreChip, StateMessage, card, primaryBtn, reveal, useReducedMotionFlag } from "./ui";

type Status = "all" | "scored" | "open";

export function HistoryView() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotionFlag();
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<ReportApiError | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("all");

  useEffect(() => {
    let alive = true;
    listSessions()
      .then((s) => alive && setSessions(s))
      .catch((err: unknown) => {
        if (!alive) return;
        const e = err instanceof ReportApiError ? err : new ReportApiError("server", "Couldn't load your interviews.");
        if (e.kind === "auth") router.replace(`/auth/signin?next=${encodeURIComponent("/dashboard/reports")}`);
        else setError(e);
      });
    return () => {
      alive = false;
    };
  }, [router]);

  const roles = useMemo(() => [...new Set((sessions ?? []).map((s) => s.role))], [sessions]);

  // default filter: ?role= if it matches one of your roles, else every interview
  useEffect(() => {
    if (!sessions || role !== null) return;
    const wanted = params.get("role");
    setRole(wanted && roles.includes(wanted) ? wanted : "all");
  }, [sessions, roles, params, role]);

  const all = role === "all" || role === null;
  const byRole = (sessions ?? []).filter((s) => all || s.role === role);
  const shown = byRole.filter((s) => (status === "all" ? true : status === "scored" ? s.overallScore !== null : s.overallScore === null));
  const reportsFor = (r: string) => (sessions ?? []).filter((s) => s.role === r && s.overallScore !== null).length;
  // sessions are newest first, so this is the latest role with a trend to show
  const trendRole = all ? ((sessions ?? []).find((s) => reportsFor(s.role) >= 2)?.role ?? null) : role;

  const scores = byRole.filter((s) => s.overallScore !== null).map((s) => s.overallScore!);
  const stats = [
    { label: "Interviews", value: byRole.length },
    { label: "Scored", value: scores.length },
    { label: "Average", value: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null },
    { label: "Best", value: scores.length ? Math.max(...scores) : null },
  ];

  return (
    <AppPage
      icon={FileChartColumn}
      title="Reports"
      description="Every interview you've done, its score, and how you're trending per role."
      actions={
        <Button asChild size="sm" className="h-8 font-semibold">
          <Link href="/dashboard/ai-interview">
            <Mic /> New interview
          </Link>
        </Button>
      }
    >
      {error ? (
        <StateMessage title="Couldn't load your interviews" body={error.message}>
          <button type="button" onClick={() => location.reload()} className={primaryBtn}>
            Try again
          </button>
        </StateMessage>
      ) : !sessions ? (
        <div aria-busy="true" aria-label="Loading your interviews" className="grid gap-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[84px] rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
          <Skeleton className="h-[240px] rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-[320px] rounded-2xl bg-white/[0.04]" />
        </div>
      ) : sessions.length === 0 ? (
        <StateMessage icon={<FileChartColumn className="size-5" />} title="No interviews yet" body="Your interviews and their reports will appear here once you've done one.">
          <Link href="/dashboard/ai-interview" className={primaryBtn}>
            <Mic /> Start an interview
          </Link>
        </StateMessage>
      ) : (
        <div className="grid gap-4">
          <motion.dl {...reveal(reduce)} className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={cn(card, "flex flex-col-reverse px-4 py-3.5")}>
                <dt className="text-[12.5px] text-white/45">{s.label}</dt>
                <dd className="m-0 text-[26px] font-semibold tracking-[-0.04em] tabular-nums text-white">{s.value ?? <span className="text-white/30">—</span>}</dd>
              </div>
            ))}
          </motion.dl>

          {roles.length > 1 && (
            <motion.div {...reveal(reduce, 0.04)} role="group" aria-label="Filter by role" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {["all", ...roles].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors",
                    role === r ? "bg-white text-black" : "border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white",
                  )}
                >
                  {r !== "all" && <span className="size-1.5 rounded-full" style={{ background: roleColor(r) }} />}
                  {r === "all" ? "All roles" : roleTitle(r)}
                </button>
              ))}
            </motion.div>
          )}

          {trendRole && <Trend sessions={sessions.filter((s) => s.role === trendRole)} role={trendRole} reduce={reduce} />}

          <motion.section {...reveal(reduce, 0.1)} className={cn(card, "overflow-hidden")}>
            <header className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 px-5 py-2">
              <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em]">{all ? "All interviews" : `${roleTitle(role!)} interviews`}</h2>
              <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
                <TabsList className="h-7 bg-white/[0.04] p-0.5">
                  <TabsTrigger value="all" className="h-6 px-2 text-[12px]">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="scored" className="h-6 px-2 text-[12px]">
                    Scored
                  </TabsTrigger>
                  <TabsTrigger value="open" className="h-6 px-2 text-[12px]">
                    Unscored
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </header>
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_90px_20px] gap-4 border-y border-white/[0.05] bg-white/[0.015] px-5 py-2 text-[11.5px] font-medium text-white/35 md:grid">
              <span>Interview</span>
              <span>Date</span>
              <span>Answered</span>
              <span className="text-right">Score</span>
              <span />
            </div>
            {shown.length ? (
              <ul className="m-0 list-none divide-y divide-white/[0.05] p-0">
                {shown.map((s) => (
                  <li key={s.id}>
                    <Row s={s} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 border-t border-white/[0.05] px-5 py-10 text-center text-[13.5px] text-white/45">No interviews match this filter.</p>
            )}
          </motion.section>
        </div>
      )}
    </AppPage>
  );
}

function Row({ s }: { s: SessionSummary }) {
  const title = roleTitle(s.role);
  const pct = s.totalQuestions ? Math.min(100, (s.answered / s.totalQuestions) * 100) : 0;
  const body = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl text-[12px] font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${roleColor(s.role)}, ${roleColor(s.role)}80)` }}
        >
          {title
            .split(/[\s/&]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-white">{title}</div>
          <div className="mt-0.5 truncate text-[12px] text-white/40">
            {levelLabel(s.difficulty)}
            <span className="md:hidden"> · {formatDate(s.createdAt)}</span>
          </div>
        </div>
      </div>
      <span className="hidden text-[12.5px] text-white/55 md:block">{formatDate(s.createdAt)}</span>
      <span className="hidden items-center gap-2 md:flex">
        <span className="h-1 w-14 overflow-hidden rounded-full bg-white/[0.07]">
          <span className="block h-full rounded-full bg-white/50" style={{ width: `${pct}%` }} />
        </span>
        <span className="text-[12px] tabular-nums text-white/50">
          {s.answered}/{s.totalQuestions}
        </span>
      </span>
      <span className="flex justify-end">
        {s.overallScore !== null ? (
          <ScoreChip value={s.overallScore} outOf={100} />
        ) : s.answered > 0 ? (
          <span className="whitespace-nowrap rounded-lg bg-[#4d7cff]/12 px-2 py-1 text-[12px] font-medium text-[#a5b8ff]">Get report</span>
        ) : (
          <span className="text-[12px] text-white/35">No answers</span>
        )}
      </span>
      <ArrowUpRight className={cn("hidden size-4 md:block", s.answered > 0 ? "text-white/25 group-hover:text-white" : "text-transparent")} />
    </>
  );
  const cls = "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 md:grid-cols-[minmax(0,1fr)_150px_120px_90px_20px]";
  return s.answered > 0 ? (
    <Link href={`/dashboard/reports/${s.id}`} className={cn(cls, "transition-colors hover:bg-white/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const trendConfig = { score: { label: "Score", color: "#4d7cff" } } satisfies ChartConfig;

function Trend({ sessions, role, reduce }: { sessions: SessionSummary[]; role: string; reduce: boolean }) {
  const pts = sessions
    .filter((s) => s.overallScore !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-10);

  if (pts.length < 2) {
    return (
      <motion.p {...reveal(reduce, 0.06)} className={cn(card, "m-0 px-5 py-4 text-[13.5px] text-white/50")}>
        Do another {roleTitle(role)} interview to see your score trend.
      </motion.p>
    );
  }

  const first = pts[0]!.overallScore!;
  const last = pts.at(-1)!.overallScore!;
  const data = pts.map((p, i) => ({ i, score: p.overallScore!, label: new Date(p.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) }));
  const up = last > first;

  return (
    <motion.figure {...reveal(reduce, 0.06)} className={cn(card, "m-0")}>
      <figcaption className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 px-5 pt-1">
        <span className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.015em] text-white">
          <span className="size-2 rounded-full" style={{ background: roleColor(role) }} />
          {roleTitle(role)} trend
          <span className="text-[12.5px] font-normal text-white/40">· last {pts.length} reports</span>
        </span>
        <Chip className={up ? "text-[#6ee7b7]" : last < first ? "text-[#fca5a5]" : undefined}>
          {up ? <TrendingUp className="size-3.5" /> : last < first ? <TrendingDown className="size-3.5" /> : null}
          {up ? `Up ${last - first} points` : last < first ? `Down ${first - last} points` : "No change"} since the first
        </Chip>
      </figcaption>
      <div className="px-2 pb-3">
        <ChartContainer config={trendConfig} className="aspect-auto h-[200px] w-full">
          <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="history-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4d7cff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4d7cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" />
            <XAxis dataKey="i" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickFormatter={(i: number) => data[i]?.label ?? ""} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
            <ChartTooltip cursor={{ stroke: "rgba(255,255,255,0.15)" }} content={<ChartTooltipContent labelFormatter={(_, p) => (p[0] ? String(p[0].payload.label) : "")} />} />
            <Area
              dataKey="score"
              type="monotone"
              stroke="var(--color-score)"
              strokeWidth={2}
              fill="url(#history-fill)"
              isAnimationActive={!reduce}
              animationDuration={1200}
              animationEasing="ease-out"
              dot={{ r: 3, fill: "#0f0f11", stroke: "var(--color-score)", strokeWidth: 2 }}
              activeDot={{ r: 4.5, fill: "#fff", stroke: "var(--color-score)" }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </motion.figure>
  );
}

