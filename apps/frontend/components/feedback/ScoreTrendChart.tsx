"use client";

import type { FeedbackTrendPoint } from "@/lib/feedback/derive";
import styles from "./FeedbackDashboard.module.css";

interface ScoreTrendChartProps {
  trend: FeedbackTrendPoint[];
  skills?: string[];
  activeSkill?: string | null;
  onSelectSkill?: (skill: string) => void;
  emptyMessage?: string;
  title?: string;
  label?: string;
}

function labelForKey(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

export default function ScoreTrendChart({
  trend,
  skills,
  activeSkill,
  onSelectSkill,
  emptyMessage = "Complete at least two interviews to see your trend.",
  title = "Score trend",
  label = "Progress",
}: ScoreTrendChartProps) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.row}>
        <div>
          <span className={styles.label}>{label}</span>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        {skills && skills.length > 0 && onSelectSkill && (
          <div className={styles.tabs} role="tablist" aria-label="Filter score trend by skill">
            {skills.map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={item === activeSkill}
                className={`${styles.tab} ${item === activeSkill ? styles.tabActive : ""}`}
                onClick={() => onSelectSkill(item)}
              >
                {labelForKey(item)}
              </button>
            ))}
          </div>
        )}
      </div>
      {trend.length < 2 ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <svg className={styles.chart} viewBox="0 0 640 190" role="img" aria-label="Score trend chart">
          <line x1="24" x2="616" y1="160" y2="160" stroke="#e5e5e5" />
          <polyline
            className={styles.chartLine}
            points={trend
              .map(
                (point, index) =>
                  `${24 + (index * 592) / Math.max(1, trend.length - 1)},${160 - point.score * 1.25}`,
              )
              .join(" ")}
          />
          {trend.map((point, index) => {
            const cx = 24 + (index * 592) / Math.max(1, trend.length - 1);
            const cy = 160 - point.score * 1.25;
            return (
              <g key={`${point.label}-${index}`}>
                <circle className={styles.chartPoint} cx={cx} cy={cy} r="4" />
                <text x={cx} y="180" textAnchor="middle">
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
