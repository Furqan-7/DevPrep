"use client";

/**
 * Role picker: a typographic index of every interview role, grouped by category,
 * with search ("/" to focus, Esc to clear), category tabs and, for signed-in users,
 * their latest score per role from the report API.
 */

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { serif } from "@/lib/fonts";
import { ROLES, ROLE_CATEGORIES, ROLE_DURATION_RANGE, roleSlug } from "@/data/roles";
import { formatDate, listSessions, type SessionSummary } from "@/lib/interview/report";
import { ease, revealProps, useMotionMode } from "@/lib/motion";

const italic = { fontStyle: "italic" } as const;

type Role = (typeof ROLES)[number];
type Entry = { role: Role; slug: string; index: number };

// One running number across the whole catalogue, in category order.
const ENTRIES: Entry[] = ROLE_CATEGORIES.flatMap((c) => ROLES.filter((r) => r.category === c)).map((role, i) => ({
  role,
  slug: roleSlug(role.title),
  index: i + 1,
}));

const TABS = ["All", ...ROLE_CATEGORIES] as const;


/** Latest reported score per role slug, plus the most recent reported interview. */
function useHistory() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    let alive = true;
    listSessions()
      .then((s) => alive && setSessions(s))
      .catch(() => {}); // history is a nice-to-have here; the catalogue works without it
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(() => {
    const reported = sessions.filter((s) => s.overallScore !== null); // newest first
    const last = new Map<string, number>();
    for (const s of reported) if (!last.has(s.role)) last.set(s.role, s.overallScore!);
    return { last, latest: reported[0] ?? null, count: (slug: string) => reported.filter((s) => s.role === slug).length };
  }, [sessions]);
}

