"use client";

/**
 * Pricing section: two "pass" cards. Early access is free and lists only what works
 * today (counts derived from the real role list). Pro is shown with its price and a
 * "Coming soon" badge, because paid plans aren't available to buy yet.
 */

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import { serif } from "@/lib/fonts";
import { ROLES, ROLE_CATEGORIES, ROLE_DURATION_RANGE } from "@/data/roles";

const ease = [0.16, 1, 0.3, 1] as const;

const FREE_ITEMS = [
  "Real-time voice interviews with Zara",
  "A feedback report and voice retries after every interview",
  `All ${ROLES.length} interview roles`,
  `All ${ROLE_CATEGORIES.length} categories, ${ROLE_CATEGORIES[0]} to ${ROLE_CATEGORIES[ROLE_CATEGORIES.length - 1]}`,
  `${ROLE_DURATION_RANGE.min}–${ROLE_DURATION_RANGE.max} minute mock interviews`,
  "Unlimited practice while in early access",
];

const PRO_ITEMS = [
  "Everything in Early access",
  "Questions tailored to your resume",
  "Live code execution for technical rounds",
];

function Tick({ on }: { on: boolean }) {
  return (
    <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition-[background-color,box-shadow] duration-300 ${on ? "bg-[#f0f0f0]" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"}`}>
      <svg viewBox="0 0 10 10" aria-hidden="true" className={`h-2.5 w-2.5 transition-[opacity,transform] duration-300 ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
        <path d="M2 5.2 4.1 7.3 8 3" fill="none" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Dot() {
  return (
    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(190,200,255,0.3)]">
      <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] opacity-70" />
    </span>
  );
}

/** Gentle 3D tilt + spotlight that follow the pointer. */
function useTilt(enabled: boolean) {
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };
  return { onPointerMove, onPointerLeave };
}

const cardBase =
  "relative flex flex-col overflow-hidden rounded-[24px] px-[22px] pb-7 pt-[26px] transition-transform duration-200 ease-out [--mx:50%] [--my:30%] [--rx:0deg] [--ry:0deg] [transform:rotateX(var(--rx))_rotateY(var(--ry))] motion-reduce:[transform:none] sm:px-[34px] sm:pb-[30px] sm:pt-[34px]";

export function PricingSection() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [reduce, setReduce] = useState(false);
  const [ticked, setTicked] = useState(0);

  // read after mount so server and client render the same HTML
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduce) {
      setTicked(FREE_ITEMS.length);
      return;
    }
    if (!inView) return;
    const timers = FREE_ITEMS.map((_, k) => setTimeout(() => setTicked(k + 1), 700 + k * 220));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const tilt = useTilt(!reduce);
  const show = inView || reduce;
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 30, filter: "blur(8px)" },
    animate: show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 0.9, delay, ease },
  });

  return (
    <section ref={ref} id="pricing" aria-labelledby="pricing-title" className="relative scroll-mt-16 overflow-hidden bg-[#0a0a0a] px-5 pb-24 pt-20 font-sans text-[#f0f0f0] sm:px-6 sm:pb-32 sm:pt-28">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[62%] h-[640px] w-[1100px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(92,100,220,0.24),rgba(10,10,10,0)_70%)]" />

      <div className="relative mx-auto mb-10 max-w-[760px] text-center sm:mb-[46px]">
        <div className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
          <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
          Pricing
        </div>
        <h2 id="pricing-title" className="m-0 text-[34px] font-medium leading-[1.06] tracking-[-0.05em] sm:text-[52px]">
          Free while we&rsquo;re
          <br />
          <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>in early access.</em>
        </h2>
        <p className="mx-auto mt-4 max-w-[460px] text-[15px] leading-[1.5] tracking-[-0.04em] text-white/56 sm:text-[16px]">
          No card, no trial clock. Practice as much as you like today. Pro adds resume-tailored questions and live code when it launches.
        </p>
      </div>

      <div className="relative mx-auto grid max-w-[980px] grid-cols-1 items-start gap-4 [perspective:1200px] md:grid-cols-2 md:gap-5">
        {/* Early access — the live, free plan */}
        <motion.article
          {...rise(0)}
          {...tilt}
          className={`${cardBase} bg-[linear-gradient(180deg,#121216,#0c0c0e)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_40px_120px_-40px_rgba(92,100,220,0.55)]`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),rgba(140,150,255,0.14),transparent_60%)]" />
          {show && !reduce && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-[60%] w-2/5 skew-x-[-12deg] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.09),transparent)] animate-[dp-pr-sheen_1.4s_0.5s_cubic-bezier(0.45,0,0.55,1)_both]" />
          )}

          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(190,200,255,0.08)] px-[11px] py-1.5 text-[12.5px] text-[#bec8ff] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.25)]">
              <i className="block h-1.5 w-1.5 rounded-full bg-[#7dde9b] shadow-[0_0_8px_#7dde9b]" />
              Early access
            </span>
            <span className="text-[12.5px] text-white/40">Live today</span>
          </div>
          <div className="relative mt-[22px] flex items-baseline gap-3">
            <b className="text-[64px] font-medium leading-[0.9] tracking-[-0.06em] sm:text-[84px]">$0</b>
            <span className="text-[15px] tracking-[-0.03em] text-white/50">while in early access</span>
          </div>
          <p className="relative mt-2.5 text-[15px] leading-[1.5] tracking-[-0.03em] text-white/56">Everything that works today, free. We&rsquo;ll tell you well before anything changes.</p>
          <div className="relative mb-1.5 mt-[26px] text-[11.5px] uppercase tracking-[0.06em] text-white/40">Included</div>
          <ul className="relative m-0 flex-1 list-none p-0">
            {FREE_ITEMS.map((item, k) => (
              <li key={item} className="flex items-center gap-3 border-t border-white/[0.06] py-2.5 text-[14.5px] tracking-[-0.02em] text-white/[0.86]">
                <Tick on={k < ticked} />
                {item}
              </li>
            ))}
          </ul>
          <div className="relative mt-[26px] flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/auth/signup")}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-[9px] bg-[#f0f0f0] px-[22px] text-[14px] font-medium tracking-[-0.04em] text-[#0a0a0a] transition-colors hover:bg-white"
            >
              Get early access
            </button>
            <small className="text-center text-[12.5px] text-white/40">Takes about a minute to sign up</small>
          </div>
        </motion.article>

        {/* Pro — priced, not purchasable yet */}
        <motion.article
          {...rise(0.12)}
          {...tilt}
          className={`${cardBase} bg-[#0d0d0f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),rgba(140,150,255,0.08),transparent_60%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="text-[15px] font-medium tracking-[-0.035em]">Pro</span>
            <span className="rounded-full bg-[rgba(190,200,255,0.08)] px-[9px] py-1 text-[11.5px] text-[#bec8ff] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.22)]">Coming soon</span>
          </div>
          <div className="relative mt-[22px] flex items-baseline gap-3">
            <b className="text-[64px] font-medium leading-[0.9] tracking-[-0.06em] text-white/90 sm:text-[84px]">$10</b>
            <span className="text-[15px] tracking-[-0.03em] text-white/50">per month</span>
          </div>
          <p className="relative mt-2.5 text-[15px] leading-[1.5] tracking-[-0.03em] text-white/50">For when you want to go deeper on every answer.</p>
          <div className="relative mb-1.5 mt-[26px] text-[11.5px] uppercase tracking-[0.06em] text-white/40">What Pro will add</div>
          <ul className="relative m-0 flex-1 list-none p-0">
            {PRO_ITEMS.map((item, k) => (
              <li key={item} className={`flex items-center gap-3 border-t border-white/[0.06] py-2.5 text-[14.5px] tracking-[-0.02em] ${k === 0 ? "text-white/[0.86]" : "text-white/55"}`}>
                {k === 0 ? <Tick on /> : <Dot />}
                {item}
              </li>
            ))}
          </ul>
          <div className="relative mt-[26px] flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/auth/signup?plan=pro")}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-[9px] bg-[rgba(10,10,10,0.56)] px-[22px] text-[14px] font-medium tracking-[-0.04em] text-[#f0f0f0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
            >
              Start free, upgrade later
            </button>
            <small className="text-center text-[12.5px] text-white/40">Pro isn&rsquo;t available to buy yet</small>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

export default PricingSection;
