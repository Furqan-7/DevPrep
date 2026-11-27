"use client";

/** Three steps, joined by a line that fills in as the section scrolls past. */

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { BarChart3, Mic, MousePointerClick } from "lucide-react";
import { ROLES, ROLE_DURATION_RANGE } from "@/data/roles";
import { Reveal, SectionHeader } from "./primitives";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a role and a level",
    body: `Choose from ${ROLES.length} roles at Fresher, Mid-level or Senior. Add your resume or a job description to tailor the questions.`,
    meta: ["Frontend Engineer", "Mid-level", "Resume on"],
  },
  {
    icon: Mic,
    title: "Talk it through with Zara",
    body: "Ten questions, out loud. She listens, asks follow-ups on what you said and moves on like a real interviewer.",
    meta: ["10 questions", "Live transcript", "Follow-ups"],
  },
  {
    icon: BarChart3,
    title: "Read the report, then retry",
    body: "Every answer is scored with what was strong, what was missing and a stronger version. Retry the weak ones by voice.",
    meta: ["Score /100", "Stronger answers", "Voice retries"],
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-[#050506] px-4 py-20 sm:px-6 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4d7cff]/[0.07] blur-[100px]" />
      <SectionHeader eyebrow="How it works" title="From cold start to ready in three steps" body={`No setup and nothing to install. Most interviews take ${ROLE_DURATION_RANGE.min} to ${ROLE_DURATION_RANGE.max} minutes.`} />

      <div ref={ref} className="relative mx-auto mt-16 max-w-[1120px]">
        {/* connector */}
        <div aria-hidden className="absolute left-[16.6%] right-[16.6%] top-[27px] hidden h-px bg-white/[0.08] md:block">
          <motion.div style={{ scaleX }} className="h-full origin-left bg-[linear-gradient(90deg,#8fb0ff,#c4a6ff,#ff9ecf)]" />
        </div>

        <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex">
              <Reveal delay={i * 0.1} className="flex w-full flex-col items-center text-center">
                <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-white/10 bg-[#0d0d11] text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <s.icon className="size-5" />
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-white text-[10.5px] font-semibold text-black">{i + 1}</span>
                </span>
                <div className="fx-border mt-6 flex w-full flex-1 flex-col rounded-[20px] bg-[#0a0a0d] p-6">
                  <h3 className="m-0 text-[18px] font-semibold tracking-[-0.025em] text-white">{s.title}</h3>
                  <p className="m-0 mt-2 flex-1 text-[14px] leading-[1.6] text-white/50">{s.body}</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                    {s.meta.map((m) => (
                      <span key={m} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white/55">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
