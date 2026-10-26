"use client";

import styles from "./FeedbackDashboard.module.css";

export interface SkillItem {
  key: string;
  label: string;
  score: number | null;
}

interface SkillsCardProps {
  skills: SkillItem[];
  title?: string;
  label?: string;
}

export default function SkillsCard({
  skills,
  title = "Skills",
  label = "Breakdown",
}: SkillsCardProps) {
  return (
    <div className={styles.card} aria-label={title}>
      <span className={styles.label}>{label}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {skills.map((item) => (
        <div className={styles.skillRow} key={item.key}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.bar}>
            <i style={{ width: `${Math.min(100, Math.max(0, item.score ?? 0))}%` }} />
          </div>
          <span className={styles.meta}>{item.score === null ? "—" : Math.round(item.score)}</span>
        </div>
      ))}
    </div>
  );
}
