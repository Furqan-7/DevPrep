"use client";

/**
 * One question in the report: a row with the latest score that expands to what was
 * said, the feedback, a stronger answer and a voice retry.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion } from "motion/react";
import { MAX_ATTEMPTS, currentScore, questionLabel, type AttemptResult, type ReportQuestion } from "@/lib/interview/report";
import { MicIcon, ScoreChip, WithPlaceholders, card, ease, primaryBtn } from "./ui";
import { VoiceRetry } from "./VoiceRetry";

export function QuestionRow({
  q,
  reduce,
  defaultOpen = false,
  onAttempt,
}: {
  q: ReportQuestion;
  reduce: boolean;
  defaultOpen?: boolean;
  onAttempt: (questionId: number, result: AttemptResult) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
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
    <article className={`${card} mt-2 overflow-hidden transition-shadow duration-300 ${open ? "shadow-[inset_0_0_0_1px_rgba(190,200,255,0.22)]" : ""}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-[18px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#bec8ff]/60"
      >
        <span className="w-[34px] shrink-0 text-[12px] text-white/38">{questionLabel(q.order)}</span>
        <span className="flex-1 text-[15px] leading-[1.35] tracking-[-0.02em]">{q.question}</span>
        {score !== null ? (
          <TickingChip value={score} reduce={reduce} />
        ) : (
          <span className="shrink-0 text-[12.5px] text-white/40">{q.answer ? "No feedback" : "Not answered"}</span>
        )}
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-400 ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, ease }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 sm:pl-[68px] sm:pr-5">
              {!q.answer ? (
                <p className="m-0 text-[14px] text-white/55">You didn&rsquo;t get to this question in the interview.</p>
              ) : !evaluation ? (
                <>
                  <Label>What you said</Label>
                  <p className="m-0 border-l-2 border-white/10 pl-3 text-[14px] leading-[1.55] text-white/72">{q.answer}</p>
                  <p className="mt-4 text-[13.5px] text-white/50">Feedback wasn&rsquo;t generated for this answer.</p>
                </>
              ) : (
                <>
                  <div className="grid gap-[22px] sm:grid-cols-2">
                    <div>
                      <Label>{latest ? `What you said · attempt ${q.attempts.length + 1}` : "What you said"}</Label>
                      <p className="m-0 border-l-2 border-white/10 pl-3 text-[14px] leading-[1.55] text-white/72">{answer}</p>
                      {q.attempts.length > 0 && q.score !== null ? (
                        <p className="mt-3 text-[12.5px] tabular-nums text-white/40">
                          Scores so far: {[q.score, ...q.attempts.map((a) => a.score)].join(" → ")}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <Label>Feedback</Label>
                      <p className="m-0 mb-2.5 text-[14px] leading-[1.45]">{evaluation.verdict}</p>
                      <ul className="m-0 list-none p-0 text-[13.5px] leading-[1.45] text-white/70">
                        {evaluation.strengths.map((s) => (
                          <Item key={`s-${s}`} mark="✓" markClass="text-[#9fe0b7]">
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
                                className="mt-1.5 flex gap-2 text-white/40 line-through decoration-[#9fe0b7]/60"
                              >
                                <span aria-hidden="true" className="w-3.5 shrink-0 text-center text-[#9fe0b7] no-underline">
                                  ✓
                                </span>
                                <span>
                                  <span className="sr-only">Fixed: </span>
                                  {g}
                                </span>
                              </motion.li>
                            ))}
                        {evaluation.gaps.map((g) => (
                          <Item key={`g-${g}`} mark="→" markClass="text-[#bec8ff]">
                            {g}
                          </Item>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-[18px] rounded-[14px] bg-[#bec8ff]/5 px-[18px] py-4 text-[14px] leading-[1.6] text-white/80 shadow-[inset_0_0_0_1px_rgba(190,200,255,0.12)]">
                    <Label>A stronger answer</Label>
                    <WithPlaceholders text={evaluation.betterAnswer} />
                    {/\[[^\]]+\]/.test(evaluation.betterAnswer) ? (
                      <p className="mb-0 mt-2.5 text-[12px] text-white/40">Swap the [highlighted parts] for your own experience.</p>
                    ) : null}
                  </div>

                  {justScored ? <ScoredBanner from={justScored.from} to={justScored.to} attemptsLeft={attemptsLeft} reduce={reduce} /> : null}

                  {retrying ? (
                    <VoiceRetry questionId={q.id} onScored={onScored} onCancel={() => setRetrying(false)} />
                  ) : canRetry ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => { setJustScored(null); setRetrying(true); }} className={primaryBtn}>
                        <MicIcon />
                        {q.attempts.length ? "Retry again" : "Retry this question"}
                      </button>
                      {/* the result banner already shows this right after a retry */}
                      {justScored ? null : (
                        <span className="text-[12.5px] text-white/40">
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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[12px] text-white/40">{children}</div>;
}

function Item({ mark, markClass, children }: { mark: string; markClass: string; children: React.ReactNode }) {
  return (
    <li className="mt-1.5 flex gap-2">
      <span aria-hidden="true" className={`w-3.5 shrink-0 text-center ${markClass}`}>
        {mark}
      </span>
      <span>{children}</span>
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
  const tone = delta > 0 ? "bg-[#9fe0b7]/12 text-[#9fe0b7]" : delta < 0 ? "bg-[#ffaa78]/12 text-[#ffc7a6]" : "bg-white/7 text-white/70";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px]" role="status">
      <ScoreChip value={from} />
      <span aria-hidden="true" className="text-white/35">
        →
      </span>
      <TickingChip value={to} from={from} reduce={reduce} />
      <motion.span
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : 0.6, duration: 0.5, ease }}
        className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${tone}`}
      >
        {delta > 0 ? `+${delta} better` : delta < 0 ? `${delta} lower` : "Same score"}
      </motion.span>
      <span className="text-[12.5px] text-white/40">
        {attemptsLeft} {attemptsLeft === 1 ? "retry" : "retries"} left
      </span>
    </div>
  );
}
