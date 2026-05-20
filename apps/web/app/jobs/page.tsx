"use client";

import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    Wifi,
    GraduationCap,
    Briefcase,
    FileText,
    CircleDot,
    MapPin,
    Clock,
    Tag,
    ExternalLink,
    SlidersHorizontal,
    LayoutGrid,
    Sparkles,
    HelpCircle,
    TrendingUp,
    Building2,
    X
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

// --- Types ---
interface Job {
    id: string;
    title: string;
    company: string;
    companyLogo: string | null;
    location: string;
    isRemote: boolean;
    type: string;
    salary: string | null;
    description: string;
    tags: string[];
    category?: string;
    postedAt: string;
    applyUrl: string;
    source: "adzuna" | "remotive" | "jsearch";
    benefits?: string[];
}

// --- Hardcoded Job Data ---
const JOBS: Job[] = [
    {
        id: "5733975938",
        title: "Software Engineer Intern (AI/ML)",
        company: "SkillsCapital",
        companyLogo: null,
        location: "India (Remote)",
        isRemote: true,
        type: "contract",
        salary: null,
        description: "Work on AI-powered Talent Cloud — smart matching, intelligent screening, vetting engines, and scalable decision-making systems.",
        tags: ["AI/ML", "Python"],
        category: "IT Jobs",
        postedAt: "2026-05-19",
        applyUrl: "https://www.adzuna.in/land/ad/5733975938",
        source: "adzuna"
    },
    {
        id: "5729068026",
        title: "SDET Intern",
        company: "Visit Health",
        companyLogo: null,
        location: "Noida, India",
        isRemote: false,
        type: "contract",
        salary: null,
        description: "Building healthcare infrastructure at scale. We're looking for people who think like engineers, write code, build automation, and debug issues.",
        tags: ["Testing", "Automation", "QA"],
        category: "IT Jobs",
        postedAt: "2026-05-14",
        applyUrl: "https://www.adzuna.in/land/ad/5729068026",
        source: "adzuna"
    },
    {
        id: "5734431512",
        title: "Software Engineer (Apprentice)",
        company: "Vonage",
        companyLogo: null,
        location: "Bangalore, Karnataka",
        isRemote: false,
        type: "full_time",
        salary: null,
        description: "Help us innovate cloud communications. Vonage is a global cloud communications leader helping businesses accelerate digital transformation.",
        tags: ["Cloud", "Communications", "APIs"],
        category: "IT Jobs",
        postedAt: "2026-05-20",
        applyUrl: "https://www.adzuna.in/details/5734431512",
        source: "adzuna"
    },
    {
        id: "5719203778",
        title: "Software Engineer Intern",
        company: "Cloudflare",
        companyLogo: null,
        location: "Bangalore, Karnataka",
        isRemote: false,
        type: "full_time",
        salary: null,
        description: "Help build a better Internet. Cloudflare runs one of the world's largest networks powering millions of websites for customers from SMBs to Fortune 500.",
        tags: ["Networking", "Rust", "Systems"],
        category: "IT Jobs",
        postedAt: "2026-05-05",
        applyUrl: "https://www.adzuna.in/details/5719203778",
        source: "adzuna"
    },
    {
        id: "5731675439",
        title: "Software Engineering Intern",
        company: "GE Aerospace",
        companyLogo: null,
        location: "Bangalore, Karnataka",
        isRemote: false,
        type: "contract",
        salary: null,
        description: "John F. Welch Technology Center, Bengaluru. Seeking intern with Java, JavaScript, and web development background.",
        tags: ["Java", "JavaScript", "Web"],
        category: "IT Jobs",
        postedAt: "2026-05-17",
        applyUrl: "https://www.adzuna.in/details/5731675439",
        source: "adzuna"
    },
    {
        id: "2090885",
        title: "Paid Media Specialist",
        company: "Noventra Group Europe",
        companyLogo: null,
        location: "Worldwide",
        isRemote: true,
        type: "freelance",
        salary: "$65k – $85k",
        description: "Support campaign coordination, audience research, paid advertising across Meta Ads and Google Ads for European retail brands.",
        tags: ["Google Ads", "Meta Ads", "A/B Testing", "ecommerce"],
        category: "Marketing",
        postedAt: "2026-05-18",
        applyUrl: "https://remotive.com/remote-jobs/marketing/paid-media-specialist-2090885",
        source: "remotive"
    },
    {
        id: "1919265",
        title: "Senior Independent Software Developer",
        company: "A.Team",
        companyLogo: null,
        location: "Americas, Europe, Israel",
        isRemote: true,
        type: "contract",
        salary: "$90–$150/hr",
        description: "Match with high-growth companies backed by a16z, YC, Softbank on impactful 0-to-1 missions in small autonomous teams.",
        tags: ["React", "Node", "Full-stack"],
        category: "Software Development",
        postedAt: "2026-05-16",
        applyUrl: "https://remotive.com/remote-jobs/software-development/senior-independent-software-developer-1919265",
        source: "remotive"
    },
    {
        id: "1919266",
        title: "Senior Independent AI Engineer / Architect",
        company: "A.Team",
        companyLogo: null,
        location: "Americas, Europe, Israel",
        isRemote: true,
        type: "contract",
        salary: "$120–$170/hr",
        description: "Lead design, deployment, and scaling of production AI systems. Work in elite peer networks from OpenAI, Google, Meta, Amazon.",
        tags: ["LLMs", "NLP", "ML Infra", "AI"],
        category: "Software Development",
        postedAt: "2026-05-16",
        applyUrl: "https://remotive.com/remote-jobs/software-development/senior-independent-ai-engineer-architect-1919266",
        source: "remotive"
    },
    {
        id: "v2mD49CS8tWSAdy-AAAAAA==",
        title: "Fullstack Developer (Node & React)",
        company: "Stellent IT (via Dice)",
        companyLogo: null,
        location: "Chicago, IL",
        isRemote: false,
        type: "full_time",
        salary: null,
        description: "Design, development, and deployment of fullstack applications. Architect scalable backend systems using Node.js and React. 8+ years experience.",
        tags: ["Node.js", "React", "PostgreSQL", "AWS"],
        category: "IT Jobs",
        postedAt: "2026-05-19",
        applyUrl: "https://www.linkedin.com/jobs/view/fullstack-developer-node-react-f2f-interview-at-jobs-via-dice-4415961036",
        source: "jsearch"
    },
    {
        id: "qIsPjUMr0Em0hqHoAAAAAA==",
        title: "Developer II",
        company: "United Airlines",
        companyLogo: null,
        location: "Chicago, IL",
        isRemote: false,
        type: "full_time",
        salary: "$89,965 – $117,212",
        description: "Plan, design, develop and launch efficient systems in support of core organizational functions. Work on massively scaling technology solutions.",
        tags: ["C#", "Java", "Azure", "Agile"],
        category: "IT Jobs",
        postedAt: "2026-05-20",
        applyUrl: "https://careers.united.com/us/en/job/WHQ00026290/Developer-II",
        source: "jsearch",
        benefits: ["Paid time off", "Dental insurance", "Health insurance"]
    },
    {
        id: "vZNukCt-XaCLNKjeAAAAAA==",
        title: "Frontend Developer",
        company: "TEKsystems",
        companyLogo: null,
        location: "Chicago, IL (Remote)",
        isRemote: true,
        type: "contract",
        salary: "$50–$70/hr",
        description: "NextJS, ReactJS, and Sitecore work on internal and customer facing systems. High-traffic public-facing websites with GraphQL integrations.",
        tags: ["Next.js", "React", "Sitecore", "TypeScript"],
        category: "IT Jobs",
        postedAt: "2026-05-18",
        applyUrl: "https://careers.teksystems.com/ca/fr/job/JP-006033368/Frontend-Developer",
        source: "jsearch"
    }
];

