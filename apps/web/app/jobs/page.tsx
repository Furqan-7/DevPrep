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
    ExternalLink,
    SlidersHorizontal,
    LayoutGrid,
    TrendingUp,
    X,
    ArrowLeft,
    Menu,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- Types ---
interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    isRemote: boolean;
    type: string;
    salary: string | null;
    description: string;
    tags: string[];
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
        location: "India (Remote)",
        isRemote: true,
        type: "contract",
        salary: null,
        description: "Work on AI-powered Talent Cloud — smart matching, intelligent screening, vetting engines, and scalable decision-making systems.",
        tags: ["AI/ML", "Python"],
        postedAt: "2026-05-19",
        applyUrl: "https://www.adzuna.in/land/ad/5733975938",
        source: "adzuna"
    },
    {
        id: "5729068026",
        title: "SDET Intern",
        company: "Visit Health",
        location: "Noida, India",
        isRemote: false,
        type: "contract",
        salary: null,
        description: "Building healthcare infrastructure at scale. Looking for people who think like engineers, write code, build automation, and debug issues.",
        tags: ["Testing", "Automation", "QA"],
        postedAt: "2026-05-14",
        applyUrl: "https://www.adzuna.in/land/ad/5729068026",
        source: "adzuna"
    },
    {
        id: "5734431512",
        title: "Software Engineer (Apprentice)",
        company: "Vonage",
        location: "Bangalore, Karnataka",
        isRemote: false,
        type: "full_time",
        salary: null,
        description: "Help us innovate cloud communications. Vonage is a global cloud communications leader helping businesses accelerate digital transformation.",
        tags: ["Cloud", "Communications", "APIs"],
        postedAt: "2026-05-20",
        applyUrl: "https://www.adzuna.in/details/5734431512",
        source: "adzuna"
    },
    {
        id: "5719203778",
        title: "Software Engineer Intern",
        company: "Cloudflare",
        location: "Bangalore, Karnataka",
        isRemote: false,
        type: "full_time",
        salary: null,
        description: "Help build a better Internet. Cloudflare runs one of the world's largest networks powering millions of websites from SMBs to Fortune 500.",
        tags: ["Networking", "Rust", "Systems"],
        postedAt: "2026-05-05",
        applyUrl: "https://www.adzuna.in/details/5719203778",
        source: "adzuna"
    },
    {
        id: "5731675439",
        title: "Software Engineering Intern",
        company: "GE Aerospace",
        location: "Bangalore, Karnataka",
        isRemote: false,
        type: "contract",
        salary: null,
        description: "John F. Welch Technology Center, Bengaluru. Seeking intern with Java, JavaScript, and web development background.",
        tags: ["Java", "JavaScript", "Web"],
        postedAt: "2026-05-17",
        applyUrl: "https://www.adzuna.in/details/5731675439",
        source: "adzuna"
    },
    {
        id: "2090885",
        title: "Paid Media Specialist",
        company: "Noventra Group Europe",
        location: "Worldwide",
        isRemote: true,
        type: "freelance",
        salary: "$65k – $85k",
        description: "Support campaign coordination, audience research, paid advertising across Meta Ads and Google Ads for European retail brands.",
        tags: ["Google Ads", "Meta Ads", "A/B Testing", "ecommerce"],
        postedAt: "2026-05-18",
        applyUrl: "https://remotive.com/remote-jobs/marketing/paid-media-specialist-2090885",
        source: "remotive"
    },
    {
        id: "1919265",
        title: "Senior Independent Software Developer",
        company: "A.Team",
        location: "Americas, Europe, Israel",
        isRemote: true,
        type: "contract",
        salary: "$90–$150/hr",
        description: "Match with high-growth companies backed by a16z, YC, Softbank on impactful 0-to-1 missions in small autonomous teams.",
        tags: ["React", "Node", "Full-stack"],
        postedAt: "2026-05-16",
        applyUrl: "https://remotive.com/remote-jobs/software-development/senior-independent-software-developer-1919265",
        source: "remotive"
    },
    {
        id: "1919266",
        title: "Senior Independent AI Engineer / Architect",
        company: "A.Team",
        location: "Americas, Europe, Israel",
        isRemote: true,
        type: "contract",
        salary: "$120–$170/hr",
        description: "Lead design, deployment, and scaling of production AI systems. Work in elite peer networks from OpenAI, Google, Meta, Amazon.",
        tags: ["LLMs", "NLP", "ML Infra", "AI"],
        postedAt: "2026-05-16",
        applyUrl: "https://remotive.com/remote-jobs/software-development/senior-independent-ai-engineer-architect-1919266",
        source: "remotive"
    },
    {
        id: "v2mD49CS8tWSAdy-AAAAAA==",
        title: "Fullstack Developer (Node & React)",
        company: "Stellent IT (via Dice)",
        location: "Chicago, IL",
        isRemote: false,
        type: "full_time",
        salary: null,
        description: "Design, development, and deployment of fullstack applications. Architect scalable backend systems using Node.js and React. 8+ years experience.",
        tags: ["Node.js", "React", "PostgreSQL", "AWS"],
        postedAt: "2026-05-19",
        applyUrl: "https://www.linkedin.com/jobs/view/fullstack-developer-node-react-f2f-interview-at-jobs-via-dice-4415961036",
        source: "jsearch"
    },
    {
        id: "qIsPjUMr0Em0hqHoAAAAAA==",
        title: "Developer II",
        company: "United Airlines",
        location: "Chicago, IL",
        isRemote: false,
        type: "full_time",
        salary: "$89,965 – $117,212",
        description: "Plan, design, develop and launch efficient systems in support of core organizational functions. Work on massively scaling technology solutions.",
        tags: ["C#", "Java", "Azure", "Agile"],
        postedAt: "2026-05-20",
        applyUrl: "https://careers.united.com/us/en/job/WHQ00026290/Developer-II",
        source: "jsearch",
        benefits: ["Paid time off", "Dental insurance", "Health insurance"]
    },
    {
        id: "vZNukCt-XaCLNKjeAAAAAA==",
        title: "Frontend Developer",
        company: "TEKsystems",
        location: "Chicago, IL (Remote)",
        isRemote: true,
        type: "contract",
        salary: "$50–$70/hr",
        description: "NextJS, ReactJS, and Sitecore work on internal and customer facing systems. High-traffic public-facing websites with GraphQL integrations.",
        tags: ["Next.js", "React", "Sitecore", "TypeScript"],
        postedAt: "2026-05-18",
        applyUrl: "https://careers.teksystems.com/ca/fr/job/JP-006033368/Frontend-Developer",
        source: "jsearch"
    }
];

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
    return company.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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

