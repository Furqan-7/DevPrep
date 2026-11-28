"use client";

/**
 * Features section ("living bento"): four dark tiles, each running a small live
 * loop of the real product — Zara talking, code running, roles, and the score report.
 * Loops start when the section scrolls into view and stop when it unmounts.
 */

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { serif } from "@/lib/fonts";


const ease = [0.16, 1, 0.3, 1] as const;
const mono = { fontFamily: "var(--font-jbmono, 'JetBrains Mono'), ui-monospace, monospace" };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ───────── Zara: waveform + typing transcript ───────── */
type Line = { id: number; who: "Zara" | "You"; text: string; typing: boolean };

const SCRIPT: Omit<Line, "typing" | "id">[] = [
  { who: "Zara", text: "Walk me through how you'd design a rate limiter for an API." },
  { who: "You", text: "I'd start with a token bucket per user, stored in Redis…" },
  { who: "Zara", text: "Good. How would that hold up across multiple regions?" },
];

const BARS = Array.from({ length: 84 }, (_, i) => ({ delay: -((i * 0.13) % 1.1), height: 30 + ((i * 37) % 65) }));

function VoiceDemo({ active, reduce }: { active: boolean; reduce: boolean }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [speaker, setSpeaker] = useState<Line["who"]>("Zara");
  const [seconds, setSeconds] = useState(252);

  useEffect(() => {
    if (reduce) {
      setLines(SCRIPT.slice(1).map((l, i) => ({ ...l, id: i, typing: false })));
      return;
    }
    if (!active) return;
    let alive = true;
    let nextId = 0;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    (async () => {
      while (alive) {
        setLines([]);
        for (const line of SCRIPT) {
          if (!alive) return;
          setSpeaker(line.who);
          setLines((ls) => [...ls, { ...line, id: nextId++, text: "", typing: true }]);
          for (let i = 1; i <= line.text.length; i++) {
            if (!alive) return;
            const text = line.text.slice(0, i);
            setLines((ls) => ls.map((l, k) => (k === ls.length - 1 ? { ...l, text } : l)));
            await sleep(26);
          }
          setLines((ls) => ls.map((l, k) => (k === ls.length - 1 ? { ...l, typing: false } : l)));
          await sleep(900);
          setLines((ls) => (ls.length > 2 ? ls.slice(1) : ls));
        }
        await sleep(1400);
      }
    })();
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [active, reduce]);

  const listening = speaker === "You";
  return (
    <div className="flex h-full flex-col gap-3.5">
      <div className="flex items-center gap-4">
        <div className="relative grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#d9deff,#6f78e0_70%)] text-[15px] font-semibold text-[#0a0a0a]">
          <span className="absolute inset-0 rounded-full border border-[rgba(190,200,255,0.55)] animate-[dp-fx-ring_2.4s_ease-out_infinite] motion-reduce:animate-none" />
          <span className="absolute inset-0 rounded-full border border-[rgba(190,200,255,0.55)] animate-[dp-fx-ring_2.4s_ease-out_1.2s_infinite] motion-reduce:animate-none" />
          Z
        </div>
        <div>
          <div className="text-[14px] font-medium">Zara · AI interviewer</div>
          <div className="flex items-center gap-1.5 text-[12px] text-white/40">
            <i className="h-1.5 w-1.5 rounded-full bg-[#7dde9b] shadow-[0_0_8px_#7dde9b]" />
            {listening ? "Listening" : "Speaking"}
          </div>
        </div>
        <div className="ml-auto text-[12px] tabular-nums text-white/40">
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
        </div>
      </div>

      <div className="flex h-11 items-center gap-[3px]" aria-hidden="true">
        {BARS.map((b, i) => (
          <span
            key={i}
            style={{ animationDelay: `${b.delay}s`, ["--h" as string]: `${b.height}%` }}
            className={`h-[20%] max-w-[5px] flex-1 rounded-[3px] animate-[dp-fx-bar_1.1s_ease-in-out_infinite] motion-reduce:animate-none ${listening ? "bg-white/35" : "bg-[linear-gradient(#fff,#bec8ff)]"}`}
          />
        ))}
      </div>

      <div className="flex min-h-[84px] flex-col gap-2 text-[13.5px] leading-[1.45]">
        {lines.map((l) => (
          <div key={l.id}>
            <b className={`mr-1.5 font-medium ${l.who === "You" ? "text-white/56" : "text-[#bec8ff]"}`}>{l.who}</b>
            <span className={l.who === "You" ? "text-white/56" : "text-[#f0f0f0]"}>{l.text}</span>
            {l.typing && <i className="ml-0.5 inline-block h-3.5 w-[7px] bg-[#bec8ff] align-[-2px] animate-[dp-fx-blink_1s_steps(1)_infinite]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Code: type, run, pass ───────── */
type Tok = [cls: string, text: string];
const K = "text-[#bec8ff]";
const F = "text-white";
const P = "text-white/60";
const CODE: Tok[][] = [
  [[K, "def"], ["", " "], [F, "two_sum"], [P, "(nums, target):"]],
  [["", "    seen "], [P, "= {}"]],
  [["", "    "], [K, "for"], ["", " i, n "], [K, "in"], ["", " "], [F, "enumerate"], [P, "(nums):"]],
  [["", "        "], [K, "if"], ["", " target "], [P, "-"], ["", " n "], [K, "in"], ["", " seen"], [P, ":"]],
  [["", "            "], [K, "return"], ["", " "], [P, "[seen[target - n], i]"]],
  [["", "        seen[n] "], [P, "="], ["", " i"]],
];

function CodeDemo({ active, reduce }: { active: boolean; reduce: boolean }) {
  const [typed, setTyped] = useState(0);
  const [rows, setRows] = useState(0);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (reduce) {
      setTyped(CODE.length);
      setRows(2);
      return;
    }
    if (!active) return;
    let alive = true;
    (async () => {
      while (alive) {
        setTyped(0);
        setRows(0);
        await sleep(500);
        for (let i = 1; i <= CODE.length; i++) {
          if (!alive) return;
          setTyped(i);
          await sleep(480);
        }
        await sleep(400);
        setPressed(true);
        await sleep(150);
        setPressed(false);
        for (let r = 1; r <= 2; r++) {
          await sleep(380);
          if (!alive) return;
          setRows(r);
        }
        await sleep(2600);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, reduce]);

  return (
    <div className="flex h-full flex-col text-[12.5px]" style={mono}>
      <div className="mb-2.5 flex items-center gap-2 font-sans text-[12px] tracking-[-0.02em] text-white/40">
        <span className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[#f0f0f0]">solution.py</span>
        <span>tests.py</span>
        <span className={`ml-auto flex items-center gap-1.5 rounded-md bg-[#f0f0f0] px-2.5 py-[5px] font-medium text-[#0a0a0a] transition-transform duration-150 ${pressed ? "scale-[0.94]" : ""}`}>
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true"><path d="M2.5 1.5v7L8.5 5z" fill="currentColor" /></svg>
          Run
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-[3px] whitespace-pre leading-[1.55]">
        {CODE.map((line, i) => (
          <div key={i} className="flex gap-3.5">
            <em className="w-3.5 shrink-0 text-right not-italic text-white/20">{i + 1}</em>
            <span className={`inline-block overflow-hidden align-top transition-[max-width] duration-500 ease-[steps(28,end)] motion-reduce:transition-none ${i < typed ? "max-w-[40ch]" : "max-w-0"}`}>
              {line.map(([cls, text], k) => <span key={k} className={cls}>{text}</span>)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex min-h-9 flex-col gap-1 rounded-lg bg-white/[0.035] px-3 py-2 text-[12px] text-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className={`transition-all duration-300 ${rows >= 1 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>$ python tests.py</div>
        <div className={`text-[#7dde9b] transition-all duration-300 ${rows >= 2 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>✓ 3 / 3 tests passed · 14 ms</div>
      </div>
    </div>
  );
}

/* ───────── Roles: slow vertical marquee ───────── */
const ROLES: { name: string; category: string; highlight?: boolean }[] = [
  { name: "Frontend Engineer", category: "Engineering", highlight: true },
  { name: "Backend Engineer", category: "Engineering" },
  { name: "System Design", category: "Engineering" },
  { name: "ML Engineer", category: "Data" },
  { name: "Data Engineer", category: "Data" },
  { name: "Product Manager", category: "Product" },
  { name: "Full Stack Developer", category: "Engineering" },
  { name: "Behavioral Round", category: "Behavioral" },
];

function RolesDemo() {
  return (
    <div className="relative h-full overflow-hidden [mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)]" aria-hidden="true">
      <div className="flex flex-col gap-2 animate-[dp-fx-up_14s_linear_infinite] motion-reduce:animate-none">
        {[...ROLES, ...ROLES].map((r, i) => (
          <div key={i} className={`flex items-center justify-between rounded-[9px] px-3 py-2.5 text-[13.5px] ${r.highlight ? "bg-[rgba(190,200,255,0.07)] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.45)]" : "bg-white/[0.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"}`}>
            <span>{r.name}</span>
            <small style={mono} className={`text-[11px] uppercase tracking-[0.06em] ${r.highlight ? "text-[#bec8ff]" : "text-white/40"}`}>{r.category}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Feedback: score ring + skill bars ───────── */
// Same shape as the real report: an overall score out of 100 and three ratings out of 10.
const SKILLS = [
  { label: "Technical", value: 7 },
  { label: "Communication", value: 8 },
  { label: "Confidence", value: 6 },
];
const SCORE = 72;
const RING = 283; // circumference of r=45

function FeedbackDemo({ active, reduce }: { active: boolean; reduce: boolean }) {
  const [k, setK] = useState(0); // 0 → 1 progress of the fill

  useEffect(() => {
    if (reduce) {
      setK(1);
      return;
    }
    if (!active) return;
    let alive = true;
    let raf = 0;
    (async () => {
      while (alive) {
        setK(0);
        await sleep(600);
        if (!alive) return;
        await new Promise<void>((done) => {
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / 1400, 1);
            setK(1 - Math.pow(1 - p, 3));
            if (p < 1 && alive) raf = requestAnimationFrame(tick);
            else done();
          };
          raf = requestAnimationFrame(tick);
        });
        await sleep(5200);
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [active, reduce]);

  return (
    <div className="flex h-full w-full items-center gap-[18px]">
      <div className="relative h-[104px] w-[104px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="dp-fb-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#8d96f0" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.08)" />
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="7" stroke="url(#dp-fb-grad)" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - (SCORE / 100) * k)} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <b className="block text-[26px] font-medium tabular-nums tracking-[-0.05em]">{Math.round(SCORE * k)}</b>
            <small className="-mt-1 block text-[11px] text-white/40">of 100</small>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-[11px]">
        {SKILLS.map((s) => (
          <div key={s.label} className="text-[12.5px]">
            <div className="mb-[5px] flex justify-between text-white/56">
              <span>{s.label}</span>
              <span className="tabular-nums text-[#f0f0f0]">{Math.round(s.value * k)}/10</span>
            </div>
            <i className="block h-[5px] overflow-hidden rounded-[5px] bg-white/[0.07]">
              <b className="block h-full rounded-[5px] bg-[linear-gradient(90deg,#8d96f0,#fff)]" style={{ width: `${s.value * 10 * k}%` }} />
            </i>
          </div>
        ))}
        <div className="mt-0.5 text-[12px] text-white/40">
          Sharpen: <span className="text-[#bec8ff]">mention trade-offs earlier</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── tile + section ───────── */
const spotlight = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
};

function Tile({ className, demoClass = "", demo, title, body, index }: { className: string; demoClass?: string; demo: ReactNode; title: string; body: string; index: number }) {
  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 28, filter: "blur(8px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay: 0.05 + index * 0.1, ease } } }}
      onPointerMove={spotlight}
      className={`group relative flex flex-col overflow-hidden rounded-[18px] bg-[#0d0d0f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-shadow duration-300 [--x:50%] [--y:50%] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_circle_at_var(--x)_var(--y),rgba(120,130,255,0.12),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className={`relative px-[22px] pt-[22px] ${demoClass}`}>{demo}</div>
      <div className="relative px-[22px] pb-[22px] pt-[18px]">
        <h3 className="m-0 text-[17px] font-medium tracking-[-0.04em] text-[#f0f0f0]">{title}</h3>
        <p className="mt-1.5 max-w-[460px] text-[14px] leading-[1.5] tracking-[-0.03em] text-white/50">{body}</p>
      </div>
    </motion.article>
  );
}

export function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduce = !!useReducedMotion();

  return (
    <section ref={ref} id="features" aria-labelledby="features-title" className="relative scroll-mt-16 overflow-hidden bg-[#0a0a0a] px-5 pb-24 pt-20 font-sans text-[#f0f0f0] sm:px-6 sm:pb-32 sm:pt-28">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[180px] h-[600px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(92,100,220,0.16),rgba(10,10,10,0)_70%)]" />

      <div className="relative mx-auto max-w-[1080px]">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease }}
          className="mb-10 text-center sm:mb-[52px]"
        >
          <div className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
            <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
            Features
          </div>
          <h2 id="features-title" className="m-0 text-[30px] font-medium leading-[1.06] tracking-[-0.05em] sm:text-[52px]">
            Everything you need to
            <br />
            <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>ace the real one.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[15px] leading-[1.5] tracking-[-0.04em] text-white/56 sm:text-[16px]">
            Not a question bank. A full mock interview, running live, from the first question to the final score.
          </p>
        </motion.div>

        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} className="grid grid-cols-1 gap-3.5 lg:grid-cols-6">
          <Tile
            index={0}
            className="lg:col-span-4"
            demoClass="min-h-[190px] flex-1"
            demo={<VoiceDemo active={inView} reduce={reduce} />}
            title="AI Interviewer — Zara"
            body="Natural voice conversations with an AI interviewer. Not a quiz — a real dialogue that mirrors how actual interviews feel."
          />
          <Tile
            index={1}
            className="lg:col-span-2"
            demoClass="flex min-h-[190px] flex-1 items-center"
            demo={<FeedbackDemo active={inView} reduce={reduce} />}
            title="Feedback You Can Act On"
            body="A score for every answer, what was missing, and a stronger version. Then retry it out loud."
          />
          <Tile
            index={2}
            className="lg:col-span-3"
            demoClass="h-[268px] shrink-0"
            demo={<CodeDemo active={inView} reduce={reduce} />}
            title="Live Code Execution"
            body="Solve DSA and coding problems with a real compiler. Write, run, and debug, just like a real technical screen."
          />
          <Tile
            index={3}
            className="lg:col-span-3"
            demoClass="h-[268px] shrink-0 pb-0"
            demo={<RolesDemo />}
            title="Role-Specific Questions"
            body="24 roles across Engineering, Data, Design, Product, and Behavioral, each curated for what that role actually tests."
          />
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;
