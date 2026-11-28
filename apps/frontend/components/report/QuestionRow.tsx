"use client";

/**
 * One question in the report: a row with the latest score that expands to what was
 * said, the feedback and rubric, a stronger answer and a voice retry.
 */

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, Mic, MessageSquareText, Quote, Sparkles } from "lucide-react";
import { MAX_ATTEMPTS, currentScore, questionLabel, type AttemptResult, type ReportQuestion, type Rubric } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { Label, ScoreChip, WithPlaceholders, bandColor, card, ease, primaryBtn } from "./ui";
import { deliveryLine } from "./Delivery";
import { VoiceRetry } from "./VoiceRetry";

const RUBRIC: { key: keyof Rubric; label: string }[] = [
  { key: "relevance", label: "Answering the question" },
  { key: "depth", label: "Technical depth" },
  { key: "clarity", label: "Clarity" },
  { key: "evidence", label: "Concrete examples" },
];

export function QuestionRow({
  q,
  reduce,
  open,
  onToggle,
  onAttempt,
}: {
  q: ReportQuestion;
  reduce: boolean;
  open: boolean;
  onToggle: () => void;
  onAttempt: (questionId: number, result: AttemptResult) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [justScored, setJustScored] = useState<{ from: number; to: number } | null>(null);

  const latest = q.attempts.at(-1);
  const evaluation = latest?.evaluation ?? q.evaluation;
  const previous = q.attempts.length >= 2 ? q.attempts.at(-2)!.evaluation : q.evaluation;
  const fixed = latest ? (latest.evaluation.fixedGaps ?? []) : [];
  const score = currentScore(q);
  const answer = latest?.answer ?? q.answer;
  const attemptsLeft = MAX_ATTEMPTS - q.attempts.length;
  const canRetry = !!q.evaluation && attemptsLeft > 0;
  const bodyId = `q-${q.id}-body`;

  const onScored = (result: AttemptResult) => {
    setRetrying(false);
    setJustScored({ from: result.previousScore, to: result.attempt.score });
    onAttempt(q.id, result);
  };

  return (
    <article className={cn(card, "overflow-hidden transition-[border-color,box-shadow] duration-300", open && "border-white/[0.14] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.015] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-5"
      >
        <span
          className="grid h-7 min-w-10 shrink-0 place-items-center rounded-lg px-1.5 text-[11.5px] font-semibold tabular-nums"
          style={score !== null ? { background: `${bandColor(score)}1f`, color: bandColor(score) } : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}
        >
          {questionLabel(q.order)}
        </span>
        <span className="flex-1 text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-white/90">{q.question}</span>
        {q.attempts.length > 0 ? (
          <span className="hidden rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-white/45 sm:inline">
            {q.attempts.length} {q.attempts.length === 1 ? "retry" : "retries"}
          </span>
        ) : null}
        {score !== null ? <TickingChip value={score} reduce={reduce} /> : <span className="shrink-0 text-[12px] text-white/40">{q.answer ? "No feedback" : "Not answered"}</span>}
        <ChevronDown className={cn("size-4 shrink-0 text-white/40 transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 pb-5 pt-4 sm:px-5">
              {!q.answer ? (
                <p className="m-0 text-[13.5px] text-white/55">You didn&rsquo;t get to this question in the interview.</p>
              ) : !evaluation ? (
                <>
                  <Label icon={<Quote className="size-3.5" />}>What you said</Label>
                  <p className="m-0 rounded-xl bg-white/[0.03] p-3.5 text-[13.5px] leading-[1.6] text-white/75">{q.answer}</p>
                  <p className="mt-4 text-[13px] text-white/50">Feedback wasn&rsquo;t generated for this answer.</p>
                </>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <Label icon={<Quote className="size-3.5" />}>{latest ? `What you said · attempt ${q.attempts.length + 1}` : "What you said"}</Label>
                      <p className="m-0 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3.5 text-[13.5px] leading-[1.6] text-white/75">{answer}</p>
                      {!latest && q.delivery ? <p className="m-0 mt-2 text-[12px] tabular-nums text-white/40">{deliveryLine(q.delivery)}</p> : null}
                      {q.attempts.length > 0 && q.score !== null ? (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-white/45">
                          Scores so far:
                          {[q.score, ...q.attempts.map((a) => a.score)].map((s, i, arr) => (
                            <span key={i} className="flex items-center gap-1.5">
                              <span className="font-semibold tabular-nums" style={{ color: bandColor(s) }}>
                                {s}
                              </span>
                              {i < arr.length - 1 ? <ArrowRight className="size-3 text-white/25" /> : null}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {evaluation.rubric ? (
                        <div className="mt-4">
                          <Label>Rubric</Label>
                          <div className="grid gap-2">
                            {RUBRIC.map((r, i) => {
                              const v = evaluation.rubric[r.key];
                              return (
                                <div key={r.key} className="grid grid-cols-[150px_1fr_24px] items-center gap-2.5 text-[12px]">
                                  <span className="truncate text-white/55">{r.label}</span>
                                  <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                    <motion.span
                                      className="block h-full rounded-full"
                                      style={{ background: bandColor(v) }}
                                      initial={reduce ? false : { width: 0 }}
                                      animate={{ width: `${v * 10}%` }}
                                      transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease }}
                                    />
                                  </span>
                                  <span className="text-right font-medium tabular-nums text-white/80">{v}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <Label icon={<MessageSquareText className="size-3.5" />}>Feedback</Label>
                      <p className="m-0 mb-3 text-[14px] font-medium leading-[1.5] text-white">{evaluation.verdict}</p>
                      <ul className="m-0 grid list-none gap-2 p-0 text-[13px] leading-[1.5] text-white/70">
                        {evaluation.strengths.map((s) => (
                          <Item key={`s-${s}`} tone="good">
                            {s}
                          </Item>
                        ))}
                        {latest &&
                          previous?.gaps
                            .filter((g) => fixed.includes(g))
                            .map((g, i) => (
                              <motion.li
                                key={`f-${g}`}
                                initial={justScored && !reduce ? { opacity: 0.6 } : false}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.25 }}
                                className="flex gap-2.5 text-white/40 line-through decoration-[#34d399]/60"
                              >
                                <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#34d399]/15 text-[#6ee7b7] no-underline">
                                  <Check className="size-2.5" />
                                </span>
                                <span>
                                  <span className="sr-only">Fixed: </span>
                                  {g}
                                </span>
                              </motion.li>
                            ))}
                        {evaluation.gaps.map((g) => (
                          <Item key={`g-${g}`} tone="gap">
                            {g}
                          </Item>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="relative mt-4 overflow-hidden rounded-xl border border-[#a78bfa]/20 bg-[linear-gradient(135deg,rgba(77,124,255,0.07),rgba(167,139,250,0.07))] p-4">
                    <Label icon={<Sparkles className="size-3.5 text-[#c4b5fd]" />}>A stronger answer</Label>
                    <p className="m-0 text-[13.5px] leading-[1.7] text-white/85">
                      <WithPlaceholders text={evaluation.betterAnswer} />
                    </p>
                    {/\[[^\]]+\]/.test(evaluation.betterAnswer) ? <p className="mb-0 mt-2.5 text-[12px] text-white/40">Swap the highlighted parts for your own experience.</p> : null}
                  </div>

                  {justScored ? <ScoredBanner from={justScored.from} to={justScored.to} attemptsLeft={attemptsLeft} reduce={reduce} /> : null}

                  {retrying ? (
                    <VoiceRetry questionId={q.id} onScored={onScored} onCancel={() => setRetrying(false)} />
                  ) : canRetry ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setJustScored(null);
                          setRetrying(true);
                        }}
                        className={primaryBtn}
                      >
                        <Mic />
                        {q.attempts.length ? "Retry again" : "Retry this question"}
                      </button>
                      {/* the result banner already shows this right after a retry */}
                      {justScored ? null : (
                        <span className="flex items-center gap-1.5 text-[12px] text-white/40">
                          {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
                            <span key={i} className={cn("size-1.5 rounded-full", i < attemptsLeft ? "bg-white/50" : "bg-white/10")} />
                          ))}
                          {attemptsLeft} {attemptsLeft === 1 ? "retry" : "retries"} left
                        </span>
                      )}
                    </div>
                  ) : q.evaluation ? (
                    <p className="mt-4 text-[12.5px] text-white/40">You&rsquo;ve used all {MAX_ATTEMPTS} retries for this question.</p>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function Item({ tone, children }: { tone: "good" | "gap"; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden="true"
        className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full", tone === "good" ? "bg-[#34d399]/15 text-[#6ee7b7]" : "bg-[#fbbf24]/15 text-[#fcd34d]")}
      >
        {tone === "good" ? <Check className="size-2.5" /> : <ArrowRight className="size-2.5" />}
      </span>
      <span>
        <span className="sr-only">{tone === "good" ? "Strength: " : "To improve: "}</span>
        {children}
      </span>
    </li>
  );
}

/** Score pill that counts to a new value when it changes. */
function TickingChip({ value, from, reduce }: { value: number; from?: number; reduce: boolean }) {
  const [shown, setShown] = useState(from ?? value);
  useEffect(() => {
    if (reduce || shown === value) {
      setShown(value);
      return;
    }
    const controls = animate(shown, value, { duration: 0.9, ease, onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
    // only re-run when the target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);
  return <ScoreChip value={shown} />;
}

function ScoredBanner({ from, to, attemptsLeft, reduce }: { from: number; to: number; attemptsLeft: number; reduce: boolean }) {
  const delta = to - from;
  const tone = delta > 0 ? "bg-[#34d399]/12 text-[#6ee7b7]" : delta < 0 ? "bg-[#fbbf24]/12 text-[#fcd34d]" : "bg-white/[0.07] text-white/70";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[13.5px]" role="status">
      <span className="text-[12px] text-white/45">New score</span>
      <ScoreChip value={from} />
      <ArrowRight aria-hidden="true" className="size-3.5 text-white/30" />
      <TickingChip value={to} from={from} reduce={reduce} />
      <motion.span
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : 0.6, duration: 0.5, ease }}
        className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone}`}
      >
        {delta > 0 ? `+${delta} better` : delta < 0 ? `${delta} lower` : "Same score"}
      </motion.span>
      <span className="ml-auto text-[12px] text-white/40">
        {attemptsLeft} {attemptsLeft === 1 ? "retry" : "retries"} left
      </span>
    </div>
  );
}
