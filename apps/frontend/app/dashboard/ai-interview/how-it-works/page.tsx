"use client";

/**
 * In-app explainer of an interview: the four steps from picking a role to retrying
 * answers, what happens under the hood, how answers are scored, and tips for a session.
 */

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, AudioLines, CircleHelp, FileChartColumn, Headphones, Link2, Mic, MousePointerClick, RotateCcw, ScrollText, Settings2, Timer, Volume2 } from "lucide-react";
import { AppPage, panel } from "@/components/app/AppPage";
import { ease } from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/data/roles";
import { MAX_ATTEMPTS } from "@/lib/interview/report";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a role and a level",
    body: `Choose from ${ROLES.length} roles at Fresher, Mid-level or Senior. Optionally tailor the questions to your resume or a job description.`,
  },
  {
    icon: Settings2,
    title: "Check your mic",
    body: "Allow your microphone (the camera is optional and never recorded), say a few words to check the level, then start.",
  },
  {
    icon: Mic,
    title: "Talk it through with Zara",
    body: "She opens with “Tell me about yourself”, then asks ten questions out loud and follows up on what you actually said.",
  },
  {
    icon: FileChartColumn,
    title: "Read your report and retry",
    body: `Every answer is scored with what was strong, what was missing and a stronger version. Retry any question by voice, up to ${MAX_ATTEMPTS} times.`,
  },
];

const UNDER_THE_HOOD = [
  { icon: AudioLines, title: "Hands-free turn taking", body: "Voice detection runs in your browser and notices when you stop talking, so there's no button to hold." },
  { icon: Volume2, title: "Speaks as she writes", body: "Zara's reply goes to her voice a sentence at a time, and transcription starts while you pause, so replies feel natural." },
  { icon: ScrollText, title: "Live transcript", body: "Everything you and Zara say shows up in the transcript beside her as the conversation happens." },
  { icon: Link2, title: "Share a report", body: "Create a read-only link with your scores and feedback. Your answers stay private, and you can turn the link off any time." },
];

const RUBRIC = [
  { label: "Answering the question", body: "Did you answer what was asked, first, before adding context?" },
  { label: "Technical depth", body: "Do you explain why it works and the trade-offs, not just what it is?" },
  { label: "Clarity", body: "Is the answer structured: a short answer, the explanation, an example?" },
  { label: "Concrete examples", body: "Is it backed by a project, a number or an incident from your own work?" },
];

const TIPS = [
  { icon: Headphones, text: "Wear headphones so Zara's voice doesn't reach your mic." },
  { icon: Timer, text: "Pause for about a second when you finish. That's how Zara knows it's her turn." },
  { icon: RotateCcw, text: "Retry your weakest answer straight away, while the feedback is fresh." },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, delay, ease },
});

export default function HowItWorksPage() {
  return (
    <AppPage
      icon={CircleHelp}
      title="How it works"
      description="What happens in a DevPrep interview, how your answers are scored, and how to get the most out of it."
      actions={
        <Button asChild size="sm" className="h-8 font-semibold">
          <Link href="/dashboard/ai-interview">
            <Mic /> Start an interview
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4">
        {/* steps */}
        <motion.section {...fade()} className={cn(panel, "p-5")}>
          <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em]">From role to report</h2>
          <ol className="relative m-0 mt-5 grid list-none gap-3 p-0 md:grid-cols-4">
            <span aria-hidden className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-white/[0.08] md:block" />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="relative z-10 mx-auto grid size-10 place-items-center rounded-xl border border-white/10 bg-[#141417] text-white shadow-[0_0_0_4px_#0f0f11] md:mx-0">
                  <s.icon className="size-[18px]" />
                </span>
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="text-[11.5px] font-medium tabular-nums text-white/35">Step {i + 1}</span>
                  <h3 className="m-0 mt-1 text-[14px] font-semibold tracking-[-0.015em] text-white">{s.title}</h3>
                  <p className="m-0 mt-1.5 text-[12.5px] leading-[1.55] text-white/55">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* under the hood */}
          <motion.section {...fade(0.04)} className={cn(panel, "p-5")}>
            <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em]">Under the hood</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {UNDER_THE_HOOD.map((f) => (
                <div key={f.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="grid size-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/75">
                    <f.icon className="size-4" />
                  </span>
                  <h3 className="m-0 mt-3 text-[13.5px] font-semibold text-white">{f.title}</h3>
                  <p className="m-0 mt-1 text-[12.5px] leading-[1.55] text-white/55">{f.body}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* scoring */}
          <motion.section {...fade(0.08)} className={cn(panel, "p-5")}>
            <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em]">How answers are scored</h2>
            <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-white/50">Each answer gets a score out of 10 on four skills. The report adds an overall score out of 100.</p>
            <ul className="m-0 mt-4 grid list-none gap-2 p-0">
              {RUBRIC.map((r, i) => (
                <li key={r.label} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[11px] font-semibold text-white/70">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-white">{r.label}</span>
                    <span className="block text-[12px] leading-[1.5] text-white/50">{r.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* tips + cta */}
        <motion.section {...fade(0.1)} className={cn(panel, "grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6")}>
          <div>
            <h2 className="m-0 text-[16px] font-semibold tracking-[-0.02em]">Before you start</h2>
            <ul className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-3">
              {TIPS.map((t) => (
                <li key={t.text} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-white/65">
                  <t.icon className="mt-0.5 size-3.5 shrink-0 text-white/45" />
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
          <Button asChild className="h-10 rounded-xl px-5 font-semibold">
            <Link href="/dashboard/ai-interview">
              Choose a role <ArrowRight />
            </Link>
          </Button>
        </motion.section>
      </div>
    </AppPage>
  );
}
