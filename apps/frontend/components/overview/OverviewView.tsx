"use client";

/**
 * Overview: headline numbers, readiness per role, score trend, answer skills and recent
 * interviews, with the profile column on the right. Tabs switch to the full interview
 * list and the year of activity.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Flame, Mic, RefreshCw } from "lucide-react";
import { EmptyState, panel } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "@/hooks/useAccount";
import { ApiError, signInHref } from "@/lib/api";
import { getInsights, type Insights } from "@/lib/insights";
import { listSessions, type SessionSummary } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { Card, Chip } from "./parts";
import { ProfilePanel } from "./ProfilePanel";
import { ReadinessStrip } from "./Readiness";
import { RecentInterviews } from "./RecentInterviews";
import { ScoreTrend } from "./ScoreTrend";
import { SkillBars } from "./SkillBars";
import { StatCards } from "./StatCards";

const greeting = (hour: number) => (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

export function OverviewView() {
  const router = useRouter();
  const { account } = useAccount();
  const [data, setData] = useState<{ insights: Insights; sessions: SessionSummary[]; at: number } | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [hello, setHello] = useState("Overview");

  const load = useCallback(
    async (fresh: boolean) => {
      try {
        // both requests go out together; the sidebar shares the insights one
        const [insights, sessions] = await Promise.all([getInsights({ fresh }), listSessions()]);
        setData({ insights, sessions, at: Date.now() });
        setError("");
      } catch (err) {
        if (err instanceof ApiError && err.kind === "auth") router.replace(signInHref("/dashboard"));
        else setError(err instanceof ApiError ? err.message : "Couldn't load your overview.");
      }
    },
    [router],
  );

  useEffect(() => {
    if (!account?.signedIn) return;
    const first = account.name.split(/\s+/)[0];
    setHello(`${greeting(new Date().getHours())}${first ? `, ${first}` : ""}`);
    void load(false);
  }, [account, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  if (account && !account.signedIn) {
    return (
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className={panel}>
          <EmptyState title="Sign in to see your progress" body="Your interviews, practice and streaks show up here once you're signed in.">
            <Button asChild>
              <Link href={signInHref("/dashboard")}>Sign in</Link>
            </Button>
          </EmptyState>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Tabs defaultValue="summary" className="gap-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="m-0 text-[24px] font-semibold leading-[1.2] tracking-[-0.035em] text-white">{hello}</h1>
            <p className="m-0 mt-1 text-[13.5px] text-white/45">Where you stand across interviews and practice, and what to work on next.</p>
          </div>
          <div className="flex items-center gap-2">
            {data ? (
              <Chip>
                <Clock className="size-3.5" /> Updated {new Date(data.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </Chip>
            ) : null}
            <Button variant="outline" size="icon-sm" className="size-7 border-white/[0.08] bg-white/[0.02]" aria-label="Refresh" onClick={refresh} disabled={!data || refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <TabsList variant="line" className="mt-4 h-auto w-full justify-start gap-4 rounded-none border-b border-white/[0.06] p-0">
          {[
            ["summary", "Summary"],
            ["interviews", "Interviews"],
            ["activity", "Activity"],
          ].map(([v = "", label]) => (
            <TabsTrigger key={v} value={v} className="h-10 flex-none rounded-none px-0.5 text-[13.5px] after:!bottom-[-1px] data-[state=active]:text-white">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {error ? (
          <div className={cn(panel, "mt-6")}>
            <EmptyState title="Your overview didn't load" body={error}>
              <Button variant="outline" onClick={() => void load(true)}>
                Try again
              </Button>
            </EmptyState>
          </div>
        ) : !data ? (
          <div aria-busy="true" className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[124px] rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
              <Skeleton className="h-[120px] rounded-2xl bg-white/[0.04]" />
              <Skeleton className="h-[300px] rounded-2xl bg-white/[0.04]" />
            </div>
            <Skeleton className="h-[520px] rounded-2xl bg-white/[0.04]" />
          </div>
        ) : (
          <>
            <TabsContent value="summary" className="mt-6">
              <Summary insights={data.insights} sessions={data.sessions} account={account} />
            </TabsContent>
            <TabsContent value="interviews" className="mt-6">
              <RecentInterviews sessions={data.sessions} limit={50} />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
              <Activity insights={data.insights} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </main>
  );
}

function Summary({ insights, sessions, account }: { insights: Insights; sessions: SessionSummary[]; account: ReturnType<typeof useAccount>["account"] }) {
  const { trend, rubric } = insights;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-w-0 content-start gap-4">
        <StatCards insights={insights} />
        <ReadinessStrip readiness={insights.readiness} delay={0.08} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card delay={0.12} title="Score trend" hint="Overall score of each report, oldest to newest." aside={trend.length > 1 ? <Chip>Last {trend.length} reports</Chip> : null}>
            {trend.length >= 2 ? (
              <div className="px-2 pb-3">
                <ScoreTrend trend={trend} />
              </div>
            ) : (
              <EmptyState
                className="py-12"
                title={trend.length === 1 ? `First report: ${trend[0]!.score}/100` : "No reports yet"}
                body={trend.length === 1 ? "Take another interview to see your trend." : "Finish an interview and open its report to start your trend."}
              />
            )}
          </Card>

          <Card delay={0.16} title="Answer skills" hint="Average rubric score, out of 10, across your recent evaluated answers." aside={rubric ? <Chip>{rubric.answers} answers</Chip> : null}>
            {rubric ? <SkillBars rubric={rubric} /> : <EmptyState className="py-12" title="Nothing scored yet" body="Your four answer skills show here after your first report." />}
          </Card>
        </div>

        <RecentInterviews sessions={sessions} delay={0.2} />
      </div>

      <ProfilePanel account={account} insights={insights} />
    </div>
  );
}

function Activity({ insights }: { insights: Insights }) {
  const total = insights.activity.reduce((s, a) => s + a.count, 0);
  const activeDays = insights.activity.filter((a) => a.count > 0).length;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Practice actions this year", value: total },
          { label: "Days you practised", value: activeDays },
          { label: "Current streak", value: `${insights.stats.currentStreak} ${insights.stats.currentStreak === 1 ? "day" : "days"}`, icon: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-card px-4 py-3.5">
            <div className="text-[12.5px] text-white/45">{s.label}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[24px] font-semibold tracking-[-0.04em] text-white">
              {s.icon ? <Flame className="size-5 text-[#fbbf24]" /> : null}
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <Card title="Activity" hint="Interviews and code submissions per day, for the past year." aside={<Chip>Last 12 months</Chip>}>
        <div className="px-5 pb-5">
          <ActivityHeatmap activity={insights.activity} />
        </div>
      </Card>
      <div className="flex justify-center">
        <Button asChild>
          <Link href="/dashboard/ai-interview">
            <Mic /> Practise today
          </Link>
        </Button>
      </div>
    </div>
  );
}
