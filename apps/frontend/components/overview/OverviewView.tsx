"use client";

/**
 * Overview: headline numbers, score trend, what to practise next, the activity heatmap,
 * readiness per role and focus areas (weakest rubric dimension).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppPage, EmptyState, PanelTitle, panel } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSignedIn } from "@/hooks/useSignedIn";
import { ApiError, signInHref } from "@/lib/api";
import { getInsights, type Insights } from "@/lib/insights";
import { formatDate, roleTitle, type Rubric } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { ScoreTrend } from "./ScoreTrend";

const RUBRIC: { key: keyof Rubric; label: string; advice: string }[] = [
  { key: "relevance", label: "Answering the question", advice: "Restate the question in a line, then answer it first before adding context." },
  { key: "depth", label: "Technical depth", advice: "Go one level deeper: explain why it works and what the trade-offs are, not just what it is." },
  { key: "clarity", label: "Clarity", advice: "Structure each answer as a short answer, then the explanation, then an example." },
  { key: "evidence", label: "Concrete examples", advice: "Back each claim with a specific project, number or incident from your own work." },
];

const readinessLabel = (score: number) => (score >= 80 ? "Interview-ready" : score >= 60 ? "Getting close" : "Keep practising");

export function OverviewView() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    setName((localStorage.getItem("username") ?? "").split(/\s+/)[0] ?? "");
    let alive = true;
    getInsights()
      .then((i) => {
        if (alive) setInsights(i);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        if (err instanceof ApiError && err.kind === "auth") router.replace(signInHref("/dashboard"));
        else setError(err instanceof ApiError ? err.message : "Couldn't load your overview.");
      });
    return () => {
      alive = false;
    };
  }, [signedIn, router]);

  if (signedIn === false) {
    return (
      <AppPage>
        <EmptyState title="Sign in to see your progress" body="Your interviews, practice and streaks show up here once you're signed in.">
          <Button asChild>
            <Link href={signInHref("/dashboard")}>Sign in</Link>
          </Button>
        </EmptyState>
      </AppPage>
    );
  }

  return (
    <AppPage
      title={name ? `Welcome back, ${name}` : "Overview"}
      description="Where you stand across interviews and practice, and what to work on next."
      actions={
        <Button asChild>
          <Link href="/dashboard/ai-interview">
            Start an interview <ArrowRight />
          </Link>
        </Button>
      }
    >
      {error ? (
        <div className={panel}>
          <EmptyState title="Your overview didn't load" body={error}>
            <Button variant="outline" onClick={() => location.reload()}>
              Try again
            </Button>
          </EmptyState>
        </div>
      ) : !insights ? (
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-[104px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : (
        <Overview insights={insights} />
      )}
    </AppPage>
  );
}

function Overview({ insights }: { insights: Insights }) {
  const { stats, trend, nextSteps } = insights;
  const tiles = [
    { label: "Interviews reviewed", value: stats.interviews, sub: stats.averageScore !== null ? `${stats.averageScore}/100 average, last 5` : "No reports yet" },
    { label: "Coding problems solved", value: `${stats.codingSolved}/${stats.codingTotal}`, sub: "All tests passing in the coding round" },
    { label: "Current streak", value: `${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`, sub: `Longest ${stats.longestStreak} ${stats.longestStreak === 1 ? "day" : "days"}` },
    { label: "Roles practised", value: insights.readiness.length, sub: insights.readiness[0] ? `Latest: ${roleTitle(insights.readiness[0].role)}` : "Pick one to start" },
  ];

  return (
    // minmax(0, 1fr) lets wide content (the heatmap) scroll inside its panel instead of widening the page
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <dl className={cn(panel, "m-0 grid grid-cols-2 lg:grid-cols-4")}>
        {tiles.map((t, i) => (
          <div key={t.label} className={cn("px-5 py-4", i % 2 === 1 && "border-l border-white/[0.06]", i >= 2 && "border-t border-white/[0.06] lg:border-t-0", i === 2 && "lg:border-l")}>
            <dt className="text-[12.5px] text-muted-foreground">{t.label}</dt>
            <dd className="m-0 mt-1.5 text-[26px] font-medium tabular-nums tracking-[-0.03em]">{t.value}</dd>
            <dd className="m-0 mt-0.5 truncate text-[12.5px] text-muted-foreground">{t.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={panel}>
          <PanelTitle aside={trend.length > 1 ? `Last ${trend.length} reports` : undefined}>Score trend</PanelTitle>
          <div className="px-3 py-4">
            {trend.length >= 2 ? (
              <ScoreTrend trend={trend} />
            ) : (
              <EmptyState
                className="py-12"
                title={trend.length === 1 ? `First report: ${trend[0]!.score}/100` : "No reports yet"}
                body={trend.length === 1 ? "Take another interview to see your trend." : "Finish an interview and open its report to start your trend."}
              />
            )}
          </div>
        </section>

        <section className={panel}>
          <PanelTitle aside={nextSteps.sessionId ? <Link href={`/dashboard/reports/${nextSteps.sessionId}`} className="hover:text-foreground">Latest report</Link> : undefined}>
            Practise next
          </PanelTitle>
          {nextSteps.items.length ? (
            <ol className="m-0 list-none p-0">
              {nextSteps.items.map((item, i) => (
                <li key={item} className="flex gap-3 border-b border-white/[0.06] px-5 py-3.5 text-[13.5px] leading-[1.5] last:border-b-0">
                  <span className="pt-px text-[12px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState className="py-12" title="Nothing yet" body="Your report's top improvements appear here." />
          )}
        </section>
      </div>

      <section className={panel}>
        <PanelTitle aside="Interviews and code submissions">Activity</PanelTitle>
        <div className="px-5 py-4">
          <ActivityHeatmap activity={insights.activity} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        <Readiness readiness={insights.readiness} />
        <FocusAreas rubric={insights.rubric} />
      </div>
    </div>
  );
}

function Readiness({ readiness }: { readiness: Insights["readiness"] }) {
  return (
    <section className={panel}>
      <PanelTitle aside="Weighted toward your last 3 reports">Readiness by role</PanelTitle>
      {readiness.length ? (
        <ul className="m-0 list-none p-0">
          {readiness.map((r) => (
            <li key={r.role} className="border-b border-white/[0.06] px-5 py-3.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                <Link href={`/dashboard/ai-interview/${r.role}`} className="truncate font-medium hover:underline">
                  {roleTitle(r.role)}
                </Link>
                <span className="shrink-0 tabular-nums">{r.score}</span>
              </div>
              <Progress value={r.score} className="mt-2 h-1.5 bg-white/[0.06] [&>[data-slot=progress-indicator]]:bg-[#bec8ff]" aria-label={`${roleTitle(r.role)} readiness`} />
              <p className="m-0 mt-1.5 text-[12px] text-muted-foreground">
                {readinessLabel(r.score)} · {r.interviews} {r.interviews === 1 ? "report" : "reports"} · {formatDate(r.lastAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="py-12" title="No roles yet" body="Readiness is worked out from your interview reports for each role.">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/ai-interview">Choose a role</Link>
          </Button>
        </EmptyState>
      )}
    </section>
  );
}

function FocusAreas({ rubric }: { rubric: Insights["rubric"] }) {
  const weakest = rubric ? [...RUBRIC].sort((a, b) => rubric[a.key] - rubric[b.key])[0]! : null;

  return (
    <section className={panel}>
      <PanelTitle aside={rubric ? `${rubric.answers} recent answers` : undefined}>Focus areas</PanelTitle>
      <div className="px-5 py-4">
        {rubric && weakest ? (
          <>
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {RUBRIC.map((r) => (
                <li key={r.key} className="grid grid-cols-[150px_1fr_32px] items-center gap-3 text-[13px]">
                  <span className={cn(r.key === weakest.key ? "text-foreground" : "text-muted-foreground")}>{r.label}</span>
                  <Progress
                    value={rubric[r.key] * 10}
                    aria-label={r.label}
                    className={cn("h-1.5 bg-white/[0.06]", r.key === weakest.key ? "[&>[data-slot=progress-indicator]]:bg-[#ffc7a6]" : "[&>[data-slot=progress-indicator]]:bg-white/40")}
                  />
                  <span className="text-right tabular-nums">{rubric[r.key]}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-4 rounded-lg bg-white/[0.03] px-3.5 py-3 text-[13px] leading-[1.5] text-white/75">
              <span className="text-foreground">Work on {weakest.label.toLowerCase()}.</span> {weakest.advice}
            </p>
          </>
        ) : (
          <p className="m-0 text-[13px] text-muted-foreground">Your weakest answer skill shows here after your first report.</p>
        )}
      </div>
    </section>
  );
}
