"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  Rocket,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ScoreTrendChart from "@/components/feedback/ScoreTrendChart";
import SkillsCard from "@/components/feedback/SkillsCard";
import RecurringGapsCard from "@/components/feedback/RecurringGapsCard";
import SessionList from "@/components/feedback/SessionList";
import { getRoleFeedback, roleFeedbackHref, type FeedbackApiError } from "@/lib/feedback/api";
import { deriveAverageScore, derivePassRate, deriveTrend, deriveWeakestSkill } from "@/lib/feedback/derive";
import type { RoleFeedback } from "@/types/feedback";
import styles from "./RoleFeedback.module.css";

interface RoleFeedbackClientProps {
  roleId: string;
}

function formatDate(value: string | null, locale: string, timeZone: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(new Date(value));
}

function formatDuration(minutes: number): string {
  return `${minutes}m`;
}

function labelForKey(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function RoleSkeletons() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label="Loading feedback">
      <div className={`${styles.skeleton} ${styles.breadcrumbStrip}`} style={{ height: "32px", width: "40%" }} />
      <div className={`${styles.skeleton} ${styles.hero}`} style={{ height: "240px" }} />
      <div className={`${styles.skeleton} ${styles.statsGrid}`} style={{ height: "100px" }} />
      <div className={`${styles.skeleton} ${styles.section}`} style={{ height: "320px" }} />
      <div className={`${styles.skeleton} ${styles.section}`} style={{ height: "220px" }} />
    </div>
  );
}

