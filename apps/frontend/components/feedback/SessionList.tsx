"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FeedbackSession } from "@/types/feedback";
import { roleFeedbackHref } from "@/lib/feedback/routes";
import styles from "./FeedbackDashboard.module.css";

interface SessionListProps {
  sessions: FeedbackSession[];
  passThreshold: number;
  locale: string;
  timeZone: string;
  showFilters?: boolean;
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onClearFilters?: () => void;
  showOpenRoleLink?: boolean;
}

function formatDate(value: string | null, locale: string, timeZone: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(new Date(value));
}

function labelForKey(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

export default function SessionList({
  sessions,
  passThreshold,
  locale,
  timeZone,
  showFilters = false,
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  query = "",
  onQueryChange,
  sort = "newest",
  onSortChange,
  onClearFilters,
  showOpenRoleLink = true,
}: SessionListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className={styles.section} aria-label="Completed sessions">
      {showFilters && (
        <>
          <div className={styles.filters}>
            {onQueryChange && (
              <input
                className={styles.input}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search sessions"
                aria-label="Search sessions"
              />
            )}
            {onSortChange && (
              <select
                className={styles.select}
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
                aria-label="Sort sessions"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            )}
          </div>
          {categories.length > 0 && onSelectCategory && (
            <div className={styles.chips} role="group" aria-label="Filter by category">
              <button
                className={`${styles.chip} ${selectedCategory === "" ? styles.chipActive : ""}`}
                onClick={() => onSelectCategory("")}
              >
                All
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  className={`${styles.chip} ${selectedCategory === item ? styles.chipActive : ""}`}
                  onClick={() => onSelectCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {sessions.length === 0 ? (
        <div className={styles.empty}>
          No sessions match your search{" "}
          {onClearFilters && (
            <button className={styles.button} onClick={onClearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        sessions.map((session) => (
          <article className={styles.session} key={session.id}>
            <button
              className={styles.sessionToggle}
              onClick={() => setExpanded(expanded === session.id ? null : session.id)}
              aria-expanded={expanded === session.id}
            >
              <span
                className={`${styles.score} ${
                  session.score >= passThreshold ? styles.pass : styles.fail
                }`}
              >
                {session.score}
              </span>
              <span>
                <span className={styles.sessionRole}>{session.role}</span>
                <span className={styles.sessionMeta}>
                  {session.category} · {formatDate(session.createdAt, locale, timeZone)} ·{" "}
                  {session.durationMin} min
                </span>
              </span>
              <span className={styles.meta}>{session.topics.join(" · ")}</span>
              <ChevronRight
                className={`${styles.sessionArrow} ${
                  expanded === session.id ? styles.sessionArrowOpen : ""
                }`}
                size={16}
              />
            </button>
            {expanded === session.id && (
              <div className={styles.details}>
                <div>
                  {Object.entries(session.skillScores).map(([key, value]) => (
                    <div className={styles.barLine} key={key}>
                      <span>{labelForKey(key)}</span>
                      <span className={styles.bar}>
                        <i style={{ width: `${value}%` }} />
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                  {session.feedbackNote && <p className={styles.note}>{session.feedbackNote}</p>}
                  {showOpenRoleLink && (
                    <Link
                      className={styles.button}
                      href={roleFeedbackHref(session.roleId)}
                    >
                      Open {session.category} page
                    </Link>
                  )}
                </div>
                <div>
                  {session.questions.map((question, index) => (
                    <div className={styles.question} key={`${session.id}-${index}`}>
                      <div className={styles.questionTitle}>
                        <span>{question.text}</span>
                        <span className={styles.questionScore}>{question.score}</span>
                      </div>
                      {question.strongerAnswer && (
                        <p className={styles.questionText}>{question.strongerAnswer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))
      )}
    </section>
  );
}
