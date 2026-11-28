"use client";

/**
 * The four answer skills as vertical bars over a striped track, with a dashed target
 * line. The weakest skill is highlighted, since it's the one to work on next.
 */

import { motion } from "motion/react";
import type { Insights } from "@/lib/insights";
import type { Rubric } from "@/lib/interview/report";
import { ease } from "@/components/app/kit";

export const RUBRIC: { key: keyof Rubric; label: string; short: string; advice: string }[] = [
  { key: "relevance", label: "Answering the question", short: "Answering", advice: "Restate the question in a line, then answer it first before adding context." },
  { key: "depth", label: "Technical depth", short: "Depth", advice: "Go one level deeper: explain why it works and what the trade-offs are, not just what it is." },
  { key: "clarity", label: "Clarity", short: "Clarity", advice: "Structure each answer as a short answer, then the explanation, then an example." },
  { key: "evidence", label: "Concrete examples", short: "Examples", advice: "Back each claim with a specific project, number or incident from your own work." },
];

const TARGET = 8;
const COLORS = ["#22c55e", "#4d7cff", "#a78bfa", "#2dd4bf"];

export function weakestSkill(rubric: Rubric) {
  return [...RUBRIC].sort((a, b) => rubric[a.key] - rubric[b.key])[0]!;
}

export function SkillBars({ rubric }: { rubric: NonNullable<Insights["rubric"]> }) {
  const weakest = weakestSkill(rubric);
  const strongest = [...RUBRIC].sort((a, b) => rubric[b.key] - rubric[a.key])[0]!;

  return (
    <div className="px-5 pb-5">
      <div className="relative h-[200px]">
        {/* target line */}
        <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-white/25" style={{ bottom: `${TARGET * 10}%` }}>
          <span className="absolute -top-[18px] right-0 rounded bg-[#111113] px-1 text-[10.5px] text-white/45">Target {TARGET}</span>
        </div>
        <div className="grid h-full grid-cols-4 gap-3">
          {RUBRIC.map((r, i) => {
            const v = rubric[r.key];
            const isWeak = r.key === weakest.key;
            const color = isWeak ? "#f59e0b" : COLORS[i]!;
            return (
              <div key={r.key} className="fx-stripes relative flex items-end overflow-visible rounded-xl bg-white/[0.015]">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${v * 10}%` }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.08, ease }}
                  className="relative w-full rounded-xl"
                  style={{ background: `linear-gradient(180deg, ${color}, ${color}cc)`, boxShadow: `0 10px 30px -12px ${color}` }}
                >
                  <span className="absolute bottom-2 left-2.5 text-[12px] font-semibold tabular-nums text-black/80">{v}</span>
                  {r.key === strongest.key && !isWeak ? (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-black shadow-lg">Best</span>
                  ) : null}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {RUBRIC.map((r) => (
          <span key={r.key} className={`truncate text-center text-[11.5px] ${r.key === weakest.key ? "font-medium text-[#fcd34d]" : "text-white/45"}`}>
            {r.short}
          </span>
        ))}
      </div>
    </div>
  );
}
