"use client";

/**
 * Role picker: a centred intro, search ("/" to focus, Esc to clear), category pills and a
 * grid of role cards. Signed-in users also see their latest score per role from the report API.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock3, Search, X } from "lucide-react";
import { serif } from "@/lib/fonts";
import { ROLES, ROLE_CATEGORIES, ROLE_DURATION_RANGE, roleSlug } from "@/data/roles";
import { formatDate, listSessions, type SessionSummary } from "@/lib/interview/report";
import { ease, revealProps, useMotionMode } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const italic = { fontStyle: "italic" } as const;

type Role = (typeof ROLES)[number];
type Entry = { role: Role; slug: string };

// Catalogue order: category order, then the order roles are listed in.
const ENTRIES: Entry[] = ROLE_CATEGORIES.flatMap((c) => ROLES.filter((r) => r.category === c)).map((role) => ({
  role,
  slug: roleSlug(role.title),
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
  const reveal = (delay: number) => revealProps(mode, delay);
  const latestTitle = history.latest ? (ENTRIES.find((e) => e.slug === history.latest!.role)?.role.title ?? history.latest.role) : "";

  return (
    <main data-theme="dark" className="relative isolate mx-auto max-w-[1200px] px-4 pb-24 pt-14 text-foreground sm:px-6 sm:pt-20">

      {/* ── intro ── */}
      <div className="mx-auto max-w-[640px] text-center">
        <motion.h1 {...reveal(0)} className="m-0 text-[38px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[54px]">
          Choose what to{" "}
          <em className={`${serif.className} font-normal tracking-normal text-brand-soft`} style={italic}>
            practice.
          </em>
        </motion.h1>
        <motion.p {...reveal(0.1)} className="m-0 mx-auto mt-4 max-w-[480px] text-[15.5px] leading-[1.55] text-muted-foreground">
          Pick the role you&rsquo;re interviewing for, answer out loud, and get a scored report on every answer.
        </motion.p>
      </div>

      {/* ── search + categories ── */}
      <motion.div {...reveal(0.15)} className="mx-auto mt-9 max-w-[620px]">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search by role or skill"
            aria-label="Search roles or skills"
            className="h-12 rounded-xl border-white/10 bg-white/[0.03] pl-11 pr-12 text-[15px] md:text-[15px]"
          />
          {query ? (
            <Button variant="ghost" size="icon-sm" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg">
              <X />
            </Button>
          ) : (
            <kbd className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md border border-white/12 px-1.5 py-px font-sans text-[11px] text-muted-foreground">/</kbd>
          )}
        </div>
        <div role="tablist" aria-label="Categories" className="mt-4 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => {
            const n = t === "All" ? ROLES.length : ROLES.filter((r) => r.category === t).length;
            const on = tab === t;
            return (
              <Button
                key={t}
                role="tab"
                aria-selected={on}
                variant={on ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(t)}
                className={cn("h-8 rounded-full px-3.5 text-[13px]", !on && "border-white/10 bg-transparent text-white/70 hover:text-foreground")}
              >
                {t}
                <span className={cn("tabular-nums text-[11.5px]", on ? "text-primary-foreground/55" : "text-white/35")}>{n}</span>
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* ── last time ── */}
      {history.latest && (
        <motion.div {...reveal(0.2)}>
          <Card className="mx-auto mt-8 max-w-[620px] flex-row flex-wrap items-center gap-x-4 gap-y-3 border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13.5px] sm:flex-nowrap">
            <span className="min-w-0 flex-1 text-muted-foreground">
              Last time: <span className="text-foreground">{latestTitle}</span> ·{" "}
              <span className="tabular-nums text-foreground">{history.latest.overallScore}/100</span> · {formatDate(history.latest.createdAt)}
            </span>
            <span className="flex gap-2">
              <Button asChild variant="ghost" size="sm" className="h-8">
                <Link href={`/dashboard/reports/${history.latest.id}`}>Open report</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 border-white/12 bg-transparent">
                <Link href={`/dashboard/ai-interview/${history.latest.role}`}>Practice again</Link>
              </Button>
            </span>
          </Card>
        </motion.div>
      )}

      {/* ── catalogue ── */}
      <div className="mb-4 mt-12 flex items-baseline justify-between text-[13px] text-muted-foreground" aria-live="polite">
        <span>
          <span className="tabular-nums text-foreground">{matches.length}</span> {matches.length === 1 ? "role" : "roles"} available
          {tab !== "All" ? ` in ${tab}` : ""}
          {q ? ` for “${query.trim()}”` : ""}
        </span>
        <span className="hidden sm:inline">
          {ROLE_DURATION_RANGE.min}–{ROLE_DURATION_RANGE.max} min each
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab + (q ? ":search" : "")}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.35, ease }}
        >
          {matches.length === 0 ? (
            <Card className="items-center border-dashed border-white/12 bg-transparent py-20 text-center">
              <div>
                <p className="m-0 text-[17px] tracking-[-0.02em]">No roles match &ldquo;{query.trim()}&rdquo;.</p>
                <p className="m-0 mt-2 text-[14px] text-muted-foreground">Try a skill instead, like React, SQL or Kubernetes.</p>
              </div>
              <Button variant="outline" size="sm" className="border-white/12 bg-transparent" onClick={() => { setQuery(""); setTab("All"); }}>
                Show all roles
              </Button>
            </Card>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((e) => (
                <li key={e.slug}>
                  <RoleCard entry={e} lastScore={history.last.get(e.slug)} />
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function RoleCard({ entry, lastScore }: { entry: Entry; lastScore?: number }) {
  const { role, slug } = entry;
  const href = `/dashboard/ai-interview/${slug}`;
  return (
    <Card className="group relative h-full gap-0 rounded-lg border-white/[0.08] bg-[#0f0f11] py-4 shadow-none transition-colors duration-150 hover:border-white/[0.16]">
      <CardHeader className="gap-0 px-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[15.5px] font-medium leading-[1.3] tracking-[-0.015em]">
            <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring">
              {role.title}
            </Link>
          </CardTitle>
          {lastScore !== undefined && (
            <span className="shrink-0 rounded border border-white/10 px-1.5 py-px text-[11.5px] tabular-nums text-white/70" title="Your last score">
              {lastScore}/100
            </span>
          )}
        </div>
        <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Clock3 aria-hidden="true" className="size-3" />
          {role.duration} min · {role.category}
        </p>
      </CardHeader>
      <CardContent className="mt-3.5 flex flex-wrap gap-1.5 px-4">
        {role.skills.map((s) => (
          <span key={s} className="rounded border border-white/[0.07] px-1.5 py-0.5 text-[12px] text-white/60">
            {s}
          </span>
        ))}
      </CardContent>
      <CardFooter className="mt-auto px-4 pt-4">
        <span
          aria-hidden="true"
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-white/[0.06] text-[13px] font-medium text-white/85 transition-colors duration-150 group-hover:bg-white group-hover:text-black"
        >
          Start interview
          <ArrowRight className="size-3.5" />
        </span>
      </CardFooter>
    </Card>
  );
}
