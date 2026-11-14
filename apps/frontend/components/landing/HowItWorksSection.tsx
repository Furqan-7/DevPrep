"use client";

/**
 * "How it works" section: a vertical timeline whose glowing line is drawn by scroll.
 * When the light reaches a step, its node lights up and the step slides in with a
 * small product screen. A CTA appears once the line completes.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { serif } from "@/lib/fonts";

const mono = { fontFamily: "var(--font-jbmono, 'JetBrains Mono'), ui-monospace, monospace" };

const STEPS = [
  { num: "01", title: "Pick your role", body: "Choose from 24 roles across Engineering, Data, Design, Product and Behavioral. Resume-tailored questions are coming with Pro." },
  { num: "02", title: "Review what to expect", body: "See the top 10 most common questions for your role before you start. Know what's coming so you can walk in with a plan." },
  { num: "03", title: "Take the interview", body: "Talk naturally to Zara and answer by voice. When you finish, you get a score for every answer, what was missing, and a stronger answer you can practice." },
] as const;

const box = "relative overflow-hidden rounded-[14px] bg-[#0d0d0f] p-[18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]";
const ease = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/* ───────── step screens ───────── */
const ROLES = [
  { category: "Engineering", name: "Frontend Engineer", pick: true },
  { category: "Engineering", name: "Backend Engineer" },
  { category: "Data", name: "ML Engineer" },
  { category: "Product", name: "Product Manager" },
];