// --- Nav (matches landing page) ---
const Nav = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-2" : "bg-transparent py-3.5"}`}>
            <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div
                        className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter cursor-pointer"
                        onClick={() => router.push("/")}
                    >
                        <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                            <div className="w-3 h-3 bg-black rounded-sm" />
                        </div>
                        DevPrep
                    </div>
                    <div className="hidden md:flex items-center gap-5 text-xs text-brand-muted">
                        {["Jobs", "DSA", "Calendar", "Subjects", "Blog"].map((link) => (
                            <a
                                key={link}
                                onClick={() => router.push(`/${link.toLowerCase()}`)}
                                className={`hover:text-white transition-colors cursor-pointer ${link === "Jobs" ? "text-white font-semibold" : ""}`}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={() => router.push("/auth/signin")}
                        className="px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-sm inline-flex items-center gap-2 text-brand-muted hover:text-white"
                    >
                        Sign in
                    </button>
                    <button
                        onClick={() => router.push("/auth/signup")}
                        className="px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-sm inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    >
                        Get Started Free
                    </button>
                </div>
                <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-brand-bg border-b border-brand-border p-5 flex flex-col gap-4">
                    {["Jobs", "DSA", "Calendar", "Subjects", "Blog"].map((link) => (
                        <a
                            key={link}
                            onClick={() => { router.push(`/${link.toLowerCase()}`); setMobileMenuOpen(false); }}
                            className="text-base text-brand-muted active:text-white cursor-pointer"
                        >
                            {link}
                        </a>
                    ))}
                    <div className="flex flex-col gap-3 pt-4 border-t border-brand-border">
                        <button onClick={() => { setMobileMenuOpen(false); router.push("/auth/signin"); }} className="text-brand-muted hover:text-white text-sm font-medium">Sign in</button>
                        <button onClick={() => { setMobileMenuOpen(false); router.push("/auth/signup"); }} className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold">Get Started Free</button>
                    </div>
                </div>
            )}
        </nav>
    );
};

