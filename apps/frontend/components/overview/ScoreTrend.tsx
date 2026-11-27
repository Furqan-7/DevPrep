"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { roleTitle } from "@/lib/interview/report";
import type { Insights } from "@/lib/insights";

const config = { score: { label: "Score", color: "#bec8ff" } } satisfies ChartConfig;

/** Overall report scores over the last interviews, oldest to newest. */
export function ScoreTrend({ trend }: { trend: Insights["trend"] }) {
  const data = trend.map((t, i) => ({
    i,
    score: t.score,
    role: roleTitle(t.role),
    label: new Date(t.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
  }));
  return (
    <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="i" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(i: number) => data[i]?.label ?? ""} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={(_, p) => (p[0] ? `${p[0].payload.role} · ${p[0].payload.label}` : "")} />}
        />
        <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-score)" }} activeDot={{ r: 4 }} />
      </LineChart>
    </ChartContainer>
  );
}
