"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { roleTitle } from "@/lib/interview/report";
import type { Insights } from "@/lib/insights";

const config = { score: { label: "Score", color: "#4d7cff" } } satisfies ChartConfig;

/** Overall report scores over the last interviews, oldest to newest. */
export function ScoreTrend({ trend }: { trend: Insights["trend"] }) {
  const data = trend.map((t, i) => ({
    i,
    score: t.score,
    role: roleTitle(t.role),
    label: new Date(t.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
  }));
  return (
    <ChartContainer config={config} className="aspect-auto h-[230px] w-full">
      <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -22 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d7cff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4d7cff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" />
        <XAxis dataKey="i" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickFormatter={(i: number) => data[i]?.label ?? ""} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
        <ChartTooltip cursor={{ stroke: "rgba(255,255,255,0.15)" }} content={<ChartTooltipContent labelFormatter={(_, p) => (p[0] ? `${p[0].payload.role} · ${p[0].payload.label}` : "")} />} />
        <Area
          dataKey="score"
          type="monotone"
          stroke="var(--color-score)"
          strokeWidth={2}
          fill="url(#trend-fill)"
          dot={{ r: 2.5, fill: "#0f0f11", stroke: "var(--color-score)", strokeWidth: 2 }}
          activeDot={{ r: 4, fill: "#fff", stroke: "var(--color-score)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
