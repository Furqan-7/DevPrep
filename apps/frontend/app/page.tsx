"use client";

/**
 * DevPrep Landing Page
 * Rebuilt to match the new Framer design (devprep-framer-website.zip).
 *
 * NOTES FOR INTEGRATION (see full write-up in chat):
 * - This file assumes Inter is already your default sans font (font-sans).
 * - JetBrains Mono is used for nav links, buttons, eyebrow labels, the logo,
 *   and a few mono accents (numbers, footer badge). Add it via next/font in
 *   your root layout for a pixel-exact match:
 *     import { JetBrains_Mono } from "next/font/google";
 *     const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });
 *   and apply `${jetbrainsMono.variable}` to <html> or <body>, then this file's
 *   `font-mono-devprep` class (defined via inline style fallback below) will
 *   pick up "var(--font-jbmono)". Until then it falls back to system monospace.
 * - Every CTA route is a best-guess placeholder — see the "ROUTES — VERIFY"
 *   block just below the imports. Update these to your real paths.
 * - Uses motion/react (Framer Motion), consistent with your existing codebase.
 */

import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  ArrowRight,
  Mic2,
  Code2,
  ListChecks,
  Zap,
  Check,
  X,
  ChevronDown,
  Menu,
  X as CloseIcon,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ─────────────────────────────────────────────
   ROUTES — VERIFY THESE AGAINST YOUR APP
   I don't have your project's routing, so these are reasonable guesses
   based on your old landing page's pattern (/auth/signin, /auth/signup).
───────────────────────────────────────────── */
const ROUTES = {
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  signUpPro: "/auth/signup?plan=pro",
  dashboard: "/dashboard", // where a logged-in user lands — GUESS, old code used /dashboard/jobs
  allRoles: "/roles", // GUESS — footer "All Roles" link
  about: "/about", // GUESS
  blog: "/blog", // GUESS
  privacy: "/privacy", // GUESS
  terms: "/terms", // GUESS
  contact: "/contact", // GUESS — Teams/Campus "Contact Us"
  twitter: "#", // PLACEHOLDER — needs real handle
  linkedin: "#", // PLACEHOLDER — needs real handle
  github: "#", // PLACEHOLDER — needs real handle
};

const monoStyle = { fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)" };

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─────────────────────────────────────────────
   Animated Count-Up Stat (reused pattern from existing codebase)
