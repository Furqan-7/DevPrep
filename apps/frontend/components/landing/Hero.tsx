"use client";

/**
 * Landing hero: aurora light, headline that blurs in word by word, two CTAs and a live
 * preview of the interview room that tilts flat as the page scrolls.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, Captions, Mic, Play, PhoneOff, Video } from "lucide-react";
import { ROLES } from "@/data/roles";
import { DEMO_URL, ease } from "./primitives";

const LINE_1 = ["Ace", "the", "interview"];
const LINE_2 = ["before", "it", "begins."];

function Word({ children, i, accent }: { children: string; i: number; accent?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease }}
      className={`inline-block ${accent ? "fx-text-aurora pb-[0.08em]" : ""}`}
    >
      {children}
    </motion.span>
  );
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.9, delay, ease },
});

/* ───────── background light ───────── */
function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="fx-grid absolute inset-0 opacity-70" />
      {/* light cone from the top edge */}
      <div className="absolute left-1/2 top-[-260px] h-[760px] w-[1100px] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_38%,rgba(143,176,255,0.16)_46%,rgba(196,166,255,0.2)_50%,rgba(143,176,255,0.16)_54%,transparent_62%)] blur-[30px]" />
      <div className="absolute left-[12%] top-[8%] h-[420px] w-[520px] rounded-full bg-[#3b5bff]/25 blur-[120px] motion-safe:animate-[fx-float_12s_ease-in-out_infinite]" />
      <div className="absolute right-[8%] top-[18%] h-[380px] w-[460px] rounded-full bg-[#b06cff]/20 blur-[120px] motion-safe:animate-[fx-float_14s_ease-in-out_-4s_infinite]" />
      <div className="absolute left-1/2 top-[48%] h-[300px] w-[640px] -translate-x-1/2 rounded-full bg-[#ff6fb5]/10 blur-[120px]" />
      <div className="absolute inset-x-0 bottom-0 h-[280px] bg-gradient-to-b from-transparent to-[#050506]" />
    </div>
  );
}

/* ───────── interview room preview ───────── */
const SCRIPT = [
  { who: "zara", text: "Hi, I'm Zara. Let's start simple: tell me about yourself." },
  { who: "you", text: "I'm a frontend engineer. Last quarter I rebuilt our checkout in React and cut load time by about forty percent." },
  { who: "zara", text: "That's a big win. What did you change to get that forty percent?" },
  { who: "you", text: "Mostly code-splitting the payment step and moving the address form to a server component." },
] as const;

