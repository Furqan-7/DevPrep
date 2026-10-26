"use client";

import type { RecurringGap, WeeklyFrequency } from "@/types/feedback";
import styles from "./FeedbackDashboard.module.css";

interface RecurringGapsCardProps {
  gaps: RecurringGap[];
  weeks?: WeeklyFrequency[];
  title?: string;
  label?: string;
  emptyMessage?: string;
}

function labelForKey(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

export default function RecurringGapsCard({
  gaps,
  weeks,
  title = "Recurring gaps",
  label = "Pattern watch",
  emptyMessage = "Recurring gaps show up after a few interviews.",
}: RecurringGapsCardProps) {
  return (
    <div className={styles.card} aria-label={title}>
      <span className={styles.label}>{label}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {gaps.length === 0 ? (
        <p className={styles.muted}>{emptyMessage}</p>
      ) : (
        gaps.map((gap) => (
          <div className={styles.gapRow} key={gap.skill}>
            <strong>{labelForKey(gap.skill)}</strong>
            <small>{gap.note ?? `${gap.occurrences} sessions`}</small>
          </div>
        ))
      )}
      {weeks && weeks.length > 0 && (
        <>
          <span className={styles.label} style={{ marginTop: "16px", display: "block" }}>
            Practice frequency
          </span>
          <div className={styles.frequency}>
            {weeks.map((week) => (
              <div className={styles.frequencyItem} key={week.weekStart}>
                <span>{week.sessionCount}</span>
                <i
                  className={`${styles.frequencyBar} ${week.sessionCount === 0 ? styles.frequencyEmpty : ""}`}
                  style={{ height: `${Math.max(4, week.sessionCount * 24)}px` }}
                />
                <span>{week.weekStart}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
