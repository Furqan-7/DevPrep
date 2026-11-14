"use client";

/**
 * Role detail ("prep brief"): what the role covers, how the interview runs, a study
 * list of common questions, the user's past interviews for this role, and a sticky
 * panel to pick a level and start.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import api from "@/lib/api";
import { serif } from "@/lib/fonts";
import { ROLES, ROLE_CATEGORIES, roleSlug } from "@/data/roles";
import { ROLE_STUDY_QUESTIONS } from "@/data/roleQuestions";
import { formatDate, levelLabel, listSessions, type SessionSummary } from "@/lib/interview/report";
import { ease, revealProps, useMotionMode } from "@/lib/motion";

const italic = { fontStyle: "italic" } as const;

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
  { title: "Tell me about yourself", body: "Zara opens with your introduction and uses it later." },
  { title: "10 questions, out loud", body: "One at a time, with follow-ups on what you actually say." },
  { title: "Your report", body: "A score for every answer, what was missing, a stronger version. Retry any of them." },
];

export function RoleBrief({ slug }: { slug: string }) {
  const router = useRouter();
  const mode = useMotionMode();
  const reveal = (d: number) => revealProps(mode, d);
  const index = ORDERED.findIndex((r) => roleSlug(r.title) === slug);
  const role = ORDERED[index]!;
  const questions = ROLE_STUDY_QUESTIONS[slug] ?? [];
  const here = `/dashboard/ai-interview/${slug}`;

  const [level, setLevel] = useState<Level>("fresher");
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEVEL_KEY);
      if (LEVELS.some((l) => l.value === saved)) setLevel(saved as Level);
    } catch {
      /* storage unavailable: keep the default */
    }
    if (!localStorage.getItem("token")) return;
    let alive = true;
    listSessions()
      .then((s) => alive && setHistory(s.filter((x) => x.role === slug)))
      .catch(() => {}); // history is optional on this page
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
      }>("/api/interview/generate", { role: slug, difficulty: level });
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
        }),
      );
      router.push(`${here}/session`);
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e.response?.status;
      // MiddleWhere answers 411 (no token), 403 (expired) or 404 "Invalid Token"
      if (status === 411 || status === 403 || e.response?.data?.message === "Invalid Token") return toSignIn();
      setError(e.response ? "Couldn't start the interview. Please try again." : "Can't reach the server. Check your connection and try again.");
      setStarting(false);
    }
  };

  const levelInfo = LEVELS.find((l) => l.value === level)!;

  return (
    <main className="mx-auto grid max-w-[1200px] gap-x-14 px-4 pb-24 pt-9 sm:px-6 lg:grid-cols-[1fr_360px]">
      {/* ── header ── */}
      <div className="lg:col-start-1">
        <motion.nav {...reveal(0)} aria-label="Breadcrumb" className="flex gap-2 text-[13px] text-white/45">
          <Link href="/dashboard/ai-interview" className="transition-colors hover:text-[#f0f0f0]">
            Interviews
          </Link>
          <span aria-hidden="true">/</span>
          <span>{role.category}</span>
        </motion.nav>
        <motion.div {...reveal(0.05)} className="mt-10 flex gap-3.5 text-[12.5px] tabular-nums text-white/40">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{role.category}</span>
          <span>{role.duration} min</span>
          <span>Voice</span>
        </motion.div>
        <motion.h1 {...reveal(0.1)} className="m-0 mt-3 text-[40px] font-medium leading-[1.02] tracking-[-0.05em] sm:text-[64px]">
          {role.title}
        </motion.h1>
        <motion.p {...reveal(0.15)} className="m-0 mt-[18px] text-[15px] leading-[1.5] text-white/55">
          Covers <span className="text-white/80">{role.skills.join(" · ")}</span>
        </motion.p>
      </div>

      {/* ── start panel (sticky beside the content on large screens) ── */}
      <motion.aside {...reveal(0.2)} className="mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
        <div className="relative isolate overflow-hidden rounded-[20px] bg-[#0d0d0f] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:sticky lg:top-[96px]">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-[300px] left-1/2 -z-10 h-[420px] w-[700px] -translate-x-1/2 bg-[radial-gradient(ellipse_45%_45%_at_50%_55%,rgba(150,160,255,0.24),rgba(10,10,10,0)_72%)]" />
          <h2 className="m-0 text-[22px] font-medium tracking-[-0.04em]">
            Ready when{" "}
            <em className={`${serif.className} font-normal tracking-normal`} style={italic}>
              you are.
            </em>
          </h2>

          <div id="level-label" className="mb-2 mt-[22px] text-[12.5px] text-white/45">
            Your level
          </div>
          <div role="radiogroup" aria-labelledby="level-label" className="relative grid grid-cols-3 rounded-[11px] bg-[#0a0a0a] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
            {LEVELS.map((l) => {
              const on = l.value === level;
              return (
                <button
                  key={l.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => chooseLevel(l.value)}
                  className={`relative h-9 cursor-pointer rounded-[8px] text-[13px] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#bec8ff]/60 ${on ? "text-[#0a0a0a]" : "text-white/55 hover:text-white/80"}`}
                >
                  {on && <motion.span layoutId="level-pill" transition={{ duration: mode === "reduce" ? 0 : 0.45, ease }} className="absolute inset-0 -z-0 rounded-[8px] bg-[#f0f0f0]" />}
                  <span className="relative">{l.label}</span>
                </button>
              );
            })}
          </div>
          <p className="m-0 mt-2 min-h-[36px] text-[12.5px] leading-[1.45] text-white/45" aria-live="polite">
            {levelInfo.hint}
          </p>

          <dl className="m-0 mt-4 border-t border-white/[0.08] text-[13.5px]">
            {[
              ["Length", `~${role.duration} min`],
              ["Questions", "Intro + 10"],
              ["You'll need", "A microphone"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/[0.08] py-[11px]">
                <dt className="text-white/55">{k}</dt>
                <dd className="m-0 text-[#f0f0f0]">{v}</dd>
              </div>
            ))}
          </dl>

          {error && (
            <p role="alert" className="m-0 mt-4 text-[13px] text-[#ffb4b4]">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={start}
            disabled={starting}
            className="mt-5 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-[11px] bg-[#f0f0f0] text-[15px] font-medium tracking-[-0.02em] text-[#0a0a0a] transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bec8ff] disabled:cursor-wait disabled:bg-white/70"
          >
            {starting ? (
              <>
                <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70 motion-reduce:animate-none" />
                Starting…
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-[15px] w-[15px]">
                  <rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4" fill="currentColor" />
                  <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Start interview
              </>
            )}
          </button>
          <p className="m-0 mt-2.5 text-center text-[12.5px] text-white/40">You&rsquo;ll check your mic before Zara starts.</p>
        </div>
      </motion.aside>

      {/* ── content ── */}
      <div className="lg:col-start-1">
        <Section title="How it runs" mode={mode}>
          <ol className="m-0 grid list-none p-0 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-b border-white/[0.08] py-[18px] sm:pr-[18px] sm:[&+li]:border-l sm:[&+li]:pl-[18px]">
                <span className="text-[12px] tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="m-0 mb-1 mt-2 text-[15px] font-medium tracking-[-0.02em]">{s.title}</h3>
                <p className="m-0 text-[13.5px] leading-[1.5] text-white/50">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Questions to prepare" count={questions.length || undefined} mode={mode}>
          {questions.length ? (
            <>
              <ol className="m-0 list-none p-0">
                {questions.map((q, i) => (
                  <li key={q} className="grid grid-cols-[44px_1fr] border-b border-white/[0.08] py-4 text-[15.5px] leading-[1.45] tracking-[-0.02em] text-white/82">
                    <span className="pt-1 text-[12px] tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
                    {q}
                  </li>
                ))}
              </ol>
              <p className="m-0 mt-3 text-[13px] leading-[1.5] text-white/42">
                A study list for this role. Zara writes her own questions during the interview and follows up on your answers, so expect different wording.
              </p>
            </>
          ) : (
            <p className="m-0 py-4 text-[14.5px] leading-[1.55] text-white/55">
              There&rsquo;s no study list for {role.title} yet. Zara writes questions for this role during the interview and follows up on your answers, and your report shows what to work on.
            </p>
          )}
        </Section>

        {history.length > 0 && (
          <Section title={`Your ${role.title} interviews`} count={history.length} mode={mode}>
            <ul className="m-0 list-none p-0">
              {history.map((s) => {
                const body = (
                  <>
                    <span className="text-white/80">{formatDate(s.createdAt)}</span>
                    <span className="hidden text-white/40 sm:block">{levelLabel(s.difficulty)}</span>
                    <span className="text-[12.5px] text-white/40">{s.answered}/{s.totalQuestions} answered</span>
                    <span className="text-right tabular-nums text-[#cfd6ff]">{s.overallScore ?? (s.answered ? <span className="text-[13px] text-[#bec8ff]">Get report →</span> : <span className="text-white/35">—</span>)}</span>
                  </>
                );
                const cls = "grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/[0.08] py-3.5 text-[14px] sm:grid-cols-[1fr_110px_120px_90px]";
                return (
                  <li key={s.id}>
                    {s.answered > 0 ? (
                      <Link href={`/dashboard/ai-interview/report/${s.id}`} className={`${cls} transition-colors hover:bg-white/[0.02]`}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, count, mode, children }: { title: string; count?: number; mode: ReturnType<typeof useMotionMode>; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={mode === "pending" ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={mode === "reduce" ? { duration: 0 } : { duration: 0.7, ease }}
      className="mt-14"
    >
      <h2 className="m-0 flex items-baseline justify-between border-b border-white/[0.08] pb-3 text-[13px] font-medium text-white/60">
        {title}
        {count !== undefined && <span className="text-[12.5px] font-normal tabular-nums text-white/35">{count}</span>}
      </h2>
      {children}
    </motion.section>
  );
}