function PickScreen({ on }: { on: boolean }) {
  return (
    <div className={box}>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((r) => (
          <div
            key={r.name}
            className={`rounded-[9px] px-3 py-2.5 text-[13px] transition-[box-shadow,background-color] duration-[400ms] ${r.pick && on ? "bg-[rgba(190,200,255,0.08)] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.55)] delay-[1100ms]" : "bg-white/[0.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"}`}
          >
            <small style={mono} className={`mb-[3px] block text-[10px] uppercase tracking-[0.06em] transition-colors duration-[400ms] ${r.pick && on ? "text-[#bec8ff] delay-[1100ms]" : "text-white/40"}`}>{r.category}</small>
            {r.name}
          </div>
        ))}
      </div>
      <div className="my-3 flex items-center gap-2.5 text-[11.5px] text-white/35 before:h-px before:flex-1 before:bg-white/[0.08] after:h-px after:flex-1 after:bg-white/[0.08]">or</div>
      <div className="flex items-center gap-2.5 rounded-[9px] border border-dashed border-white/[0.16] px-3 py-2.5 text-[12.5px] text-white/50">
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#bec8ff]" aria-hidden="true">
          <path d="M4 1.5h5L12.5 5v9.5h-8.5z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M9 1.5V5h3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span>Resume-tailored questions <b className="font-medium text-[#bec8ff]">· coming with Pro</b></span>
      </div>
      {/* cursor glides to Frontend Engineer and clicks */}
      <svg
        viewBox="0 0 18 18"
        aria-hidden="true"
        className={`absolute h-[18px] w-[18px] transition-[left,top,opacity] duration-1000 ${ease} motion-reduce:hidden ${on ? "left-[30%] top-[26%] opacity-100 delay-200 animate-[dp-hiw-click_0.3s_1.05s_both]" : "left-[70%] top-[85%] opacity-0"}`}
      >
        <path d="M3 2l11 6.2-4.8 1.1L7.4 14z" fill="#fff" stroke="#0a0a0a" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const QUESTIONS = ["Tell me about a project you’re proud of", "How does the browser render a page?", "Explain the virtual DOM and reconciliation", "Design an autocomplete component"];

function ReviewScreen({ on }: { on: boolean }) {
  return (
    <div className={box}>
      <div className="mb-2.5 flex justify-between text-[12px] text-white/40">
        <span><b className="font-medium text-[#f0f0f0]">Frontend Engineer</b> · top questions</span>
        <span>10 total</span>
      </div>
      {QUESTIONS.map((q, i) => (
        <div
          key={q}
          style={{ transitionDelay: on ? `${150 + i * 120}ms` : "0ms" }}
          className={`flex items-center gap-2.5 border-t border-white/[0.06] py-[9px] text-[13px] transition-[opacity,transform] duration-500 ${ease} first-of-type:border-t-0 motion-reduce:transition-none ${on ? "translate-x-0 opacity-100" : "-translate-x-2.5 opacity-0"}`}
        >
          <em style={mono} className="w-4 text-[11px] not-italic text-white/30">0{i + 1}</em>
          <span className="flex-1 text-white/80">{q}</span>
          <i className="hidden rounded-full bg-[rgba(190,200,255,0.08)] px-[7px] py-[3px] text-[10.5px] not-italic text-[#bec8ff] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.2)] sm:inline">Asked often</i>
        </div>
      ))}
    </div>
  );
}

const BARS = Array.from({ length: 34 }, (_, i) => ({ delay: -((i * 0.13) % 1.1), height: 30 + ((i * 37) % 65) }));

function TakeScreen({ on }: { on: boolean }) {
  return (
    <div className={box}>
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="relative grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#d9deff,#6f78e0_70%)] text-[13px] font-semibold text-[#0a0a0a]">
          <span className="absolute inset-0 rounded-full border border-[rgba(190,200,255,0.55)] animate-[dp-fx-ring_2.4s_ease-out_infinite] motion-reduce:animate-none" />
          Z
        </div>
        <div className="flex h-[30px] flex-1 items-center gap-[3px]" aria-hidden="true">
          {BARS.map((b, i) => (
            <span
              key={i}
              style={{ animationDelay: `${b.delay}s`, ["--h" as string]: `${b.height}%` }}
              className="h-[20%] max-w-[4px] flex-1 rounded-[3px] bg-[linear-gradient(#fff,#bec8ff)] animate-[dp-fx-bar_1.1s_ease-in-out_infinite] motion-reduce:animate-none"
            />
          ))}
        </div>
        <span className="text-[12px] tabular-nums text-white/45">18:42</span>
        <span className="rounded-[7px] bg-[rgba(255,120,120,0.14)] px-2.5 py-1.5 text-[12px] font-medium text-[#ffb3b3]">End</span>
      </div>
      <div className="my-3 flex gap-1.5">
        {["Voice", "Code editor", "Notes"].map((t, i) => (
          <span key={t} className={`rounded-md px-[9px] py-[5px] text-[11.5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ${i === 0 ? "bg-white/[0.06] text-[#f0f0f0]" : "text-white/45"}`}>{t}</span>
        ))}
      </div>
      <div className={`flex items-center gap-3 rounded-xl bg-[linear-gradient(90deg,rgba(92,100,220,0.16),rgba(92,100,220,0.04))] p-3 shadow-[inset_0_0_0_1px_rgba(190,200,255,0.25)] transition-[opacity,transform] duration-[600ms] ${ease} motion-reduce:transition-none ${on ? "translate-y-0 opacity-100 delay-[900ms]" : "translate-y-3 opacity-0"}`}>
        <b className="text-[22px] font-medium tracking-[-0.05em]">72</b>
        <div className="flex-1">
          <span className="block text-[13px] font-medium">Your report is ready</span>
          <small className="block text-[11.5px] text-white/50">Strengths, gaps and what to sharpen</small>
        </div>
        <i className="rounded-[7px] bg-[#f0f0f0] px-2.5 py-1.5 text-[12px] font-medium not-italic text-[#0a0a0a]">View</i>
      </div>
    </div>
  );
}

const SCREENS: ((props: { on: boolean }) => ReactNode)[] = [PickScreen, ReviewScreen, TakeScreen];

/* ───────── section ───────── */
export function HowItWorksSection() {
  const router = useRouter();
  // read after mount so server and client render the same HTML
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;

    const render = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const h = r.height;
      // the light sits ~62% down the viewport; everything above it is "drawn"
      const fill = reduce ? h : Math.max(0, Math.min(h, window.innerHeight * 0.62 - r.top));
      track.style.setProperty("--fill", `${fill}px`);
      track.style.setProperty("--comet", fill > 4 && fill < h - 4 ? "1" : "0");
      const next = nodeRefs.current.map((n) => (n ? fill >= n.getBoundingClientRect().top + n.offsetHeight / 2 - r.top : false));
      setActive((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reduce]);

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative scroll-mt-16 overflow-hidden bg-[#0a0a0a] px-5 pb-28 pt-20 font-sans text-[#f0f0f0] sm:px-6 sm:pb-36 sm:pt-28">
      <div className="mx-auto mb-10 max-w-[820px] text-center md:mb-[70px]">
        <div className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
          <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
          How it works
        </div>
        <h2 id="how-title" className="m-0 text-[30px] font-medium leading-[1.06] tracking-[-0.05em] sm:text-[52px]">
          From zero to interview-ready
          <br />
          <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>in three steps.</em>
        </h2>
      </div>

      <div ref={trackRef} className="relative mx-auto max-w-[1040px] [--comet:0] [--fill:0px]">
        {/* rail + drawn light + comet */}
        <div aria-hidden="true" className="absolute bottom-0 left-3 top-0 w-0.5 -translate-x-px rounded-full bg-white/[0.07] md:left-1/2">
          <div className="absolute left-0 top-0 h-[var(--fill)] w-full rounded-full bg-[linear-gradient(rgba(190,200,255,0),#bec8ff_30%,#fff)] shadow-[0_0_12px_rgba(190,200,255,0.6)]" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-[var(--fill)] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[var(--comet)] bg-[radial-gradient(circle,#fff_0,#fff_4px,rgba(220,225,255,0.85)_6px,rgba(190,200,255,0.35)_18px,rgba(92,100,220,0.16)_42px,rgba(92,100,220,0)_80px)] md:left-1/2"
        />

        <ol className="m-0 list-none p-0">
          {STEPS.map((s, i) => {
            const on = active[i] ?? false;
            const flip = i % 2 === 1;
            const Screen = SCREENS[i]!;
            const reveal = `transition-[opacity,transform,filter] duration-[800ms] ${ease} motion-reduce:transition-none ${on ? "translate-x-0 opacity-100 blur-0" : "opacity-0 blur-[8px]"}`;
            return (
              <li key={s.num} className="relative grid grid-cols-1 items-center gap-5 py-9 pl-11 md:grid-cols-2 md:gap-24 md:py-14 md:pl-0">
                <span
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className={`absolute left-3 top-[70px] h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,box-shadow] duration-500 md:left-1/2 md:top-1/2 ${on ? "bg-[#f0f0f0] shadow-[0_0_0_5px_rgba(190,200,255,0.16)]" : "bg-[#0a0a0a] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.16)]"}`}
                >
                  {on && !reduce && <span className="absolute -inset-2.5 rounded-full border border-[rgba(190,200,255,0.6)] animate-[dp-hiw-halo_2.4s_ease-out_infinite]" />}
                </span>

                <div className={`${flip ? "md:order-2" : "md:justify-self-end md:text-right"} ${reveal} ${on ? "" : flip ? "md:translate-x-6" : "md:-translate-x-6"}`}>
                  <div className={`${serif.className} text-[42px] leading-none tracking-normal text-[#bec8ff] md:text-[54px]`} style={{ fontStyle: "italic" }}>{s.num}</div>
                  <h3 className="mt-3.5 text-[24px] font-medium tracking-[-0.045em] md:text-[28px]">{s.title}</h3>
                  <p className={`mt-2.5 max-w-[400px] text-[15px] leading-[1.55] tracking-[-0.03em] text-white/56 md:text-[15.5px] ${flip ? "" : "md:ml-auto"}`}>{s.body}</p>
                </div>

                <div className={`${flip ? "md:order-1" : ""} ${reveal} ${on ? "md:delay-[120ms]" : flip ? "md:-translate-x-6" : "md:translate-x-6"}`}>
                  <Screen on={on || reduce} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* CTA appears once the last step lights up */}
      <div className="mt-7 flex justify-center">
        <button
          type="button"
          onClick={() => router.push("/auth/signup")}
          className={`inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-[#f0f0f0] px-5 text-[14px] font-medium tracking-[-0.04em] text-[#0a0a0a] transition-[opacity,transform,background-color] duration-[600ms] hover:bg-white motion-reduce:transition-none ${active[2] || reduce ? "translate-y-0 opacity-100 delay-500" : "pointer-events-none translate-y-3 opacity-0"}`}
          tabIndex={active[2] || reduce ? 0 : -1}
        >
          Start your first interview
        </button>
      </div>
    </section>
  );
}

export default HowItWorksSection;
