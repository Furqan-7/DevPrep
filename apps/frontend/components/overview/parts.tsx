"use client";

/** Small building blocks shared by the overview cards. */

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const ease = [0.16, 1, 0.3, 1] as const;

export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="More info" className="grid size-4 cursor-help place-items-center rounded-full text-white/30 transition-colors hover:text-white/70">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] border-white/10 leading-[1.45]">{children}</TooltipContent>
    </Tooltip>
  );
}

/** Bordered dashboard card with an optional header row. */
export function Card({
  title,
  hint,
  aside,
  children,
  className,
  bodyClassName,
  delay = 0,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className={cn("flex min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]", className)}
    >
      {title ? (
        <header className="flex min-h-[52px] items-center justify-between gap-3 px-5 pt-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="m-0 truncate text-[14px] font-semibold tracking-[-0.015em] text-white">{title}</h2>
            {hint ? <InfoTip>{hint}</InfoTip> : null}
          </div>
          {aside ? <div className="flex shrink-0 items-center gap-2 text-[12.5px] text-muted-foreground">{aside}</div> : null}
        </header>
      ) : null}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </motion.section>
  );
}

/** Pill-shaped chip for card headers ("Last 10 reports"). */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 text-[12px] font-medium text-white/60", className)}>{children}</span>;
}

/** Circular progress ring with a value in the middle. */
export function Ring({ value, size = 36, stroke = 3.5, color = "#4d7cff", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(100, value)) / 100) }}
          transition={{ duration: 1.2, ease }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums text-white">{children}</span>
    </span>
  );
}

/** Colour for a score out of 100: green when strong, amber in the middle, red when weak. */
export const scoreColor = (score: number) => (score >= 80 ? "#34d399" : score >= 60 ? "#4d7cff" : score >= 40 ? "#fbbf24" : "#f87171");