function SourceBadge({ source }: { source: "adzuna" | "remotive" | "jsearch" }) {
    const styles: Record<string, string> = {
        adzuna: "bg-white/5 text-white/50 border-white/10",
        remotive: "bg-white/5 text-white/50 border-white/10",
        jsearch: "bg-white/5 text-white/50 border-white/10",
    };
    const labels: Record<string, string> = { adzuna: "Adzuna", remotive: "Remotive", jsearch: "JSearch" };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest font-mono ${styles[source]}`}>
            {labels[source]}
        </span>
    );
}

function FilterChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                active
                    ? "bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    : "bg-white/[0.03] border-white/10 text-brand-muted hover:border-white/30 hover:text-white"
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

export default function JobsPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredJobs = useMemo(() => {
        return JOBS.filter((j) => {
            const searchable = [j.title, j.company, j.location, j.description, ...(j.tags || [])].join(" ").toLowerCase();
            if (searchQuery && !searchable.includes(searchQuery.toLowerCase())) return false;
            if (activeFilter === "remote") return j.isRemote;
            if (activeFilter === "internship") return j.title.toLowerCase().includes("intern") || j.type === "contract";
            if (activeFilter === "fulltime") return j.type === "full_time";
            if (activeFilter === "contract") return j.type === "contract" || j.type === "freelance";
            if (activeFilter === "adzuna") return j.source === "adzuna";
            if (activeFilter === "remotive") return j.source === "remotive";
            if (activeFilter === "jsearch") return j.source === "jsearch";
            return true;
        });
    }, [activeFilter, searchQuery]);

    return (
        <div className="relative min-h-screen dot-background selection:bg-white selection:text-black">
            <Nav />

            {/* Page Hero */}
            <section className="pt-28 pb-10 px-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[200px] bg-white opacity-[0.03] blur-[100px] rounded-full -z-10 pointer-events-none" />
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-start gap-4"
                    >
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                            <span className="text-brand-muted">Live feed · Updated daily</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight leading-[1.1]">
                            Job & Internship Board
                        </h1>
                        <p className="text-sm text-brand-muted max-w-md leading-relaxed">
                            Live listings from Adzuna, Remotive, and JSearch — normalized into one clean feed for developers.
                        </p>
                    </motion.div>
                </div>
            </section>

            <main className="max-w-5xl mx-auto px-6 pb-24 space-y-6">

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="relative group"
                >
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-muted">
                        <Search size={15} className="group-focus-within:text-white transition-colors duration-200" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search role, company, skill..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-sm text-white placeholder-brand-muted outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all duration-300"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-4 flex items-center text-brand-muted hover:text-white transition-colors"
                        >
                            <X size={15} />
                        </button>
                    )}
                </motion.div>

                {/* Filter Row */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4"
                >
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {[
                            { key: "all", icon: <LayoutGrid size={12} />, label: "All" },
                            { key: "remote", icon: <Wifi size={12} />, label: "Remote" },
                            { key: "internship", icon: <GraduationCap size={12} />, label: "Internships" },
                            { key: "fulltime", icon: <Briefcase size={12} />, label: "Full-time" },
                            { key: "contract", icon: <FileText size={12} />, label: "Contract" },
                            { key: "adzuna", icon: <CircleDot size={12} />, label: "Adzuna" },
                            { key: "remotive", icon: <CircleDot size={12} />, label: "Remotive" },
                            { key: "jsearch", icon: <CircleDot size={12} />, label: "JSearch" },
                        ].map((f) => (
                            <FilterChip
                                key={f.key}
                                active={activeFilter === f.key}
                                onClick={() => setActiveFilter(f.key)}
                                icon={f.icon}
                                label={f.label}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-brand-muted font-mono">
                        <span>{filteredJobs.length} active opportunities</span>
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/60">
                            <TrendingUp size={11} /> Live Sync
                        </span>
                    </div>
                </motion.div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((j, i) => (
                                <motion.div
                                    key={j.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25, delay: i * 0.03 }}
                                    className="bg-white/[0.03] border border-white/10 hover:border-white/25 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_30px_rgba(255,255,255,0.05)] group relative overflow-hidden card-gradient"
                                >
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-semibold text-white/70 text-xs shrink-0">
                                                    {initials(j.company)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-white/80 transition-colors duration-200">
                                                        {j.title}
                                                    </h3>
                                                    <p className="text-xs text-brand-muted font-medium">{j.company}</p>
                                                </div>
                                            </div>
                                            <SourceBadge source={j.source} />
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {j.isRemote && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/60 border border-white/10">
                                                    <Wifi size={9} /> Remote
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/60 border border-white/10">
                                                {typeLabel(j.type)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-brand-muted">
                                                <MapPin size={9} /> {j.location}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-brand-muted leading-relaxed line-clamp-3">
                                            {j.description}
                                        </p>

                                        {/* Tags */}
                                        {j.tags && j.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {j.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40 border border-white/[0.07]"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-5 pt-4 border-t border-white/[0.07] flex items-center justify-between gap-4">
                                        <div className="text-[11px] font-mono">
                                            {j.salary ? (
                                                <span className="font-bold text-white/80">{j.salary}</span>
                                            ) : (
                                                <span className="text-brand-muted italic">Salary Negotiable</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-brand-muted">
                                            <span>{timeAgo(j.postedAt)}</span>
                                            <button
                                                onClick={() => window.open(j.applyUrl, "_blank")}
                                                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                                            >
                                                Apply <ExternalLink size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-brand-muted">
                                    <SlidersHorizontal size={22} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-base text-white">No roles match your query</h3>
                                    <p className="text-xs text-brand-muted max-w-sm">
                                        Try clearing your search or choosing a different filter.
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}
                                    className="text-xs font-semibold px-5 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                                >
                                    Clear All Filters
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-brand-border py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-brand-muted font-medium">© 2026 DevPrep. Built for Indian placements.</p>
                    <div className="flex gap-5 text-xs text-brand-muted font-medium">
                        <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
