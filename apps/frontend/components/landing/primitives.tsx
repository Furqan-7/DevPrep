"use client";

/** Building blocks shared by the landing page sections. */

import { useRef, type CSSProperties, type ReactNode, type PointerEvent } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

export const ease = [0.16, 1, 0.3, 1] as const;

export const DEMO_URL = "https://github.com/user-attachments/assets/e849b172-3296-481f-a1bc-5e0ba44fd50e";

export const SOCIAL = {
  x: "https://x.com/B_Furqan07",
  linkedin: "https://www.linkedin.com/in/furqan-bodarni-132378327/",
  github: "https://github.com/Furqan-7",
};

/** Fades and un-blurs its children the first time they scroll into view. */
export function Reveal({ children, delay = 0, y = 18, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Small pill above a section title. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[12.5px] font-medium tracking-[-0.01em] text-white/70 backdrop-blur",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[linear-gradient(135deg,#8fb0ff,#c4a6ff)] shadow-[0_0_10px_#8fb0ff]" />
      {children}
    </span>
  );
}

/** Eyebrow, headline and one line of copy, centred above a section. */
export function SectionHeader({ eyebrow, title, body, className }: { eyebrow: string; title: ReactNode; body?: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-[720px] text-center", className)}>
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="fx-text-fade m-0 mt-5 text-[38px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[54px]">{title}</h2>
      </Reveal>
      {body ? (
        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 max-w-[540px] text-[16px] leading-[1.6] tracking-[-0.01em] text-white/55 sm:text-[17px]">{body}</p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** Card with a hairline gradient border and a soft light that follows the cursor. */
export function SpotlightCard({ children, className, spot }: { children: ReactNode; className?: string; spot?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      style={spot ? ({ "--fx-spot": spot } as CSSProperties) : undefined}
      className={cn("fx-border fx-spotlight overflow-hidden rounded-[22px] bg-[#0b0b0e]", className)}
    >
      {children}
    </div>
  );
}

/** Whether an element has scrolled into view, for visuals that animate once seen. */
export function useSeen<T extends Element>(amount = 0.4) {
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, amount });
  return [ref, seen] as const;
}
