"use client";

/**
 * Role detail ("prep brief"): what the role covers, how the interview runs, a study
 * list of common questions, the user's past interviews for this role, and a sticky
 * panel to pick a level, optionally tailor the interview (resume, target job) and start.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight, Clock3, FileChartColumn, Headphones, ListChecks, Loader2, Mic, MessagesSquare } from "lucide-react";
import api from "@/lib/api";
import { AppPage } from "@/components/app/AppPage";
import { Chip, Ring, scoreColor } from "@/components/app/kit";
import { ROLES, ROLE_CATEGORIES, roleSlug } from "@/data/roles";
import { ROLE_STUDY_QUESTIONS } from "@/data/roleQuestions";
import { getResume } from "@/lib/career";
import { formatDate, levelLabel, listSessions, type SessionSummary } from "@/lib/interview/report";
import { ease, useMotionMode } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { categoryMeta } from "./categories";
import { MIN_JOB_CHARS, TailorOptions } from "./TailorOptions";

// Sent as the session's "difficulty"; the backend passes it to Zara's prompt as-is.
const LEVELS = [
  { value: "fresher", label: "Fresher", hint: "Fundamentals and how you think. Good for placements and first jobs." },
  { value: "mid-level", label: "Mid-level", hint: "Real-world trade-offs and things you've built." },
  { value: "senior", label: "Senior", hint: "Architecture, scale and leading decisions." },
] as const;
type Level = (typeof LEVELS)[number]["value"];
const LEVEL_KEY = "devprep-level";

const ORDERED = ROLE_CATEGORIES.flatMap((c) => ROLES.filter((r) => r.category === c));

const STEPS = [
  { icon: MessagesSquare, title: "Tell me about yourself", body: "Zara opens with your introduction and uses it later." },
  { icon: Mic, title: "10 questions, out loud", body: "One at a time, with follow-ups on what you actually say." },
  { icon: FileChartColumn, title: "Your report", body: "A score for every answer, what was missing and a stronger version. Retry any of them." },
];

export function RoleBrief({ slug }: { slug: string }) {
  const router = useRouter();
  const mode = useMotionMode();
  const index = ORDERED.findIndex((r) => roleSlug(r.title) === slug);
  const role = ORDERED[index]!;
  const meta = categoryMeta(role.category);
  const questions = ROLE_STUDY_QUESTIONS[slug] ?? [];
  const here = `/dashboard/ai-interview/${slug}`;

  const [level, setLevel] = useState<Level>("fresher");
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [resumeName, setResumeName] = useState<string | null | undefined>(undefined);
  const [useResume, setUseResume] = useState(false);
  const [job, setJob] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEVEL_KEY);
      if (LEVELS.some((l) => l.value === saved)) setLevel(saved as Level);
    } catch {
      /* storage unavailable: keep the default */
    }
    if (!localStorage.getItem("token")) {
      setResumeName(null);
      return;
    }
    let alive = true;
    listSessions()
      .then((s) => alive && setHistory(s.filter((x) => x.role === slug)))
      .catch(() => {}); // history is optional on this page
    getResume()
      .then((r) => alive && setResumeName(r?.fileName ?? null))
      .catch(() => alive && setResumeName(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  const chooseLevel = (l: Level) => {
    setLevel(l);
    try {
      localStorage.setItem(LEVEL_KEY, l);
    } catch {
      /* not essential */
    }
  };

  const toSignIn = () => router.push(`/auth/signin?next=${encodeURIComponent(here)}`);

  const start = async () => {
    if (!localStorage.getItem("token")) return toSignIn();
    const jobDescription = job?.trim() ?? "";
    if (jobDescription && jobDescription.length < MIN_JOB_CHARS) {
      setError(`Paste more of the job description (at least ${MIN_JOB_CHARS} characters), or remove it.`);
      return;
    }
    setStarting(true);
    setError("");
    try {
      const { data } = await api.post<{
        success: boolean;
        sessionId: number;
        question: string;
        totalQuestions: number;
        candidateName?: string | null;
        message?: string;
      }>("/api/interview/generate", {
        role: slug,
        difficulty: level,
        ...(useResume ? { useResume: true } : {}),
        ...(jobDescription ? { jobDescription } : {}),
      });
      if (!data.success) throw new Error(data.message ?? "start failed");
      // read by the session page (app/dashboard/ai-interview/[role]/session)
      sessionStorage.setItem(
        `interview_session_${slug}`,
        JSON.stringify({
          sessionId: data.sessionId,
          firstQuestion: data.question,
          totalQuestions: data.totalQuestions,
          candidateName: data.candidateName ?? null,
          title: role.title,
          duration: role.duration,
          skills: [...role.skills],
          level,
        }),
      );
      router.push(`${here}/session`);
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e.response?.status;
      // MiddleWhere answers 411 (no token), 403 (expired) or 404 "Invalid Token"
      if (status === 411 || status === 403 || e.response?.data?.message === "Invalid Token") return toSignIn();
      if (status === 409 && e.response?.data?.message) {
        setError(e.response.data.message);
        setStarting(false);
        return;
      }
      setError(e.response ? "Couldn't start the interview. Please try again." : "Can't reach the server. Check your connection and try again.");
      setStarting(false);
    }
  };

  const levelInfo = LEVELS.find((l) => l.value === level)!;
  const scored = history.filter((s) => s.overallScore !== null);
  const best = scored.length ? Math.max(...scored.map((s) => s.overallScore!)) : null;

  return (
    <AppPage back={{ href: "/dashboard/ai-interview", label: "All interviews" }} className="max-w-[1320px]">
      {/* ── hero ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="fx-grain relative mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-card px-6 py-7 sm:px-8"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="fx-grid absolute inset-0 opacity-60" />
          <div className="absolute -right-24 -top-32 size-[380px] rounded-full opacity-30 blur-[100px]" style={{ background: meta.color }} />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${meta.color}22`, color: meta.color }}>
                <meta.icon className="size-[18px]" />
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/50">
                <span>{role.category}</span>
                <span className="text-white/20">·</span>
                <Clock3 className="size-3" /> {role.duration} min
                <span className="text-white/20">·</span>
                <Headphones className="size-3" /> Voice
              </div>
            </div>
            <h1 className="m-0 mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-[46px]">{role.title}</h1>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.skills.map((s) => (
                <span key={s} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12.5px] text-white/70">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {history.length > 0 && (
            <div className="flex gap-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/30 px-4 py-3 backdrop-blur">
                <Ring value={best ?? 0} size={42} color={best !== null ? scoreColor(best) : "#71717a"}>
                  {best ?? "—"}
                </Ring>
                <div>
                  <div className="text-[11.5px] text-white/45">Best score</div>
                  <div className="text-[14px] font-semibold text-white">
                    {history.length} {history.length === 1 ? "interview" : "interviews"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── content ── */}
        <div className="grid min-w-0 content-start gap-6">
          <Block title="How it runs" mode={mode}>
            <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded-lg bg-white/[0.06] text-white">
                      <s.icon className="size-4" />
                    </span>
                    <span className="text-[11.5px] tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="m-0 mt-3 text-[14px] font-semibold tracking-[-0.015em] text-white">{s.title}</h3>
                  <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-white/50">{s.body}</p>
                </li>
              ))}
            </ol>
          </Block>

          <Block title="Questions to prepare" aside={questions.length ? <Chip>{questions.length} questions</Chip> : null} mode={mode} flush>
            {questions.length ? (
              <>
                <ol className="m-0 list-none divide-y divide-white/[0.05] p-0">
                  {questions.map((q, i) => (
                    <li key={q} className="group flex gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.05] text-[11px] font-medium tabular-nums text-white/50 group-hover:bg-white group-hover:text-black">
                        {i + 1}
                      </span>
                      <span className="text-[14px] leading-[1.55] text-white/80">{q}</span>
                    </li>
                  ))}
                </ol>
                <p className="m-0 flex items-start gap-2 border-t border-white/[0.05] px-5 py-3.5 text-[12.5px] leading-[1.5] text-white/40">
                  <ListChecks className="mt-0.5 size-3.5 shrink-0" />
                  A study list for this role. Zara writes her own questions during the interview and follows up on your answers, so expect different wording.
                </p>
              </>
            ) : (
              <p className="m-0 px-5 py-5 text-[14px] leading-[1.55] text-white/55">
                There&rsquo;s no study list for {role.title} yet. Zara writes questions for this role during the interview and follows up on your answers, and your report shows what to work on.
              </p>
            )}
          </Block>

          {history.length > 0 && (
            <Block title={`Your ${role.title} interviews`} aside={<Chip>{history.length}</Chip>} mode={mode} flush>
              <ul className="m-0 list-none divide-y divide-white/[0.05] p-0">
                {history.map((s) => {
                  const body = (
                    <>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] text-white">{formatDate(s.createdAt)}</span>
                        <span className="block text-[12px] text-white/40">
                          {levelLabel(s.difficulty)} · {s.answered}/{s.totalQuestions} answered
                        </span>
                      </span>
                      {s.overallScore !== null ? (
                        <span className="flex items-center gap-2 text-[14px] font-semibold tabular-nums" style={{ color: scoreColor(s.overallScore) }}>
                          {s.overallScore}
                          <ArrowUpRight className="size-3.5 text-white/25" />
                        </span>
                      ) : s.answered ? (
                        <span className="text-[12.5px] font-medium text-[#8fb0ff]">Get report →</span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </>
                  );
                  const cls = "flex items-center justify-between gap-4 px-5 py-3";
                  return (
                    <li key={s.id}>
                      {s.answered > 0 ? (
                        <Link href={`/dashboard/reports/${s.id}`} className={cn(cls, "transition-colors hover:bg-white/[0.02]")}>
                          {body}
                        </Link>
                      ) : (
                        <div className={cls}>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Block>
          )}
        </div>

        {/* ── setup panel ── */}
        <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease }} className="lg:sticky lg:top-[72px] lg:self-start">
          <div className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0d10] p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,1)]">
            <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-[#4d7cff]/15 blur-[80px]" />
            <h2 className="m-0 text-[17px] font-semibold tracking-[-0.025em] text-white">Set up your interview</h2>
            <p className="m-0 mt-1 text-[12.5px] text-white/45">Choose a level, tailor it if you like, then start.</p>

            <div id="level-label" className="mb-2 mt-5 text-[12px] font-medium text-white/55">
              Level
            </div>
            <div role="radiogroup" aria-labelledby="level-label" className="grid gap-1.5">
              {LEVELS.map((l) => {
                const on = l.value === level;
                return (
                  <button
                    key={l.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => chooseLevel(l.value)}
                    className={cn(
                      "relative flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring",
                      on ? "border-[#4d7cff]/50 bg-[#4d7cff]/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]",
                    )}
                  >
                    <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-[#4d7cff]" : "border-white/25")}>
                      {on && <motion.span layoutId="level-dot" transition={{ duration: mode === "reduce" ? 0 : 0.3, ease }} className="size-2 rounded-full bg-[#4d7cff]" />}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-medium text-white">{l.label}</span>
                      <span className="block text-[12px] leading-[1.45] text-white/45">{l.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="sr-only" aria-live="polite">
              {levelInfo.label} selected
            </span>

            <TailorOptions resumeName={resumeName} useResume={useResume} onUseResume={setUseResume} job={job} onJob={setJob} />

            <dl className="m-0 mt-4 grid grid-cols-3 gap-2">
              {[
                ["Length", `~${role.duration} min`],
                ["Questions", "Intro + 10"],
                ["Needs", "Microphone"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col-reverse rounded-xl bg-white/[0.03] px-3 py-2">
                  <dt className="text-[11px] text-white/40">{k}</dt>
                  <dd className="m-0 truncate text-[12.5px] font-medium text-white">{v}</dd>
                </div>
              ))}
            </dl>

            {error && (
              <p role="alert" className="m-0 mt-4 rounded-xl border border-[#f87171]/25 bg-[#f87171]/[0.07] px-3 py-2.5 text-[12.5px] text-[#fecaca]">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={start}
              disabled={starting}
              className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold tracking-[-0.02em] text-black shadow-[0_10px_30px_-12px_rgba(255,255,255,0.5)] transition-[background-color,transform] duration-200 hover:bg-white/90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:bg-white/70"
            >
              {starting ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> Starting…
                </>
              ) : (
                <>
                  <Mic className="size-4" /> Start interview
                </>
              )}
            </button>
            <p className="m-0 mt-2.5 text-center text-[12px] text-white/40">You&rsquo;ll check your mic before Zara starts.</p>
          </div>
        </motion.aside>
      </div>
    </AppPage>
  );
}

function Block({ title, aside, mode, flush, children }: { title: string; aside?: ReactNode; mode: ReturnType<typeof useMotionMode>; flush?: boolean; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={mode === "pending" ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={mode === "reduce" ? { duration: 0 } : { duration: 0.6, ease }}
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-card"
    >
      <header className="flex min-h-[52px] items-center justify-between gap-3 px-5">
        <h2 className="m-0 text-[14px] font-semibold tracking-[-0.015em] text-white">{title}</h2>
        {aside}
      </header>
      <div className={flush ? "border-t border-white/[0.05]" : "px-5 pb-5"}>{children}</div>
    </motion.section>
  );
}
