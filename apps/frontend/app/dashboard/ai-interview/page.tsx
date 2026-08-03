"use client";

/**
 * DevPrep — AI Interview Role Selection
 *
 * Redesigned to the "Tidiane DevOps Portfolio System" spec.
 * Rendered inside DashboardShell (dark context #0d0e10).
 *
 * Functionality unchanged: same ROLES data, same search/filter logic,
 * same titleToSlug routing.
 *
 * Responsive: 375 / 390 / 428 / 768 / 834 / 1024px+.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Clock, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { monoStyle, Eyebrow } from "@/components/auth/AuthShared";

/* ─────────────────────────────────────────────
   Motion curve — design system: cubic-bezier(0.25, 0.8, 0.25, 1)
───────────────────────────────────────────── */
const EASE = [0.25, 0.8, 0.25, 1] as const;

/* ─────────────────────────────────────────────
   Data — identical to original
───────────────────────────────────────────── */
const ROLES = [
  { title: "Frontend Engineer",         duration: 20, skills: ["React", "TypeScript", "CSS Architecture", "Web Performance"] },
  { title: "Backend Engineer",          duration: 20, skills: ["System Design", "REST APIs", "Databases", "Caching"] },
  { title: "Full Stack Developer",      duration: 25, skills: ["Node.js", "React", "PostgreSQL", "Docker"] },
  { title: "Data Structures & Algorithms", duration: 18, skills: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming"] },
  { title: "System Design",            duration: 30, skills: ["Scalability", "Load Balancing", "Microservices", "CAP Theorem"] },
  { title: "Machine Learning Engineer", duration: 20, skills: ["Machine Learning", "Deep Learning", "Data Analysis", "Python"] },
  { title: "DevOps Engineer",          duration: 18, skills: ["CI/CD", "Kubernetes", "AWS", "Infrastructure as Code"] },
  { title: "Android Developer",        duration: 18, skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM"] },
  { title: "iOS Developer",            duration: 18, skills: ["Swift", "SwiftUI", "UIKit", "Core Data"] },
  { title: "Data Engineer",            duration: 20, skills: ["Spark", "Kafka", "ETL Pipelines", "Data Warehousing"] },
  { title: "Product Manager",          duration: 20, skills: ["Product Strategy", "Roadmapping", "Stakeholder Management", "Metrics"] },
  { title: "Behavioral Round",         duration: 15, skills: ["Leadership", "Conflict Resolution", "Communication", "Teamwork"] },
  { title: "Cloud Engineer",           duration: 20, skills: ["AWS", "GCP", "Azure", "Serverless", "Terraform"] },
  { title: "Site Reliability Engineer",duration: 22, skills: ["Observability", "On-Call", "SLOs & SLAs", "Incident Response"] },
  { title: "Cybersecurity Engineer",   duration: 20, skills: ["Threat Modeling", "Penetration Testing", "OWASP", "Cryptography"] },
  { title: "QA / Test Engineer",       duration: 18, skills: ["Test Automation", "Selenium", "API Testing", "Bug Lifecycle"] },
  { title: "Data Scientist",           duration: 22, skills: ["Statistics", "Feature Engineering", "Model Evaluation", "SQL"] },
  { title: "Generative AI Engineer",   duration: 20, skills: ["LLMs", "Prompt Engineering", "RAG", "LangChain", "Fine-tuning"] },
  { title: "Embedded Systems Engineer",duration: 20, skills: ["C/C++", "RTOS", "Microcontrollers", "Hardware Interfaces"] },
  { title: "Blockchain Developer",     duration: 20, skills: ["Solidity", "Smart Contracts", "Web3.js", "DeFi Protocols"] },
  { title: "UI/UX Designer",          duration: 18, skills: ["Figma", "User Research", "Design Systems", "Prototyping"] },
  { title: "Game Developer",           duration: 20, skills: ["Unity", "C#", "Game Physics", "Shader Programming"] },
  { title: "Database Administrator",   duration: 20, skills: ["Query Optimization", "Indexing", "Replication", "Backup & Recovery"] },
  { title: "Technical Program Manager",duration: 20, skills: ["Execution Planning", "Cross-team Alignment", "Risk Management", "OKRs"] },
];

const FILTER_TAGS = ["All", "Engineering", "Data", "Design", "Product", "Behavioral"];

const FILTER_MAP: Record<string, string[]> = {
  All: [],
  Engineering: [
    "Frontend Engineer", "Backend Engineer", "Full Stack Developer",
    "DevOps Engineer", "Android Developer", "iOS Developer",
    "Cloud Engineer", "Site Reliability Engineer", "Cybersecurity Engineer",
    "QA / Test Engineer", "Embedded Systems Engineer", "Blockchain Developer",
    "Game Developer", "Database Administrator",
  ],
  Data: [
    "Machine Learning Engineer", "Data Engineer", "Data Structures & Algorithms",
    "Data Scientist", "Generative AI Engineer",
  ],
  Design:    ["UI/UX Designer"],
  Product:   ["Product Manager", "Technical Program Manager"],
  Behavioral:["Behavioral Round"],
};

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[&]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─────────────────────────────────────────────
   Search bar — dark-context variant
   Matches the auth InputField pattern:
   8px radius · accent focus ring · mono typography
───────────────────────────────────────────── */
function SearchBar({
  value,
  onChange,
  filterOpen,
  onFilterToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  filterOpen: boolean;
  onFilterToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 w-full bg-white/[0.05] border rounded-[8px] px-4
        transition-all duration-200
        focus-within:border-[#eb3a14]/60 focus-within:ring-2 focus-within:ring-[#eb3a14]/15 focus-within:bg-white/[0.07]
        ${filterOpen ? "border-[#eb3a14]/50" : "border-white/[0.1]"}`}
      style={{ minHeight: 48 }}
    >
      <Search size={15} className="text-white/30 flex-shrink-0" aria-hidden />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by role or skill"
        style={{ fontFamily: "Inter, var(--font-sans, sans-serif)" }}
        className="flex-1 bg-transparent border-none outline-none text-white text-[14px] placeholder:text-white/25 min-w-0"
      />

      {/* Filter toggle — 44 × 44 tap target */}
      <button
        type="button"
        onClick={onFilterToggle}
        aria-label="Toggle category filters"
        style={{ width: 36, height: 36, flexShrink: 0 }}
        className={`flex items-center justify-center rounded-full border cursor-pointer transition-all duration-200 ${
          filterOpen
            ? "bg-[#eb3a14] border-[#eb3a14] text-white"
            : "bg-white/[0.06] border-white/[0.12] text-white/40 hover:bg-white/[0.1] hover:text-white"
        }`}
      >
        <SlidersHorizontal size={13} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Filter pill
   Active: accent fill (#EB3A14). Inactive: ghost.
   Pill shape (rounded-full) per design system.
   min-height 44px for touch targets.
───────────────────────────────────────────── */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{ ...monoStyle, minHeight: 36, flexShrink: 0 }}
      className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] border
        whitespace-nowrap cursor-pointer transition-all duration-200 ${
          active
            ? "bg-[#eb3a14] border-[#eb3a14] text-white shadow-[0_0_14px_rgba(235,58,20,0.35)]"
            : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:bg-white/[0.1] hover:text-white hover:border-white/[0.25]"
        }`}
    >
      {label}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   Skill tag
   Mono label per design system spec:
   "use monospaced labels for all metadata"
   rounded-sm (4px) for utility items
───────────────────────────────────────────── */
function SkillTag({ label }: { label: string }) {
  return (
    <span
      style={monoStyle}
      className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] border border-white/[0.09]
        bg-white/[0.05] text-[10px] font-medium text-white/45 uppercase tracking-[0.05em]"
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Role card
   Design system card spec:
   · border: 1px solid line
   · rounded: 12px (rounded.lg)
   · hover: translate-y-[-4px] + shadow-2xl
   · surface: bg-white/[0.03]
───────────────────────────────────────────── */
function RoleCard({
  role,
  index,
}: {
  role: { title: string; duration: number; skills: string[] };
  index: number;
}) {
  const router = useRouter();
  const slug = titleToSlug(role.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.4, ease: EASE }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: EASE } }}
      onClick={() => router.push(`/dashboard/ai-interview/${slug}`)}
      className="group flex flex-col rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-5 cursor-pointer
        hover:border-[#eb3a14]/30 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
        transition-colors duration-300"
      style={{ minHeight: 200 }}
    >
      {/* Duration badge */}
      <div
        style={monoStyle}
        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-3"
      >
        <Clock size={9} />
        {role.duration} mins interview
      </div>

      {/* Role title */}
      <h3
        className="text-[15px] font-bold text-white tracking-[-0.02em] leading-snug mb-3"
        style={{ fontFamily: "Inter, var(--font-sans, sans-serif)" }}
      >
        {role.title}
      </h3>

      {/* Skill tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {role.skills.map((skill) => (
          <SkillTag key={skill} label={skill} />
        ))}
      </div>

      {/* CTA — pill per design system, accent on group-hover */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/ai-interview/${slug}`); }}
        style={{ minHeight: 44, marginTop: "auto" }}
        className="w-full flex items-center justify-center gap-2 px-4 rounded-full border border-white/[0.1]
          bg-white/[0.04] cursor-pointer transition-all duration-200
          group-hover:border-[#eb3a14]/50 group-hover:bg-[#eb3a14]/10 group-hover:text-[#eb3a14]"
      >
        <span style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/55 group-hover:text-[#eb3a14] transition-colors duration-200">
          View questions
        </span>
        <ChevronRight
          size={12}
          className="text-white/40 group-hover:text-[#eb3a14] group-hover:translate-x-0.5 transition-all duration-200"
        />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-24"
    >
      <p style={monoStyle} className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/20 mb-2">
        No results
      </p>
      <p className="text-[14px] text-white/35">
        No roles match <span className="text-white/55 font-medium">&quot;{query}&quot;</span>
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function AIInterviewPage() {
  const [query,        setQuery]        = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [filterOpen,   setFilterOpen]   = useState(false);

  const filtered = useMemo(() => {
    let list = ROLES;
    if (activeFilter !== "All") {
      const allowed = FILTER_MAP[activeFilter];
      list = list.filter((r) => allowed.includes(r.title));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [query, activeFilter]);

  return (
    <DashboardShell>
      {/*
       * Explicit dark bg on this wrapper — self-sufficient regardless of
       * DashboardShell's background token resolution.
       * overflow-x-hidden prevents any element from causing horizontal scroll.
       */}
      <div className="overflow-x-hidden" style={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#0d0e10" }}>

        {/* ── Hero ─────────────────────────────── */}
        <section className="relative flex flex-col items-center text-center px-4 sm:px-6 pt-14 pb-10">

          {/* Decorative glow — pointer-events-none */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[130px]"
            style={{ background: "rgba(235,58,20,0.07)" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative flex flex-col items-center w-full"
          >
            {/* Eyebrow badge — reused from AuthShared */}
            <div className="mb-5">
              <Eyebrow>AI-Powered</Eyebrow>
            </div>

            {/* Headline — clamp() prevents overflow on 375px */}
            <h1
              className="font-bold text-white tracking-[-0.03em] leading-[1.1] mb-4 max-w-3xl"
              style={{
                fontSize: "clamp(26px, 5.5vw, 56px)",
                fontFamily: "Inter, var(--font-sans, sans-serif)",
              }}
            >
              Prepare for your{" "}
              <span style={{ color: "#eb3a14" }}>next interview</span>
            </h1>

            {/* Subtext */}
            <p
              className="text-white/50 leading-relaxed mb-8 max-w-[480px]"
              style={{
                fontSize: "clamp(13px, 2vw, 15px)",
                fontFamily: "Inter, var(--font-sans, sans-serif)",
              }}
            >
              Pick the position you&apos;re interviewing for, take an
              AI-powered session with Zara, and get instant feedback.
            </p>

            {/* Search — full-width on mobile, capped on desktop */}
            <div className="w-full max-w-[560px]">
              <SearchBar
                value={query}
                onChange={setQuery}
                filterOpen={filterOpen}
                onFilterToggle={() => setFilterOpen((o) => !o)}
              />
            </div>

            {/*
             * Filter pills — horizontally scrollable row on mobile.
             * scrollbar-width:none + webkit pseudo hides the scroll track.
             * overflow-x-auto allows touch-swiping on narrow screens.
             */}
            <div
              className="w-full max-w-[560px] mt-4 flex items-center gap-2 pb-0.5"
              style={{ overflowX: "auto", scrollbarWidth: "none" }}
            >
              <style>{`
                .filter-pill-row::-webkit-scrollbar { display: none; }
              `}</style>
              {FILTER_TAGS.map((tag) => (
                <FilterPill
                  key={tag}
                  label={tag}
                  active={activeFilter === tag}
                  onClick={() => setActiveFilter(tag)}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Role Grid ──────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">

          {/* Role counter — mono metadata label */}
          <AnimatePresence mode="popLayout">
            <motion.p
              key={`${activeFilter}-${filtered.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={monoStyle}
              className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/25 mb-5"
            >
              {filtered.length} role{filtered.length !== 1 ? "s" : ""} available
            </motion.p>
          </AnimatePresence>

          {/* Cards */}
          {filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            /*
             * AnimatePresence without mode="wait" so the new grid fades in
             * immediately — mode="wait" would leave a blank gap while waiting
             * for exit animations to complete.
             */
            <AnimatePresence>
              <motion.div
                key={`${activeFilter}__${query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                {filtered.map((role, i) => (
                  <RoleCard key={role.title} role={role} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}
