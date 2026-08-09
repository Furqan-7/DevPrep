"use client";

/**
 * DevPrep — AI Interview Role Selection
 *
 * Redesigned to the "Tidiane DevOps Portfolio System" spec (v1.0.0).
 *
 * Design tokens (single source of truth):
 *   bg       #F5F5F7   surface  #FFFFFF
 *   primary  #1A1A1A   secondary #666666
 *   accent   #EB3A14   line     #E5E5E5
 *   sans     Inter     mono     JetBrains Mono
 *   rounded.lg  12px   rounded.full 999px
 *   motion.curve cubic-bezier(0.25,0.8,0.25,1)  duration 0.8s
 *
 * Lenis smooth-scroll is loaded dynamically so the page works
 * whether or not the `lenis` npm package is installed.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { monoStyle } from "@/components/auth/AuthShared";

/* ─────────────────────────────────────────────
   Design-system motion constants
───────────────────────────────────────────── */
const EASE = [0.25, 0.8, 0.25, 1] as const;
const DURATION = 0.5;

/* Fonts are loaded via next/font/google in app/layout.tsx — no inline
   <link> tags needed here. */

/* ─────────────────────────────────────────────
   Native lerp smooth-scroll
   Mirrors Lenis's feel with a lerp factor of 0.10
   — zero npm dependencies required.
───────────────────────────────────────────── */
function useSmoothScroll() {
  useEffect(() => {
    // Skip on touch devices — native momentum scroll is better there
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let rafId: number;
    const LERP = 0.10;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetY = Math.max(0, Math.min(targetY + e.deltaY, document.body.scrollHeight - window.innerHeight));
    };

    const tick = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.5) {
        currentY = targetY;
      } else {
        currentY += diff * LERP;
        window.scrollTo(0, currentY);
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafId);
    };
  }, []);
}

