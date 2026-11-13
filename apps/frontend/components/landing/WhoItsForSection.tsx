"use client";

/**
 * "Who it's for" section (persona spotlight): three audience tabs that auto-advance
 * with a progress line. The stage shows who the audience is and the first session
 * DevPrep would set up for them, ticking off its items one by one.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], display: "swap" });

const PERSONAS = [
  {
    num: "001",
    title: "Students & Grads",
    tag: "First technical role",
    body: "Preparing for your first technical role? DevPrep helps you simulate real interview pressure before the real thing — no prior experience needed.",
    role: "Frontend Engineer · Entry level",
    plan: ["Tell me about yourself", "DSA fundamentals with live code", "Walk through a college project"],
    mins: 25,
  },
  {
    num: "002",
    title: "Job Switchers",
    tag: "Changing roles or levelling up",
    body: "Changing industries or leveling up? Practice for a new role with questions that match exactly what your target company tests.",
    role: "Backend Engineer · Mid level",
    plan: ["Why are you making the switch?", "Map past experience to the new role", "Role-specific technical round"],
    mins: 30,
  },
  {
    num: "003",
    title: "Bootcamp Grads",
    tag: "Turning skills into answers",
    body: "You know how to build. Now learn how to talk about it. DevPrep bridges the gap between your skills and your ability to demonstrate them.",
    role: "Full Stack Developer · Junior",
    plan: ["Walk through your portfolio project", "Explain trade-offs out loud", "Behavioral: working on a team"],
    mins: 25,
  },
] as const;

const DURATION = 6000; // ms per persona
const personaAt = (i: number) => PERSONAS[i] ?? PERSONAS[0];
const SWAP_MS = 260;

function Check({ done }: { done: boolean }) {
  return (
    <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition-[background-color,box-shadow] duration-300 ${done ? "bg-[#f0f0f0]" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"}`}>
      <svg viewBox="0 0 10 10" aria-hidden="true" className={`h-2.5 w-2.5 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${done ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
        <path d="M2 5.2 4.1 7.3 8 3" fill="none" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function WhoItsForSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [active, setActive] = useState(0); // selected tab
  const [shown, setShown] = useState(0); // persona rendered in the stage (lags during the swap)
  const [swapping, setSwapping] = useState(false);
  const [ticked, setTicked] = useState(0); // plan items checked off
  const [started, setStarted] = useState(false);
  const [reduce, setReduce] = useState(false);

  const paused = useRef(false);
  const inView = useRef(false);
  const elapsed = useRef(0);

  // reduced-motion preference, read after mount so server and client HTML match
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // start when the section first comes into view; keep track of visibility for pausing
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      inView.current = !!entry?.isIntersecting;
      if (entry?.isIntersecting) setStarted(true);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // swap the stage content when the active tab changes
  useEffect(() => {
    if (active === shown) return;
    if (reduce) {
      setShown(active);
      return;
    }
    setSwapping(true);
    const t = setTimeout(() => {
      setShown(active);
      setSwapping(false);
    }, SWAP_MS);
    return () => clearTimeout(t);
  }, [active, shown, reduce]);

  // tick the plan items off once the stage shows a persona
  useEffect(() => {
    if (!started) return;
    if (reduce) {
      setTicked(personaAt(shown).plan.length);
      return;
    }
    setTicked(0);
    const timers = personaAt(shown).plan.map((_, k) => setTimeout(() => setTicked(k + 1), 450 + k * 380));
    return () => timers.forEach(clearTimeout);
  }, [shown, started, reduce]);

  // auto-advance loop: writes the progress line directly, no re-render per frame
  useEffect(() => {
    if (!started || reduce) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      if (!paused.current && inView.current && !document.hidden) elapsed.current += dt;
      const p = Math.min(elapsed.current / DURATION, 1);
      tabRefs.current[active]?.style.setProperty("--p", String(p));
      if (p >= 1) {
        elapsed.current = 0;
        setActive((a) => (a + 1) % PERSONAS.length);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, started, reduce]);

  const select = (i: number) => {
    tabRefs.current.forEach((b) => b?.style.setProperty("--p", "0"));
    elapsed.current = 0;
    setActive(i);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + PERSONAS.length) % PERSONAS.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  const p = personaAt(shown);
  const fade = `transition-[opacity,transform,filter] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${swapping ? "translate-y-2.5 opacity-0 blur-[6px]" : "translate-y-0 opacity-100 blur-0"}`;

  return (
    <section ref={sectionRef} aria-labelledby="who-title" className="relative overflow-hidden bg-[#0a0a0a] px-5 pb-24 pt-20 font-sans text-[#f0f0f0] sm:px-6 sm:pb-32 sm:pt-28">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[60%] h-[620px] w-[1100px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(92,100,220,0.18),rgba(10,10,10,0)_70%)]" />

      <div className="relative mx-auto mb-9 max-w-[760px] text-center sm:mb-11">
        <div className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
          <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
          Who it&rsquo;s for
        </div>
        <h2 id="who-title" className="m-0 text-[32px] font-medium leading-[1.06] tracking-[-0.05em] sm:text-[52px]">
          Built for anyone
          <br />
          <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>on the job hunt.</em>
        </h2>
      </div>

      <div
        role="tablist"
        aria-label="Who DevPrep is for"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        className="relative mx-auto mb-[22px] flex w-full max-w-max gap-1.5 overflow-x-auto rounded-xl bg-white/[0.035] p-[5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] [scrollbar-width:none]"
      >
        {PERSONAS.map((persona, i) => {
          const on = i === active;
          return (
            <button
              key={persona.title}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`who-tab-${i}`}
              aria-selected={on}
              aria-controls="who-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`relative cursor-pointer overflow-hidden whitespace-nowrap rounded-lg px-[11px] py-[9px] text-[13px] tracking-[-0.03em] transition-[color,background-color] duration-300 [--p:0] sm:px-4 sm:py-2.5 sm:text-[14px] ${on ? "bg-white/[0.07] text-[#f0f0f0]" : "text-white/50 hover:text-[#f0f0f0]"}`}
            >
              {persona.title}
              <i aria-hidden="true" className={`absolute inset-x-2.5 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/10 ${on && !reduce ? "opacity-100" : "opacity-0"}`}>
                <b className="block h-full w-full origin-left scale-x-[var(--p)] rounded-full bg-[#bec8ff]" />
              </i>
            </button>
          );
        })}
      </div>

      <div
        id="who-panel"
        role="tabpanel"
        aria-labelledby={`who-tab-${active}`}
        aria-live="polite"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        className="relative mx-auto grid max-w-[1000px] grid-cols-1 items-center gap-5 rounded-[22px] bg-[linear-gradient(180deg,#111114,#0c0c0e)] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_30px_90px_-40px_rgba(80,90,220,0.35)] md:min-h-[300px] md:grid-cols-[1fr_1.05fr] md:gap-10 md:px-11 md:py-10"
      >
        <div className={fade}>
          <div className={`${serif.className} text-[60px] leading-[0.9] tracking-normal text-[#bec8ff] md:text-[84px]`} style={{ fontStyle: "italic" }}>{p.num}</div>
          <div className="mt-3.5 text-[13px] text-white/45">{p.tag}</div>
          <h3 className="mt-1.5 text-[26px] font-medium tracking-[-0.045em] md:text-[32px]">{p.title}</h3>
          <p className="mt-2.5 max-w-[400px] text-[15px] leading-[1.55] tracking-[-0.03em] text-white/56 md:text-[15.5px]">{p.body}</p>
        </div>

        <div className={`rounded-[14px] bg-[#0d0d0f] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ${fade}`}>
          <div className="mb-1 flex items-baseline justify-between text-[12px] text-white/40">
            <b className="text-[14px] font-medium text-[#f0f0f0]">Your first session</b>
            <span>~{p.mins} min</span>
          </div>
          <div className="mb-3 text-[12.5px] text-[#bec8ff]">{p.role}</div>
          <ul className="m-0 list-none p-0">
            {p.plan.map((item, k) => (
              <li key={item} className="flex items-center gap-3 border-t border-white/[0.06] py-[11px] text-[14px] text-white/80">
                <Check done={k < ticked} />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[10px] bg-[linear-gradient(90deg,rgba(92,100,220,0.16),rgba(92,100,220,0.04))] px-3 py-2.5 text-[13px] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.22)]">
            <span className="text-white/60">Tailored to where you are</span>
            <button
              type="button"
              onClick={() => router.push("/auth/signup")}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-[7px] bg-[#f0f0f0] px-[11px] py-1.5 font-medium text-[#0a0a0a] transition-colors hover:bg-white"
            >
              Start free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhoItsForSection;
