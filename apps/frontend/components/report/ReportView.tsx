"use client";

/**
 * Interview report: loads the session, generates the report on first visit (15–30 s),
 * then shows the overall score, the top things to practise and every question.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, motion } from "motion/react";
import { serif } from "@/lib/fonts";
import {
  createReport,
  formatDate,
  getSession,
  roleTitle,
  ReportApiError,
  type AttemptResult,
  type SessionDetail,
} from "@/lib/interview/report";
import { QuestionRow } from "./QuestionRow";
import { PageShell, StateMessage, TopBar, card, ease, primaryBtn, reveal, secondaryBtn, useReducedMotionFlag } from "./ui";

type View =
  | { name: "loading" }
  | { name: "generating"; answered: number }
  | { name: "ready"; session: SessionDetail }
  | { name: "error"; error: ReportApiError };

const italic = { fontStyle: "italic" } as const;

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
        if (answered === 0) throw new ReportApiError("no_answers", "No answers to review.");
        setView({ name: "generating", answered });
        session = await createReport(sessionId);
      }
      setView({ name: "ready", session });
    } catch (err) {
      const error = err instanceof ReportApiError ? err : new ReportApiError("server", "Something went wrong.");
      if (error.kind === "auth") {
        router.replace(`/auth/signin?next=${encodeURIComponent(`/dashboard/ai-interview/report/${sessionId}`)}`);
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

  return (
    <PageShell>
      <TopBar active="report" />
      {view.name === "loading" && <Skeleton />}
      {view.name === "generating" && <Generating answered={view.answered} reduce={reduce} />}
      {view.name === "error" && <ErrorState error={view.error} onRetry={load} />}
      {view.name === "ready" && <Report session={view.session} reduce={reduce} onAttempt={onAttempt} />}
    </PageShell>
  );
}

/* ───────── states ───────── */

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your report" className="grid gap-2 pt-2">
      <i className="block h-[264px] animate-pulse rounded-[20px] bg-[#0d0d0f] motion-reduce:animate-none" />
      {[0, 1, 2].map((i) => (
        <i key={i} className="block h-[62px] animate-pulse rounded-[20px] bg-[#0d0d0f] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

function Generating({ answered, reduce }: { answered: number; reduce: boolean }) {
  return (
    <div className="flex flex-col items-center px-4 pb-10 pt-24 text-center" role="status" aria-live="polite">
      <motion.div
        {...reveal(reduce)}
        aria-hidden="true"
        className="h-[84px] w-[84px] animate-[dp-rep-breathe_2.4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_50%_40%,#bec8ff,#5b63d8_60%,#1a1b3a)] shadow-[0_0_60px_rgba(140,150,255,0.45)] motion-reduce:animate-none"
      />
      <motion.h1 {...reveal(reduce, 0.08)} className="m-0 mt-[30px] text-[34px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[40px]">
        Reviewing your{" "}
        <em className={`${serif.className} font-normal tracking-normal`} style={italic}>
          answers
        </em>
      </motion.h1>
      <motion.p {...reveal(reduce, 0.16)} className="mx-auto mt-3 max-w-[460px] text-[15px] leading-[1.55] tracking-[-0.02em] text-white/60">
        Zara is scoring your {answered} {answered === 1 ? "answer" : "answers"} and writing a stronger version of each. This usually takes 15–30 seconds.
      </motion.p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: ReportApiError; onRetry: () => void }) {
  if (error.kind === "not_found")
    return (
      <StateMessage title="Interview not found" body="This interview doesn't exist, or it belongs to another account.">
        <Link href="/dashboard/ai-interview/feedback" className={primaryBtn}>
          See your interviews
        </Link>
      </StateMessage>
    );
  if (error.kind === "no_answers")
    return (
      <StateMessage title="Nothing to review yet" body="This interview ended before any answers were recorded. Start a new one and answer at least one question.">
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
      <Link href="/dashboard/ai-interview/feedback" className={secondaryBtn}>
        Back to history
      </Link>
    </StateMessage>
  );
}

/* ───────── report ───────── */

function Report({ session, reduce, onAttempt }: { session: SessionDetail; reduce: boolean; onAttempt: (id: number, r: AttemptResult) => void }) {
  const report = session.report!;
  const answered = session.questions.filter((q) => q.answer).length;
  // open the weakest scored answer first: that's where a retry helps most
  const scored = session.questions.filter((q) => q.score !== null);
  const weakest = scored.length ? scored.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a)).id : null;

  return (
    <>
      <motion.section {...reveal(reduce)} className={`${card} relative isolate grid items-center gap-5 overflow-hidden p-6 sm:grid-cols-[200px_1fr] sm:gap-9 sm:p-8`}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-[200px] -top-[260px] -z-10 h-[520px] w-[620px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(140,150,255,0.18),rgba(10,10,10,0)_70%)]" />
        <ScoreRing value={report.overallScore} reduce={reduce} />
        <div>
          <div className="text-[13px] tracking-[-0.02em] text-white/45">
            {roleTitle(session.role)} · <span className="capitalize">{session.difficulty}</span> · {formatDate(session.createdAt)} · {answered}{" "}
            {answered === 1 ? "answer" : "answers"}
          </div>
          <h1 className="m-0 mb-3 mt-2 text-[32px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[40px]">
            Your interview{" "}
            <em className={`${serif.className} font-normal tracking-normal`} style={italic}>
              report
            </em>
          </h1>
          {report.summary ? <p className="m-0 max-w-[520px] text-[15px] leading-[1.55] tracking-[-0.02em] text-white/62">{report.summary}</p> : null}
          <dl className="m-0 mt-[22px] grid gap-[18px] sm:grid-cols-3">
            {(
              [
                ["Technical", report.technical],
                ["Communication", report.communication],
                ["Confidence", report.confidence],
              ] as const
            ).map(([label, v], i) => (
              <div key={label}>
                <div className="flex justify-between text-[12.5px] text-white/55">
                  <dt>{label}</dt>
                  <dd className="m-0 font-medium text-[#f0f0f0]">{v}/10</dd>
                </div>
                <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/7" aria-hidden="true">
                  <motion.i
                    className="block h-full rounded-full bg-gradient-to-r from-[#7c86ff] to-[#bec8ff]"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${v * 10}%` }}
                    transition={{ duration: 1.4, delay: 0.4 + i * 0.1, ease }}
                  />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </motion.section>

      {report.improvements.length > 0 && (
        <motion.section {...reveal(reduce, 0.08)} className={`${card} mt-3.5 px-6 py-6 sm:px-7`} aria-labelledby="practise-next">
          <h2 id="practise-next" className="m-0 mb-3.5 text-[13px] font-medium text-white/45">
            Practise next
          </h2>
          <ol className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-3">
            {report.improvements.map((t, i) => (
              <li key={t} className="flex gap-2.5 text-[14px] leading-[1.45] tracking-[-0.02em]">
                <span aria-hidden="true" className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#bec8ff]/10 text-[11.5px] text-[#bec8ff]">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </motion.section>
      )}

      <motion.h2 {...reveal(reduce, 0.14)} className="m-0 mb-3 ml-1 mt-[34px] text-[13px] font-medium text-white/45">
        Question by question · open one to see feedback and retry it
      </motion.h2>
      {session.questions.map((q, i) => (
        <motion.div key={q.id} {...reveal(reduce, 0.18 + i * 0.04)}>
          <QuestionRow q={q} reduce={reduce} defaultOpen={q.id === weakest} onAttempt={onAttempt} />
        </motion.div>
      ))}
    </>
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
    <div className="relative h-[150px] w-[150px] sm:h-[200px] sm:w-[200px]" role="img" aria-label={`Interview score ${value} out of 100`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="dp-rep-ring" x1="0" x2="1">
            <stop offset="0" stopColor="#7c86ff" />
            <stop offset="1" stopColor="#bec8ff" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <motion.circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="url(#dp-rep-ring)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={reduce ? false : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - value / 100) }}
          transition={{ duration: 1.6, delay: 0.3, ease }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <b className="text-[48px] font-medium leading-none tracking-[-0.05em] tabular-nums sm:text-[64px]">{shown}</b>
        <span className="mt-1.5 text-[12.5px] text-white/45">out of 100</span>
      </div>
    </div>
  );
}
