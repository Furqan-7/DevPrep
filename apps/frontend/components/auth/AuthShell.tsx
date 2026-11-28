"use client";

/**
 * Shared layout for sign in and sign up. On large screens a side panel repeats the
 * landing page's planet horizon (it rises and brightens on load, and glows a little
 * more while a form field has focus); below lg only the form shows, over a faint glow.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";

export const ease = [0.16, 1, 0.3, 1] as const;

const LOGO_PATH =
  "M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z";

// Deterministic star field so server and client render the same markup.
const STARS = (() => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 110 }, (_, i) => ({
    x: rand() * 100,
    y: rand() * 72,
    r: [0.6, 0.7, 0.8, 1][i % 4] ?? 0.8,
    o: [0.3, 0.45, 0.6, 0.8][i % 4] ?? 0.5,
    t: 3 + rand() * 4,
    d: rand() * 5,
  }));
})();

/**
 * "pending" until the reduced-motion preference has been read after mount (so server
 * and client render the same HTML); entrances wait for it, then play or snap to the end.
 */
type MotionMode = "pending" | "full" | "reduce";

function useMotionMode(): MotionMode {
  const [mode, setMode] = useState<MotionMode>("pending");
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMode(mq.matches ? "reduce" : "full");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mode;
}

/** Blur-up entrance used by every block on the auth pages. */
export function useReveal() {
  const mode = useMotionMode();
  return (delay: number) => ({
    initial: { opacity: 0, y: 16, filter: "blur(8px)" },
    animate: mode === "pending" ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: mode === "reduce" ? { duration: 0 } : { duration: 0.8, delay, ease },
  });
}

export function AuthLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="DevPrep home" className={`inline-flex items-center gap-[9px] text-[17px] font-semibold leading-none tracking-[-0.04em] text-[#f0f0f0] ${className}`}>
      <svg viewBox="415 142 738 677" aria-hidden="true" className="h-[18px] w-[20px] shrink-0" fill="currentColor">
        <path d={LOGO_PATH} />
      </svg>
      DevPrep
    </Link>
  );
}

function HorizonPanel({ children, focused }: { children: ReactNode; focused: boolean }) {
  const reveal = useReveal();
  const mode = useMotionMode();
  const rise = {
    initial: { y: 90, opacity: 0.25 },
    animate: mode === "pending" ? undefined : { y: 0, opacity: 1 },
    transition: mode === "reduce" ? { duration: 0 } : { duration: 1.6, ease },
  };

  return (
    <aside className="relative isolate hidden flex-col overflow-hidden rounded-[24px] px-10 py-9 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:flex">
      <svg aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x.toFixed(2)}%`}
            cy={`${s.y.toFixed(2)}%`}
            r={s.r}
            fill="#fff"
            opacity={s.o}
            className="animate-[dp-cta-twinkle_var(--t)_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ ["--t" as string]: `${s.t.toFixed(1)}s`, animationDelay: `-${s.d.toFixed(1)}s` }}
          />
        ))}
      </svg>

      {/* atmosphere, brighter while a field has focus */}
      <motion.div aria-hidden="true" {...rise} className="pointer-events-none absolute -bottom-[330px] left-1/2 -z-30 h-[700px] w-[1200px] -translate-x-1/2">
        <div className="h-full w-full bg-[radial-gradient(ellipse_45%_45%_at_50%_55%,rgba(190,200,255,0.5),rgba(92,100,220,0.32)_38%,rgba(60,62,170,0.12)_62%,rgba(10,10,10,0)_80%)]" />
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_40%_38%_at_50%_58%,rgba(190,200,255,0.35),rgba(10,10,10,0)_75%)] transition-opacity duration-700 ${focused ? "opacity-100" : "opacity-0"}`}
        />
      </motion.div>
      {/* planet */}
      <motion.div
        aria-hidden="true"
        {...rise}
        className="pointer-events-none absolute left-1/2 top-[calc(100%-120px)] -z-20 h-[1500px] w-[1500px] -translate-x-1/2 rounded-full bg-[#0a0a0a] shadow-[inset_0_2px_20px_#fff,0_-8px_40px_2px_rgba(255,255,255,0.38)]"
      />

      <motion.div {...reveal(0.15)}>
        <AuthLogo />
      </motion.div>
      <div className="mb-[150px] mt-auto">{children}</div>
    </aside>
  );
}

export function AuthShell({ panel, children }: { panel: ReactNode; children: ReactNode }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="grid min-h-dvh bg-[#0a0a0a] font-sans text-[#f0f0f0] selection:bg-[#bec8ff]/25 lg:grid-cols-[1.05fr_1fr] lg:gap-3 lg:p-3"
      onFocus={(e) => setFocused(e.target instanceof HTMLInputElement)}
      onBlur={() => setFocused(false)}
    >
      <HorizonPanel focused={focused}>
        {panel}
      </HorizonPanel>

      <main className="relative isolate flex justify-center overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:items-center lg:py-10">
        {/* faint glow behind the form on small screens, where the panel is hidden */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[420px] left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_45%_45%_at_50%_55%,rgba(150,160,255,0.28),rgba(10,10,10,0)_70%)] lg:hidden"
        />
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
