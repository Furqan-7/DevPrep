"use client";

/**
 * "Built for real-time" band: the voice pipeline lighting up stage by stage, next to the
 * numbers that define an interview. Every number here comes from the product itself.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AudioLines, BrainCircuit, Ear, Volume2 } from "lucide-react";
import { MAX_ATTEMPTS } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { Eyebrow, Reveal, SpotlightCard, ease, useSeen } from "./primitives";

const STAGES = [
  { icon: Ear, title: "Hears you stop", body: "Voice activity detection runs in your browser and streams audio while you talk." },
  { icon: AudioLines, title: "Transcribes early", body: "Transcription starts during your pause, so the text is ready the moment you finish." },
  { icon: BrainCircuit, title: "Thinks briefly", body: "Zara's reply streams in token by token, from a session already loaded in memory." },
  { icon: Volume2, title: "Speaks while writing", body: "Each sentence goes to the voice as soon as it's written, not after the whole reply." },
];

const FACTS = [
  { value: "10", label: "questions per interview" },
  { value: "3", label: "levels for every role" },
  { value: "4", label: "skills scored per answer" },
  { value: String(MAX_ATTEMPTS), label: "voice retries per question" },
];

function Pipeline() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.5);
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  const active = reduce ? -1 : tick % (STAGES.length + 1);

  useEffect(() => {
    if (!seen || reduce) return;
    const id = setInterval(() => setTick((t) => t + 1), 1100);
    return () => clearInterval(id);
  }, [seen, reduce]);

  return (
    <div ref={ref} className="relative grid gap-2.5 self-center">
      {STAGES.map((s, i) => {
        const on = active >= i;
        return (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, x: 16 }}
            animate={seen ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: i * 0.08, duration: 0.7, ease }}
            className={cn(
              "relative flex items-start gap-4 rounded-2xl border px-4 py-3.5 transition-[background-color,border-color] duration-500",
              on ? "border-[#8fb0ff]/30 bg-[#4d7cff]/[0.07]" : "border-white/[0.06] bg-white/[0.02]",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-500",
                on ? "bg-[linear-gradient(135deg,#8fb0ff,#c4a6ff)] text-[#0a0a14]" : "bg-white/[0.05] text-white/60",
              )}
            >
              <s.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-medium tracking-[-0.015em] text-white">{s.title}</div>
              <div className="mt-0.5 text-[13px] leading-[1.5] text-white/45">{s.body}</div>
            </div>
            <span className={cn("ml-auto mt-1 size-2 shrink-0 rounded-full transition-colors duration-500", on ? "bg-[#8fb0ff] shadow-[0_0_10px_#8fb0ff]" : "bg-white/10")} />
          </motion.div>
        );
      })}
    </div>
  );
}

export function Realtime() {
  return (
    <section className="relative bg-[#050506] px-4 py-24 sm:px-6 sm:py-28">
      <SpotlightCard className="mx-auto grid max-w-[1120px] gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:p-14">
        <div className="flex flex-col">
          <Reveal>
            <Eyebrow>Built for real time</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="fx-text-fade m-0 mt-5 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[46px]">
              A conversation,
              <br />
              not a form to fill in
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="m-0 mt-5 max-w-[440px] text-[16px] leading-[1.6] text-white/55">
              Every stage of the voice pipeline overlaps with the one before it, so Zara answers in the rhythm of a real interview instead of a loading spinner.
            </p>
          </Reveal>
          <Reveal delay={0.18} className="mt-auto">
            <dl className="m-0 mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06]">
              {FACTS.map((f) => (
                <div key={f.label} className="flex flex-col-reverse bg-[#0b0b0e] px-5 py-4">
                  <dt className="mt-0.5 text-[12.5px] text-white/45">{f.label}</dt>
                  <dd className="m-0 text-[30px] font-semibold tracking-[-0.05em] text-white">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
        <Pipeline />
      </SpotlightCard>
    </section>
  );
}
