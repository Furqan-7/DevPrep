"use client";

/**
 * DevPrep — How It Works (dashboard)
 *
 * In-app explainer of the AI interview session flow.
 * Redesigned strictly in accordance with Tidiane DevOps Portfolio System v1.0.0.
 */

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic2, Code2, Zap, Target, FileText, Terminal as TerminalIcon } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";

const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

// Design system easing motion curve: cubic-bezier(0.25, 0.8, 0.25, 1)
const EASE = [0.25, 0.8, 0.25, 1] as const;

/* ─────────────────────────────────────────────
   Three-step session flow
───────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    tag: "// PHASE_01",
    icon: <Target size={18} />,
    title: "Pick your role",
    body: "Choose from 24+ roles across Engineering, Data, Design, and Product. Every question set is curated for what that role actually tests.",
  },
  {
    num: "02",
    tag: "// PHASE_02",
    icon: <FileText size={18} />,
    title: "Review what to expect",
    body: "See the top questions for your role before you start. Know what's coming so you can walk in with a plan — not a guess.",
  },
  {
    num: "03",
    tag: "// PHASE_03",
    icon: <Mic2 size={18} />,
    title: "Take the interview",
    body: "Talk naturally to Zara. Answer by voice, solve code live, and get a full breakdown of your performance right when you finish.",
  },
] as const;

/* ─────────────────────────────────────────────
   Feature highlights (Hardware/Terminal Tech Grid)
───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Mic2 size={18} />,
    title: "Voice-first interviews",
    body: "Zara asks questions naturally by voice. You speak your answers — no typing, no scripted prompts. It feels like the real thing.",
  },
  {
    icon: <Code2 size={18} />,
    title: "Live code execution",
    body: "Solve DSA and coding problems with a real compiler inside the session. Write, run, and debug without leaving the interview.",
  },
  {
    icon: <Zap size={18} />,
    title: "Instant feedback",
    body: "Get a breakdown of every answer right after the session — what you nailed, what to sharpen, and how to improve before the real interview.",
  },
] as const;

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div className="min-h-[calc(100vh-64px)] bg-[#F5F5F7] text-[#1A1A1A] antialiased pb-32 relative selection:bg-[#EB3A14] selection:text-white">

        {/* Subtle grid background pattern adhering to System noise/layered depth */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{
            backgroundImage: `radial-gradient(#1A1A1A 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* ── Hero Section ─────────────────────────────── */}
        <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 sm:pt-24 pb-16 overflow-hidden max-w-[1280px] mx-auto">

          {/* Metadata System Label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E5E5] rounded-[4px] mb-6 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#EB3A14] animate-pulse" />
            <span
              style={monoStyle}
              className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#666666]"
            >
              SYS.FLOW // VER_1.0.0
            </span>
          </motion.div>

          {/* Headline with Mask Entrance Feel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative flex flex-col items-center max-w-[840px]"
          >
            <h1 className="font-semibold text-[#1A1A1A] text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-[-0.04em] mb-6">
              From zero to interview-ready{" "}
              <span className="text-[#EB3A14] underline decoration-[#EB3A14]/30 underline-offset-8">
                in three steps
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[#666666] text-[15px] sm:text-[18px] leading-relaxed max-w-[560px] tracking-[-0.02em] mb-10">
              DevPrep simulates a real engineering interview — role-specific questions, voice conversation with Zara, and instant feedback.
            </p>

            {/* Dual CTA Buttons (Pill shaped as per design specs) */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/dashboard/ai-interview")}
                style={monoStyle}
                className="inline-flex items-center gap-3 bg-[#EB3A14] hover:bg-[#D63410] text-white text-[11px] uppercase font-medium tracking-[0.1em] px-8 py-4 rounded-full cursor-pointer transition-colors shadow-lg shadow-[#EB3A14]/20"
              >
                <span>START PRACTICING</span>
                <ArrowRight size={14} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => document.getElementById("session-flow")?.scrollIntoView({ behavior: "smooth" })}
                style={monoStyle}
                className="inline-flex items-center bg-white hover:bg-[#F5F5F7] text-[#1A1A1A] text-[11px] uppercase font-medium tracking-[0.1em] px-8 py-4 rounded-full cursor-pointer transition-colors border border-[#E5E5E5] shadow-sm"
              >
                SEE HOW IT WORKS
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* ── Steps Section ────────────────────────────── */}
        <section id="session-flow" className="relative z-10 max-w-[1120px] mx-auto px-6 mb-20 scroll-mt-12">

          {/* Section Header Line */}
          <div className="flex items-center justify-between pb-4 mb-8 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <TerminalIcon size={14} className="text-[#EB3A14]" />
              <p style={monoStyle} className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#1A1A1A]">
                PIPELINE // SESSION_FLOW
              </p>
            </div>
            <span style={monoStyle} className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#666666] hidden sm:block">
              [ 03 PHASES ]
            </span>
          </div>

          {/* 3-Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
                className="group relative bg-white border border-[#E5E5E5] rounded-[12px] p-8 flex flex-col justify-between transition-all duration-500 hover:-translate-y-[4px] hover:shadow-2xl hover:border-[#1A1A1A] overflow-hidden"
              >
                {/* Accent Highlight Bar */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#EB3A14] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  {/* Card Header: Mono Metadata & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-baseline gap-2">
                      <span
                        style={monoStyle}
                        className="text-[28px] font-semibold text-[#1A1A1A] tracking-[-0.04em] group-hover:text-[#EB3A14] transition-colors"
                      >
                        {step.num}
                      </span>
                      <span style={monoStyle} className="text-[10px] font-medium tracking-[0.1em] text-[#666666]">
                        {step.tag}
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-[4px] bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-white group-hover:border-[#1A1A1A] transition-all duration-300 shrink-0">
                      {step.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-[#1A1A1A] text-[18px] tracking-[-0.02em] mb-3">
                    {step.title}
                  </h3>

                  {/* Body Copy */}
                  <p className="text-[#666666] text-[14px] leading-relaxed tracking-[-0.01em]">
                    {step.body}
                  </p>
                </div>

                {/* Subtle Hardware Interface Bottom Marker */}
                <div className="pt-6 mt-6 border-t border-[#F5F5F7] flex items-center justify-between">
                  <span style={monoStyle} className="text-[9px] uppercase tracking-[0.1em] text-[#666666]">STATUS: READY</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E5] group-hover:bg-[#EB3A14] transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Feature Highlights (System Terminal Hardware Grid) ────────────────────────── */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E5E5]">
            <p style={monoStyle} className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#1A1A1A]">
              HARDWARE & ARCHITECTURE // INSIDE_THE_ENGINE
            </p>
            <span style={monoStyle} className="text-[10px] uppercase tracking-[0.1em] text-[#EB3A14]">
              LIVE EXECUTION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E5E5E5] rounded-[12px] bg-white divide-y md:divide-y-0 md:divide-x divide-[#E5E5E5] overflow-hidden shadow-sm">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.45, ease: EASE }}
                className="p-7 flex flex-col justify-between hover:bg-[#F5F5F7]/50 transition-colors group"
              >
                <div>
                  <div className="w-10 h-10 rounded-[4px] bg-[#1E1E1E] text-white flex items-center justify-center mb-6 group-hover:bg-[#EB3A14] transition-colors duration-300">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-[#1A1A1A] text-[16px] tracking-[-0.02em] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[#666666] text-[13px] leading-relaxed tracking-[-0.01em]">
                    {f.body}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E5E5E5]/60 flex items-center justify-between">
                  <span style={monoStyle} className="text-[9px] uppercase tracking-[0.1em] text-[#666666]">
                    MOD_0{i + 1}
                  </span>
                  <span style={monoStyle} className="text-[9px] uppercase tracking-[0.1em] text-[#22C55E]">
                    ● ACTIVE
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

        </section>

      </div>
    </DashboardShell>
  );
}