// --- Helpers ---
function timeAgo(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date("2026-05-20");
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
}

function initials(company: string): string {
    return company
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

function sourceLabel(s: string): string {
    return { adzuna: "Adzuna", remotive: "Remotive", jsearch: "JSearch" }[s] || s;
}

function typeLabel(t: string): string {
    const map: Record<string, string> = {
        full_time: "Full-time",
        contract: "Contract",
        freelance: "Freelance",
        part_time: "Part-time",
        full_time_remote: "Remote FT"
    };
    return map[t] || t.replace("_", " ");
}

export default function JobsPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredJobs = useMemo(() => {
        return JOBS.filter((j) => {
            const searchable = [
                j.title,
                j.company,
                j.location,
                j.description,
                ...(j.tags || [])
            ]
                .join(" ")
                .toLowerCase();

            if (searchQuery && !searchable.includes(searchQuery.toLowerCase())) {
                return false;
            }

            if (activeFilter === "remote") return j.isRemote;
            if (activeFilter === "internship") {
                return j.title.toLowerCase().includes("intern") || j.type === "intern" || j.type === "contract";
            }
            if (activeFilter === "fulltime") return j.type === "full_time";
            if (activeFilter === "contract") {
                return j.type === "contract" || j.type === "freelance";
            }
            if (activeFilter === "adzuna") return j.source === "adzuna";
            if (activeFilter === "remotive") return j.source === "remotive";
            if (activeFilter === "jsearch") return j.source === "jsearch";

            return true;
        });
    }, [activeFilter, searchQuery]);

    return (
        <div className="min-h-screen bg-[#0B0E14] text-[#F3F4F6] dot-background selection:bg-[#6366F1] selection:text-white pb-20">

            {/* Page Header */}
            <header className="pt-10 pb-8 border-b border-[#1E2635] bg-[#0B0E14]/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                <a href="/" className="hover:text-white transition-colors cursor-pointer">TechPrep</a>
                                <span className="opacity-20">/</span>
                                <span className="text-[#6366F1]">Jobs & Internships</span>
                            </nav>
                            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Job & Internship Board</h1>
                            <p className="text-sm text-[#9CA3AF] max-w-xl">
                                Live listings from Adzuna, Remotive, and JSearch — normalized into one feed.
                            </p>
                        </div>

                        <div className="bg-[#131822] border border-[#1E2635] rounded-xl p-4 md:px-6 flex items-center gap-5">
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF]">Status Terminal</div>
                                <div className="text-lg font-mono font-bold flex items-center gap-2 text-[#6366F1]">
                                    <span className="inline-block w-2.5 h-2.5 bg-[#6366F1] rounded-full animate-pulse" />
                                    ONLINE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

                {/* Command-Palette Style Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#9CA3AF]">
                        <Search size={16} className="group-focus-within:text-[#6366F1] transition-colors duration-200" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search role, company, skill..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#131822] border border-[#1E2635] rounded-xl py-3.5 pl-12 pr-12 text-sm text-[#F3F4F6] placeholder-[#9CA3AF]/40 outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all duration-300"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-4 flex items-center text-[#9CA3AF] hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filter Row with customized Chips */}
                <div className="flex items-center justify-between border-b border-[#1E2635] pb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
                        <FilterChip
                            active={activeFilter === "all"}
                            onClick={() => setActiveFilter("all")}
                            icon={<LayoutGrid size={13} />}
                            label="All"
                        />
                        <FilterChip
                            active={activeFilter === "remote"}
                            onClick={() => setActiveFilter("remote")}
                            icon={<Wifi size={13} />}
                            label="Remote"
                        />
                        <FilterChip
                            active={activeFilter === "internship"}
                            onClick={() => setActiveFilter("internship")}
                            icon={<GraduationCap size={13} />}
                            label="Internships"
                        />
                        <FilterChip
                            active={activeFilter === "fulltime"}
                            onClick={() => setActiveFilter("fulltime")}
                            icon={<Briefcase size={13} />}
                            label="Full-time"
                        />
                        <FilterChip
                            active={activeFilter === "contract"}
                            onClick={() => setActiveFilter("contract")}
                            icon={<FileText size={13} />}
                            label="Contract"
                        />
                        <FilterChip
                            active={activeFilter === "adzuna"}
                            onClick={() => setActiveFilter("adzuna")}
                            icon={<CircleDot size={13} />}
                            label="Adzuna"
                        />
                        <FilterChip
                            active={activeFilter === "remotive"}
                            onClick={() => setActiveFilter("remotive")}
                            icon={<CircleDot size={13} />}
                            label="Remotive"
                        />
                        <FilterChip
                            active={activeFilter === "jsearch"}
                            onClick={() => setActiveFilter("jsearch")}
                            icon={<CircleDot size={13} />}
                            label="JSearch"
                        />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                        <span className="font-mono">{filteredJobs.length} active opportunities</span>
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#6366F1]">
                            <TrendingUp size={12} /> Live Sync
                        </span>
                    </div>
                </div>

                {/* Jobs Grid / List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((j) => (
                                <motion.div
                                    key={j.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25 }}
                                    className="bg-[#131822] border border-[#1E2635] hover:border-[#6366F1]/50 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] group relative overflow-hidden"
                                >
                                    <div className="space-y-4">
                                        {/* Header Details */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-[#1E2635] border border-[#1E2635] flex items-center justify-center font-mono font-semibold text-[#F3F4F6] text-xs">
                                                    {initials(j.company)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-sm text-[#F3F4F6] line-clamp-1 group-hover:text-[#6366F1] transition-colors duration-200">
                                                        {j.title}
                                                    </h3>
                                                    <p className="text-xs text-[#9CA3AF] font-medium">{j.company}</p>
                                                </div>
                                            </div>
                                            <SourceBadge source={j.source} />
                                        </div>

                                        {/* Meta Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {j.isRemote && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <Wifi size={10} /> Remote
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1E2635] text-[#9CA3AF] border border-[#1E2635]">
                                                {typeLabel(j.type)}
                                            </span>
                                        </div>

                                        {/* Brief description */}
                                        <p className="text-xs text-[#9CA3AF]/80 leading-relaxed font-normal line-clamp-3">
                                            {j.description}
                                        </p>

                                        {/* Tags */}
                                        {j.tags && j.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {j.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E2635]/50 text-[#9CA3AF] border border-[#1E2635]/20"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Bar */}
                                    <div className="mt-6 pt-4 border-t border-[#1E2635] flex items-center justify-between gap-4">
                                        <div className="text-[11px] font-mono text-[#9CA3AF]">
                                            {j.salary ? (
                                                <span className="font-bold text-[#F3F4F6]">{j.salary}</span>
                                            ) : (
                                                <span className="text-[#9CA3AF]/60 italic">Salary Negotiable</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => window.open(j.applyUrl, "_blank")}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md bg-[#131822] text-[#F3F4F6] border border-[#6366F1]/30 hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] transition-all duration-200 cursor-pointer active:scale-95"
                                        >
                                            Apply <ExternalLink size={11} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-[#131822] border border-[#1E2635] flex items-center justify-center text-[#9CA3AF]/30">
                                    <SlidersHorizontal size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-base text-[#F3F4F6]">No active roles match your query</h3>
                                    <p className="text-xs text-[#9CA3AF] max-w-sm">
                                        Try clearing your search query or choosing another source chip filter.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveFilter("all");
                                        setSearchQuery("");
                                    }}
                                    className="text-xs font-semibold px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5356E0] transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Subtle details */}
            <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-[#1E2635] text-center text-[11px] text-[#9CA3AF]/40 font-mono">
                © 2026 TechPrep Jobs Hub. Connected with secure Web APIs. All rights reserved.
            </footer>
        </div>
    );
}

function FilterChip({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${active
                    ? "bg-[#6366F1]/15 border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1]/25"
                    : "bg-[#131822] border-[#1E2635] text-[#9CA3AF] hover:border-[#6366F1]/30 hover:text-[#F3F4F6]"
                }`}
        >
            {icon}
            <span>{label}</span>
            {active && <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />}
        </button>
    );
}

function SourceBadge({ source }: { source: "adzuna" | "remotive" | "jsearch" }) {
    if (source === "adzuna") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest font-mono">
                Adzuna
            </span>
        );
    }
    if (source === "remotive") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest font-mono">
                Remotive
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-mono">
            JSearch
        </span>
    );
}
