"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import type { FeedbackGoal, FeedbackSession, FeedbackSummary, RecurringGap, WeeklyFrequency } from "@/types/feedback";
import { getFrequency, getGaps, getGoal, getSessions, getSummary, roleFeedbackHref, type FeedbackApiError } from "@/lib/feedback/api";
import { deriveAverageScore, derivePassRate, deriveTrend, deriveWeakestSkill } from "@/lib/feedback/derive";
import styles from "./FeedbackDashboard.module.css";

interface FeedbackData {
  summary: FeedbackSummary;
  sessions: FeedbackSession[];
  gaps: RecurringGap[];
  weeks: WeeklyFrequency[];
  goal: FeedbackGoal | null;
}

function formatDate(value: string | null, locale: string, timeZone: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(new Date(value));
}

function labelForKey(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function ErrorMessage({ error, onRetry }: { error: FeedbackApiError; onRetry: () => void }) {
  return <div className={styles.error} role="alert"><strong>{error.message}</strong><button className={styles.button} onClick={onRetry}>Retry</button></div>;
}

function Skeletons() {
  return <>{Array.from({ length: 5 }, (_, index) => <div className={styles.skeleton} key={index} aria-hidden="true" />)}</>;
}

export default function FeedbackDashboard() {
  const router = useRouter();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<FeedbackApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [timeZone, setTimeZone] = useState("UTC");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [summary, sessions, gaps, frequency, goal] = await Promise.all([
      getSummary(), getSessions({ category: category || undefined, q: query || undefined, sort }), getGaps(), getFrequency(), getGoal(),
    ]);
    const failed = [summary, sessions, gaps, frequency, goal].find((result) => !result.ok);
    if (failed && !failed.ok) {
      if (failed.error.code === "unauthorized") router.push("/auth/signin");
      setError(failed.error);
      setLoading(false);
      return;
    }
    if (!summary.ok || !sessions.ok || !gaps.ok || !frequency.ok || !goal.ok) return;
    setData({ summary: summary.data, sessions: sessions.data.sessions, gaps: gaps.data, weeks: frequency.data.weeks, goal: goal.data.goal });
    setLoading(false);
  }, [category, query, router, sort]);

  useEffect(() => {
    setLocale(navigator.language);
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const sessions = useMemo(() => data?.sessions ?? [], [data?.sessions]);
  const skills = useMemo(() => [...new Set(sessions.flatMap((item) => Object.keys(item.skillScores)))], [sessions]);
  const activeSkill = skill ?? skills[0] ?? null;
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of sessions) {
      if (!map.has(item.category)) {
        map.set(item.category, item.roleId);
      }
    }
    return Array.from(map.entries()).map(([cat, rId]) => ({ category: cat, roleId: rId }));
  }, [sessions]);
  const selectedRoleOption = useMemo(() => {
    if (!category) return null;
    return categoryOptions.find((opt) => opt.category === category) ?? null;
  }, [category, categoryOptions]);
  const trend = useMemo(() => deriveTrend(sessions, activeSkill, locale, timeZone), [activeSkill, locale, sessions, timeZone]);
  const loadedSummary = data?.summary;
  const average = loadedSummary?.averageScore ?? deriveAverageScore(sessions);
  const passRate = loadedSummary?.passRate ?? (loadedSummary ? derivePassRate(sessions, loadedSummary.passThreshold) : null);
  const weakest = loadedSummary?.weakestSkill ?? deriveWeakestSkill(sessions);

  if (loading && !data) return <main className={styles.page}><div className={styles.wrap}><Skeletons /></div></main>;
  if (error) return <main className={styles.page}><div className={styles.wrap}><ErrorMessage error={error} onRetry={() => void load()} /></div></main>;
  if (!data || sessions.length === 0) {
    return <main className={styles.page}><header className={`${styles.header} dp-glow`}><div className={styles.wrap}><div className={styles.eyebrow}>Session history</div><h1 className={styles.title}>All feedback</h1><p className={styles.lede}>Review your interview performance, find recurring gaps, and choose what to sharpen next.</p></div></header><div className={styles.wrap}><div className={`${styles.empty} ${styles.lifted}`}><Target size={30} color="#eb3a14" /><h2>No feedback yet</h2><p>No feedback yet. Complete your first mock interview with Zara and your scores, skill breakdown and feedback will appear here.</p><Link className={`${styles.button} ${styles.primary}`} href="/dashboard/ai-interview">Start your first interview <ChevronRight size={14} /></Link></div></div></main>;
  }

  const summary = data.summary;
  const goal = data.goal;
  const comparisonFirst = sessions[0];
  const comparisonSecond = sessions[1];

  return (
    <main className={styles.page}>
      <header className={`${styles.header} dp-glow`}><div className={styles.wrap}><div className={styles.eyebrow}>Session history</div><h1 className={styles.title}>All feedback</h1><p className={styles.lede}>A clear record of what is improving, what is holding you back, and what to practice next.</p></div></header>
      <div className={styles.wrap}>
        <section className={`${styles.stats} ${styles.lifted}`} aria-label="Feedback summary">
          <div className={styles.stat}><span className={styles.label}>Sessions</span><strong>{summary.totalSessions}</strong><small>completed interviews</small></div>
          <div className={styles.stat}><span className={styles.label}>Average</span><strong>{average === null ? "—" : Math.round(average)}</strong><small>overall score</small></div>
          <div className={styles.stat}><span className={styles.label}>Pass rate</span><strong>{passRate === null ? "—" : `${Math.round(passRate * 100)}%`}</strong><small>threshold {summary.passThreshold}</small></div>
          <div className={styles.stat}><span className={styles.label}>Weakest skill</span><strong>{weakest ? labelForKey(weakest) : "—"}</strong><small>{summary.lastUpdatedAt ? `updated ${formatDate(summary.lastUpdatedAt, locale, timeZone)}` : "keep practicing"}</small></div>
        </section>
        <section className={styles.section}><div className={styles.next}><div><span className={styles.label}>Next up</span><h3>{weakest ? `Practice ${labelForKey(weakest)}` : "Continue your practice"}</h3><p className={styles.muted}>Use your latest feedback to choose the next interview.</p></div><Link className={`${styles.button} ${styles.primary}`} href="/dashboard/ai-interview">Start practicing <ChevronRight size={14} /></Link></div></section>
        <section className={styles.section}><div className={styles.card}><div className={styles.row}><div><span className={styles.label}>Goal</span><h2 className={styles.sectionTitle}>{goal?.label ?? "Set a goal"}</h2></div>{goal && <span className={styles.meta}>{goal.targetScore}</span>}</div>{goal ? <><p className={styles.muted}>Reach {goal.targetScore} by {formatDate(goal.targetDate, locale, timeZone)}.</p><div className={styles.progress}><i style={{ width: `${Math.min(100, ((average ?? 0) / goal.targetScore) * 100)}%` }} /></div></> : <p className={styles.muted}>Choose a target score and date to make your practice measurable.</p>}</div></section>
        <section className={styles.section}><div className={styles.row}><div><span className={styles.label}>Progress</span><h2 className={styles.sectionTitle}>Score trend</h2></div><div className={styles.tabs}>{skills.map((item) => <button className={`${styles.tab} ${item === activeSkill ? styles.tabActive : ""}`} key={item} onClick={() => setSkill(item)}>{labelForKey(item)}</button>)}</div></div>{trend.length < 2 ? <div className={styles.empty}>Complete at least two interviews to see your trend.</div> : <svg className={styles.chart} viewBox="0 0 640 190" role="img" aria-label="Score trend chart"><line x1="24" x2="616" y1="160" y2="160" stroke="#e5e5e5" /><polyline className={styles.chartLine} points={trend.map((point, index) => `${24 + (index * 592) / Math.max(1, trend.length - 1)},${160 - point.score * 1.25}`).join(" ")} />{trend.map((point, index) => <g key={`${point.label}-${index}`}><circle className={styles.chartPoint} cx={24 + (index * 592) / Math.max(1, trend.length - 1)} cy={160 - point.score * 1.25} r="4" /><text x={24 + (index * 592) / Math.max(1, trend.length - 1)} y="180" textAnchor="middle">{point.label}</text></g>)}</svg>}</section>
        <div className={styles.grid}>
          <section className={styles.section}><div className={styles.card}><span className={styles.label}>Breakdown</span><h2 className={styles.sectionTitle}>Skills</h2>{skills.map((item) => { const values = sessions.map((entry) => entry.skillScores[item]).filter((value): value is number => value !== undefined); const value = values.length ? values.reduce((total, current) => total + current, 0) / values.length : null; return <div className={styles.skillRow} key={item}><span className={styles.barLabel}>{labelForKey(item)}</span><div className={styles.bar}><i style={{ width: `${value ?? 0}%` }} /></div><span className={styles.meta}>{value === null ? "—" : Math.round(value)}</span></div>; })}</div></section>
          <section className={styles.section}><div className={styles.card}><span className={styles.label}>Pattern watch</span><h2 className={styles.sectionTitle}>Recurring gaps</h2>{data.gaps.length === 0 ? <p className={styles.muted}>Recurring gaps show up after a few interviews.</p> : data.gaps.map((gap) => <div className={styles.gapRow} key={gap.skill}><strong>{labelForKey(gap.skill)}</strong><small>{gap.note ?? `${gap.occurrences} sessions`}</small></div>)}<span className={styles.label}>Practice frequency</span><div className={styles.frequency}>{data.weeks.map((week) => <div className={styles.frequencyItem} key={week.weekStart}><span>{week.sessionCount}</span><i className={`${styles.frequencyBar} ${week.sessionCount === 0 ? styles.frequencyEmpty : ""}`} style={{ height: `${Math.max(4, week.sessionCount * 24)}px` }} /><span>{week.weekStart}</span></div>)}</div></div></section>
        </div>
        {comparisonFirst && comparisonSecond && <section className={styles.section}><span className={styles.label}>Calibration</span><h2 className={styles.sectionTitle}>Compare two sessions</h2><div className={styles.card}><div className={`${styles.compare} ${styles.compareHeader}`}><span>Metric</span><span>{comparisonSecond.role}</span><span>{comparisonFirst.role}</span></div>{skills.map((item) => <div className={styles.compare} key={item}><span>{labelForKey(item)}</span><span>{comparisonSecond.skillScores[item] ?? "—"}</span><span>{comparisonFirst.skillScores[item] ?? "—"}</span></div>)}</div></section>}
        <section className={styles.section}><div className={styles.filters}><input className={styles.input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sessions" aria-label="Search sessions" /><select className={styles.select} value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort sessions"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div><div className={styles.chips}><button className={`${styles.chip} ${category === "" ? styles.chipActive : ""}`} onClick={() => setCategory("")}>All</button>{categoryOptions.map((item) => <button className={`${styles.chip} ${category === item.category ? styles.chipActive : ""}`} key={item.category} onClick={() => setCategory(item.category)}>{item.category}</button>)}{selectedRoleOption && <Link className={styles.button} href={roleFeedbackHref(selectedRoleOption.roleId)}>Open {selectedRoleOption.category} page</Link>}</div>{sessions.length === 0 ? <div className={styles.empty}>No sessions match your search <button className={styles.button} onClick={() => { setQuery(""); setCategory(""); }}>Clear filters</button></div> : sessions.map((session) => <article className={styles.session} key={session.id}><button className={styles.sessionToggle} onClick={() => setExpanded(expanded === session.id ? null : session.id)} aria-expanded={expanded === session.id}><span className={`${styles.score} ${session.score >= summary.passThreshold ? styles.pass : styles.fail}`}>{session.score}</span><span><span className={styles.sessionRole}>{session.role}</span><span className={styles.sessionMeta}>{session.category} · {formatDate(session.createdAt, locale, timeZone)} · {session.durationMin} min</span></span><span className={styles.meta}>{session.topics.join(" · ")}</span><ChevronRight className={`${styles.sessionArrow} ${expanded === session.id ? styles.sessionArrowOpen : ""}`} size={16} /></button>{expanded === session.id && <div className={styles.details}><div>{Object.entries(session.skillScores).map(([key, value]) => <div className={styles.barLine} key={key}><span>{labelForKey(key)}</span><span className={styles.bar}><i style={{ width: `${value}%` }} /></span><span>{value}</span></div>)}{session.feedbackNote && <p className={styles.note}>{session.feedbackNote}</p>}<Link className={styles.button} href={roleFeedbackHref(session.roleId)}>Open {session.category} page</Link></div><div>{session.questions.map((question, index) => <div className={styles.question} key={`${session.id}-${index}`}><div className={styles.questionTitle}><span>{question.text}</span><span className={styles.questionScore}>{question.score}</span></div>{question.strongerAnswer && <p className={styles.questionText}>{question.strongerAnswer}</p>}</div>)}</div></div>}</article>)}</section>
      </div>
    </main>
  );
}
