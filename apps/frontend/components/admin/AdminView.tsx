"use client";

/** Admin overview: usage totals, interviews per day, roles by popularity and the latest sessions. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ShieldCheck } from "lucide-react";
import { AppPage, EmptyState, PanelTitle, panel } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, signInHref } from "@/lib/api";
import { getAdminStats, type AdminStats } from "@/lib/insights";
import { formatDate, levelLabel, roleTitle } from "@/lib/interview/report";
import { cn } from "@/lib/utils";

const chartConfig = { count: { label: "Interviews", color: "#4d7cff" } } satisfies ChartConfig;
const headRow = "border-white/[0.06] hover:bg-transparent [&>th]:text-[12.5px] [&>th]:font-normal [&>th]:text-muted-foreground";

export function AdminView() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.kind === "auth") router.replace(signInHref("/dashboard/admin"));
        else setError(err instanceof ApiError ? err : new ApiError("server", "Couldn't load admin stats."));
      });
  }, [router]);

  if (error) {
    return (
      <AppPage>
        <EmptyState title={error.kind === "not_found" ? "Page not found" : "Admin stats didn't load"} body={error.kind === "not_found" ? undefined : error.message}>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </EmptyState>
      </AppPage>
    );
  }

  return (
    <AppPage icon={ShieldCheck} title="Admin" description="How DevPrep is being used.">
      {!stats ? (
        <div className="grid gap-4">
          <Skeleton className="h-[104px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      ) : (
        <Dashboard stats={stats} />
      )}
    </AppPage>
  );
}

function Dashboard({ stats }: { stats: AdminStats }) {
  const tiles = [
    ["Users", stats.totals.users],
    ["Active this week", stats.activeUsers.week],
    ["Active this month", stats.activeUsers.month],
    ["Interviews", stats.totals.interviews],
    ["Reports", stats.totals.reports],
    ["Code reviews", stats.totals.codingSubmissions],
    ["Applications", stats.totals.applications],
    ["Resumes", stats.totals.resumes],
  ] as const;
  const days = stats.interviewsPerDay.map((d) => ({ ...d, label: new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) }));

  return (
    <div className="grid gap-4">
      <dl className={cn(panel, "m-0 grid grid-cols-2 sm:grid-cols-4")}>
        {tiles.map(([label, value], i) => (
          <div key={label} className={cn("border-white/[0.06] px-5 py-4", i % 4 !== 0 && "sm:border-l", i % 2 === 1 && "border-l", i >= 2 && "border-t", i < 4 && "sm:border-t-0")}>
            <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
            <dd className="m-0 mt-1.5 text-[24px] font-semibold tabular-nums tracking-[-0.03em]">{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <section className={panel}>
        <PanelTitle aside="Last 30 days, UTC">Interviews per day</PanelTitle>
        <div className="px-3 py-4">
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={panel}>
          <PanelTitle>Roles</PanelTitle>
          <Table>
            <TableHeader>
              <TableRow className={headRow}>
                <TableHead className="pl-5">Role</TableHead>
                <TableHead className="text-right">Interviews</TableHead>
                <TableHead className="pr-5 text-right">Avg score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.roles.map((r) => (
                <TableRow key={r.role} className="border-white/[0.06]">
                  <TableCell className="pl-5">{roleTitle(r.role)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.interviews}</TableCell>
                  <TableCell className="pr-5 text-right tabular-nums text-muted-foreground">{r.averageScore ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className={panel}>
          <PanelTitle>Latest interviews</PanelTitle>
          <Table>
            <TableHeader>
              <TableRow className={headRow}>
                <TableHead className="pl-5">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="pr-5 text-right">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent.map((s) => (
                <TableRow key={s.id} className="border-white/[0.06]">
                  <TableCell className="max-w-[140px] truncate pl-5">{s.user}</TableCell>
                  <TableCell>
                    {roleTitle(s.role)}
                    <span className="block text-[12px] text-muted-foreground">{levelLabel(s.difficulty)}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.score ?? <span className="text-muted-foreground">{s.status}</span>}</TableCell>
                  <TableCell className="pr-5 text-right text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
