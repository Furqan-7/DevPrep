"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Flame, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  SUBJECTS,
  getTopics,
  getQuestions,
  CS_CORE_QUESTIONS,
  type Subject,
  type Question,
} from "./csCoreQuestions";

// ── Diagram Components ────────────────────────────────────────────────────────
// Colors: fill uses "#0a0a0b" (same as card bg used everywhere in app),
// strokes use "rgba(255,255,255,0.1)" (brand-border token value).

function ProcessStatesDiagram() {
  const states = ["New", "Ready", "Running", "Waiting", "Terminated"];
  const W = 90;
  const H = 38;
  const GAP = 28;
  const totalW = states.length * W + (states.length - 1) * GAP;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${H + 26}`}
      className="w-full max-w-xl"
      aria-label="Process states diagram"
    >
      {states.map((s, i) => {
        const x = i * (W + GAP);
        return (
          <g key={s}>
            <rect
              x={x} y={0} width={W} height={H} rx={5}
              fill="#0a0a0b"
              stroke={i === 2 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}
              strokeWidth={1}
            />
            <text
              x={x + W / 2} y={H / 2 + 4}
              textAnchor="middle"
              fontSize={10}
              fontFamily="Inter, sans-serif"
              fill={i === 2 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"}
            >
              {s}
            </text>
            {i < states.length - 1 && (
              <>
                <line
                  x1={x + W} y1={H / 2}
                  x2={x + W + GAP - 5} y2={H / 2}
                  stroke="rgba(255,255,255,0.15)" strokeWidth={1}
                />
                <polygon
                  points={`${x + W + GAP - 5},${H / 2 - 3.5} ${x + W + GAP},${H / 2} ${x + W + GAP - 5},${H / 2 + 3.5}`}
                  fill="rgba(255,255,255,0.15)"
                />
              </>
            )}
          </g>
        );
      })}
      {/* Waiting → Ready dashed arc */}
      <path
        d={`M ${3 * (W + GAP) + W / 2} ${H + 5} Q ${2 * (W + GAP) + W / 2} ${H + 22} ${W + W / 2} ${H + 5}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
    </svg>
  );
}

function DeadlockConditionsDiagram() {
  const labels = ["Mutual\nexclusion", "Hold and\nwait", "No\npreemption", "Circular\nwait"];
  const W = 96;
  const H = 50;
  const GAP = 20;
  const totalW = labels.length * W + (labels.length - 1) * GAP;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${H}`}
      className="w-full max-w-lg"
      aria-label="Deadlock conditions diagram"
    >
      {labels.map((label, i) => {
        const x = i * (W + GAP);
        const lines = label.split("\n");
        return (
          <g key={i}>
            <rect
              x={x} y={0} width={W} height={H} rx={5}
              fill="#0a0a0b"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={x + W / 2}
                y={lines.length === 1 ? H / 2 + 4 : H / 2 - 5 + li * 14}
                textAnchor="middle"
                fontSize={10}
                fontFamily="Inter, sans-serif"
                fill="rgba(255,255,255,0.55)"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function DiagramRenderer({ diagramKey }: { diagramKey: string | null }) {
  if (!diagramKey) return null;
  return (
    <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
        Diagram
      </p>
      {diagramKey === "process-states" && <ProcessStatesDiagram />}
      {diagramKey === "deadlock-conditions" && <DeadlockConditionsDiagram />}
    </div>
  );
}

// ── Difficulty Badge ──────────────────────────────────────────────────────────
// Exact classes from DSA page ProblemRow (dsa/page.tsx lines 343–346 + 393)

function DifficultyBadge({ difficulty }: { difficulty: Question["difficulty"] }) {
  const styles: Record<Question["difficulty"], string> = {
    easy: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
    intermediate: "text-amber-400 bg-amber-400/5 border-amber-400/20",
    advanced: "text-rose-400 bg-rose-400/5 border-rose-400/20",
  };
  const labels: Record<Question["difficulty"], string> = {
    easy: "Easy",
    intermediate: "Medium",
    advanced: "Hard",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[difficulty]}`}
    >
      {labels[difficulty]}
    </span>
  );
}

// ── Self-rating type ──────────────────────────────────────────────────────────

