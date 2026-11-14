"use client";

import { useEffect, useState } from "react";

export const ease = [0.16, 1, 0.3, 1] as const;

export type MotionMode = "pending" | "full" | "reduce";

/**
 * Reads prefers-reduced-motion after mount, so server and client render the same
 * HTML. "pending" until then: entrances should wait for it and then either play
 * ("full") or jump straight to the end ("reduce"), never half-play a fade.
 */
export function useMotionMode(): MotionMode {
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

/** Blur-up entrance props for a motion element, honouring the motion mode. */
export function revealProps(mode: MotionMode, delay = 0) {
  return {
    initial: { opacity: 0, y: 14, filter: "blur(8px)" },
    animate: mode === "pending" ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: mode === "reduce" ? { duration: 0 } : { duration: 0.8, delay, ease },
  };
}