export function RoleCatalog() {
  const mode = useMotionMode();
  const reduce = mode === "reduce";
  const history = useHistory();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = ENTRIES.filter(
    (e) => (tab === "All" || e.role.category === tab) && (!q || `${e.role.title} ${e.role.skills.join(" ")}`.toLowerCase().includes(q)),
  );
  const grouped = tab === "All" && !q;

  const reveal = (delay: number) => revealProps(mode, delay);

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      {/* ── header ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <motion.h1 {...reveal(0)} className="m-0 text-[40px] font-medium leading-[1.02] tracking-[-0.05em] sm:text-[60px]">
          Choose what
          <br />
          to{" "}
          <em className={`${serif.className} font-normal tracking-normal`} style={italic}>
            practice.
          </em>
        </motion.h1>
        <motion.dl {...reveal(0.08)} className="m-0 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 lg:mb-2">
          {[
            [String(ROLES.length), "roles"],
            [String(ROLE_CATEGORIES.length), "categories"],
            [`${ROLE_DURATION_RANGE.min}–${ROLE_DURATION_RANGE.max}`, "minutes each"],
            ["Voice", "answer out loud"],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col-reverse border-l border-white/10 pl-3.5">
              <dt className="mt-0.5 text-[12.5px] text-white/42">{l}</dt>
              <dd className="m-0 text-[20px] font-medium tracking-[-0.04em] tabular-nums">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* ── controls ── */}
      <motion.div {...reveal(0.14)} className="mt-10 flex flex-col gap-4 border-b border-white/[0.08] lg:flex-row lg:items-end lg:justify-between">
        <div role="tablist" aria-label="Categories" className="-mb-px flex gap-5 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,#000_82%,transparent)] [scrollbar-width:none] sm:gap-6 sm:pr-0 sm:[mask-image:none]">
          {TABS.map((t) => {
            const n = t === "All" ? ROLES.length : ROLES.filter((r) => r.category === t).length;
            const on = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t)}
                className={`relative shrink-0 cursor-pointer whitespace-nowrap pb-3.5 text-[14px] tracking-[-0.02em] transition-colors ${on ? "text-[#f0f0f0]" : "text-white/45 hover:text-white/80"}`}
              >
                {t}
                <sup className="ml-1 text-[10.5px] tabular-nums text-white/35">{n}</sup>
                {on && <motion.span layoutId="role-tab" transition={{ duration: reduce ? 0 : 0.45, ease }} className="absolute inset-x-0 bottom-0 h-px bg-[#f0f0f0]" />}
              </button>
            );
          })}
        </div>
        <label className="group mb-3 flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_rgba(190,200,255,0.55),0_0_0_4px_rgba(190,200,255,0.07)] lg:w-[300px]">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search roles or skills"
            aria-label="Search roles or skills"
            className="h-full w-full bg-transparent text-[14px] text-[#f0f0f0] outline-none placeholder:text-white/35"
          />
          <kbd className="rounded-[5px] px-1.5 py-px font-sans text-[11px] text-white/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">/</kbd>
        </label>
      </motion.div>

      {/* ── last time ── */}
      {history.latest && (
        <motion.div {...reveal(0.2)} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/[0.08] py-3.5 text-[13.5px] text-white/50">
          <span>
            Last time:{" "}
            <span className="text-[#f0f0f0]">{ENTRIES.find((e) => e.slug === history.latest!.role)?.role.title ?? history.latest.role}</span> ·{" "}
            <span className="tabular-nums text-[#cfd6ff]">{history.latest.overallScore}/100</span> · {formatDate(history.latest.createdAt)}
          </span>
          <span className="flex gap-5 sm:ml-auto">
            <Link href={`/dashboard/ai-interview/report/${history.latest.id}`} className="text-white/75 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#f0f0f0] hover:decoration-[#bec8ff]">
              Open report
            </Link>
            <Link href={`/dashboard/ai-interview/${history.latest.role}`} className="text-white/75 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#f0f0f0] hover:decoration-[#bec8ff]">
              Practice again
            </Link>
          </span>
        </motion.div>
      )}

      {/* ── catalogue ── */}
      <p className="sr-only" aria-live="polite">
        {matches.length} {matches.length === 1 ? "role" : "roles"}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab + (q ? ":search" : "")}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.35, ease }}
        >
          {matches.length === 0 ? (
            <div className="py-24 text-center">
              <p className="m-0 text-[17px] tracking-[-0.02em]">No roles match &ldquo;{query.trim()}&rdquo;.</p>
              <p className="mt-2 text-[14px] text-white/45">Try a skill instead, like React, SQL or Kubernetes.</p>
              <button type="button" onClick={() => { setQuery(""); setTab("All"); }} className="mt-5 cursor-pointer text-[13.5px] text-[#cfd6ff] underline underline-offset-4">
                Show all roles
              </button>
            </div>
          ) : grouped ? (
            ROLE_CATEGORIES.map((c, ci) => {
              const list = matches.filter((e) => e.role.category === c);
              return (
                <motion.section
                  key={c}
                  aria-labelledby={`cat-${c}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={mode === "pending" ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.7, delay: ci === 0 ? 0.25 : 0, ease }}
                  className="mt-12 first:mt-10"
                >
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 id={`cat-${c}`} className="m-0 text-[13px] font-medium tracking-[-0.01em] text-white/60">
                      {c}
                    </h2>
                    <span className="text-[12.5px] tabular-nums text-white/35">
                      {list.length} {list.length === 1 ? "role" : "roles"}
                    </span>
                  </div>
                  <Grid entries={list} last={history.last} />
                </motion.section>
              );
            })
          ) : (
            <section className="mt-8">
              <div className="mb-3 text-[12.5px] text-white/40">
                {matches.length} {matches.length === 1 ? "role" : "roles"}
                {tab !== "All" ? ` in ${tab}` : ""}
                {q ? ` matching “${query.trim()}”` : ""}
              </div>
              <Grid entries={matches} last={history.last} />
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function Grid({ entries, last }: { entries: Entry[]; last: Map<string, number> }) {
  return (
    // 1px gaps over a hairline-coloured background draw the dividers between entries
    <ul className="m-0 grid list-none grid-cols-1 gap-px overflow-hidden rounded-[16px] bg-white/[0.07] p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.07)] sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((e) => (
        <li key={e.slug} className="bg-[#0a0a0a]">
          <RoleEntry entry={e} lastScore={last.get(e.slug)} />
        </li>
      ))}
      {/* fill the last row so the hairline background never shows as a grey block */}
      {Array.from({ length: (2 - (entries.length % 2)) % 2 }, (_, i) => (
        <li key={`pad2-${i}`} aria-hidden="true" className="hidden bg-[#0a0a0a] sm:block lg:hidden" />
      ))}
      {Array.from({ length: (3 - (entries.length % 3)) % 3 }, (_, i) => (
        <li key={`pad3-${i}`} aria-hidden="true" className="hidden bg-[#0a0a0a] lg:block" />
      ))}
    </ul>
  );
}

function RoleEntry({ entry, lastScore }: { entry: Entry; lastScore?: number }) {
  const { role, slug, index } = entry;
  const onMove = (ev: PointerEvent<HTMLAnchorElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    ev.currentTarget.style.setProperty("--x", `${ev.clientX - r.left}px`);
    ev.currentTarget.style.setProperty("--y", `${ev.clientY - r.top}px`);
  };
  return (
    <Link
      href={`/dashboard/ai-interview/${slug}`}
      onPointerMove={onMove}
      className="group relative isolate flex h-full flex-col px-5 pb-[18px] pt-4 sm:min-h-[148px] transition-colors duration-300 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(240px_circle_at_var(--x,50%)_var(--y,50%),rgba(190,200,255,0.09),transparent_70%)] before:opacity-0 before:transition-opacity before:duration-300 hover:bg-[#0e0e11] hover:before:opacity-100 focus-visible:bg-[#0e0e11] focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-[#bec8ff]/60"
    >
      <div className="flex items-center justify-between text-[12px] tabular-nums text-white/32">
        <span>{String(index).padStart(2, "0")}</span>
        <span>{role.duration} min</span>
      </div>
      <h3 className="m-0 mt-3 text-[18px] font-medium leading-[1.2] tracking-[-0.03em] text-[#f0f0f0]">{role.title}</h3>
      <p className="m-0 mt-2 line-clamp-2 text-[13px] leading-[1.5] text-white/45">{role.skills.join(" · ")}</p>
      <div className="mt-auto flex items-center justify-between pt-4 text-[12.5px]">
        {lastScore !== undefined ? (
          <span className="text-white/45">
            Last score <span className="tabular-nums text-[#cfd6ff]">{lastScore}</span>
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1.5 text-white/0 transition-all duration-300 group-hover:text-[#f0f0f0] group-focus-visible:text-[#f0f0f0]">
          Start
          <span aria-hidden="true" className="inline-block -translate-x-1 transition-transform duration-300 group-hover:translate-x-0">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
