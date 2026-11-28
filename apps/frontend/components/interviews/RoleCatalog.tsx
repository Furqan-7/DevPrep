"use client";

/**
 * Role picker: a "pick up where you left off" banner, a toolbar with search ("/" to focus,
 * Esc to clear) and category tabs, and a grid of role cards. Signed-in users also see
 * their latest score and interview count per role from the report API.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CircleHelp, Clock3, Mic, RotateCcw, Search, X } from "lucide-react";
import { AppPage, EmptyState } from "@/components/app/AppPage";
import { Ring, scoreColor } from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLES, ROLE_CATEGORIES, ROLE_DURATION_RANGE, roleSlug } from "@/data/roles";
import { formatDate, listSessions, type SessionSummary } from "@/lib/interview/report";
import { ease, useMotionMode } from "@/lib/motion";
import { categoryMeta } from "./categories";

type Role = (typeof ROLES)[number];
type Entry = { role: Role; slug: string };

// Catalogue order: category order, then the order roles are listed in.
const ENTRIES: Entry[] = ROLE_CATEGORIES.flatMap((c) => ROLES.filter((r) => r.category === c)).map((role) => ({
  role,
  slug: roleSlug(role.title),
}));

const TABS = ["All", ...ROLE_CATEGORIES] as const;
type Tab = (typeof TABS)[number];

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
    const counts = new Map<string, number>();
    for (const s of reported) {
      if (!last.has(s.role)) last.set(s.role, s.overallScore!);
      counts.set(s.role, (counts.get(s.role) ?? 0) + 1);
    }
    return { last, counts, latest: reported[0] ?? null };
  }, [sessions]);
}

export function RoleCatalog() {
  const mode = useMotionMode();
  const reduce = mode === "reduce";
  const history = useHistory();
  const [tab, setTab] = useState<Tab>("All");
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
  const latest = history.latest;
  const latestTitle = latest ? (ENTRIES.find((e) => e.slug === latest.role)?.role.title ?? latest.role) : "";

  return (
    <AppPage
      icon={Mic}
      title="Choose an interview"
      description="Pick the role you're interviewing for, answer out loud, and get a scored report on every answer."
      actions={
        <Button asChild variant="outline" size="sm" className="h-8 border-white/[0.08] bg-white/[0.02]">
          <Link href="/dashboard/ai-interview/how-it-works">
            <CircleHelp /> How it works
          </Link>
        </Button>
      }
    >
      {/* ── pick up where you left off ── */}
      {latest && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.07] bg-card p-4 sm:flex-nowrap"
        >
          <Ring value={latest.overallScore!} size={48} stroke={4} color={scoreColor(latest.overallScore!)}>
            {latest.overallScore}
          </Ring>
          <div className="relative min-w-0 flex-1">
            <div className="text-[12px] font-medium text-white/40">Pick up where you left off</div>
            <div className="mt-0.5 truncate text-[15px] font-semibold tracking-[-0.02em] text-white">{latestTitle}</div>
            <div className="text-[12.5px] text-white/45">
              {latest.overallScore}/100 · {formatDate(latest.createdAt)}
            </div>
          </div>
          <div className="relative flex gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 text-white/70">
              <Link href={`/dashboard/reports/${latest.id}`}>Open report</Link>
            </Button>
            <Button asChild size="sm" className="h-8 font-semibold">
              <Link href={`/dashboard/ai-interview/${latest.role}`}>
                <RotateCcw /> Practise again
              </Link>
            </Button>
          </div>
        </motion.section>
      )}

      {/* ── toolbar ── */}
      <div className="sticky top-14 z-20 -mx-1 mb-5 flex flex-col gap-3 rounded-2xl bg-background/80 px-1 py-2 backdrop-blur-xl md:flex-row md:items-center">
        <div className="relative md:w-[320px]">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search by role or skill"
            aria-label="Search roles or skills"
            className="h-9 rounded-lg border-white/[0.08] bg-white/[0.025] pl-9 pr-10 text-[13.5px] md:text-[13.5px]"
          />
          {query ? (
            <Button variant="ghost" size="icon-sm" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-md">
              <X />
            </Button>
          ) : (
            <Kbd className="absolute right-2.5 top-1/2 -translate-y-1/2">/</Kbd>
          )}
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-w-0 overflow-x-auto">
          <TabsList className="h-9 bg-white/[0.04] p-1">
            {TABS.map((t) => {
              const n = t === "All" ? ROLES.length : ROLES.filter((r) => r.category === t).length;
              return (
                <TabsTrigger key={t} value={t} className="h-7 flex-none gap-1.5 px-2.5 text-[12.5px]">
                  {t}
                  <span className="text-[11px] tabular-nums opacity-50">{n}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <span className="hidden whitespace-nowrap text-[12.5px] text-muted-foreground md:ml-auto md:inline" aria-live="polite">
          <span className="tabular-nums text-white">{matches.length}</span> {matches.length === 1 ? "role" : "roles"} · {ROLE_DURATION_RANGE.min}–{ROLE_DURATION_RANGE.max} min each
        </span>
      </div>

      {/* ── catalogue ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab + (q ? ":search" : "")}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.35, ease }}
        >
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.1]">
              <EmptyState icon={Search} title={`No roles match “${query.trim()}”`} body="Try a skill instead, like React, SQL or Kubernetes.">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-transparent"
                  onClick={() => {
                    setQuery("");
                    setTab("All");
                  }}
                >
                  Show all roles
                </Button>
              </EmptyState>
            </div>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map((e, i) => (
                <motion.li
                  key={e.slug}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.025, ease }}
                >
                  <RoleCard entry={e} lastScore={history.last.get(e.slug)} count={history.counts.get(e.slug) ?? 0} />
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
    </AppPage>
  );
}

function RoleCard({ entry, lastScore, count }: { entry: Entry; lastScore?: number; count: number }) {
  const { role, slug } = entry;
  const href = `/dashboard/ai-interview/${slug}`;
  const meta = categoryMeta(role.category);
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-4 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.9)]">
      <div className="relative flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03]" style={{ color: meta.color }}>
          <meta.icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[15px] font-semibold leading-[1.3] tracking-[-0.02em] text-white">
            <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
              {role.title}
            </Link>
          </h3>
          <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-white/45">
            <Clock3 aria-hidden="true" className="size-3" />
            {role.duration} min · {role.category}
          </p>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-white/20 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      </div>

      <div className="relative mb-4 mt-4 flex flex-wrap gap-1.5">
        {role.skills.map((s) => (
          <span key={s} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11.5px] text-white/60">
            {s}
          </span>
        ))}
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        {lastScore !== undefined ? (
          <span className="flex items-center gap-2 text-[12px] text-white/50">
            <span className="size-1.5 rounded-full" style={{ background: scoreColor(lastScore) }} />
            Last score <span className="font-semibold tabular-nums text-white">{lastScore}</span>
            <span className="text-white/30">·</span>
            {count} {count === 1 ? "report" : "reports"}
          </span>
        ) : (
          <span className="text-[12px] text-white/35">Not practised yet</span>
        )}
        <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-white/70 transition-colors group-hover:text-white">
          Start <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
