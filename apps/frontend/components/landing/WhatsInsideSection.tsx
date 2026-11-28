"use client";

/**
 * "What's inside" section: product facts only, derived from the real role list so they
 * can't drift — role count, category count, session length range and real-time voice —
 * plus a marquee of every role DevPrep offers.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { serif } from "@/lib/fonts";
import { ROLES, ROLE_CATEGORIES, ROLE_DURATION_RANGE } from "@/data/roles";

const mono = { fontFamily: "var(--font-jbmono, 'JetBrains Mono'), ui-monospace, monospace" };
const ease = [0.16, 1, 0.3, 1] as const;

const categoryList = (() => {
  const c = [...ROLE_CATEGORIES];
  return c.length > 1 ? `${c.slice(0, -1).join(", ")} and ${c[c.length - 1]}` : c.join("");
})();

const BARS = Array.from({ length: 30 }, (_, i) => ({ delay: -((i * 0.13) % 1.1), height: 30 + ((i * 37) % 65) }));

/** Counts from 0 to `to` once `run` becomes true. Writes the DOM directly. */
function CountUp({ to, run, reduce }: { to: number; run: boolean; reduce: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = String(to);
      return;
    }
    if (!run) return;
    let raf = 0;
    const start = setTimeout(() => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min((t - t0) / 1300, 1);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 250);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [to, run, reduce]);
  return <span ref={ref} className="tabular-nums">0</span>;
}

function Tile({ index, children, label, sub }: { index: number; children: React.ReactNode; label: string; sub: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay: 0.05 + index * 0.1, ease } } }}
      className="relative overflow-hidden rounded-[18px] bg-[#0d0d0f] px-6 pb-6 pt-[26px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] after:absolute after:inset-x-6 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(190,200,255,0.5),transparent)]"
    >
      <div className="flex min-h-12 items-baseline gap-1.5 text-[48px] font-medium leading-none tracking-[-0.06em] sm:min-h-16 sm:text-[64px]">{children}</div>
      <div className="mt-3.5 text-[15px] font-medium tracking-[-0.035em]">{label}</div>
      <div className="mt-1 text-[13px] leading-[1.5] tracking-[-0.02em] text-white/50">{sub}</div>
    </motion.div>
  );
}

function RoleChip({ title, category }: { title: string; category: string }) {
  return (
    <span className="flex shrink-0 items-center gap-[9px] whitespace-nowrap rounded-full bg-white/[0.03] px-3.5 py-[9px] text-[13.5px] tracking-[-0.02em] text-white/[0.78] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
      {title}
      <small style={mono} className="text-[10px] uppercase tracking-[0.06em] text-white/35">{category}</small>
    </span>
  );
}

export function WhatsInsideSection() {
  const ref = useRef<HTMLElement>(null);
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

  const half = Math.ceil(ROLES.length / 2);
  const rows = [ROLES.slice(0, half), ROLES.slice(half)];

  return (
    <section ref={ref} aria-labelledby="inside-title" className="relative overflow-hidden bg-[#0a0a0a] pb-24 pt-20 font-sans text-[#f0f0f0] sm:pb-[120px] sm:pt-28">
      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease }}
        className="mx-auto mb-10 max-w-[760px] px-5 text-center sm:mb-[52px] sm:px-6"
      >
        <div className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
          <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
          What&rsquo;s inside
        </div>
        <h2 id="inside-title" className="m-0 text-[32px] font-medium leading-[1.06] tracking-[-0.05em] sm:text-[52px]">
          One place to practice
          <br />
          <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>every kind of round.</em>
        </h2>
      </motion.div>

      <motion.div initial="hidden" animate={inView || reduce ? "visible" : "hidden"} className="mx-auto grid max-w-[1080px] grid-cols-2 gap-3 px-5 sm:gap-3.5 sm:px-6 lg:grid-cols-4">
        <Tile index={0} label="Interview roles" sub="From Frontend to Product, each with its own question set.">
          <CountUp to={ROLES.length} run={inView} reduce={reduce} />
        </Tile>
        <Tile index={1} label="Categories" sub={`${categoryList}.`}>
          <CountUp to={ROLE_CATEGORIES.length} run={inView} reduce={reduce} />
        </Tile>
        <Tile index={2} label="Per mock interview" sub="Short enough for a lunch break, long enough to feel real.">
          <span className="flex items-baseline gap-0.5 text-[34px] sm:text-[52px]">
            <CountUp to={ROLE_DURATION_RANGE.min} run={inView} reduce={reduce} />–<CountUp to={ROLE_DURATION_RANGE.max} run={inView} reduce={reduce} />
            <small className="ml-1 text-[14px] font-normal tracking-[-0.03em] text-white/45 sm:text-[18px]">min</small>
          </span>
        </Tile>
        <Tile index={3} label="Real-time voice" sub="You speak, Zara listens and answers out loud.">
          <span className="flex h-12 w-full items-center gap-[3px] sm:h-16" aria-hidden="true">
            {BARS.map((b, i) => (
              <span
                key={i}
                style={{ animationDelay: `${b.delay}s`, ["--h" as string]: `${b.height}%` }}
                className="h-[20%] max-w-[5px] flex-1 rounded-[3px] bg-[linear-gradient(#fff,#bec8ff)] animate-[dp-fx-bar_1.1s_ease-in-out_infinite] motion-reduce:h-1/2 motion-reduce:animate-none"
              />
            ))}
          </span>
        </Tile>
      </motion.div>

      {/* every role DevPrep offers */}
      <div className="mt-10 sm:mt-[46px]">
        <h3 className="sr-only">All {ROLES.length} roles</h3>
        {reduce ? (
          <ul className="mx-auto flex max-w-[1080px] list-none flex-wrap justify-center gap-2.5 px-5 sm:px-6">
            {ROLES.map((r) => (
              <li key={r.title}><RoleChip title={r.title} category={r.category} /></li>
            ))}
          </ul>
        ) : (
          <div className="group flex flex-col gap-2.5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            {rows.map((row, i) => (
              <div
                key={i}
                aria-hidden={i > 0 ? true : undefined}
                className={`flex w-max gap-2.5 group-hover:[animation-play-state:paused] ${i === 0 ? "animate-[dp-wi-marquee_60s_linear_infinite]" : "animate-[dp-wi-marquee_70s_linear_infinite_reverse]"}`}
              >
                {[...row, ...row].map((r, k) => (
                  <RoleChip key={`${r.title}-${k}`} title={r.title} category={r.category} />
                ))}
              </div>
            ))}
            <p className="sr-only">{ROLES.map((r) => r.title).join(", ")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default WhatsInsideSection;