type Rating = "know" | "shaky" | "blank";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CSCorePage() {
  const [subject, setSubject] = useState<Subject>("os");
  const [topic, setTopic] = useState<string>(getTopics("os")[0]);
  const [qIndex, setQIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scratchpad, setScratchpad] = useState<Record<string, string>>({});
  // ratings keyed by question id
  const [ratings, setRatings] = useState<Record<string, Rating>>({});

  const topics = getTopics(subject);
  const questions = getQuestions(subject, topic);
  const question = questions[qIndex] ?? null;

  // How many questions in a topic have been rated
  const ratedCount = useCallback(
    (sub: Subject, tp: string) =>
      getQuestions(sub, tp).filter((q) => ratings[q.id] !== undefined).length,
    [ratings]
  );

  const handleSubjectChange = (s: Subject) => {
    setSubject(s);
    const firstTopic = getTopics(s)[0];
    setTopic(firstTopic);
    setQIndex(0);
    setShowAnswer(false);
  };

  const handleTopicChange = (t: string) => {
    setTopic(t);
    setQIndex(0);
    setShowAnswer(false);
  };

  const goNext = () => {
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setShowAnswer(false);
    }
  };

  const goPrev = () => {
    if (qIndex > 0) {
      setQIndex((i) => i - 1);
      setShowAnswer(false);
    }
  };

  const handleRate = (r: Rating) => {
    if (!question) return;
    setRatings((prev) => ({ ...prev, [question.id]: r }));
  };

  const scratchKey = question?.id ?? "";
  const currentRating = question ? ratings[question.id] : undefined;

  return (
    <DashboardShell>
      <div className="min-h-screen bg-brand-bg text-white dot-background selection:bg-white selection:text-black pb-20">

        {/* Sticky Header */}
        <header className="pt-10 pb-8 border-b border-white/5 bg-brand-bg/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-10">
            <div className="flex items-start justify-between gap-8">
              {/* Left: breadcrumb + title + tabs */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-muted font-bold">
                    <span className="hover:text-white transition-colors cursor-pointer">DevPrep</span>
                    <span className="opacity-20">/</span>
                    <span className="text-white">CS Core</span>
                  </nav>
                  <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">CS Core</h1>
                  <p className="text-sm text-brand-muted max-w-xl">
                    Topic-wise questions to crack your interviews
                  </p>
                </div>

                {/* Subject tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {SUBJECTS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSubjectChange(key)}
                      className={`flex-shrink-0 px-5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 border ${
                        subject === key
                          ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          : "bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: global progress stats card — computed from all questions + local ratings */}
              {(() => {
                const allQ = CS_CORE_QUESTIONS;
                const totalAll = allQ.length;
                const answeredAll = allQ.filter((q) => ratings[q.id] !== undefined).length;
                const masteredAll = allQ.filter((q) => ratings[q.id] === "know").length;
                const masteryPct = totalAll > 0 ? Math.round((masteredAll / totalAll) * 100) : 0;
                return (
                  <div className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center gap-6 self-end mb-1">
                    {/* Answered */}
                    <div className="space-y-0.5 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Answered</div>
                      <div className="flex items-center justify-center gap-1.5 text-lg font-display font-bold leading-tight">
                        <CheckCircle2 size={15} className="text-brand-muted flex-shrink-0" />
                        <span className="text-white">{answeredAll}</span>
                        <span className="text-[11px] text-brand-muted font-normal">/{totalAll}</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    {/* Streak */}
                    <div className="space-y-0.5 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Streak</div>
                      <div className="flex items-center justify-center gap-1.5 text-lg font-display font-bold leading-tight">
                        <Flame size={15} className="text-amber-400 flex-shrink-0" />
                        <span className="text-white">0</span>
                        <span className="text-[11px] text-brand-muted font-normal"> days</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    {/* Mastery */}
                    <div className="space-y-0.5 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Mastery</div>
                      <div className="flex items-center justify-center gap-1.5 text-lg font-display font-bold leading-tight">
                        <Trophy size={15} className="text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-400">{masteryPct}</span>
                        <span className="text-[11px] text-brand-muted font-normal">%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </header>

        {/* ── Main 2-col Layout ── */}
        <div className="max-w-7xl mx-auto px-10 mt-8">
          <div className="flex gap-8 items-start">

            {/* ── LEFT SIDEBAR — Topics ──
                Card bg/border: bg-white/[0.03] border-white/10 (same as rest of app).
                Active topic uses the same white-pill active style as subject tabs. */}
            <aside className="w-56 flex-shrink-0 sticky top-36 flex flex-col gap-1">
              <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-3">
                Topics
              </p>
              {topics.map((t) => {
                const total = getQuestions(subject, t).length;
                const done = ratedCount(subject, t);
                const isActive = t === topic;
                return (
                  <button
                    key={t}
                    onClick={() => handleTopicChange(t)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border text-left ${
                      isActive
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        : "bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{t}</span>
                    <span
                      className={`flex-shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-black/20 text-black/60"
                          : "bg-white/[0.05] text-brand-muted/60"
                      }`}
                    >
                      {done}/{total}
                    </span>
                  </button>
                );
              })}

              {/* ── Subject progress summary ── */}
              {(() => {
                const subjectTotal = topics.reduce(
                  (acc, t) => acc + getQuestions(subject, t).length, 0
                );
                const subjectDone = topics.reduce(
                  (acc, t) => acc + ratedCount(subject, t), 0
                );
                const pct = subjectTotal > 0 ? Math.round((subjectDone / subjectTotal) * 100) : 0;
                return (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-2">
                      Subject progress
                    </p>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-brand-muted">
                          <span className="text-white font-bold">{subjectDone}</span>
                          /{subjectTotal} answered
                        </span>
                        <span className="text-[9px] font-mono text-brand-muted/50">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white/40 transition-all duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </aside>

            {/* Main panel: question card column + right info panel */}
            <div className="flex-1 min-w-0 flex gap-5 items-start">

              {/* Question column */}
              <div className="flex-1 min-w-0">
                {question ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* ── Question card — badge + progress inside as header row ── */}
                      <div className="rounded-2xl border border-white/10 bg-[#0a0a0b]/50 overflow-hidden">
                        <div className="flex">
                          <div className="w-0.5 flex-shrink-0 bg-white/30" />
                          <div className="flex-1 p-5">
                            {/* Card header: badge left, progress dots right */}
                            <div className="flex items-center justify-between mb-4">
                              <DifficultyBadge difficulty={question.difficulty} />
                              <div className="flex items-center gap-1.5">
                                {questions.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => { setQIndex(i); setShowAnswer(false); }}
                                    aria-label={`Go to question ${i + 1}`}
                                    className={`rounded-full transition-all duration-200 ${
                                      i === qIndex
                                        ? "w-4 h-2 bg-white"
                                        : ratings[questions[i].id]
                                        ? "w-2 h-2 bg-white/30"
                                        : "w-2 h-2 bg-white/10 hover:bg-white/20"
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-[10px] font-mono text-brand-muted">
                                  {qIndex + 1}/{questions.length}
                                </span>
                              </div>
                            </div>

                            {/* Index chip + question text */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="flex-shrink-0 w-6 h-6 rounded-md border border-white/10 flex items-center justify-center">
                                <span className="text-[9px] font-mono font-bold text-brand-muted/40">
                                  {String(qIndex + 1).padStart(2, "0")}
                                </span>
                              </div>
                              <p className="text-sm font-medium leading-relaxed text-white">
                                {question.question}
                              </p>
                            </div>

                            {/* Scratchpad textarea */}
                            <textarea
                              placeholder="Type your answer here..."
                              rows={3}
                              value={scratchpad[scratchKey] ?? ""}
                              onChange={(e) =>
                                setScratchpad((prev) => ({
                                  ...prev,
                                  [scratchKey]: e.target.value,
                                }))
                              }
                              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-brand-muted/40 focus:outline-none focus:border-white/30 resize-none transition-colors font-sans"
                            />

                            {/* Show answer button */}
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => setShowAnswer((v) => !v)}
                                className={`px-5 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 border ${
                                  showAnswer
                                    ? "bg-white/5 text-brand-muted border-white/10"
                                    : "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95"
                                }`}
                              >
                                {showAnswer ? "Hide answer" : "Show answer"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Answer panel ── */}
                      <AnimatePresence>
                        {showAnswer && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                              <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
                                Model Answer
                              </p>
                              <p className="text-sm text-white/80 leading-relaxed">
                                {question.answer}
                              </p>

                              <DiagramRenderer diagramKey={question.diagramKey} />

                              <div className="pt-4 border-t border-white/[0.06]">
                                <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-3">
                                  How did you do?
                                </p>
                                <div className="flex gap-2">
                                  {(
                                    [
                                      { id: "know" as const, label: "Know it", activeClass: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" },
                                      { id: "shaky" as const, label: "Shaky", activeClass: "text-amber-400 bg-amber-400/5 border-amber-400/20" },
                                      { id: "blank" as const, label: "Blank", activeClass: "text-rose-400 bg-rose-400/5 border-rose-400/20" },
                                    ] as const
                                  ).map(({ id, label, activeClass }) => (
                                    <button
                                      key={id}
                                      onClick={() => handleRate(id)}
                                      className={`flex-1 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 border ${
                                        currentRating === id
                                          ? activeClass
                                          : "bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Navigation ── */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={goPrev}
                          disabled={qIndex === 0}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 border bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronLeft size={13} />
                          Previous
                        </button>
                        <button
                          onClick={goNext}
                          disabled={qIndex === questions.length - 1}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 border bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        >
                          Next question
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] text-brand-muted text-sm">
                    No questions for this topic yet.
                  </div>
                )}
              </div>

              {/* ── RIGHT INFO PANEL — same width as left sidebar ── */}
              {question && (
                <aside className="w-52 flex-shrink-0 sticky top-36 space-y-4">

                  {/* Asked at — company chips reusing topic-item card style */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-3">
                      Asked at
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {question.companies.map((c) => (
                        <span
                          key={c.name}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-white/[0.03] text-brand-muted border-white/10"
                        >
                          {/* Favicon via Google S2 — same approach as dsa/page.tsx COMPANY_LOGO */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=32`}
                            alt={c.name}
                            width={13}
                            height={13}
                            className="rounded-[2px] opacity-80 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Related topics — clickable, navigates sidebar */}
                  {question.relatedTopics.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-3">
                        Related topics
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {question.relatedTopics
                          .filter((t) => getTopics(subject).includes(t))
                          .map((t) => (
                            <button
                              key={t}
                              onClick={() => handleTopicChange(t)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
                            >
                              {t}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                </aside>
              )}

            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}