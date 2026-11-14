"use client";

/**
 * Interview history: every session with its score, filterable by role. A score trend
 * is drawn only within one role, since scores across different roles aren't comparable:
 * the selected role, or with "All roles" the most recent role that has two reports.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { serif } from "@/lib/fonts";
import { formatDate, listSessions, roleTitle, ReportApiError, type SessionSummary } from "@/lib/interview/report";
import { PageShell, ScoreChip, StateMessage, TopBar, card, ease, primaryBtn, reveal, useReducedMotionFlag } from "./ui";

const italic = { fontStyle: "italic" } as const;

export function HistoryView() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotionFlag();
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<ReportApiError | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listSessions()
      .then((s) => alive && setSessions(s))
      .catch((err: unknown) => {
        if (!alive) return;
        const e = err instanceof ReportApiError ? err : new ReportApiError("server", "Couldn't load your interviews.");
        if (e.kind === "auth") router.replace(`/auth/signin?next=${encodeURIComponent("/dashboard/ai-interview/feedback")}`);
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
  const shown = (sessions ?? []).filter((s) => all || s.role === role);
  const reportsFor = (r: string) => (sessions ?? []).filter((s) => s.role === r && s.overallScore !== null).length;
  // sessions are newest first, so this is the latest role with a trend to show
  const trendRole = all ? ((sessions ?? []).find((s) => reportsFor(s.role) >= 2)?.role ?? null) : role;

  return (
    <PageShell>
      <TopBar active="history" />
      {error ? (
        <StateMessage title="Couldn't load your interviews" body={error.message}>
          <button type="button" onClick={() => location.reload()} className={primaryBtn}>
            Try again
          </button>
        </StateMessage>
      ) : !sessions ? (
        <div aria-busy="true" aria-label="Loading your interviews" className="grid gap-2 pt-16">
          {[0, 1, 2].map((i) => (
            <i key={i} className="block h-[68px] animate-pulse rounded-[20px] bg-[#0d0d0f] motion-reduce:animate-none" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <StateMessage title="No interviews yet" body="Your interviews and their reports will appear here once you've done one.">
          <Link href="/dashboard/ai-interview" className={primaryBtn}>
            Start an interview
          </Link>
        </StateMessage>
      ) : (
        <>
          <motion.h1 {...reveal(reduce)} className="m-0 mb-5 mt-2 text-[34px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[40px]">
            Past{" "}
            <em className={`${serif.className} font-normal tracking-normal`} style={italic}>
              interviews
            </em>
          </motion.h1>

          {roles.length > 1 && (
            <motion.div {...reveal(reduce, 0.05)} role="group" aria-label="Filter by role" className="mb-4 flex flex-wrap gap-2">
              {["all", ...roles].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={`h-8 cursor-pointer rounded-full px-3.5 text-[13px] transition-colors ${
                    role === r ? "bg-[#f0f0f0] text-[#0a0a0a]" : "text-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:text-[#f0f0f0]"
                  }`}
                >
                  {r === "all" ? "All roles" : roleTitle(r)}
                </button>
              ))}
            </motion.div>
          )}

          {trendRole && <Trend sessions={sessions.filter((s) => s.role === trendRole)} role={trendRole} reduce={reduce} />}

          <motion.ul {...reveal(reduce, 0.12)} className={`${card} m-0 list-none p-0`}>
            {shown.map((s) => (
              <li key={s.id} className="border-t border-white/6 first:border-t-0">
                <Row s={s} />
              </li>
            ))}
          </motion.ul>
        </>
      )}
    </PageShell>
  );
}

function Row({ s }: { s: SessionSummary }) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] tracking-[-0.02em]">{roleTitle(s.role)}</div>
        <div className="mt-[3px] text-[12.5px] text-white/42">
          {formatDate(s.createdAt)} · <span className="capitalize">{s.difficulty}</span> · {s.answered}/{s.totalQuestions} answered
        </div>
      </div>
      {s.overallScore !== null ? (
        <ScoreChip value={s.overallScore} outOf={100} />
      ) : s.answered > 0 ? (
        <span className="shrink-0 text-[13px] text-[#bec8ff]">Get report →</span>
      ) : (
        <span className="shrink-0 text-[12.5px] text-white/40">No answers</span>
      )}
    </>
  );
  const cls = "flex items-center gap-4 px-5 py-[18px]";
  return s.answered > 0 ? (
    <Link href={`/dashboard/ai-interview/report/${s.id}`} className={`${cls} transition-colors hover:bg-white/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#bec8ff]/60`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Trend({ sessions, role, reduce }: { sessions: SessionSummary[]; role: string; reduce: boolean }) {
  const pts = sessions
    .filter((s) => s.overallScore !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-10);

  if (pts.length < 2) {
    return (
      <p className="mb-4 mt-0 text-[13.5px] text-white/50">
        Do another {roleTitle(role)} interview to see your score trend.
      </p>
    );
  }

  const W = 700, H = 150, padX = 28, padY = 26;
  const xs = pts.map((_, i) => padX + (i * (W - padX * 2)) / (pts.length - 1));
  const ys = pts.map((p) => H - padY - ((p.overallScore ?? 0) / 100) * (H - padY * 2));
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i]!.toFixed(1)}`).join(" ");
  const first = pts[0]!.overallScore!, last = pts.at(-1)!.overallScore!;

  return (
    <motion.figure {...reveal(reduce, 0.08)} className={`${card} m-0 mb-4 p-5`}>
      <figcaption className="mb-2 flex flex-wrap justify-between gap-2 text-[13px] text-white/50">
        <span>{roleTitle(role)} · last {pts.length} reports</span>
        <span className={last > first ? "text-[#9fe0b7]" : "text-white/50"}>
          {last > first ? `Up ${last - first} points` : last < first ? `Down ${first - last} points` : "No change"} since the first
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full overflow-visible" role="img" aria-label={`Scores: ${pts.map((p) => p.overallScore).join(", ")}`}>
        <motion.path
          d={d}
          fill="none"
          stroke="#bec8ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease }}
        />
        {pts.map((p, i) => (
          <g key={p.id}>
            <circle cx={xs[i]} cy={ys[i]} r="5" fill="#0a0a0a" stroke="#bec8ff" strokeWidth="2" />
            <text x={xs[i]} y={ys[i]! - 13} fill="#f0f0f0" fontSize="13" textAnchor="middle">
              {p.overallScore}
            </text>
          </g>
        ))}
      </svg>
    </motion.figure>
  );
}
