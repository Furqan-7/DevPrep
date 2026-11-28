"use client";

/**
 * Right-hand column of the overview: the user's card, overall readiness, what to
 * practise next from the latest report, and the weakest skill as this week's focus.
 */

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, FileChartColumn, FileText, Mic, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Account } from "@/hooks/useAccount";
import type { Insights } from "@/lib/insights";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { ease } from "@/components/app/kit";
import { weakestSkill } from "./SkillBars";

const tile = "rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3";

export function ProfilePanel({ account, insights }: { account: Account | null; insights: Insights }) {
  const { stats, readiness, nextSteps, rubric } = insights;
  const overall = readiness.length ? Math.round(readiness.reduce((s, r) => s + r.score, 0) / readiness.length) : 0;
  const weakest = rubric ? weakestSkill(rubric) : null;

  return (
    <div className="grid content-start gap-3 xl:sticky xl:top-[72px] xl:self-start">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease }}
        className="overflow-hidden rounded-2xl border border-white/[0.07] bg-card"
      >
        {/* banner */}
        <div className="fx-stripes h-[76px] border-b border-white/[0.06] bg-[#141416]" />
        <div className="px-4 pb-4">
          <Avatar className="-mt-9 size-[68px] rounded-full ring-4 ring-card">
            <AvatarFallback className="rounded-full bg-[#1f1f23] text-[20px] font-semibold text-white">{account?.initials ?? "·"}</AvatarFallback>
          </Avatar>
          <div className="mt-3 flex items-center gap-2">
            <h2 className="m-0 truncate text-[18px] font-semibold tracking-[-0.03em] text-white">{account?.name || "Your profile"}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#34d399]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#6ee7b7]">
              <span className="size-1.5 rounded-full bg-[#34d399]" /> Active
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-white/40">Free · Early access</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { href: "/dashboard/ai-interview", label: "Interview", icon: Mic },
              { href: "/dashboard/reports", label: "Reports", icon: FileChartColumn },
              { href: "/dashboard/resume", label: "Resume", icon: FileText },
            ].map((a) => (
              <Button key={a.href} asChild variant="outline" size="sm" className="h-8 border-white/[0.08] bg-white/[0.02] px-2 text-[12px] font-medium">
                <Link href={a.href}>
                  <a.icon className="size-3.5" /> {a.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className={tile}>
              <div className="text-[11.5px] text-white/40">Longest streak</div>
              <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-white">
                {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
              </div>
            </div>
            <div className={tile}>
              <div className="text-[11.5px] text-white/40">Roles practised</div>
              <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-white">{readiness.length}</div>
            </div>
          </div>

          <div className={`${tile} mt-2`}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-white/60">Overall readiness</span>
              <span className="font-semibold tabular-nums text-white">
                <AnimatedNumber value={overall} />%
              </span>
            </div>
            <div className="relative mt-2.5 h-1.5 rounded-full bg-white/[0.07]">
              <motion.div
                className="h-full rounded-full bg-[#4d7cff]"
                initial={{ width: 0 }}
                animate={{ width: `${overall}%` }}
                transition={{ duration: 1.2, ease }}
              />
              <motion.span
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#4d7cff] shadow-[0_0_10px_rgba(77,124,255,0.8)]"
                initial={{ left: 0 }}
                animate={{ left: `${overall}%` }}
                transition={{ duration: 1.2, ease }}
              />
            </div>
            <p className="m-0 mt-2 text-[11.5px] text-white/35">Average across the roles you&rsquo;ve practised</p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.16, ease }}
        className="rounded-2xl border border-white/[0.07] bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-white">Practise next</h2>
          {nextSteps.sessionId ? (
            <Link href={`/dashboard/reports/${nextSteps.sessionId}`} className="text-[12px] font-medium text-white/50 hover:text-white">
              Latest report
            </Link>
          ) : null}
        </div>
        {nextSteps.items.length ? (
          <ol className="m-0 mt-3 grid list-none gap-2 p-0">
            {nextSteps.items.map((item, i) => (
              <li key={item} className="flex gap-3 rounded-xl px-1 py-1.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[12px] font-semibold text-white/70">
                  {i + 1}
                </span>
                <span className="text-[12.5px] leading-[1.5] text-white/75">{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 mt-2 text-[12.5px] leading-[1.5] text-white/45">The top improvements from your latest report show up here.</p>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.22, ease }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-4"
      >
        <span className="relative grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
          <Sparkles className="size-4 text-white" />
        </span>
        <h2 className="relative m-0 mt-3 text-[15px] font-semibold tracking-[-0.02em] text-white">{weakest ? `Focus on ${weakest.label.toLowerCase()}` : "Your focus, summarized"}</h2>
        <p className="relative m-0 mt-1 text-[12.5px] leading-[1.5] text-white/55">
          {weakest ? weakest.advice : "After your first report, this card tells you which answer skill to work on next."}
        </p>
        <div className="relative mt-4 flex gap-2">
          <Button asChild size="sm" className="h-8 rounded-lg text-[12.5px] font-semibold">
            <Link href="/dashboard/ai-interview">
              <Mic /> Practise now
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg text-[12.5px] text-white/70">
            <Link href="/dashboard/ai-interview/how-it-works">
              How it works <ArrowRight />
            </Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
