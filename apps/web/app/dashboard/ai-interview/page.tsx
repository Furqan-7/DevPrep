"use client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Mic, Clock, ChevronRight } from "lucide-react";

const ROLES = [
  {
    title: "Frontend Engineer",
    duration: 20,
    skills: ["React", "TypeScript", "CSS Architecture", "Web Performance"],
  },
  {
    title: "Backend Engineer",
    duration: 20,
    skills: ["System Design", "REST APIs", "Databases", "Caching"],
  },
  {
    title: "Full Stack Developer",
    duration: 25,
    skills: ["Node.js", "React", "PostgreSQL", "Docker"],
  },
  {
    title: "Data Structures & Algorithms",
    duration: 18,
    skills: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming"],
  },
  {
    title: "System Design",
    duration: 30,
    skills: ["Scalability", "Load Balancing", "Microservices", "CAP Theorem"],
  },
  {
    title: "Machine Learning Engineer",
    duration: 20,
    skills: ["Machine Learning", "Deep Learning", "Data Analysis", "Python"],
  },
  {
    title: "DevOps Engineer",
    duration: 18,
    skills: ["CI/CD", "Kubernetes", "AWS", "Infrastructure as Code"],
  },
  {
    title: "Android Developer",
    duration: 18,
    skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM"],
  },
  {
    title: "iOS Developer",
    duration: 18,
    skills: ["Swift", "SwiftUI", "UIKit", "Core Data"],
  },
  {
    title: "Data Engineer",
    duration: 20,
    skills: ["Spark", "Kafka", "ETL Pipelines", "Data Warehousing"],
  },
  {
    title: "Product Manager",
    duration: 20,
    skills: ["Product Strategy", "Roadmapping", "Stakeholder Management", "Metrics"],
  },
  {
    title: "Behavioral Round",
    duration: 15,
    skills: ["Leadership", "Conflict Resolution", "Communication", "Teamwork"],
  },
];

const FILTER_TAGS = [
  "All",
  "Engineering",
  "Data",
  "Design",
  "Product",
  "Behavioral",
];

const FILTER_MAP: Record<string, string[]> = {
  All: [],
  Engineering: ["Frontend Engineer", "Backend Engineer", "Full Stack Developer", "DevOps Engineer", "Android Developer", "iOS Developer"],
  Data: ["Machine Learning Engineer", "Data Engineer", "Data Structures & Algorithms"],
  Design: [],
  Product: ["Product Manager"],
  Behavioral: ["Behavioral Round"],
};

export default function AIInterviewPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);

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
      {/* ── Hero ── */}
      <section className="relative w-full flex flex-col items-center text-center px-6 pt-16 pb-12 overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-600/10 blur-[120px] -z-10" />
        <div className="pointer-events-none absolute top-20 left-1/4 w-[200px] h-[200px] rounded-full bg-violet-500/10 blur-[80px] -z-10" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-brand-muted mb-6">
          <Mic size={11} className="text-white/60" />
          AI-Powered · 100% Free
        </div>

        {/* Heading */}
        <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-4 max-w-3xl">
          Prepare for your{" "}
          <span className="text-brand-muted">next interview</span>
        </h1>

        {/* Sub */}
        <p className="text-sm md:text-base text-brand-muted max-w-xl leading-relaxed mb-10">
          Pick the position you are interviewing for, take an AI-powered practice
          interview, and get feedback on your performance.
        </p>

        {/* Search bar */}
        <div className="relative w-full max-w-xl">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-full px-5 py-3.5 focus-within:border-white/25 transition-colors">
            <Search size={16} className="text-brand-muted flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role"
              className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-brand-muted font-sans"
            />
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                filterOpen
                  ? "bg-white/10 border-white/30 text-white"
                  : "bg-white/5 border-white/10 text-brand-muted hover:text-white"
              }`}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* Filter tag chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
            {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight border transition-all duration-150 ${
                activeFilter === tag
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  : "bg-white/[0.03] border-white/10 text-brand-muted hover:text-white hover:border-white/30"
              }`}
            >
              {tag}
            </button>
          ))}
          </div>
        </div>
      </section>

      {/* ── Role Cards Grid ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-brand-muted text-sm">
            No roles found for &quot;{query}&quot;
          </div>
        ) : (
          <>
            <p className="text-xs text-brand-muted mb-5 uppercase tracking-widest font-semibold">
              {filtered.length} role{filtered.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((role) => (
                <RoleCard key={role.title} role={role} />
              ))}
            </div>
          </>
        )}
      </section>
    </DashboardShell>
  );
}

function RoleCard({
  role,
}: {
  role: { title: string; duration: number; skills: string[] };
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex flex-col justify-between rounded-2xl border bg-white/[0.02] p-5 transition-all duration-200 cursor-pointer ${
        hovered
          ? "border-white/25 bg-white/[0.04] shadow-[0_0_30px_rgba(255,255,255,0.04)]"
          : "border-white/8"
      }`}
      style={{ borderColor: hovered ? undefined : "rgba(255,255,255,0.07)" }}
    >
      {/* Top */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-[10px] text-brand-muted uppercase tracking-widest font-semibold mb-2">
          <Clock size={10} />
          {role.duration} mins interview
        </div>
        <h3 className="text-base font-bold text-white font-display tracking-tight mb-3">
          {role.title}
        </h3>
        {/* Skill tags */}
        <div className="flex flex-wrap gap-1.5">
          {role.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] border border-white/[0.07] text-brand-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-white/70 transition-all duration-150 group-hover:bg-white/10 group-hover:border-white/30 group-hover:text-white">
        Take practice interview
        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
