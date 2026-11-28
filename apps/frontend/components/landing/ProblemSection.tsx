"use client";

/**
 * "The problem" section: a scroll-pinned statement that lights up word by word,
 * strikes through the bad prep habits, then resolves into the four DevPrep fixes.
 * Every effect is driven by scroll position, so scrolling back rewinds it.
 */

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { serif } from "@/lib/fonts";


type Part = { text: string; bad?: boolean };

// The statement, split into plain runs and the habits that get struck through.
const STATEMENT: Part[] = [
  { text: "Most people prep for interviews" },
  { text: "practicing alone", bad: true },
  { text: "with" },
  { text: "generic questions", bad: true },
  { text: ",", },
  { text: "guessing what interviewers want", bad: true },
  { text: ", and never once" },
  { text: "saying an answer out loud.", bad: true },
];

const FIXES = [
  ["Instant feedback", "A breakdown of every answer, right after the session."],
  ["Role-specific questions", "Curated for 24+ engineering, data, and design roles."],
  ["Know what they want", "Live code execution for DSA and technical rounds."],
  ["Speak it out loud", "Zara asks questions by voice, naturally."],
] as const;

const DIM = "rgba(255,255,255,0.12)";
const LIT = "rgba(240,240,240,1)";
const STRUCK = "rgba(240,240,240,0.38)";

// Scroll ranges (0 = section pinned, 1 = about to unpin)
const LIGHT_START = 0.02;
const LIGHT_END = 0.45;
const strikeRange = (i: number) => [0.48 + i * 0.05, 0.56 + i * 0.05] as const;

/* ───────── pieces ───────── */
type StrikeSpec = { fade: readonly [number, number]; draw: readonly [number, number]; last: boolean };

function Word({ progress, from, to, strike, children }: { progress: MotionValue<number>; from: number; to: number; strike?: StrikeSpec; children: string }) {
  const color = useTransform(
    progress,
    strike ? [from, to, strike.fade[0], strike.fade[1]] : [from, to],
    strike ? [DIM, LIT, LIT, STRUCK] : [DIM, LIT],
  );
  if (!strike) return <motion.span style={{ color }}>{children}</motion.span>;
  return (
    <motion.span style={{ color }} className="relative">
      {children}
      <Strike progress={progress} range={strike.draw} last={strike.last} />
    </motion.span>
  );
}

// One line per word, reaching into the following space, so a phrase that wraps still reads as one strike.
function Strike({ progress, range, last }: { progress: MotionValue<number>; range: readonly [number, number]; last: boolean }) {
  const scaleX = useTransform(progress, [range[0], range[1]], [0, 1]);
  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX }}
      className={`pointer-events-none absolute left-[-0.04em] top-[54%] h-[2px] origin-left bg-[#dfe3ff] shadow-[0_0_10px_rgba(190,200,255,0.7)] ${last ? "right-[-0.04em] rounded-r-full" : "right-[-0.27em]"}`}
    />
  );
}

function FixCard({ progress, index, title, body }: { progress: MotionValue<number>; index: number; title: string; body: string }) {
  const range = [0.76 + index * 0.03, 0.86 + index * 0.03];
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [22, 0]);
  const filter = useTransform(progress, range, ["blur(8px)", "blur(0px)"]);
  return (
    <motion.div style={{ opacity, y, filter }} className="rounded-xl bg-white/[0.03] p-4 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:p-[18px]">
      <b className="flex items-start gap-2 text-[14px] font-medium tracking-[-0.035em] text-[#f0f0f0] sm:text-[15px]">
        <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#f0f0f0] text-[#0a0a0a]">
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
            <path d="M2 5.2 4.1 7.3 8 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {title}
      </b>
      <p className="mt-2 text-[12.5px] leading-[1.45] tracking-[-0.03em] text-white/50 sm:text-[13.5px]">{body}</p>
    </motion.div>
  );
}