export default function RoleFeedbackClient({ roleId }: RoleFeedbackClientProps) {
  const router = useRouter();

  const [data, setData] = useState<RoleFeedback | null>(null);
  const [error, setError] = useState<FeedbackApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("en-US");
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    setLocale(navigator.language);
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getRoleFeedback(roleId);
    if (!result.ok) {
      if (result.error.code === "unauthorized") {
        router.push(`/auth/signin?next=${encodeURIComponent(roleFeedbackHref(roleId))}`);
        return;
      }
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, [roleId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const sessions = useMemo(() => data?.sessions ?? [], [data?.sessions]);
  const averageScore = useMemo(() => deriveAverageScore(sessions), [sessions]);
  const passRate = useMemo(
    () => (data ? derivePassRate(sessions, data.passThreshold) : null),
    [data, sessions],
  );
  const weakestSkill = useMemo(() => deriveWeakestSkill(sessions), [sessions]);

  const trend = useMemo(
    () => deriveTrend(sessions, null, locale, timeZone),
    [locale, sessions, timeZone],
  );

  const skillsForCard = useMemo(
    () =>
      (data?.perSkill ?? []).map((item) => ({
        key: item.key,
        label: item.label,
        score: item.average,
      })),
    [data?.perSkill],
  );

  return (
    <DashboardShell>
      <div className={styles.page}>
        {loading && !data && <RoleSkeletons />}

        {error && (
          <div className={styles.wrap} style={{ paddingTop: "48px" }}>
            {error.code === "not_found" ? (
              <div className={styles.empty} role="alert">
                <Target size={36} color="#eb3a14" />
                <h2>Role Not Found</h2>
                <p>We could not find feedback records for this role.</p>
                <Link className={styles.ctaButton} href="/dashboard/ai-interview/feedback">
                  <ArrowLeft size={14} /> Back to All Feedback
                </Link>
              </div>
            ) : (
              <div className={styles.errorBox} role="alert">
                <strong>{error.message}</strong>
                <button className={styles.ctaButton} onClick={() => void load()}>
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && data && (
          <div className={styles.wrap}>
            {/* 1. Breadcrumb strip */}
            <div className={styles.breadcrumbStrip}>
              <div className={styles.breadcrumbInner}>
                <div className={styles.breadcrumbLinks}>
                  <Link
                    href="/dashboard/ai-interview/feedback"
                    className={styles.breadcrumbLink}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to All Feedback</span>
                  </Link>
                  <span className={styles.breadcrumbSep}>/</span>
                  <span>{data.category} Track</span>
                  <span className={styles.breadcrumbSep}>/</span>
                  <span>Evaluated by Zara AI</span>
                </div>
                <span className={`${styles.pill} ${styles.pillAccent}`}>
                  <span className={`${styles.dot}`} style={{ backgroundColor: "#EB3A14" }} />
                  {data.category}
                </span>
              </div>
            </div>

            {/* Zero Sessions State */}
            {data.sessions.length === 0 ? (
              <div className={styles.empty}>
                <Target size={36} color="#eb3a14" />
                <h2>No {data.category} interviews yet</h2>
                <p>
                  Complete your first {data.category} mock interview with Zara to view your score breakdown,
                  skill rubric, and feedback.
                </p>
                {data.otherCategories && data.otherCategories.length > 0 && (
                  <div className={styles.chips} role="group" aria-label="Switch role category" style={{ margin: "16px 0", justifyContent: "center" }}>
                    <span className={`${styles.chip} ${styles.chipActive}`} aria-current="page">
                      {data.category}
                    </span>
                    {data.otherCategories.map((item) => (
                      <Link
                        key={item.roleId}
                        href={roleFeedbackHref(item.roleId)}
                        className={styles.chip}
                      >
                        {item.category}
                      </Link>
                    ))}
                  </div>
                )}
                <Link className={styles.ctaButton} href="/dashboard/ai-interview">
                  Practice {data.category} <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                {/* 2. Hero Header */}
                <header className={styles.hero}>
                  <div className={styles.heroLeft}>
                    <div className={styles.pills}>
                      <span className={`${styles.pill} ${styles.pillAccent}`}>
                        <span className={styles.dot} style={{ backgroundColor: "#eb3a14" }} />
                        AI-EVALUATED · {data.category}
                      </span>
                      {data.latestSession && (
                        <span className={`${styles.pill} ${styles.pillNeutral}`}>
                          {formatDate(data.latestSession.createdAt, locale, timeZone)} ·{" "}
                          {formatDuration(data.latestSession.durationMin)}
                        </span>
                      )}
                      {data.latestSession && (
                        <span
                          className={`${styles.pill} ${
                            data.latestSession.score >= data.passThreshold
                              ? styles.pillSuccess
                              : styles.pillAccent
                          }`}
                        >
                          {data.latestSession.score >= data.passThreshold
                            ? "BENCHMARK MET"
                            : "BELOW BENCHMARK"}
                        </span>
                      )}
                    </div>

                    <h1 className={styles.heroTitle}>
                      {data.latestSession?.role ?? `${data.category} Track`}
                    </h1>

                    <p className={styles.heroLede}>
                      Performance evaluation across {data.category} competency thresholds, technical depth,
                      problem-solving accuracy, and system execution.
                    </p>

                    {/* Category chips to switch roles */}
                    <div className={styles.chips} role="group" aria-label="Switch role category">
                      <span
                        className={`${styles.chip} ${styles.chipActive}`}
                        aria-current="page"
                      >
                        {data.category}
                      </span>
                      {data.otherCategories.map((item) => (
                        <Link
                          key={item.roleId}
                          href={roleFeedbackHref(item.roleId)}
                          className={styles.chip}
                        >
                          {item.category}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Latest score card */}
                  {data.latestSession && (
                    <div className={styles.scoreCard} aria-label="Latest session score index">
                      <div className={styles.scoreCardHeader}>
                        <span>Overall Score</span>
                        <span
                          style={{
                            color:
                              data.latestSession.score >= data.passThreshold ? "#16833d" : "#eb3a14",
                          }}
                        >
                          {data.latestSession.score >= data.passThreshold
                            ? "Meets Benchmark"
                            : "Needs Focus"}
                        </span>
                      </div>
                      <div className={styles.scoreCardValue}>
                        <span className={styles.scoreNumber}>{data.latestSession.score}</span>
                        <span className={styles.scoreBenchmarkText}>
                          / {data.passThreshold} benchmark
                        </span>
                      </div>
                      {data.latestSession.feedbackNote && (
                        <p className={styles.scoreNote}>{data.latestSession.feedbackNote}</p>
                      )}
                      <div className={styles.scoreBarContainer}>
                        <div
                          className={styles.scoreBarFill}
                          style={{
                            width: `${Math.min(100, Math.max(0, data.latestSession.score))}%`,
                          }}
                        />
                        <div
                          className={styles.scoreBenchmarkMarker}
                          style={{ left: `${Math.min(100, Math.max(0, data.passThreshold))}%` }}
                          title={`Benchmark: ${data.passThreshold}%`}
                        />
                      </div>
                    </div>
                  )}
                </header>

                {/* 3. Stats row */}
                <section className={styles.statsGrid} aria-label="Role feedback summary stats">
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Sessions</span>
                    <strong>{data.sessions.length}</strong>
                    <small>completed in role</small>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Average</span>
                    <strong>{averageScore !== null ? Math.round(averageScore) : "—"}</strong>
                    <small>overall score</small>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Pass rate</span>
                    <strong>{passRate !== null ? `${Math.round(passRate * 100)}%` : "—"}</strong>
                    <small>threshold {data.passThreshold}</small>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Focus area</span>
                    <strong>{weakestSkill ? labelForKey(weakestSkill) : "—"}</strong>
                    <small>
                      {data.latestSession
                        ? `updated ${formatDate(data.latestSession.createdAt, locale, timeZone)}`
                        : "keep practicing"}
                    </small>
                  </div>
                </section>

                {/* 4. Numbered rubric */}
                <section className={styles.section} aria-label="Dimensional competency matrix">
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>01 // EVALUATION RUBRIC</span>
                      <h2 className={styles.sectionTitle}>Dimensional Competency Matrix</h2>
                    </div>
                    <div className={styles.sectionLegend}>
                      <span className={styles.legendItem}>
                        <span
                          className={styles.dot}
                          style={{ backgroundColor: "#747878", width: 10, height: 2, borderRadius: 1 }}
                        />
                        Staff Baseline ({data.passThreshold}%)
                      </span>
                      <span className={styles.legendItem}>
                        <span
                          className={styles.dot}
                          style={{ backgroundColor: "#eb3a14", width: 8, height: 8 }}
                        />
                        Remediation Required
                      </span>
                    </div>
                  </div>

                  <div className={styles.rubricList}>
                    {data.perSkill.map((skill, index) => {
                      const latestScore = skill.latest;
                      const hasScore = latestScore !== null;
                      const isRemediation = hasScore && latestScore < data.passThreshold;
                      const isValidated = hasScore && latestScore >= data.passThreshold + 5;
                      const isBaseline = hasScore && !isValidated && latestScore >= data.passThreshold;
                      const diff = hasScore ? latestScore - data.passThreshold : 0;

                      return (
                        <div
                          key={skill.key}
                          className={`${styles.rubricRow} ${
                            isRemediation ? styles.rubricRowNeedsRemediation : ""
                          }`}
                        >
                          <div className={styles.rubricInfo}>
                            <div className={styles.rubricTitleRow}>
                              <span className={styles.rubricIndex}>
                                {String(index + 1).padStart(2, "0")}.
                              </span>
                              <span className={styles.rubricTitle}>{skill.label}</span>
                            </div>
                            <span className={styles.rubricAverage}>
                              Avg: {skill.average !== null ? `${Math.round(skill.average)}%` : "—"} ·{" "}
                              {skill.sessionCount} session{skill.sessionCount === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div className={styles.rubricBarCol}>
                            <div className={styles.rubricBarMeta}>
                              <span>
                                Candidate: {latestScore !== null ? `${latestScore}%` : "—"}
                              </span>
                              <span style={{ color: "#747878" }}>Bar: {data.passThreshold}%</span>
                            </div>
                            <div className={styles.rubricBar}>
                              <div
                                className={`${styles.rubricBarFill} ${
                                  isRemediation ? styles.rubricBarFillRemediation : ""
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, latestScore ?? 0))}%`,
                                }}
                              />
                              <div
                                className={styles.rubricBenchmarkMarker}
                                style={{ left: `${data.passThreshold}%` }}
                                title={`Threshold: ${data.passThreshold}%`}
                              />
                            </div>
                          </div>

                          <div className={styles.rubricPillCol}>
                            {isValidated && (
                              <span className={`${styles.rubricStatusPill} ${styles.rubricValidated}`}>
                                Validated (+{diff}%)
                              </span>
                            )}
                            {isBaseline && (
                              <span className={`${styles.rubricStatusPill} ${styles.rubricBaseline}`}>
                                Baseline Met (+{diff}%)
                              </span>
                            )}
                            {isRemediation && (
                              <span className={`${styles.rubricStatusPill} ${styles.rubricRemediation}`}>
                                Needs Remediation ({diff}%)
                              </span>
                            )}
                            {!hasScore && (
                              <span className={`${styles.rubricStatusPill} ${styles.rubricBaseline}`}>
                                Not Tested
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 5. Score trend for this role */}
                <ScoreTrendChart
                  trend={trend}
                  emptyMessage={`Complete at least two ${data.category} interviews to see your trend.`}
                  title={`${data.category} score trend`}
                  label="Role progress"
                />

                {/* 6. Skills card + recurring gaps */}
                <div className={styles.splitGrid} style={{ marginTop: "36px" }}>
                  <SkillsCard
                    skills={skillsForCard}
                    title={`${data.category} Skills`}
                    label="Skill breakdown"
                  />
                  <RecurringGapsCard
                    gaps={data.recurringGaps}
                    title="Recurring gaps"
                    label="Pattern watch"
                    emptyMessage="Recurring gaps show up after a few interviews."
                  />
                </div>

                {/* 7. Strengths panel & Gaps panel */}
                <section className={styles.section} aria-label="Strengths and growth gaps">
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>02 // QUESTION-LEVEL DIAGNOSTIC</span>
                      <h2 className={styles.sectionTitle}>Strengths &amp; High-Priority Gaps</h2>
                    </div>
                  </div>

                  <div className={styles.splitGrid}>
                    {/* Strengths */}
                    <div className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <h3 className={styles.panelTitle}>
                          <CheckCircle2 size={18} color="#16833d" />
                          <span>Demonstrated Strengths</span>
                        </h3>
                        <span className={`${styles.panelBadge} ${styles.panelBadgeSuccess}`}>
                          {data.strengths.length} Validated
                        </span>
                      </div>
                      {data.strengths.length === 0 ? (
                        <p style={{ color: "#666", fontSize: "0.875rem" }}>
                          No strengths recorded yet above the benchmark.
                        </p>
                      ) : (
                        data.strengths.map((item, idx) => (
                          <div className={styles.qaItem} key={`${item.sessionId}-${idx}`}>
                            <div className={styles.qaHeader}>
                              <span className={styles.qaQuestion}>{item.question}</span>
                              <span className={`${styles.qaScore} ${styles.qaScoreSuccess}`}>
                                {item.score} / 100
                              </span>
                            </div>
                            {item.strongerAnswer && (
                              <p className={styles.qaAnswer}>{item.strongerAnswer}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Gaps */}
                    <div className={`${styles.panel} ${styles.panelGaps}`}>
                      <div className={styles.panelHeader}>
                        <h3 className={styles.panelTitle}>
                          <AlertTriangle size={18} color="#eb3a14" />
                          <span>High-Priority Growth Gaps</span>
                        </h3>
                        <span className={`${styles.panelBadge} ${styles.panelBadgeAccent}`}>
                          {data.gaps.length} Action Required
                        </span>
                      </div>
                      {data.gaps.length === 0 ? (
                        <p style={{ color: "#666", fontSize: "0.875rem" }}>
                          No critical gaps identified below the benchmark.
                        </p>
                      ) : (
                        data.gaps.map((item, idx) => (
                          <div className={styles.qaItem} key={`${item.sessionId}-${idx}`}>
                            <div className={styles.qaHeader}>
                              <span className={styles.qaQuestion}>{item.question}</span>
                              <span className={`${styles.qaScore} ${styles.qaScoreAccent}`}>
                                {item.score} / 100
                              </span>
                            </div>
                            {item.strongerAnswer && (
                              <div className={styles.qaRemediationBox}>
                                <strong>Remediation:</strong> {item.strongerAnswer}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* 8. This role's sessions as the expandable list */}
                <div style={{ marginTop: "36px" }}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>03 // SESSION ARCHIVE</span>
                      <h2 className={styles.sectionTitle}>{data.category} Sessions</h2>
                    </div>
                  </div>
                  <SessionList
                    sessions={data.sessions}
                    passThreshold={data.passThreshold}
                    locale={locale}
                    timeZone={timeZone}
                    showFilters={false}
                    showOpenRoleLink={false}
                  />
                </div>

                {/* 9. Sticky next-step bar */}
                <aside className={styles.stickyBar} aria-label="Recommended next step">
                  <div className={styles.stickyBarInner}>
                    <div className={styles.stickyLeft}>
                      <div className={styles.stickyIcon}>
                        <Rocket size={18} />
                      </div>
                      <div>
                        <span className={styles.stickyEyebrow}>Recommended Next Step</span>
                        <p className={styles.stickyText}>{data.nextStep}</p>
                      </div>
                    </div>
                    <Link className={styles.ctaButton} href="/dashboard/ai-interview">
                      Practice {data.category} <ArrowRight size={14} />
                    </Link>
                  </div>
                </aside>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
