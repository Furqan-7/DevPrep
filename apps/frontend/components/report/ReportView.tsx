"use client";

/**
 * Interview report: loads the session, generates the report on first visit (15–30 s),
 * then shows the overall score, what went well and what to practise, how the candidate
 * sounded, and every question with its feedback and a voice retry.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, motion } from "motion/react";
import { CircleCheck, FileQuestion, Lightbulb, RotateCcw, Target } from "lucide-react";
import {
  createReport,
  currentScore,
  formatDate,
  getSession,
  levelLabel,
  questionLabel,
  roleTitle,
  ReportApiError,
  type AttemptResult,
  type SessionDetail,
} from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { DeliveryCard } from "./Delivery";
import { QuestionRow } from "./QuestionRow";
import { ShareReport } from "./ShareReport";
import { PageShell, ReportHeader, StateMessage, bandColor, card, ease, primaryBtn, reveal, secondaryBtn, useReducedMotionFlag } from "./ui";

type View =
  | { name: "loading" }
  | { name: "generating"; answered: number }
  | { name: "ready"; session: SessionDetail }
  | { name: "error"; error: ReportApiError };

export function ReportView({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const reduce = useReducedMotionFlag();
  const [view, setView] = useState<View>({ name: "loading" });
  const started = useRef(false);

  const load = useCallback(async () => {
    setView({ name: "loading" });
    try {
      let session = await getSession(sessionId);
      if (!session.report) {
        const answered = session.questions.filter((q) => q.answer).length;
        if (answered === 0) throw new ReportApiError("conflict", "No answers to review.");
        setView({ name: "generating", answered });
        session = await createReport(sessionId);
      }
      setView({ name: "ready", session });
    } catch (err) {
      const error = err instanceof ReportApiError ? err : new ReportApiError("server", "Something went wrong.");
      if (error.kind === "auth") {
        router.replace(`/auth/signin?next=${encodeURIComponent(`/dashboard/reports/${sessionId}`)}`);
        return;
      }
      setView({ name: "error", error });
    }
  }, [router, sessionId]);

  useEffect(() => {
    // run once, even under React's dev double-mount, so the report isn't requested twice
    if (started.current) return;
    started.current = true;
    void load();
  }, [load]);

  const onAttempt = (questionId: number, result: AttemptResult) =>
    setView((v) =>
      v.name !== "ready"
        ? v
        : {
            name: "ready",
            session: {
              ...v.session,
              questions: v.session.questions.map((q) => (q.id === questionId ? { ...q, attempts: [...q.attempts, result.attempt] } : q)),
            },
          },
    );

  const ready = view.name === "ready" && view.session.report ? view.session : null;

  return (
    <PageShell>
      <ReportHeader
        actions={
          ready ? (
            <>
              <Link href={`/dashboard/ai-interview/${ready.role}`} className={secondaryBtn}>
                <RotateCcw /> Practise again
              </Link>
              <ShareReport sessionId={ready.id} initialToken={ready.shareToken} />
            </>
          ) : null
        }
      />
      {view.name === "loading" && <LoadingSkeleton />}
      {view.name === "generating" && <Generating answered={view.answered} reduce={reduce} />}
      {view.name === "error" && <ErrorState error={view.error} onRetry={load} />}
      {view.name === "ready" && <Report session={view.session} reduce={reduce} onAttempt={onAttempt} />}
    </PageShell>
  );
}

/* ───────── states ───────── */

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your report" className="grid gap-3">
      <i className="block h-[260px] animate-pulse rounded-2xl bg-white/[0.04] motion-reduce:animate-none" />
      <div className="grid gap-3 sm:grid-cols-2">
        <i className="block h-[160px] animate-pulse rounded-2xl bg-white/[0.04] motion-reduce:animate-none" />
        <i className="block h-[160px] animate-pulse rounded-2xl bg-white/[0.04] motion-reduce:animate-none" />
      </div>
      {[0, 1, 2].map((i) => (
        <i key={i} className="block h-[60px] animate-pulse rounded-2xl bg-white/[0.04] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

const GENERATING_STEPS = ["Reading your answers", "Scoring each one on four skills", "Writing a stronger version of each"];

function Generating({ answered, reduce }: { answered: number; reduce: boolean }) {
  return (
    <div className={cn(card, "flex flex-col items-center overflow-hidden px-6 pb-14 pt-16 text-center")} role="status" aria-live="polite">
      <motion.div {...reveal(reduce)} aria-hidden="true" className="relative grid size-16 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <span className="size-7 rounded-full border-2 border-white/10 border-t-[#4d7cff]" style={{ animation: reduce ? undefined : "fx-spin-slow 0.9s linear infinite" }} />
      </motion.div>
      <motion.h1 {...reveal(reduce, 0.08)} className="m-0 mt-7 text-[26px] font-semibold leading-[1.15] tracking-[-0.035em]">
        Reviewing your answers
      </motion.h1>
      <motion.p {...reveal(reduce, 0.14)} className="mx-auto mt-2.5 max-w-[440px] text-[14px] leading-[1.55] text-white/55">
        Zara is scoring your {answered} {answered === 1 ? "answer" : "answers"} and writing a stronger version of each. This usually takes 15–30 seconds.
      </motion.p>
      <motion.ul {...reveal(reduce, 0.2)} className="m-0 mt-7 grid list-none gap-2 p-0 text-left">
        {GENERATING_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 text-[13px] text-white/60">
            <motion.span
              className="size-1.5 rounded-full bg-[#4d7cff]"
              animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.4 }}
            />
            {s}
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: ReportApiError; onRetry: () => void }) {
  if (error.kind === "not_found")
    return (
      <StateMessage icon={<FileQuestion className="size-5" />} title="Interview not found" body="This interview doesn't exist, or it belongs to another account.">
        <Link href="/dashboard/reports" className={primaryBtn}>
          See your interviews
        </Link>
      </StateMessage>
    );
  if (error.kind === "conflict")
    return (
      <StateMessage icon={<FileQuestion className="size-5" />} title="Nothing to review yet" body="This interview ended before any answers were recorded. Start a new one and answer at least one question.">
        <Link href="/dashboard/ai-interview" className={primaryBtn}>
          Start an interview
        </Link>
      </StateMessage>
    );
  return (
    <StateMessage title="Your report isn't ready" body={error.message}>
      <button type="button" onClick={onRetry} className={primaryBtn}>
        Try again
      </button>
      <Link href="/dashboard/reports" className={secondaryBtn}>
        Back to reports
      </Link>
    </StateMessage>
  );
}

/* ───────── report ───────── */

const verdictFor = (score: number) => (score >= 80 ? "Interview-ready" : score >= 60 ? "Getting close" : "Keep practising");

function Report({ session, reduce, onAttempt }: { session: SessionDetail; reduce: boolean; onAttempt: (id: number, r: AttemptResult) => void }) {
  const report = session.report!;
  const answered = session.questions.filter((q) => q.answer).length;
  // open the weakest scored answer first: that's where a retry helps most
  const scored = session.questions.filter((q) => q.score !== null);
  const weakest = scored.length ? scored.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a)).id : null;
  const tailoredTo = [session.tailored.resume && "resume", session.tailored.job && "target job"].filter(Boolean).join(" and ");
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set(weakest !== null ? [weakest] : []));

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jumpTo = (id: number) => {
    setOpenIds((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  const meta = [roleTitle(session.role), levelLabel(session.difficulty), formatDate(session.createdAt), `${answered} ${answered === 1 ? "answer" : "answers"}`, tailoredTo ? `Tailored to your ${tailoredTo}` : null].filter(Boolean);

  return (
    <div className="grid gap-4">
      {/* ── hero ── */}
      <motion.section {...reveal(reduce)} className={cn(card, "grid items-center gap-6 p-6 sm:grid-cols-[210px_1fr] sm:gap-9 sm:p-8")}>
        <div className="flex flex-col items-center gap-3">
          <ScoreRing value={report.overallScore} reduce={reduce} />
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[12px] font-medium" style={{ color: bandColor(report.overallScore / 10) }}>
            {verdictFor(report.overallScore)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {meta.map((m) => (
              <span key={m} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[12px] text-white/60">
                {m}
              </span>
            ))}
          </div>
          <h1 className="m-0 mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[38px]">
            Interview report
          </h1>
          {report.summary ? <p className="m-0 mt-3 max-w-[560px] text-[14.5px] leading-[1.6] text-white/60">{report.summary}</p> : null}
          <dl className="m-0 mt-6 grid gap-2.5 sm:grid-cols-3">
            {(
              [
                ["Technical", report.technical],
                ["Communication", report.communication],
                ["Confidence", report.confidence],
              ] as const
            ).map(([label, v], i) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <dt className="text-white/55">{label}</dt>
                  <dd className="m-0 text-[15px] font-semibold tabular-nums text-white">
                    {v}
                    <span className="text-[11px] font-medium text-white/40">/10</span>
                  </dd>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
                  <motion.i
                    className="block h-full rounded-full"
                    style={{ background: bandColor(v) }}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${v * 10}%` }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease }}
                  />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </motion.section>

      {/* ── what went well / practise next ── */}
      {(report.strengths.length > 0 || report.improvements.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {report.strengths.length > 0 && (
            <motion.section {...reveal(reduce, 0.06)} className={cn(card, "p-5")} aria-labelledby="went-well">
              <h2 id="went-well" className="m-0 flex items-center gap-2 text-[14px] font-semibold tracking-[-0.015em]">
                <span className="grid size-7 place-items-center rounded-lg bg-[#34d399]/12 text-[#6ee7b7]">
                  <CircleCheck className="size-4" />
                </span>
                What went well
              </h2>
              <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
                {report.strengths.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-white/75">
                    <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#34d399]" />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}
          {report.improvements.length > 0 && (
            <motion.section {...reveal(reduce, 0.08)} className={cn(card, "p-5", report.strengths.length === 0 && "md:col-span-2")} aria-labelledby="practise-next">
              <h2 id="practise-next" className="m-0 flex items-center gap-2 text-[14px] font-semibold tracking-[-0.015em]">
                <span className="grid size-7 place-items-center rounded-lg bg-[#fbbf24]/12 text-[#fcd34d]">
                  <Target className="size-4" />
                </span>
                Practise next
              </h2>
              <ol className="m-0 mt-4 grid list-none gap-2.5 p-0">
                {report.improvements.map((t, i) => (
                  <li key={t} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-white/75">
                    <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[11px] font-semibold text-white/70">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </motion.section>
          )}
        </div>
      )}

      {session.delivery ? (
        <motion.div {...reveal(reduce, 0.1)}>
          <DeliveryCard delivery={session.delivery} />
        </motion.div>
      ) : null}

      {/* ── question by question ── */}
      <motion.section {...reveal(reduce, 0.12)} className={cn(card, "p-5")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em]">Question by question</h2>
            <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-white/45">
              <Lightbulb className="size-3.5" /> Open a question to see feedback and retry it out loud.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11.5px] text-white/40">
            {(
              [
                ["#34d399", "8+"],
                ["#4d7cff", "5–7"],
                ["#fbbf24", "below 5"],
              ] as const
            ).map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex h-[88px] items-end gap-1.5" role="list" aria-label="Score per question">
          {session.questions.map((q) => {
            const s = currentScore(q);
            return (
              <button
                key={q.id}
                type="button"
                role="listitem"
                onClick={() => jumpTo(q.id)}
                aria-label={`${questionLabel(q.order)}: ${s !== null ? `${s} out of 10` : "not scored"}`}
                className="group flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end gap-1.5"
              >
                <span className="relative flex w-full flex-1 items-end overflow-hidden rounded-md bg-white/[0.03]">
                  <motion.span
                    className="w-full rounded-md transition-opacity group-hover:opacity-80"
                    style={{ background: s !== null ? bandColor(s) : "rgba(255,255,255,0.08)" }}
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: s !== null ? `${Math.max(8, s * 10)}%` : "8%" }}
                    transition={{ duration: 0.9, delay: 0.2, ease }}
                  />
                </span>
                <span className="text-[10.5px] tabular-nums text-white/40 group-hover:text-white">{questionLabel(q.order)}</span>
              </button>
            );
          })}
        </div>
      </motion.section>

      <div className="grid gap-2">
        {session.questions.map((q, i) => (
          <motion.div key={q.id} id={`q-${q.id}`} className="scroll-mt-[72px]" {...reveal(reduce, 0.14 + Math.min(i, 8) * 0.03)}>
            <QuestionRow q={q} reduce={reduce} open={openIds.has(q.id)} onToggle={() => toggle(q.id)} onAttempt={onAttempt} />
          </motion.div>
        ))}
      </div>

      <div className={cn(card, "flex flex-wrap items-center justify-between gap-4 p-5")}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
            <RotateCcw className="size-4" />
          </span>
          <div>
            <div className="text-[14px] font-semibold text-white">Ready for another round?</div>
            <div className="text-[12.5px] text-white/50">Same role, fresh questions. Your next report shows the trend.</div>
          </div>
        </div>
        <Link href={`/dashboard/ai-interview/${session.role}`} className={primaryBtn}>
          <RotateCcw /> Practise {roleTitle(session.role)} again
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ value, reduce }: { value: number; reduce: boolean }) {
  const C = 2 * Math.PI * 88;
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const c = animate(0, value, { duration: 1.6, delay: 0.3, ease, onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [value, reduce]);

  return (
    <div className="relative size-[160px] sm:size-[190px]" role="img" aria-label={`Interview score ${value} out of 100`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
        <motion.circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke={bandColor(value / 10)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={reduce ? false : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - value / 100) }}
          transition={{ duration: 1.6, delay: 0.3, ease }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <b className="text-[52px] font-semibold leading-none tracking-[-0.05em] tabular-nums sm:text-[60px]">{shown}</b>
        <span className="mt-1 text-[12px] text-white/45">out of 100</span>
      </div>
    </div>
  );
}