/* ───────── section ───────── */
export function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Mirror scroll progress into a plain motion value so every effect runs on the JS path
  // (native scroll-timeline acceleration can leave opacity/filter stuck at their first value).
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => progress.set(reduce ? 1 : v));
  useEffect(() => progress.set(reduce ? 1 : scrollYProgress.get()), [reduce, progress, scrollYProgress]);

  const resolveOpacity = useTransform(progress, [0.7, 0.82], [0, 1]);
  const resolveY = useTransform(progress, [0.7, 0.82], [18, 0]);
  const resolveBlur = useTransform(progress, [0.7, 0.82], ["blur(12px)", "blur(0px)"]);
  const glow = useTransform(progress, [0.68, 0.9], [0, 1]);

  // Lay the words out once, giving each its slot in the light-up sweep.
  const totalWords = STATEMENT.reduce((n, p) => n + p.text.split(" ").filter((w) => /\w/.test(w)).length, 0);
  const slot = (LIGHT_END - LIGHT_START) / totalWords;
  let wordIndex = 0;
  let badIndex = 0;

  const renderWords = (text: string, struck?: readonly [number, number]) => {
    const tokens = text.split(/(\s+)/);
    const wordTotal = tokens.filter((t) => /\w/.test(t)).length;
    let j = 0;
    return tokens.map((token, k) => {
      if (!token) return null;
      if (/^\s+$/.test(token)) return token;
      if (!/\w/.test(token)) {
        // lone punctuation lights up together with the word before it
        const prev = LIGHT_START + Math.max(0, wordIndex - 1) * slot;
        return <Word key={k} progress={progress} from={prev} to={prev + slot}>{token}</Word>;
      }
      const from = LIGHT_START + wordIndex * slot;
      wordIndex += 1;
      let strike: StrikeSpec | undefined;
      if (struck) {
        const span = (struck[1] - struck[0]) / wordTotal;
        strike = { fade: struck, draw: [struck[0] + j * span, struck[0] + (j + 1) * span], last: j === wordTotal - 1 };
        j += 1;
      }
      return (
        <Word key={k} progress={progress} from={from} to={from + slot} strike={strike}>
          {token}
        </Word>
      );
    });
  };

  return (
    <section ref={ref} aria-labelledby="problem-title" className="relative h-[340vh] bg-[#0a0a0a] font-sans">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-5 sm:px-6">
        <motion.div
          aria-hidden="true"
          style={{ opacity: glow }}
          className="pointer-events-none absolute -bottom-[260px] left-1/2 h-[520px] w-[1200px] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(92,100,220,0.38),rgba(60,62,170,0.14)_45%,rgba(10,10,10,0)_75%)]"
        />

        <div className="relative flex w-full max-w-[980px] flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-7 sm:text-[14px]">
            <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
            The problem
          </div>

          <p className="m-0 max-w-[900px] text-[24px] font-medium leading-[1.22] tracking-[-0.045em] sm:text-[36px] lg:text-[44px]">
            {STATEMENT.map((part, i) => {
              const lead = i > 0 && !/^[,.]/.test(part.text) ? " " : "";
              if (!part.bad) return <span key={i}>{lead}{renderWords(part.text)}</span>;
              const range = strikeRange(badIndex);
              badIndex += 1;
              return (
                <span key={i}>
                  {lead}
                  {renderWords(part.text, range)}
                </span>
              );
            })}
          </p>

          <motion.h2
            id="problem-title"
            style={{ opacity: resolveOpacity, y: resolveY, filter: resolveBlur }}
            className="mt-7 text-[34px] font-medium leading-[1.05] tracking-[-0.05em] text-[#f0f0f0] sm:mt-11 sm:text-[48px] lg:text-[60px]"
          >
            Stop winging it. <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>Start preparing.</em>
          </motion.h2>

          <div className="mt-7 grid w-full grid-cols-2 gap-2.5 sm:mt-11 sm:gap-3 lg:grid-cols-4">
            {FIXES.map(([title, body], i) => (
              <FixCard key={title} progress={progress} index={i} title={title} body={body} />
            ))}
          </div>
        </div>

        <div aria-hidden="true" className="absolute bottom-7 left-1/2 hidden h-0.5 w-[120px] -translate-x-1/2 overflow-hidden rounded-full bg-white/10 sm:block">
          <motion.i style={{ scaleX: progress }} className="block h-full w-full origin-left bg-[#f0f0f0]" />
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