───────────────────────────────────────────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    if (!isInView) return;
    const match = value.match(/^([\D]*)([\d,.]+)([\D]*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }
    const prefix = match[1] || "";
    const numStr = match[2].replace(/,/g, "");
    const suffix = match[3] || "";
    const isFloat = numStr.includes(".");
    const targetNum = parseFloat(numStr);
    let startTime: number | null = null;
    const duration = 1100;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * eased;
      if (isFloat) {
        setDisplayValue(`${prefix}${current.toFixed(1)}${suffix}`);
      } else {
        setDisplayValue(`${prefix}${Math.floor(current).toLocaleString("en-US")}${suffix}`);
      }
      if (progress < 1) requestAnimationFrame(step);
      else setDisplayValue(value);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return (
    <div ref={ref} className="flex-1 px-8 py-10 text-center border-r border-[#e5e5e5] last:border-r-0">
      <div className="text-[40px] sm:text-[48px] font-extrabold text-[#1a1a1a] tracking-tight">
        {displayValue}
      </div>
      <div className="text-[15px] text-[#666] mt-2 leading-snug max-w-[260px] mx-auto">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Eyebrow label (mono, uppercase, tracked)
───────────────────────────────────────────── */
function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      style={monoStyle}
      className={`inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14] ${className}`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Nav
───────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

function GlobalNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) router.push(ROUTES.dashboard);
  }, [router]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-colors duration-300 ${scrolled ? "bg-[#f5f5f7]/90 backdrop-blur-md border-b border-[#e5e5e5]" : "bg-[#f5f5f7] border-b border-transparent"
        }`}
    >
      <div className="max-w-[1200px] w-full mx-auto px-6 sm:px-10 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          style={monoStyle}
          className="flex items-center gap-2.5 text-[15px] font-bold tracking-[0.02em] text-[#1a1a1a] cursor-pointer"
        >
          <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm shrink-0" />
          <span>DevPrep</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollToId(l.id)}
              style={monoStyle}
              className="text-[13px] font-bold tracking-[0.08em] text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors cursor-pointer"
            >
              {l.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(ROUTES.signUp)}
            style={monoStyle}
            className="bg-[#1a1a1a] hover:bg-black text-white text-[13px] font-bold tracking-[0.08em] px-5 py-2.5 rounded-full cursor-pointer transition-colors"
          >
            START PRACTICING
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className="md:hidden text-[#1a1a1a] p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {drawerOpen ? <CloseIcon size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute top-16 left-0 right-0 bg-[#f5f5f7] border-b border-[#e5e5e5] overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setDrawerOpen(false);
                    scrollToId(l.id);
                  }}
                  style={monoStyle}
                  className="text-left text-[13px] font-bold tracking-[0.08em] text-[#1a1a1a]/80"
                >
                  {l.label.toUpperCase()}
                </button>
              ))}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push(ROUTES.signUp)}
                style={monoStyle}
                className="bg-[#1a1a1a] text-white text-[13px] font-bold tracking-[0.08em] px-5 py-3 rounded-full mt-1"
              >
                START PRACTICING
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Hero
───────────────────────────────────────────── */
const ROLE_GRID = [
  { category: "Engineering", name: "Frontend Engineer", highlight: true },
  { category: "Engineering", name: "Backend Engineer" },
  { category: "Engineering", name: "Full Stack Developer" },
  { category: "Engineering", name: "System Design" },
  { category: "Data", name: "ML Engineer" },
  { category: "Data", name: "Data Engineer" },
  { category: "Product", name: "Product Manager" },
  { category: "Behavioral", name: "Behavioral Round" },
];

function HeroSection() {
  const router = useRouter();

  return (
    <section className="bg-[#f5f5f7] pt-[110px] sm:pt-[130px] pb-16 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div
            style={monoStyle}
            className="inline-flex items-center gap-2 rounded-full bg-[#eb3a14]/[0.08] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14] mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3a14]" />
            AI-Powered Mock Interviews
          </div>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.08 }}
          className="font-extrabold text-[#1a1a1a] text-[36px] sm:text-[52px] lg:text-[72px] leading-[1.05] lg:leading-[1] tracking-[-0.03em] max-w-[900px]"
        >
          Walk into your next interview{" "}
          <span className="font-bold text-[#666]">already knowing what&rsquo;s coming.</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.16 }}
          className="text-[#666] text-[16px] sm:text-[18px] leading-relaxed max-w-[560px] mt-6"
        >
          Pick a role or upload your resume, practice with Zara your AI interviewer, get instant feedback.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.24 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-9"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(ROUTES.signUp)}
            style={monoStyle}
            className="inline-flex items-center gap-2 bg-[#eb3a14] hover:bg-[#d63410] text-white text-[13px] font-bold tracking-[0.08em] px-7 py-3.5 rounded-full cursor-pointer transition-colors"
          >
            START PRACTICING
            <ArrowRight size={15} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => scrollToId("how-it-works")}
            style={monoStyle}
            className="bg-white hover:bg-white/70 text-[#1a1a1a] text-[13px] font-bold tracking-[0.08em] px-7 py-3.5 rounded-full cursor-pointer transition-colors"
          >
            SEE HOW IT WORKS
          </motion.button>
        </motion.div>

        {/* Role grid mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1000px] mt-14 rounded-[12px] border border-[#e5e5e5] bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between gap-4 bg-[#fafafa] border-b border-[#e5e5e5] px-4 sm:px-6 py-4">
            <span className="text-[14px] sm:text-[15px] font-semibold text-[#1a1a1a] text-left">
              Choose Your Interview Role
            </span>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-[#e5e5e5] rounded-md px-3 py-1.5 text-[#999] text-[13px] w-[180px]">
              <Search size={13} />
              <span>Search roles…</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#e5e5e5] gap-px">
            {ROLE_GRID.map((r) => (
              <div key={r.name} className="bg-white px-4 sm:px-5 py-4 text-left">
                <div
                  style={monoStyle}
                  className={`text-[10px] font-medium uppercase tracking-[0.08em] mb-1 ${r.highlight ? "text-[#eb3a14]" : "text-[#999]"
                    }`}
                >
                  {r.category}
                </div>
                <div className="text-[13px] sm:text-[14px] font-semibold text-[#1a1a1a]">{r.name}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Trusted By marquee
   NOTE: the source Framer design used stylized brand glyphs in this row.
   I couldn't confirm which real companies/logos without risking trademarked
   assets, so this uses a plain text placeholder — swap in real logos.
───────────────────────────────────────────── */
const TRUSTED_BY_PLACEHOLDER = [
  "Google", "Meta", "Amazon", "Microsoft", "Stripe", "Shopify", "Netflix", "Adobe", "Uber", "Airbnb",
];

function TrustedBy() {
  return (
    <section className="bg-white py-10 px-6 overflow-hidden">
      <div className="max-w-[1200px] mx-auto text-center">
        <div
          style={monoStyle}
          className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#999] mb-6"
        >
          Trusted by candidates preparing for
        </div>
        <div className="relative overflow-hidden">
          <motion.div
            className="flex items-center gap-12 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            {[...TRUSTED_BY_PLACEHOLDER, ...TRUSTED_BY_PLACEHOLDER].map((name, i) => (
              <span
                key={`${name}-${i}`}
                style={monoStyle}
                className="text-[15px] font-semibold text-[#1a1a1a]/30 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Problem / Solution
───────────────────────────────────────────── */
const OLD_WAY = [
  "Practicing alone with no feedback loop",
  "Generic questions that don't match your target role",
  "Guessing what interviewers actually want",
  "No way to practice speaking your answers out loud",
];

const DEVPREP_WAY = [
  "AI interviewer Zara asks questions by voice, naturally",
  "Live code execution for DSA and technical rounds",
  "Instant feedback on every answer right after the session",
  "Role-specific questions curated for 24+ engineering, data, and design roles",
];

function ProblemSolution() {
  return (
    <section className="bg-[#f5f5f7] py-20 sm:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">The Problem</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Stop winging it. Start preparing.
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <motion.div variants={itemVariants} className="bg-[#1a1a1a] rounded-[12px] p-8 sm:p-10">
            <div style={monoStyle} className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/40 mb-6">
              The Old Way
            </div>
            <ul className="space-y-3">
              {OLD_WAY.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-lg px-4 py-3.5 bg-white/5">
                  <X size={16} className="text-white/30 mt-0.5 flex-shrink-0" />
                  <span className="text-[15px] text-white/60 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[12px] p-8 sm:p-10">
            <div style={monoStyle} className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14] mb-6">
              The DevPrep Way
            </div>
            <ul className="space-y-3">
              {DEVPREP_WAY.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-lg px-4 py-3.5 bg-[#eb3a14]/[0.06]">
                  <div className="w-5 h-5 rounded-full bg-[#eb3a14]/10 flex items-center justify-center text-[#eb3a14] mt-0.5 flex-shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-[15px] text-[#1a1a1a]/80 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Features
───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Mic2 size={20} />,
    title: "AI Interviewer — Zara",
    body: "Natural voice conversations with an AI interviewer. Not a quiz — a real dialogue that mirrors how actual interviews feel.",
  },
  {
    icon: <Code2 size={20} />,
    title: "Live Code Execution",
    body: "Solve DSA and coding problems with a real compiler. Write, run, and debug your solution — just like in a real technical screen.",
  },
  {
    icon: <ListChecks size={20} />,
    title: "Role-Specific Questions",
    body: "24+ roles across Engineering, Data, Design, Product, and Behavioral. Every question set is curated for what that role actually tests.",
  },
  {
    icon: <Zap size={20} />,
    title: "Instant Feedback",
    body: "Get a breakdown of your answers right after the session — strengths, gaps, and what to sharpen before your real interview.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 sm:py-32 px-6 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">Features</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Everything you need to ace your next interview
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="bg-[#f5f5f7] rounded-[12px] p-8 flex flex-col sm:flex-row gap-6"
            >
              <div className="w-11 h-11 rounded-[10px] bg-white border border-[#e5e5e5] flex items-center justify-center text-[#eb3a14] flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   How It Works
───────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Pick your role",
    body: "Choose from 24+ roles across Engineering, Data, Design, and Product — or upload your resume for questions tailored to your background.",
  },
  {
    num: "02",
    title: "Review what to expect",
    body: "See the top 10 most common questions for your role before you start. Know what's coming so you can walk in with a plan.",
  },
  {
    num: "03",
    title: "Take the interview",
    body: "Talk naturally to Zara. Answer by voice, solve code live, and get a full breakdown of your performance right when you finish.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#f5f5f7] py-20 sm:py-32 px-6 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">How It Works</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            From zero to interview-ready in three steps
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-col md:flex-row gap-px bg-[#e5e5e5] rounded-[12px] overflow-hidden border border-[#e5e5e5]"
        >
          {STEPS.map((s) => (
            <motion.div key={s.num} variants={itemVariants} className="flex-1 bg-white p-8 sm:p-10">
              <div style={monoStyle} className="text-[22px] font-bold text-[#eb3a14] mb-4">
                {s.num}
              </div>
              <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-2">{s.title}</h3>
              <p className="text-[14px] text-[#666] leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Use Cases (dark section)
───────────────────────────────────────────── */
const USE_CASES = [
  {
    num: "001",
    title: "Students & Grads",
    body: "Preparing for your first technical role? DevPrep helps you simulate real interview pressure before the real thing — no prior experience needed.",
  },
  {
    num: "002",
    title: "Job Switchers",
    body: "Changing industries or leveling up? Practice for a new role with questions that match exactly what your target company tests.",
  },
  {
    num: "003",
    title: "Bootcamp Grads",
    body: "You know how to build. Now learn how to talk about it. DevPrep bridges the gap between your skills and your ability to demonstrate them.",
  },
];

function UseCases() {
  return (
    <section className="bg-[#1a1a1a] py-20 sm:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">Who It&rsquo;s For</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-white tracking-[-0.02em] leading-tight">
            Built for anyone on the job hunt
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {USE_CASES.map((u) => (
            <motion.div key={u.num} variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[12px] p-8">
              <div style={monoStyle} className="text-[11px] font-medium tracking-[0.1em] text-white/30 mb-4">
                {u.num}
              </div>
              <h3 className="text-[18px] font-semibold text-white mb-2">{u.title}</h3>
              <p className="text-[14px] text-white/60 leading-relaxed">{u.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Results / Stats
───────────────────────────────────────────── */
const STATS = [
  { value: "87%", label: "of users feel more confident going into interviews after 3+ sessions" },
  { value: "3.2×", label: "more gaps identified through AI feedback vs practicing alone without any feedback" },
  { value: "24+", label: "roles supported across Engineering, Data, Design, Product, and Behavioral — in one unified interview flow" },
];

function ResultsStats() {
  return (
    <section className="bg-white py-20 sm:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">By the Numbers</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Practice works. Here&rsquo;s the proof.
          </h2>
        </motion.div>

        <div className="flex flex-col sm:flex-row border border-[#e5e5e5] rounded-[12px] divide-y sm:divide-y-0 divide-[#e5e5e5]">
          {STATS.map((s) => (
            <AnimatedStat key={s.value} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Pricing
───────────────────────────────────────────── */
function PricingSection() {
  const router = useRouter();

  return (
    <section id="pricing" className="bg-[#f5f5f7] py-20 sm:py-32 px-6 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">Pricing</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-[16px] text-[#666]">Start for free. Upgrade when you&rsquo;re ready to go deeper.</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-col md:flex-row gap-4 items-stretch md:items-end"
        >
          {/* Free */}
          <motion.div variants={itemVariants} className="flex-1 bg-white rounded-[12px] p-8 flex flex-col">
            <div className="text-[15px] font-semibold text-[#1a1a1a] mb-1">Free</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[36px] font-extrabold text-[#1a1a1a]">$0</span>
            </div>
            <div className="text-[13px] text-[#999] mb-6">Forever free</div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "3 practice sessions per month",
                "Core roles (Engineering, Behavioral)",
                "Basic AI feedback after each session",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#1a1a1a]/75">
                  <Check size={15} className="text-[#eb3a14] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(ROUTES.signUp)}
              style={monoStyle}
              className="bg-[#f5f5f7] hover:bg-[#e5e5e5] text-[#1a1a1a] text-[13px] font-bold tracking-[0.06em] py-3 rounded-full transition-colors"
            >
              GET STARTED FREE
            </motion.button>
          </motion.div>

          {/* Pro */}
          <motion.div variants={itemVariants} className="flex-1 bg-[#1a1a1a] rounded-[12px] p-8 flex flex-col relative md:scale-[1.03] shadow-lg">
            <div
              style={monoStyle}
              className="absolute -top-3 left-8 bg-[#eb3a14] text-white text-[10px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full"
            >
              Most Popular
            </div>
            <div className="text-[15px] font-semibold text-white mb-1">Pro</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[36px] font-extrabold text-white">$19</span>
            </div>
            <div className="text-[13px] text-white/50 mb-6">per month</div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Unlimited practice sessions",
                "Resume-tailored question sets",
                "Detailed feedback breakdowns per answer",
                "All 24+ roles including Data, Design & PM",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/75">
                  <Check size={15} className="text-[#eb3a14] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(ROUTES.signUpPro)}
              style={monoStyle}
              className="bg-[#eb3a14] hover:bg-[#d63410] text-white text-[13px] font-bold tracking-[0.06em] py-3 rounded-full transition-colors"
            >
              START WITH PRO
            </motion.button>
          </motion.div>

          {/* Teams */}
          <motion.div variants={itemVariants} className="flex-1 bg-white rounded-[12px] p-8 flex flex-col">
            <div className="text-[15px] font-semibold text-[#1a1a1a] mb-1">Teams / Campus</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[36px] font-extrabold text-[#1a1a1a]">Custom</span>
            </div>
            <div className="text-[13px] text-[#999] mb-6">Bulk seats for bootcamps & colleges</div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Everything in Pro for all seats",
                "Admin dashboard and progress tracking",
                "Dedicated onboarding support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#1a1a1a]/75">
                  <Check size={15} className="text-[#eb3a14] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(ROUTES.contact)}
              style={monoStyle}
              className="bg-[#f5f5f7] hover:bg-[#e5e5e5] text-[#1a1a1a] text-[13px] font-bold tracking-[0.06em] py-3 rounded-full transition-colors"
            >
              CONTACT US
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Testimonials
───────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote:
      "I had my Google SWE interview coming up and was terrified of the system design round. Three DevPrep sessions with Zara and I walked in actually knowing what to expect. Got the offer.",
    name: "Priya S.",
    role: "SWE — Google",
  },
  {
    quote:
      "As a bootcamp grad, I knew how to code but couldn't talk about it well. DevPrep's feedback pointed out exactly what I was missing — now I can explain my thought process clearly.",
    name: "Marcus T.",
    role: "Frontend Dev — Shopify",
  },
  {
    quote:
      "I switched from marketing to PM roles. The behavioral and product sense rounds were brutal until I started using DevPrep. The questions Zara asks are exactly what I faced in real interviews.",
    name: "Anika R.",
    role: "Product Manager — Stripe",
  },
];

function TestimonialsSection() {
  return (
    <section id="reviews" className="bg-white py-20 sm:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-[700px] mx-auto mb-14"
        >
          <Eyebrow className="justify-center mb-4">Testimonials</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Don&rsquo;t take our word for it
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={itemVariants} className="bg-[#f5f5f7] rounded-[12px] p-8 flex flex-col justify-between">
              <p className="text-[14px] text-[#1a1a1a]/80 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="text-[14px] font-semibold text-[#1a1a1a]">{t.name}</div>
                <div className="text-[13px] text-[#999]">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FAQ
───────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "Can I choose my role, or does DevPrep assign one?",
    a: "You choose. Pick from 24+ roles including Frontend Engineer, Backend, DSA, ML Engineer, Product Manager, Behavioral, and more — or upload your resume for a tailored question set.",
  },
  {
    q: "What does a session actually look like?",
    a: "You'll review the top questions for your role, then Zara asks you questions one by one by voice. You answer out loud, the session transcribes your responses, and you get detailed feedback when it's done. Technical rounds include a live code editor.",
  },
  {
    q: "Does it support coding/technical rounds?",
    a: "Yes. DSA, System Design, and engineering roles include a live code execution environment powered by Judge0. You write and run real code as part of the interview, just like you would in a real technical screen.",
  },
  {
    q: "Is my data private?",
    a: "Your session data, transcripts, and resume are used only to personalize your practice experience. We never share or sell your personal information to third parties.",
  },
  {
    q: "What's included in the Free plan?",
    a: "The Free plan gives you 3 practice sessions per month with access to core Engineering and Behavioral roles, plus basic AI feedback. Upgrade to Pro for unlimited sessions, resume-tailored questions, and detailed per-answer breakdowns.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-[#f5f5f7] py-20 sm:py-32 px-6 scroll-mt-16">
      <div className="max-w-[760px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <Eyebrow className="justify-center mb-4">FAQ</Eyebrow>
          <h2 className="text-[28px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className="bg-white border border-[#e5e5e5] rounded-[12px] overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#1a1a1a]"
                  >
                    <ChevronDown size={15} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-[14px] text-[#666] leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Final CTA
───────────────────────────────────────────── */
function FinalCTA() {
  const router = useRouter();
  return (
    <section className="bg-[#1a1a1a] py-20 sm:py-32 px-6 text-center">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="max-w-[700px] mx-auto"
      >
        <Eyebrow className="justify-center mb-4">Ready?</Eyebrow>
        <h2 className="text-[32px] sm:text-[48px] font-bold text-white tracking-[-0.02em] leading-tight mb-5">
          Ready for your next interview?
        </h2>
        <p className="text-[16px] text-white/60 leading-relaxed max-w-[480px] mx-auto mb-9">
          Join thousands of candidates who stopped guessing and started practicing. Free to start, no credit card
          required.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push(ROUTES.signUp)}
          style={monoStyle}
          className="inline-flex items-center gap-2 bg-[#eb3a14] hover:bg-[#d63410] text-white text-[13px] font-bold tracking-[0.08em] px-8 py-4 rounded-full cursor-pointer transition-colors"
        >
          START PRACTICING — IT&rsquo;S FREE
          <ArrowRight size={15} />
        </motion.button>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-white pt-16 sm:pt-20 pb-10 px-6 border-t border-[#e5e5e5]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row gap-12 pb-12">
          <div className="md:max-w-[300px]">
            <div style={monoStyle} className="flex items-center gap-2.5 text-[15px] font-bold text-[#1a1a1a] mb-4">
              <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm shrink-0" />
              <span>DevPrep</span>
            </div>
            <p className="text-[14px] text-[#666] leading-relaxed mb-5">
              AI-powered mock interviews for the roles that matter. Practice with Zara, get real feedback, walk in
              confident.
            </p>
            <div
              style={monoStyle}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white text-[12px] font-medium px-4 py-2.5 rounded-md"
            >
              <span className="text-[#eb3a14]">➜</span>
              devprep --start
            </div>
          </div>

          <div className="flex flex-1 flex-col sm:flex-row gap-10 sm:gap-16">
            <div>
              <div style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4">
                Product
              </div>
              <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                <li><button onClick={() => scrollToId("features")} className="hover:text-[#eb3a14] transition-colors cursor-pointer">Features</button></li>
                <li><button onClick={() => scrollToId("pricing")} className="hover:text-[#eb3a14] transition-colors cursor-pointer">Pricing</button></li>
                <li><button onClick={() => scrollToId("how-it-works")} className="hover:text-[#eb3a14] transition-colors cursor-pointer">How It Works</button></li>
                <li><a href={ROUTES.allRoles} className="hover:text-[#eb3a14] transition-colors">All Roles</a></li>
              </ul>
            </div>
            <div>
              <div style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4">
                Company
              </div>
              <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                <li><a href={ROUTES.about} className="hover:text-[#eb3a14] transition-colors">About</a></li>
                <li><a href={ROUTES.blog} className="hover:text-[#eb3a14] transition-colors">Blog</a></li>
                <li><a href={ROUTES.privacy} className="hover:text-[#eb3a14] transition-colors">Privacy Policy</a></li>
                <li><a href={ROUTES.terms} className="hover:text-[#eb3a14] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <div style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4">
                Follow
              </div>
              <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                <li><a href={ROUTES.twitter} className="hover:text-[#eb3a14] transition-colors">Twitter / X</a></li>
                <li><a href={ROUTES.linkedin} className="hover:text-[#eb3a14] transition-colors">LinkedIn</a></li>
                <li><a href={ROUTES.github} className="hover:text-[#eb3a14] transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#999]">
          <span>© 2026 DevPrep. All rights reserved.</span>
          <span style={monoStyle}>Built with Groq Whisper · Judge0 · Gemini</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */
export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  return (
    <div className={`min-h-screen bg-[#f5f5f7] text-[#1a1a1a] overflow-x-hidden selection:bg-[#eb3a14]/20 ${reduceMotion ? "motion-reduce" : ""}`}>
      <GlobalNav />
      <HeroSection />
      <TrustedBy />
      <ProblemSolution />
      <FeaturesSection />
      <HowItWorks />
      <UseCases />
      <ResultsStats />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}