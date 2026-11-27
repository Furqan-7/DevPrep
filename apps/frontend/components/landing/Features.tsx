"use client";

/**
 * Bento grid of what DevPrep does. Each card has a small live visual that plays once
 * it scrolls into view. The numbers in the visuals are example data, styled like the app.
 */

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Check, CornerDownRight, FileText, Flame, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, SpotlightCard, ease, useSeen } from "./primitives";

function Card({ title, body, children, className, spot }: { title: string; body: string; children: ReactNode; className?: string; spot?: string }) {
  return (
    <SpotlightCard spot={spot} className={cn("flex flex-col", className)}>
      <div className="relative flex min-h-[230px] flex-1 items-center justify-center overflow-hidden px-6 pt-6">{children}</div>
      <div className="px-6 pb-6 pt-5">
        <h3 className="m-0 text-[17px] font-semibold tracking-[-0.025em] text-white">{title}</h3>
        <p className="m-0 mt-1.5 max-w-[440px] text-[14px] leading-[1.55] text-white/50">{body}</p>
      </div>
    </SpotlightCard>
  );
}

/* ───────── visuals ───────── */

/** Two audio tracks (Zara, You) taking turns, with a playhead sweeping across. */
function VoiceVisual() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const segments = [
    { track: 0, from: 0, to: 24 },
    { track: 1, from: 27, to: 58 },
    { track: 0, from: 61, to: 78 },
    { track: 1, from: 81, to: 100 },
  ];
  return (
    <div ref={ref} className="w-full max-w-[560px]">
      <div className="relative rounded-2xl border border-white/[0.07] bg-[#0e0e12] p-4">
        {["Zara", "You"].map((name, t) => (
          <div key={name} className="flex items-center gap-3 py-2">
            <span className={cn("w-10 text-[11.5px] font-medium", t === 0 ? "text-[#9db4ff]" : "text-white/60")}>{name}</span>
            <div className="relative h-9 flex-1 rounded-lg bg-white/[0.025]">
              {segments
                .filter((s) => s.track === t)
                .map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={seen ? { scaleX: 1 } : undefined}
                    transition={{ duration: 0.8, delay: 0.2 + s.from / 60, ease }}
                    className={cn(
                      "absolute inset-y-1 flex origin-left items-center gap-[2px] overflow-hidden rounded-md px-1.5",
                      t === 0 ? "bg-[#4d7cff]/20 ring-1 ring-[#4d7cff]/40 ring-inset" : "bg-white/[0.07] ring-1 ring-white/15 ring-inset",
                    )}
                    style={{ left: `${s.from}%`, width: `${s.to - s.from}%` }}
                  >
                    {Array.from({ length: 22 }, (_, b) => (
                      <span
                        key={b}
                        className={cn("w-[2px] shrink-0 rounded-full", t === 0 ? "bg-[#9db4ff]" : "bg-white/60")}
                        style={{ height: `${25 + ((b * 47 + i * 13) % 70)}%` }}
                      />
                    ))}
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
        <motion.span
          aria-hidden
          initial={{ left: "72px" }}
          animate={seen ? { left: ["72px", "calc(100% - 16px)"] } : undefined}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute inset-y-3 w-px bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11.5px] text-white/45">
        {["You stop talking", "Transcribed", "Zara replies", "Speaks as she writes"].map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="hidden h-px w-4 bg-white/15 sm:block" />}
            <span className="rounded-full border border-white/[0.07] px-2.5 py-1">{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ value, seen }: { value: number; seen: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[132px]">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={seen ? { strokeDashoffset: c * (1 - value / 100) } : undefined}
          transition={{ duration: 1.6, ease }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8fb0ff" />
            <stop offset="100%" stopColor="#c4a6ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[34px] font-semibold leading-none tracking-[-0.05em] text-white">{value}</div>
          <div className="mt-1 text-[10.5px] text-white/40">out of 100</div>
        </div>
      </div>
    </div>
  );
}

function ReportVisual() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const rubric = [
    ["Answering", 9],
    ["Depth", 7],
    ["Clarity", 9],
    ["Examples", 6],
  ] as const;
  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-5">
      <ScoreRing value={84} seen={seen} />
      <div className="grid w-full max-w-[240px] gap-2">
        {rubric.map(([label, v], i) => (
          <div key={label} className="grid grid-cols-[70px_1fr_16px] items-center gap-2.5 text-[11.5px]">
            <span className="text-white/50">{label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.span
                className={cn("block h-full rounded-full", v < 7 ? "bg-[#fbbf24]" : "bg-white/70")}
                initial={{ width: 0 }}
                animate={seen ? { width: `${v * 10}%` } : undefined}
                transition={{ duration: 1, delay: 0.3 + i * 0.1, ease }}
              />
            </span>
            <span className="text-right tabular-nums text-white/70">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetryVisual() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const attempts = [5, 7, 9];
  return (
    <div ref={ref} className="w-full max-w-[260px]">
      <div className="mb-3 flex items-center justify-between text-[11.5px] text-white/45">
        <span>Q4 · Explain event delegation</span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={seen ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 1.4, duration: 0.5, ease }}
          className="rounded-full bg-[#34d399]/12 px-2 py-0.5 font-medium text-[#6ee7b7]"
        >
          +4
        </motion.span>
      </div>
      <div className="grid gap-2">
        {attempts.map((score, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={seen ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.2 + i * 0.35, duration: 0.6, ease }}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5",
              i === attempts.length - 1 ? "border-[#34d399]/30 bg-[#34d399]/[0.06]" : "border-white/[0.06] bg-white/[0.02]",
            )}
          >
            <RotateCcw className="size-3.5 text-white/40" />
            <span className="text-[12.5px] text-white/70">{i === 0 ? "First answer" : `Retry ${i}`}</span>
            <span className="ml-auto text-[13px] font-semibold tabular-nums text-white">{score}/10</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CodingVisual() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const code: ReactNode[] = [
    <><span className="text-[#c4a6ff]">function</span> <span className="text-[#8fb0ff]">longestUnique</span>(s) {"{"}</>,
    <>  <span className="text-[#c4a6ff]">const</span> seen = <span className="text-[#c4a6ff]">new</span> <span className="text-[#5eead4]">Map</span>();</>,
    <>  <span className="text-[#c4a6ff]">let</span> start = <span className="text-[#fcd34d]">0</span>, best = <span className="text-[#fcd34d]">0</span>;</>,
    <>  <span className="text-[#c4a6ff]">for</span> (<span className="text-[#c4a6ff]">let</span> i = <span className="text-[#fcd34d]">0</span>; i &lt; s.length; i++) {"{"}</>,
    <>    <span className="text-[#c4a6ff]">if</span> (seen.get(s[i]) &gt;= start) start = seen.get(s[i]) + <span className="text-[#fcd34d]">1</span>;</>,
    <>    seen.set(s[i], i);</>,
    <>    best = <span className="text-[#5eead4]">Math</span>.max(best, i - start + <span className="text-[#fcd34d]">1</span>);</>,
    <>  {"}"}</>,
    <>  <span className="text-[#c4a6ff]">return</span> best;</>,
    <>{"}"}</>,
  ];
  return (
    <div ref={ref} className="w-full max-w-[600px]">
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0e0e12]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[11.5px] text-white/45">
          <FileText className="size-3.5" /> solution.js
          <span className="ml-auto rounded bg-white/[0.05] px-1.5 py-0.5">Medium · Sliding window</span>
        </div>
        <pre className="m-0 overflow-hidden px-4 py-3 font-mono text-[11.5px] leading-[1.75] text-white/75">
          {code.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={seen ? { opacity: 1 } : undefined}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="whitespace-pre"
            >
              <span className="mr-4 inline-block w-4 select-none text-right text-white/20">{i + 1}</span>
              {line}
            </motion.div>
          ))}
        </pre>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={seen ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.9, duration: 0.6, ease }}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] bg-[#34d399]/[0.04] px-4 py-2.5 text-[11.5px]"
        >
          <span className="flex items-center gap-1.5 font-medium text-[#6ee7b7]">
            <Check className="size-3.5" /> All tests passed
          </span>
          <span className="text-white/45">Time O(n)</span>
          <span className="text-white/45">Space O(k)</span>
          <span className="ml-auto flex items-center gap-1 text-white/60">
            <CornerDownRight className="size-3" /> AI review: 9/10
          </span>
        </motion.div>
      </div>
    </div>
  );
}

function ResumeVisual() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <div ref={ref} className="w-full max-w-[280px]">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11.5px] text-white/45">Match with job description</div>
          <div className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.05em] text-white">78%</div>
        </div>
        <span className="rounded-full bg-[#4d7cff]/15 px-2 py-0.5 text-[11px] font-medium text-[#9db4ff]">ATS check</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,#4d7cff,#c4a6ff)]"
          initial={{ width: 0 }}
          animate={seen ? { width: "78%" } : undefined}
          transition={{ duration: 1.2, ease }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["React", "TypeScript", "Next.js", "REST"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-white/75">
            <Check className="size-3 text-[#6ee7b7]" /> {s}
          </span>
        ))}
        {["GraphQL", "Testing"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-md border border-dashed border-white/15 px-2 py-1 text-[11px] text-white/45">
            <X className="size-3 text-[#fca5a5]" /> {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Deterministic pseudo-random activity, so server and client render the same grid. */
const HEAT = Array.from({ length: 7 * 18 }, (_, i) => {
  const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
  const n = Math.abs(v);
  return i > 7 * 14 ? Math.min(4, Math.floor(n * 3) + 2) : n < 0.45 ? 0 : Math.floor(n * 5);
});

function ProgressVisual() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const levels = ["bg-white/[0.05]", "bg-[#4d7cff]/25", "bg-[#4d7cff]/45", "bg-[#4d7cff]/70", "bg-[#8fb0ff]"];
  return (
    <div ref={ref} className="w-full max-w-[290px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11.5px] text-white/45">Last 18 weeks</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/12 px-2 py-0.5 text-[11px] font-medium text-[#fcd34d]">
          <Flame className="size-3" /> 12-day streak
        </span>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
        {HEAT.map((l, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={seen ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: (i / 7) * 0.03, duration: 0.3 }}
            className={cn("aspect-square rounded-[3px]", levels[l])}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationsVisual() {
  const cols = [
    { name: "Applied", cards: ["Frontend Engineer", "UI Engineer"] },
    { name: "Interviewing", cards: ["Full Stack Dev"] },
    { name: "Offer", cards: ["React Developer"] },
  ];
  return (
    <div className="grid w-full max-w-[300px] grid-cols-3 gap-2">
      {cols.map((c, ci) => (
        <div key={c.name} className="rounded-xl bg-white/[0.025] p-1.5">
          <div className="mb-1.5 flex items-center justify-between px-1 text-[10.5px] text-white/45">
            {c.name} <span>{c.cards.length}</span>
          </div>
          <div className="grid gap-1.5">
            {c.cards.map((card, i) => (
              <motion.div
                key={card}
                whileHover={{ y: -2 }}
                className={cn(
                  "rounded-lg border px-2 py-2 text-[10.5px] leading-tight text-white/75",
                  ci === 2 ? "border-[#34d399]/30 bg-[#34d399]/[0.06]" : "border-white/[0.06] bg-[#111115]",
                )}
                style={{ animation: `fx-float ${5 + i + ci}s ease-in-out ${-ci}s infinite` }}
              >
                {card}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 bg-[#050506] px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeader
        eyebrow="Features"
        title={
          <>
            Everything you need
            <br className="hidden sm:block" /> to walk in ready
          </>
        }
        body="A voice interview that feels like the real one, a report that tells you exactly what to fix, and the tools around it."
      />

      <div className="mx-auto mt-16 grid max-w-[1120px] gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card
          className="lg:col-span-4"
          title="A real voice interview, hands-free"
          body="Zara notices when you stop talking, so there's no button to hold. She replies a sentence at a time as she writes, so the pause feels like a person thinking."
        >
          <VoiceVisual />
        </Card>
        <Card className="lg:col-span-2" title="Scored like a real panel" body="An overall score out of 100, and every answer marked on four skills." spot="rgba(196,166,255,0.14)">
          <ReportVisual />
        </Card>
        <Card className="lg:col-span-2" title="Retry until it's right" body="Answer any question again out loud, up to five times, and watch the score move." spot="rgba(52,211,153,0.12)">
          <RetryVisual />
        </Card>
        <Card
          className="lg:col-span-4"
          title="A coding round with an AI reviewer"
          body="Solve problems in the browser. Tests run in a sandboxed worker, then every submission gets a score, its complexity and what to improve."
        >
          <CodingVisual />
        </Card>
        <Card className="lg:col-span-2" title="Resume against the job" body="See how your resume matches a job description, what's missing, and get a cover letter draft.">
          <ResumeVisual />
        </Card>
        <Card className="lg:col-span-2" title="Progress you can see" body="Streaks, a year of activity, and readiness for every role you practise." spot="rgba(245,158,11,0.12)">
          <ProgressVisual />
        </Card>
        <Card className="md:col-span-2 lg:col-span-2" title="Every application, one board" body="Drag jobs from Saved to Offer, with notes and links on each one.">
          <ApplicationsVisual />
        </Card>
      </div>
    </section>
  );
}
