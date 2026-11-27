"use client";

/** One honest plan: everything is free during early access. */

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ROLES } from "@/data/roles";
import { MAX_ATTEMPTS } from "@/lib/interview/report";
import { Reveal, SectionHeader, SpotlightCard } from "./primitives";

const INCLUDED = [
  `Voice interviews with Zara for all ${ROLES.length} roles`,
  "Fresher, Mid-level and Senior levels",
  "Questions tailored to your resume or a job description",
  "A full report after every interview",
  `Voice retries, up to ${MAX_ATTEMPTS} per question`,
  "Coding round with AI code review",
  "Resume match and cover letter drafts",
  "Application tracker, streaks and readiness",
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-[#050506] px-4 py-20 sm:px-6 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[60%] h-[520px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(110,120,255,0.16),transparent_65%)]" />
      <SectionHeader eyebrow="Pricing" title="Free while we're in early access" body="Every feature, no session limit and no card. If that ever changes, you'll hear about it well before it does." />

      <Reveal delay={0.1} className="relative mx-auto mt-14 max-w-[920px]">
        <SpotlightCard className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]" spot="rgba(160,170,255,0.16)">
          <div className="relative flex flex-col justify-between gap-10 overflow-hidden border-b border-white/[0.06] p-7 sm:p-9 md:border-b-0 md:border-r">
            <div aria-hidden className="absolute -left-20 -top-20 size-[260px] rounded-full bg-[#6b7bff]/20 blur-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">Early access</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34d399]/10 px-2 py-0.5 text-[11.5px] font-medium text-[#6ee7b7]">
                  <span className="size-1.5 rounded-full bg-[#34d399]" /> Open now
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-[72px] font-semibold leading-[0.9] tracking-[-0.06em] text-white">$0</span>
                <span className="text-[14px] text-white/45">/ month</span>
              </div>
              <p className="m-0 mt-4 max-w-[280px] text-[14.5px] leading-[1.55] text-white/55">Everything DevPrep does today, for as many interviews as you want.</p>
            </div>
            <div className="relative">
              <Link
                href="/auth/signup"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold tracking-[-0.02em] text-black transition-transform active:scale-[0.98]"
              >
                Create a free account <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="m-0 mt-3 text-center text-[12.5px] text-white/40">Takes about a minute</p>
            </div>
          </div>
          <div className="p-7 sm:p-9">
            <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">What&rsquo;s included</div>
            <ul className="m-0 mt-5 grid list-none gap-3.5 p-0">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14.5px] leading-[1.45] text-white/80">
                  <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-white/[0.07]">
                    <Check className="size-3 text-white" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}