function Waveform({ active, bars = 18 }: { active: boolean; bars?: number }) {
  return (
    <div className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="w-[3px] origin-center rounded-full bg-white/80 transition-opacity"
          style={{
            height: `${30 + ((i * 37) % 70)}%`,
            opacity: active ? 1 : 0.25,
            animation: active ? `fx-wave ${0.7 + ((i * 13) % 7) / 10}s ease-in-out ${-(i % 5) * 0.12}s infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

function ZaraOrb({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative grid size-[112px] place-items-center sm:size-[132px]">
      {speaking &&
        [0, 1].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border border-[#9db4ff]/40"
            style={{ animation: `fx-pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) ${i * 1.2}s infinite` }}
          />
        ))}
      <span className="absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(120,140,255,0.35),transparent_65%)] blur-xl" />
      <span className="relative size-full rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#c9d6ff_14%,#7f8cff_38%,#6a3dd8_68%,#1b0f3a_100%)] shadow-[inset_0_-12px_30px_rgba(10,0,40,0.6),0_20px_60px_-10px_rgba(110,90,255,0.6)]" />
    </div>
  );
}

function InterviewPreview() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(1);
  // with reduced motion the whole conversation shows at once and nothing loops
  const step = reduce ? SCRIPT.length : tick;

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((s) => (s >= SCRIPT.length + 1 ? 1 : s + 1)), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  const shown = SCRIPT.slice(0, Math.min(step, SCRIPT.length));
  const last = shown[shown.length - 1];
  const zaraSpeaking = last?.who === "zara";
  const question = [...shown].reverse().find((m) => m.who === "zara")?.text ?? "";

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#09090b] text-left shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_50px_120px_-30px_rgba(0,0,0,1),0_30px_80px_-40px_rgba(110,120,255,0.5)]">
      {/* window chrome */}
      <div className="flex h-11 items-center justify-between border-b border-white/[0.06] bg-[#0c0c0f] px-4">
        <div className="flex gap-1.5">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="size-[11px] rounded-full opacity-80" style={{ background: c }} />
          ))}
        </div>
        <div className="hidden items-center gap-2 rounded-md bg-white/[0.04] px-3 py-1 text-[11.5px] text-white/45 sm:flex">
          devprep · Frontend Engineer · Mid-level
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#ff4d4d]/10 px-2 py-0.5 text-[11px] font-medium text-[#ff8080]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#ff5c5c]" /> Live
        </div>
      </div>

      <div className="grid md:grid-cols-[1.25fr_1fr]">
        {/* stage */}
        <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-5 overflow-hidden px-6 py-10 sm:min-h-[380px]">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_40%,rgba(90,100,255,0.14),transparent_70%)]" />
          <ZaraOrb speaking={zaraSpeaking} />
          <div className="relative flex flex-col items-center gap-2">
            <span className="text-[13px] font-medium text-white">Zara</span>
            <div className="flex items-center gap-2 text-[11.5px] text-white/45">
              <Waveform active={!!last} />
              <span className="w-[66px]">{zaraSpeaking ? "Speaking" : "Listening"}</span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={question}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease }}
              className="relative max-w-[380px] text-center text-[15px] leading-[1.5] tracking-[-0.01em] text-white/85"
            >
              {question}
            </motion.p>
          </AnimatePresence>
          {/* camera preview */}
          <div className="absolute bottom-4 right-4 hidden h-[72px] w-[112px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(160deg,#1d1d24,#111114)] sm:block">
            <div className="absolute bottom-0 left-1/2 h-[46px] w-[52px] -translate-x-1/2 rounded-t-full bg-white/[0.08]" />
            <div className="absolute left-1/2 top-[14px] size-[22px] -translate-x-1/2 rounded-full bg-white/[0.1]" />
            <span className="absolute bottom-1.5 left-2 text-[9.5px] text-white/50">You</span>
          </div>
        </div>

        {/* transcript */}
        <div className="hidden flex-col border-l border-white/[0.06] bg-[#0b0b0e] md:flex">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <span className="text-[12.5px] font-medium text-white/80">Transcript</span>
            <span className="text-[11.5px] text-white/40">Question 2 of 10</span>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden p-4">
            <AnimatePresence initial={false}>
              {shown.map((m) => (
                <motion.div
                  key={m.text}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease }}
                  className={m.who === "you" ? "ml-6 self-end" : "mr-6"}
                >
                  <div className={`mb-1 text-[10.5px] ${m.who === "you" ? "text-right text-white/40" : "text-[#9db4ff]/80"}`}>{m.who === "you" ? "You" : "Zara"}</div>
                  <div
                    className={`rounded-xl px-3 py-2 text-[12.5px] leading-[1.5] ${m.who === "you" ? "rounded-tr-sm bg-white text-[#0a0a0a]" : "rounded-tl-sm bg-white/[0.06] text-white/85"}`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[20%] rounded-full bg-[linear-gradient(90deg,#8fb0ff,#c4a6ff)]" />
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] bg-[#0c0c0f] px-4 py-3">
        {[Mic, Video, Captions].map((Icon, i) => (
          <span key={i} className="grid size-9 place-items-center rounded-full bg-white/[0.06] text-white/75">
            <Icon className="size-4" />
          </span>
        ))}
        <span className="ml-2 inline-flex h-9 items-center gap-2 rounded-full bg-[#ff4d4d] px-4 text-[12.5px] font-medium text-white">
          <PhoneOff className="size-3.5" /> End interview
        </span>
      </div>
    </div>
  );
}

/* ───────── hero ───────── */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const rotateX = useTransform(progress, [0, 0.45], [22, 0]);
  const scale = useTransform(progress, [0, 0.45], [0.92, 1]);
  const y = useTransform(progress, [0, 0.45], [0, -40]);

  return (
    <section ref={ref} className="fx-grain relative isolate overflow-hidden bg-[#050506] px-4 pb-24 pt-[132px] sm:px-6 sm:pt-[156px]">
      <Aurora />

      <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
        <motion.div {...fadeUp(0)}>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] py-1 pl-1 pr-3 text-[12.5px] text-white/70 backdrop-blur transition-colors hover:border-white/20"
          >
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">New</span>
            <span className="fx-shimmer font-medium">Interviews tailored to your resume</span>
            <ArrowRight className="size-3.5 text-white/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <h1 className="m-0 mt-7 text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-[72px] lg:text-[88px]">
          <span className="block">
            {LINE_1.map((w, i) => (
              <span key={w}>
                <Word i={i}>{w}</Word>{i < LINE_1.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
          <span className="block">
            {LINE_2.map((w, i) => (
              <span key={w}>
                <Word i={i + LINE_1.length} accent={i > 0}>{w}</Word>{i < LINE_2.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        </h1>

        <motion.p {...fadeUp(0.6)} className="mx-auto mt-6 max-w-[540px] text-[16.5px] leading-[1.6] tracking-[-0.01em] text-white/55 sm:text-[18px]">
          Zara is an AI interviewer you talk to out loud. She follows up on what you actually said, then scores every answer and shows you a stronger one.
        </motion.p>

        <motion.div {...fadeUp(0.72)} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/signup"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-[14.5px] font-semibold tracking-[-0.02em] text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_10px_40px_-10px_rgba(255,255,255,0.45)] transition-transform active:scale-[0.98]"
          >
            <Mic className="size-4" />
            Start a free interview
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-[14.5px] font-medium tracking-[-0.02em] text-white backdrop-blur transition-colors hover:border-white/20 hover:bg-white/[0.07]"
          >
            <span className="grid size-5 place-items-center rounded-full bg-white/15">
              <Play className="size-2.5 fill-white" />
            </span>
            Watch the demo
          </a>
        </motion.div>

        <motion.ul {...fadeUp(0.84)} className="m-0 mt-6 flex list-none flex-wrap justify-center gap-x-5 gap-y-2 p-0 text-[12.5px] text-white/40">
          <li>Free in early access</li>
          <li aria-hidden>·</li>
          <li>{ROLES.length} roles, 3 levels</li>
          <li aria-hidden>·</li>
          <li>Runs in your browser</li>
        </motion.ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease }}
        className="relative mx-auto mt-16 max-w-[1080px] [perspective:1600px] sm:mt-20"
      >
        <div aria-hidden className="absolute inset-x-[10%] -top-10 h-40 rounded-full bg-[#6b7bff]/30 blur-[80px]" />
        <motion.div style={{ rotateX, scale, y, transformOrigin: "50% 0%" }} className="relative will-change-transform">
          <InterviewPreview />
        </motion.div>
      </motion.div>
    </section>
  );
}
