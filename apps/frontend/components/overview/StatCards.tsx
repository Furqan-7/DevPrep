"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Code, FileChartColumn, Flame, Gauge, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import type { Insights } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { InfoTip, ease } from "@/components/app/kit";

const DAY_MS = 86_400_000;

interface Stat {
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  value: number | null;
  suffix?: string;
  foot: ReactNode;
}

function Delta({ value, unit }: { value: number; unit: string }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", up ? "text-[#34d399]" : "text-[#f87171]")}>
      <Icon className="size-3.5" />
      {up ? "+" : ""}
      {value} {unit}
    </span>
  );
}

export function StatCards({ insights }: { insights: Insights }) {
  const { stats, trend } = insights;
  const weekAgo = Date.now() - 7 * DAY_MS;
  const thisWeek = trend.filter((t) => new Date(t.date).getTime() >= weekAgo).length;
  const last = trend.at(-1)?.score;
  const prev = trend.at(-2)?.score;
  const codingPct = stats.codingTotal ? Math.round((stats.codingSolved / stats.codingTotal) * 100) : 0;

  const items: Stat[] = [
    {
      label: "Interviews",
      hint: "Interviews you finished and opened the report for (reviewed).",
      icon: FileChartColumn,
      tone: "text-[#8fb0ff] bg-[#4d7cff]/12",
      value: stats.interviews,
      foot: thisWeek ? <Delta value={thisWeek} unit="this week" /> : <span>None this week</span>,
    },
    {
      label: "Average score",
      hint: "Mean overall score of your last five reports, out of 100.",
      icon: Gauge,
      tone: "text-[#c4b5fd] bg-[#a78bfa]/12",
      value: stats.averageScore,
      suffix: "/100",
      foot: last !== undefined && prev !== undefined ? <Delta value={last - prev} unit="vs last report" /> : <span>Last 5 reports</span>,
    },
    {
      label: "Coding solved",
      hint: "Problems where your latest submission passed every test.",
      icon: Code,
      tone: "text-[#fdba74] bg-[#f59e0b]/12",
      value: stats.codingSolved,
      suffix: `/${stats.codingTotal}`,
      foot: (
        <span className="flex w-full items-center gap-2">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.span
              className="block h-full rounded-full bg-[#f59e0b]"
              initial={{ width: 0 }}
              animate={{ width: `${codingPct}%` }}
              transition={{ duration: 1, ease }}
            />
          </span>
          <span className="tabular-nums">{codingPct}%</span>
        </span>
      ),
    },
    {
      label: "Current streak",
      hint: "Days in a row with an interview or a code submission.",
      icon: Flame,
      tone: "text-[#fcd34d] bg-[#fbbf24]/12",
      value: stats.currentStreak,
      suffix: stats.currentStreak === 1 ? " day" : " days",
      foot: (
        <span>
          Longest {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.04 * i, ease }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-white/[0.12]"
        >
          <div className="flex items-center gap-2">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", s.tone)}>
              <s.icon className="size-3.5" />
            </span>
            <span className="truncate text-[13px] text-white/60">{s.label}</span>
            <span className="ml-auto">
              <InfoTip>{s.hint}</InfoTip>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            {s.value === null ? (
              <span className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-white/30">—</span>
            ) : (
              <AnimatedNumber value={s.value} className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums" />
            )}
            {s.suffix && s.value !== null ? <span className="text-[14px] font-medium text-white/35">{s.suffix}</span> : null}
          </div>
          <div className="mt-3 flex min-h-5 items-center text-[12.5px] text-white/45">{s.foot}</div>
        </motion.div>
      ))}
    </div>
  );
}
