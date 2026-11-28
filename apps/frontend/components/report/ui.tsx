"use client";

/** Shared pieces for the interview report and history pages. */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoTile } from "@/components/brand/Logo";
import { band } from "@/lib/interview/report";
import { cn } from "@/lib/utils";

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

/** Fade-up entrance; with reduced motion the element simply appears. */
export function reveal(reduce: boolean, delay = 0) {
  return reduce
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay, ease },
      };
}

const CHIP: Record<ReturnType<typeof band>, string> = {
  hi: "bg-[#34d399]/12 text-[#6ee7b7] ring-[#34d399]/20",
  mid: "bg-[#4d7cff]/12 text-[#a5b8ff] ring-[#4d7cff]/20",
  lo: "bg-[#fbbf24]/12 text-[#fcd34d] ring-[#fbbf24]/20",
};

/** Colour for a 0–10 score band, for bars and dots. */
export const bandColor = (score10: number) => ({ hi: "#34d399", mid: "#4d7cff", lo: "#fbbf24" })[band(score10)];

/** Score pill. `value` is on the given scale; colour bands use the 0–10 equivalent. */
export function ScoreChip({ value, outOf = 10, suffix = true, className = "" }: { value: number; outOf?: 10 | 100; suffix?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-[46px] shrink-0 items-center justify-center rounded-lg px-2 text-[13px] font-semibold tabular-nums ring-1 ring-inset transition-colors duration-500",
        CHIP[band(outOf === 100 ? value / 10 : value)],
        className,
      )}
    >
      {value}
      {suffix && outOf === 10 ? <span className="ml-px text-[11px] font-medium opacity-60">/10</span> : ""}
    </span>
  );
}

/**
 * Frame for the report pages. Inside the app the dashboard shell draws the canvas; the
 * public shared report is standalone, so it brings its own dark background and header.
 */
export function PageShell({ children, standalone = false }: { children: ReactNode; standalone?: boolean }) {
  const inner = <main className="mx-auto max-w-[1080px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">{children}</main>;
  if (!standalone) return <div data-theme="dark">{inner}</div>;
  return (
    <div data-theme="dark" data-app className="relative isolate min-h-dvh bg-[#050506] font-sans text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[560px] rounded-full bg-[#4d7cff]/[0.1] blur-[120px]" />
        <div className="absolute -right-40 top-1/3 size-[520px] rounded-full bg-[#a78bfa]/[0.08] blur-[120px]" />
      </div>
      <header className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-white">
          <LogoTile /> DevPrep
        </Link>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12px] text-white/55">Shared interview report</span>
      </header>
      {inner}
    </div>
  );
}

/** Row above a single report: a way back to every report, and the report's actions. */
export function ReportHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-[13px] text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="size-3.5" /> All reports
      </Link>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export const card = "rounded-2xl border border-white/[0.07] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export const primaryBtn =
  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-3.5 text-[13.5px] font-semibold tracking-[-0.01em] text-black transition-[background-color,transform] hover:bg-white/90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-white/60 [&_svg]:size-4";
export const secondaryBtn =
  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 text-[13.5px] font-medium tracking-[-0.01em] text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4";

/** Renders [placeholder] spans in a stronger answer as highlighted slots to fill in. */
export function WithPlaceholders({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[") && p.endsWith("]") ? (
          <span key={i} className="rounded-[5px] bg-[#a78bfa]/15 px-1 py-px text-[#d8ccff] [box-decoration-break:clone]">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/** Centered message used for empty, error and not-found states. */
export function StateMessage({ title, body, children, icon }: { title: ReactNode; body: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className={cn(card, "flex flex-col items-center px-6 py-20 text-center")}>
      {icon ? <span className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/70">{icon}</span> : null}
      <h1 className="m-0 text-[24px] font-semibold leading-[1.15] tracking-[-0.035em]">{title}</h1>
      <p className="mx-auto mt-2.5 max-w-[440px] text-[14px] leading-[1.55] text-white/55">{body}</p>
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-2.5">{children}</div> : null}
    </div>
  );
}

/** Small uppercase-free label above a block of report content. */
export function Label({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-white/45">
      {icon}
      {children}
    </div>
  );
}
