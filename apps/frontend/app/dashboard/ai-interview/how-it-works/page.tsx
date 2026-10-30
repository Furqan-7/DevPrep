"use client";

/**
 * DevPrep — How It Works (dashboard)
 *
 * In-app explainer of the AI interview session flow, styled to match the
 * live interview room (ember glow, pill controls, light/dark tokens).
 */

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic2, Zap, Target, FileText, AudioLines, Clock3 } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";

const EASE = [0.25, 0.8, 0.25, 1] as const;

const STEPS = [
  {
    num: "01",
    icon: Target,
    title: "Pick your role",
    body: "Choose from roles across Engineering, Data, Design, and Product. Every question set is curated for what that role actually tests.",
  },
  {
    num: "02",
    icon: FileText,
    title: "Review what to expect",
    body: "See the top questions for your role before you start. Know what's coming so you can walk in with a plan — not a guess.",
  },
  {
    num: "03",
    icon: Mic2,
    title: "Talk to Zara",
    body: "Answer naturally by voice. Zara listens, follows up on what you said, and moves through the interview like a real interviewer.",
  },
] as const;

const FEATURES = [
  {
    icon: AudioLines,
    title: "Voice-first, real-time",
    body: "Your answer streams to Zara while you speak, so replies start moments after you pause — no typing, no scripted prompts.",
  },
  {
    icon: Zap,
    title: "Instant feedback",
    body: "Every answer is scored as you go. Finish the session and get a breakdown of what you nailed and what to sharpen.",
  },
  {
    icon: Clock3,
    title: "Track your progress",
    body: "Scores, recurring gaps and practice frequency live in your feedback dashboard so you always know what to practice next.",
  },
] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="dp-mono inline-flex items-center gap-2 rounded-full border border-dp-ln bg-dp-pill px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-dp-ink/80">
      <span className="h-1.5 w-1.5 rounded-full bg-dp-ac" />
      {children}
    </span>
  );
}

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <DashboardShell themed>
      <div className="min-h-[calc(100vh-64px)] antialiased pb-24">
        {/* ── Hero ── */}
        <section className="dp-glow relative flex flex-col items-center text-center px-6 pt-16 sm:pt-24 pb-44 sm:pb-52">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="flex flex-col items-center max-w-[860px]"
          >
            <Eyebrow>How it works</Eyebrow>
            <h1 className="mt-6 font-bold text-[38px] sm:text-[56px] lg:text-[68px] leading-[1.02] tracking-[-0.04em]">
              From zero to interview-ready{" "}
              <span className="text-dp-mu">in three steps.</span>
            </h1>
            <p className="mt-6 text-dp-mu text-[16px] sm:text-[18px] leading-relaxed max-w-[560px]">
              DevPrep simulates a real interview — role-specific questions, a live voice conversation with Zara, and feedback the moment you finish.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/ai-interview")}
                className="dp-mono dp-btn-ember inline-flex items-center gap-2.5 h-14 px-8 rounded-full text-[14px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-transform active:scale-95"
              >
                Start practicing <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("session-flow")?.scrollIntoView({ behavior: "smooth" })}
                className="dp-mono inline-flex items-center h-14 px-8 rounded-full border border-dp-ln bg-dp-sf/70 backdrop-blur-md text-[14px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-colors hover:border-dp-ink active:scale-95"
              >
                See the flow
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── Steps ── */}
        <section id="session-flow" className="relative max-w-[1120px] mx-auto px-6 scroll-mt-24">
          <div className="text-center mb-10">
            <Eyebrow>The session flow</Eyebrow>
            <h2 className="mt-5 text-[28px] sm:text-[38px] font-bold tracking-[-0.03em] leading-[1.1]">
              Three steps. <span className="text-dp-mu">One real conversation.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {STEPS.map((step, i) => (
              <motion.article
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
                className="group relative rounded-[22px] border border-dp-ln bg-dp-sf2 p-7 transition-colors hover:border-dp-ac/50"
              >
                <div className="flex items-center justify-between mb-10">
                  <span className="dp-mono text-[13px] font-bold text-dp-ac bg-dp-soft px-2.5 py-1 rounded-md">{step.num}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dp-pill border border-dp-ln text-dp-ink group-hover:text-dp-ac transition-colors">
                    <step.icon size={18} />
                  </span>
                </div>
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] mb-2.5">{step.title}</h3>
                <p className="text-dp-mu text-[14px] leading-relaxed">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── Inside a session (mini interview room) ── */}
        <section className="max-w-[1120px] mx-auto px-6 mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div>
              <Eyebrow>Inside a session</Eyebrow>
              <h2 className="mt-5 text-[28px] sm:text-[38px] font-bold tracking-[-0.03em] leading-[1.1]">
                It feels like a call, <span className="text-dp-mu">not a quiz.</span>
              </h2>
              <p className="mt-4 text-dp-mu text-[15px] leading-relaxed max-w-[440px]">
                Speak, pause, and Zara picks it up from there. Your words appear as you finish each answer, and the next question follows naturally from what you said.
              </p>
              <ul className="mt-6 space-y-3 text-[14px]">
                {["Pause about a second to hand the turn to Zara", "Mute or turn your camera off any time", "End whenever you like — progress is saved"].map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-dp-ok" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: EASE }}
              aria-hidden="true"
              className="dp-glow dp-glow--cta relative overflow-hidden rounded-[26px] border border-dp-ln bg-dp-bg px-5 pt-6 pb-28 sm:px-7"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dp-pill border border-dp-ln text-[18px] font-extrabold">
                  D<span className="text-dp-ac">.</span>
                </span>
                <div>
                  <p className="text-[14px] font-semibold">DevPrep Interviewer</p>
                  <p className="text-[13px] text-dp-ok">Speaking to you…</p>
                </div>
              </div>
              <div className="mt-5 space-y-4 sm:pl-[60px]">
                <div className="max-w-[90%] rounded-[18px] bg-dp-sf2 border border-dp-ln px-4 py-3 text-[14px] leading-relaxed">
                  Could you explain how the event loop keeps a browser UI responsive?
                </div>
                <div className="ml-auto w-fit max-w-[85%] rounded-[18px] bg-gradient-to-b from-[#ff4f1f] to-[#eb3a14] px-4 py-3 text-[14px] text-white">
                  Sure — the call stack runs sync code, and queued tasks only run once it&apos;s empty…
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3">
                <span className="dp-mono dp-btn-ember rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em]">End interview</span>
                <span className="dp-mono rounded-full border border-dp-ln bg-dp-sf/70 backdrop-blur px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em]">Having problem</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-[1120px] mx-auto px-6 mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
                className="rounded-[22px] border border-dp-ln bg-dp-sf2 p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full dp-btn-ember mb-6">
                  <f.icon size={18} />
                </span>
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] mb-2">{f.title}</h3>
                <p className="text-dp-mu text-[14px] leading-relaxed">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-[1120px] mx-auto px-6 mt-24">
          <div className="dp-glow dp-glow--cta dp-glow--rise relative overflow-hidden rounded-[28px] border border-dp-ln bg-[#0e0e10] text-white text-center px-8 pt-14 pb-36 sm:pt-16 sm:pb-44">
            <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.03em] leading-[1.1]">
              Ready when you are.
            </h2>
            <p className="mt-3 text-white/70 text-[15px] sm:text-[16px] max-w-[460px] mx-auto">
              Pick a role and have your first conversation with Zara in under a minute.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/ai-interview")}
              className="dp-mono dp-btn-ember mt-8 inline-flex items-center gap-2.5 h-14 px-9 rounded-full text-[14px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-transform active:scale-95"
            >
              Choose a role <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
