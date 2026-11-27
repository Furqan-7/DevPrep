"use client";

/**
 * Shared layout for sign in and sign up: the form on the left, and on large screens a
 * showcase panel on the right with an aurora gradient and floating previews of a report.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ease, useMotionMode } from "@/lib/motion";

export { ease };

/** Blur-up entrance used by every block on the auth pages. */
export function useReveal() {
  const mode = useMotionMode();
  return (delay: number) => ({
    initial: { opacity: 0, y: 14, filter: "blur(8px)" },
    animate: mode === "pending" ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: mode === "reduce" ? { duration: 0 } : { duration: 0.8, delay, ease },
  });
}

export function AuthLogo({ className = "" }: { className?: string }) {
  return <Logo className={className} />;
}

function FloatingReport() {
  const rubric = [
    ["Answering the question", 9],
    ["Technical depth", 7],
    ["Clarity", 8],
    ["Concrete examples", 6],
  ] as const;
  return (
    <div className="w-[300px] rounded-2xl border border-white/15 bg-[#0b0b10]/75 p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11.5px] text-white/50">Frontend Engineer · Mid-level</div>
          <div className="mt-0.5 text-[13px] font-medium text-white">Interview report</div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-semibold leading-none tracking-[-0.05em] text-white">84</div>
          <div className="text-[10.5px] text-white/45">out of 100</div>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {rubric.map(([label, v]) => (
          <div key={label} className="grid grid-cols-[1fr_90px_14px] items-center gap-2 text-[11px]">
            <span className="text-white/55">{label}</span>
            <span className="h-1 overflow-hidden rounded-full bg-white/10">
              <span className={`block h-full rounded-full ${v < 7 ? "bg-[#fbbf24]" : "bg-white/80"}`} style={{ width: `${v * 10}%` }} />
            </span>
            <span className="text-right tabular-nums text-white/75">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingMessage() {
  return (
    <div className="w-[270px] rounded-2xl border border-white/15 bg-[#0b0b10]/75 p-3.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="size-6 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,#c9d6ff_16%,#7f8cff_42%,#6a3dd8_75%)]" />
        <span className="text-[12px] font-medium text-white">Zara</span>
        <span className="ml-auto flex items-center gap-1 text-[10.5px] text-white/45">
          <span className="size-1.5 animate-pulse rounded-full bg-[#34d399]" /> Speaking
        </span>
      </div>
      <p className="m-0 mt-2.5 text-[12.5px] leading-[1.5] text-white/80">Good example. How would that change if the list had a million items?</p>
    </div>
  );
}

function FloatingTip() {
  return (
    <div className="flex w-[250px] items-start gap-2.5 rounded-2xl border border-white/15 bg-[#0b0b10]/75 p-3.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#fbbf24]/15 text-[#fcd34d]">
        <Sparkles className="size-3.5" />
      </span>
      <div>
        <div className="text-[12px] font-medium text-white">Stronger answer</div>
        <p className="m-0 mt-0.5 text-[11.5px] leading-[1.45] text-white/55">Lead with the result, then the trade-off you made to get it.</p>
      </div>
    </div>
  );
}

function Showcase({ children }: { children: ReactNode }) {
  const mode = useMotionMode();
  const float = (delay: number, y = 10) =>
    mode === "full"
      ? { animate: { y: [0, -y, 0] }, transition: { duration: 7, delay, repeat: Infinity, ease: "easeInOut" as const } }
      : {};
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 24, filter: "blur(10px)" },
    animate: mode === "pending" ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: mode === "reduce" ? { duration: 0 } : { duration: 1, delay, ease },
  });

  return (
    <aside className="fx-grain relative isolate hidden overflow-hidden rounded-[24px] lg:flex lg:flex-col">
      {/* mesh gradient */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0a0a12]">
        <div className="absolute -left-[10%] -top-[20%] h-[70%] w-[70%] rounded-full bg-[#5b6cff] opacity-70 blur-[110px]" />
        <div className="absolute -right-[15%] top-[5%] h-[60%] w-[60%] rounded-full bg-[#c56cff] opacity-55 blur-[120px]" />
        <div className="absolute bottom-[-25%] left-[20%] h-[60%] w-[70%] rounded-full bg-[#ff7ab8] opacity-40 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0)_0%,rgba(5,5,8,0.35)_55%,rgba(5,5,8,0.92)_100%)]" />
        <div className="fx-grid absolute inset-0 opacity-50" />
      </div>

      <div className="relative flex-1">
        <motion.div {...enter(0.25)} className="absolute left-[10%] top-[12%]">
          <motion.div {...float(0)}>
            <FloatingReport />
          </motion.div>
        </motion.div>
        <motion.div {...enter(0.4)} className="absolute right-[8%] top-[38%]">
          <motion.div {...float(1.2, 12)}>
            <FloatingMessage />
          </motion.div>
        </motion.div>
        <motion.div {...enter(0.55)} className="absolute left-[18%] top-[58%]">
          <motion.div {...float(2.4, 8)}>
            <FloatingTip />
          </motion.div>
        </motion.div>
      </div>

      <div className="relative px-10 pb-10">{children}</div>
    </aside>
  );
}

export function AuthShell({ panel, children }: { panel: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-[#060607] font-sans text-white lg:grid-cols-[1fr_1.08fr] lg:p-3">
      <main className="relative isolate flex flex-col px-5 py-6 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#4d7cff]/10 blur-[100px] lg:hidden" />
        <AuthLogo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
        <p className="m-0 text-center text-[12px] text-white/30 lg:text-left">
          © {new Date().getFullYear()} DevPrep ·{" "}
          <Link href="/privacy" className="hover:text-white/60">
            Privacy
          </Link>
        </p>
      </main>
      <Showcase>{panel}</Showcase>
    </div>
  );
}