/* ─────────────────────────────────────────────
   Intersection-observer hook for stagger reveal
───────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────
   ROLES data — identical to original
───────────────────────────────────────────── */
const ROLES = [
  { title: "Frontend Engineer",          duration: 20, category: "Engineering", skills: ["React", "TypeScript", "CSS Architecture", "Web Performance"] },
  { title: "Backend Engineer",           duration: 20, category: "Engineering", skills: ["System Design", "REST APIs", "Databases", "Caching"] },
  { title: "Full Stack Developer",       duration: 25, category: "Engineering", skills: ["Node.js", "React", "PostgreSQL", "Docker"] },
  { title: "Data Structures & Algorithms", duration: 18, category: "Data",     skills: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming"] },
  { title: "System Design",             duration: 30, category: "Engineering", skills: ["Scalability", "Load Balancing", "Microservices", "CAP Theorem"] },
  { title: "Machine Learning Engineer", duration: 20, category: "Data",        skills: ["Machine Learning", "Deep Learning", "Data Analysis", "Python"] },
  { title: "DevOps Engineer",           duration: 18, category: "Engineering", skills: ["CI/CD", "Kubernetes", "AWS", "Infrastructure as Code"] },
  { title: "Android Developer",         duration: 18, category: "Engineering", skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM"] },
  { title: "iOS Developer",             duration: 18, category: "Engineering", skills: ["Swift", "SwiftUI", "UIKit", "Core Data"] },
  { title: "Data Engineer",             duration: 20, category: "Data",        skills: ["Spark", "Kafka", "ETL Pipelines", "Data Warehousing"] },
  { title: "Product Manager",           duration: 20, category: "Product",     skills: ["Product Strategy", "Roadmapping", "Stakeholder Management", "Metrics"] },
  { title: "Behavioral Round",          duration: 15, category: "Behavioral",  skills: ["Leadership", "Conflict Resolution", "Communication", "Teamwork"] },
  { title: "Cloud Engineer",            duration: 20, category: "Engineering", skills: ["AWS", "GCP", "Azure", "Serverless", "Terraform"] },
  { title: "Site Reliability Engineer", duration: 22, category: "Engineering", skills: ["Observability", "On-Call", "SLOs & SLAs", "Incident Response"] },
  { title: "Cybersecurity Engineer",    duration: 20, category: "Engineering", skills: ["Threat Modeling", "Penetration Testing", "OWASP", "Cryptography"] },
  { title: "QA / Test Engineer",        duration: 18, category: "Engineering", skills: ["Test Automation", "Selenium", "API Testing", "Bug Lifecycle"] },
  { title: "Data Scientist",            duration: 22, category: "Data",        skills: ["Statistics", "Feature Engineering", "Model Evaluation", "SQL"] },
  { title: "Generative AI Engineer",    duration: 20, category: "Data",        skills: ["LLMs", "Prompt Engineering", "RAG", "LangChain", "Fine-tuning"] },
  { title: "Embedded Systems Engineer", duration: 20, category: "Engineering", skills: ["C/C++", "RTOS", "Microcontrollers", "Hardware Interfaces"] },
  { title: "Blockchain Developer",      duration: 20, category: "Engineering", skills: ["Solidity", "Smart Contracts", "Web3.js", "DeFi Protocols"] },
  { title: "UI/UX Designer",           duration: 18, category: "Design",      skills: ["Figma", "User Research", "Design Systems", "Prototyping"] },
  { title: "Game Developer",            duration: 20, category: "Engineering", skills: ["Unity", "C#", "Game Physics", "Shader Programming"] },
  { title: "Database Administrator",    duration: 20, category: "Engineering", skills: ["Query Optimization", "Indexing", "Replication", "Backup & Recovery"] },
  { title: "Technical Program Manager", duration: 20, category: "Product",     skills: ["Execution Planning", "Cross-team Alignment", "Risk Management", "OKRs"] },
] as const;

const FILTER_TAGS = ["All", "Engineering", "Data", "Design", "Product", "Behavioral"] as const;
type FilterTag = (typeof FILTER_TAGS)[number];

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[&]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─────────────────────────────────────────────
   SearchBar
   Light surface: bg #FFFFFF border #E5E5E5
   focus ring: accent (#EB3A14) at 15% opacity
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   SearchBar
   Clean surface: bg #FFFFFF border #E5E5E5
   Rounded pill shape matching design language
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
      className={`flex items-center gap-3 w-full rounded-full px-5 transition-all duration-200 bg-white border ${
        filterOpen ? "border-[#eb3a14] ring-2 ring-[#eb3a14]/15" : "border-[#e5e5e5] hover:border-[#1a1a1a]/30 focus-within:border-[#1a1a1a]"
      }`}
      style={{
        minHeight: 52,
      }}
    >
      <Search size={16} className="text-[#666666] shrink-0" aria-hidden />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by role or skill…"
        aria-label="Search roles"
        className="flex-1 bg-transparent border-none outline-none min-w-0 text-[14px] tracking-[-0.02em] text-[#1a1a1a] placeholder:text-[#666666]/60 font-sans"
      />

      {/* filter toggle */}
      <button
        type="button"
        onClick={onFilterToggle}
        aria-label="Toggle category filters"
        aria-pressed={filterOpen}
        className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
          filterOpen
            ? "bg-[#eb3a14] border-[#eb3a14] text-white"
            : "bg-transparent border-[#e5e5e5] text-[#666666] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
        }`}
      >
        <SlidersHorizontal size={13} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FilterPill
   Pill-shaped (rounded.full = 999px)
   Active: bg primary (#1A1A1A) or accent (#EB3A14), white label
   Inactive: white surface, secondary label, line border
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
      layout
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15, ease: EASE }}
      aria-pressed={active}
      style={monoStyle}
      className={`rounded-full px-4 py-1.5 text-[11px] font-bold tracking-[0.08em] uppercase shrink-0 whitespace-nowrap cursor-pointer transition-all ${
        active
          ? "bg-[#1a1a1a] text-white border border-[#1a1a1a]"
          : "bg-white text-[#1a1a1a]/70 border border-[#e5e5e5] hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
      }`}
    >
      {label}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   SkillTag
   rounded.sm = 4px, mono uppercase label
   bg: very light tint on surface; border: #E5E5E5
   text: #666666 (secondary) — always readable on white
───────────────────────────────────────────── */
function SkillTag({ label }: { label: string }) {
  return (
    <span
      style={{
        ...monoStyle,
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 4,
        border: "1px solid #E5E5E5",
        backgroundColor: "#F5F5F7",
        fontSize: "0.6rem",
        fontWeight: 500,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#666666",
      }}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   RoleCard
   Design-system card spec:
     border: 1px solid #E5E5E5
     radius: 12px (rounded.lg)
     surface: #FFFFFF
     hover: translateY(-4px) + shadow-2xl
     transition: 500ms cubic-bezier(0.25,0.8,0.25,1)
   Stagger reveal via IntersectionObserver prop
───────────────────────────────────────────── */
function RoleCard({
  role,
  index,
  visible,
}: {
  role: RoleItem;
  index: number;
  visible: boolean;
}) {
  const router = useRouter();
  const slug = titleToSlug(role.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        delay: Math.min(index * 0.045, 0.45),
        duration: DURATION,
        ease: EASE,
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
        transition: { duration: 0.3, ease: EASE },
      }}
      onClick={() => router.push(`/dashboard/ai-interview/${slug}`)}
      role="article"
      aria-label={`${role.title} — ${role.duration} minute interview`}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: 12,
        padding: "20px",
        cursor: "pointer",
        minHeight: 220,
        position: "relative",
        overflow: "hidden",
      }}
      className="group"
    >
      {/* Accent line on hover — left edge indicator */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          width: 3,
          backgroundColor: "#EB3A14",
          borderRadius: "0 2px 2px 0",
          transformOrigin: "top",
        }}
      />

      {/* Duration badge */}
      <div
        style={{
          ...monoStyle,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: "0.625rem",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#666666",
          marginBottom: 10,
        }}
      >
        <Clock size={9} aria-hidden />
        {role.duration} min interview
      </div>

      {/* Role title */}
      <h3
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          color: "#1A1A1A",
          marginBottom: 10,
        }}
      >
        {role.title}
      </h3>

      {/* Skill tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
        {role.skills.map((skill) => (
          <SkillTag key={skill} label={skill} />
        ))}
      </div>

      {/* CTA — pill per design system spec */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/dashboard/ai-interview/${slug}`);
        }}
        style={{
          marginTop: "auto",
          minHeight: 40,
          borderRadius: 999,
          border: "1px solid #E5E5E5",
          backgroundColor: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 20px",
          transition: "border-color 0.2s, background-color 0.2s",
        }}
        className="role-cta"
        aria-label={`View questions for ${role.title}`}
      >
        <span
          style={{
            ...monoStyle,
            fontSize: "0.625rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#666666",
            transition: "color 0.2s",
          }}
          className="role-cta-label"
        >
          View Questions
        </span>
        <ArrowRight
          size={11}
          style={{ color: "#666666", transition: "color 0.2s, transform 0.2s" }}
          className="role-cta-arrow"
        />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   EmptyState
