"use client";

/** Shared pieces for the interview report and history pages. */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { band } from "@/lib/interview/report";

export const ease = [0.16, 1, 0.3, 1] as const;

/** Reduced-motion preference, read after mount so server and client HTML match. */
export function useReducedMotionFlag() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

/** Blur-up entrance; with reduced motion the element simply appears. */
export function reveal(reduce: boolean, delay = 0) {
  return reduce
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 16, filter: "blur(8px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        transition: { duration: 0.8, delay, ease },
      };
}

const CHIP: Record<ReturnType<typeof band>, string> = {
  hi: "bg-[#bec8ff]/14 text-[#cfd6ff]",
  mid: "bg-white/7 text-[#e8e8e8]",
  lo: "bg-[#ffaa78]/12 text-[#ffc7a6]",
};

/** Score pill. `value` is on the given scale; colour bands use the 0–10 equivalent. */
export function ScoreChip({ value, outOf = 10, suffix = true, className = "" }: { value: number; outOf?: 10 | 100; suffix?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex h-7 min-w-[46px] shrink-0 items-center justify-center rounded-full px-2.5 text-[13px] font-medium tabular-nums transition-colors duration-500 ${CHIP[band(outOf === 100 ? value / 10 : value)]} ${className}`}
    >
      {value}
      {suffix && outOf === 10 ? "/10" : ""}
    </span>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] font-sans text-[#f0f0f0] selection:bg-[#bec8ff]/25">
      <div className="mx-auto max-w-[880px] px-4 pb-20">{children}</div>
    </div>
  );
}

export function TopBar({ active }: { active: "report" | "history" }) {
  const tab = (on: boolean) =>
    `inline-flex h-[30px] items-center rounded-[7px] px-3 text-[13px] transition-colors ${on ? "bg-[#f0f0f0] text-[#0a0a0a]" : "text-white/50 hover:text-[#f0f0f0]"}`;
  return (
    <header className="flex items-center justify-between py-[22px] text-[13.5px] text-white/50">
      <Link href="/dashboard/ai-interview" className="transition-colors hover:text-[#f0f0f0]">
        ← Back to roles
      </Link>
      <nav aria-label="Feedback" className="flex gap-1 rounded-[10px] bg-[#0d0d0f] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        {active === "report" ? (
          <span aria-current="page" className={tab(true)}>
            Report
          </span>
        ) : null}
        <Link href="/dashboard/ai-interview/feedback" aria-current={active === "history" ? "page" : undefined} className={tab(active === "history")}>
          History
        </Link>
      </nav>
    </header>
  );
}

export const card = "rounded-[20px] bg-[#0d0d0f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]";

export const primaryBtn =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] bg-[#f0f0f0] px-4 text-[13.5px] font-medium tracking-[-0.02em] text-[#0a0a0a] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bec8ff] disabled:cursor-not-allowed disabled:bg-white/60";
export const secondaryBtn =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-medium tracking-[-0.02em] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bec8ff]";

/** Renders [placeholder] spans in a stronger answer in the accent colour. */
export function WithPlaceholders({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[") && p.endsWith("]") ? (
          <span key={i} className="text-[#bec8ff]">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function MicIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4" fill="currentColor" />
      <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Centered message used for empty, error and not-found states. */
export function StateMessage({ title, body, children }: { title: ReactNode; body: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-28 text-center">
      <h1 className="m-0 text-[34px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[40px]">{title}</h1>
      <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-[1.55] tracking-[-0.02em] text-white/60">{body}</p>
      {children ? <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}
