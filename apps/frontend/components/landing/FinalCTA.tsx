"use client";

/**
 * Closing call to action: bookends the page with the hero's look — a rounded card
 * with twinkling stars and the glowing planet horizon, which rises slightly and
 * brightens as the card scrolls into view.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { serif } from "@/lib/fonts";

const ease = [0.16, 1, 0.3, 1] as const;
const DEMO_URL = "https://github.com/user-attachments/assets/e849b172-3296-481f-a1bc-5e0ba44fd50e";

// Deterministic star field so server and client render the same markup.
const STARS = (() => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 90 }, (_, i) => ({
    x: rand() * 100,
    y: rand() * 78,
    r: [0.6, 0.7, 0.8, 1][i % 4] ?? 0.8,
    o: [0.3, 0.45, 0.6, 0.8][i % 4] ?? 0.5,
    t: 3 + rand() * 4,
    d: rand() * 5,
  }));
})();

function MicIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4" fill="currentColor" />
      <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M5.5 3.8v8.4L12.2 8z" fill="currentColor" />
    </svg>
  );
}

export function FinalCTA() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  // read after mount so server and client render the same HTML
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // horizon rises as the card scrolls in; mirrored into a plain motion value so it
  // always runs on the JS path
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => progress.set(reduce ? 1 : v));
  useEffect(() => progress.set(reduce ? 1 : scrollYProgress.get()), [reduce, progress, scrollYProgress]);
  const rise = useTransform(progress, [0, 1], [0, -70]);
  const glow = useTransform(progress, [0, 1], [0.4, 1]);

  const show = inView || reduce;
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 16, filter: "blur(8px)" },
    animate: show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 0.8, delay, ease },
  });

  const btn = "inline-flex h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-5 text-[14px] font-medium tracking-[-0.04em] transition-[background-color,box-shadow] duration-200";

  return (
    <section aria-labelledby="cta-title" className="bg-[#0a0a0a] px-4 pb-6 font-sans text-[#f0f0f0] sm:px-4">
      <div
        ref={ref}
        className="relative isolate mx-auto flex h-[560px] max-w-[1160px] flex-col items-center overflow-hidden rounded-[24px] bg-[#0a0a0a] px-5 pt-20 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:h-[640px] sm:rounded-[32px] sm:pt-[110px]"
      >
        {/* stars */}
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

        {/* atmosphere + planet horizon */}
        <motion.div
          aria-hidden="true"
          style={{ y: rise, opacity: glow, x: "-50%" }}
          className="pointer-events-none absolute -bottom-[260px] left-1/2 -z-20 h-[800px] w-[1500px] bg-[radial-gradient(ellipse_45%_45%_at_50%_55%,rgba(190,200,255,0.5),rgba(92,100,220,0.32)_38%,rgba(60,62,170,0.12)_62%,rgba(10,10,10,0)_80%)]"
        />
        <motion.div
          aria-hidden="true"
          style={{ y: rise, x: "-50%" }}
          className="pointer-events-none absolute left-1/2 top-[calc(100%-50px)] -z-10 h-[1100px] w-[1100px] rounded-full bg-[#0a0a0a] shadow-[inset_0_2px_20px_#fff,0_-8px_40px_2px_rgba(255,255,255,0.38)] sm:h-[1800px] sm:w-[1800px]"
        />

        <motion.div {...reveal(0)} className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
          <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
          Ready when you are
        </motion.div>
        <motion.h2 {...reveal(0.08)} id="cta-title" className="m-0 max-w-[760px] text-[38px] font-medium leading-[1.04] tracking-[-0.05em] sm:text-[64px]">
          Your next interview
          <br />
          starts <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>right here.</em>
        </motion.h2>
        <motion.p {...reveal(0.18)} className="mx-auto mt-[18px] max-w-[420px] text-[15.5px] leading-[1.5] tracking-[-0.04em] text-white/56 sm:text-[16.5px]">
          Pick a role, say hello to Zara, and practice out loud. Free while we&rsquo;re in early access.
        </motion.p>
        <motion.div {...reveal(0.28)} className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => router.push("/auth/signup")} className={`${btn} bg-[#f0f0f0] text-[#0a0a0a] hover:bg-white`}>
            <MicIcon />
            Start a Mock Interview
          </button>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-[rgba(10,10,10,0.56)] text-[#f0f0f0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-[10px] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]`}
          >
            <PlayIcon />
            Watch Demo
          </a>
        </motion.div>
        <motion.div {...reveal(0.36)} className="mt-4 text-[12.5px] text-white/40">No card required</motion.div>
      </div>
    </section>
  );
}

export default FinalCTA;