───────────────────────────────────────────── */
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ textAlign: "center", padding: "96px 0" }}
    >
      <p
        style={{
          ...monoStyle,
          fontSize: "0.625rem",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#666666",
          marginBottom: 8,
        }}
      >
        No results
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1A1A1A" }}>
        No roles match{" "}
        <span style={{ fontWeight: 600 }}>&quot;{query}&quot;</span> — try a
        different keyword.
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Animated card grid — uses one IntersectionObserver
   for the entire grid so all visible cards reveal
   together on scroll-in.
───────────────────────────────────────────── */
type RoleItem = {
  title: string;
  duration: number;
  category: string;
  skills: readonly string[];
};

function CardGrid({
  roles,
  filterKey,
}: {
  roles: RoleItem[];
  filterKey: string;
}) {
  // Start as true so above-fold cards appear immediately on mount
  const { ref, inView } = useInView(0.02);
  const [mountVisible, setMountVisible] = useState(false);
  useEffect(() => {
    // Trigger initial reveal on next tick (avoids hydration flash)
    const t = setTimeout(() => setMountVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cardsVisible = mountVisible || inView;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={filterKey}
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {roles.map((role, i) => (
          <RoleCard key={role.title} role={role} index={i} visible={cardsVisible} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function AIInterviewPage() {
  useSmoothScroll();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTag>("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo((): RoleItem[] => {
    let list: RoleItem[] = [...ROLES];
    if (activeFilter !== "All") {
      list = list.filter((r) => r.category === activeFilter);
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
       * Light-mode page override.
       * DashboardShell enforces dark (#0d0e10); this div resets to
       * the design-system bg (#F5F5F7) for the AI Interview page only.
       */}
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#F5F5F7",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* ── Inline hover styles for card CTAs ── */}
        <style>{`
          .role-cta:hover {
            border-color: #EB3A14 !important;
            background-color: rgba(235,58,20,0.06) !important;
          }
          .role-cta:hover .role-cta-label {
            color: #EB3A14 !important;
          }
          .role-cta:hover .role-cta-arrow {
            color: #EB3A14 !important;
            transform: translateX(2px) !important;
          }
          .filter-pill-row::-webkit-scrollbar { display: none; }
        `}</style>

        {/* ── Hero ──────────────────────────────── */}
        <section
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "64px 24px 48px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex flex-col items-center w-full"
          >
            {/* Eyebrow badge (matching landing page) */}
            <div
              style={monoStyle}
              className="inline-flex items-center gap-2 rounded-full bg-[#eb3a14]/[0.08] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14] mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3a14]" />
              AI-Powered Mock Interviews
            </div>

            {/* Headline (bold two-tone matching landing page) */}
            <h1 className="font-extrabold text-[#1a1a1a] text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.05] tracking-[-0.03em] max-w-[800px] mb-6">
              Prepare for your{" "}
              <span className="font-bold text-[#666]">next interview.</span>
            </h1>

            {/* Subtext (matching landing page hero subtext) */}
            <p className="text-[#666] text-[16px] sm:text-[18px] leading-relaxed max-w-[560px] mb-8">
              Pick the position you&apos;re interviewing for, take an
              AI-powered session with Zara, and get instant feedback.
            </p>

            {/* Search bar */}
            <div style={{ width: "100%", maxWidth: 560 }}>
              <SearchBar
                value={query}
                onChange={setQuery}
                filterOpen={filterOpen}
                onFilterToggle={() => setFilterOpen((o) => !o)}
              />
            </div>

            {/* Filter pills — horizontally scrollable on mobile */}
            <div
              className="filter-pill-row"
              style={{
                width: "100%",
                maxWidth: 560,
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                overflowX: "auto",
                scrollbarWidth: "none",
                paddingBottom: 2,
              }}
            >
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

        {/* ── Role Grid ─────────────────────────── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px 96px",
          }}
        >
          {/* Role counter */}
          <AnimatePresence mode="popLayout">
            <motion.p
              key={`${activeFilter}-${filtered.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                ...monoStyle,
                fontSize: "0.625rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#666666",
                marginBottom: 20,
              }}
            >
              {filtered.length} role{filtered.length !== 1 ? "s" : ""} available
            </motion.p>
          </AnimatePresence>

          {/* Card grid or empty state */}
          {filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <CardGrid
              roles={filtered}
              filterKey={`${activeFilter}__${query}`}
            />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
