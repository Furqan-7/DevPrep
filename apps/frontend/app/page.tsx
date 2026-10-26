"use client";

/**
 * DevPrep landing page — gradient hero, "vs" comparison, light/dark theme,
 * scroll animations. Colors come from the --dp-* tokens in devprep-theme.css
 * (Tailwind classes: bg-dp-bg, text-dp-ink, text-dp-mu, border-dp-ln, bg-dp-ac, ...).
 */

import { motion, AnimatePresence, MotionConfig, useInView, useScroll, useSpring } from "motion/react";
import { ArrowRight, Mic2, Code2, ListChecks, Zap, Check, X, ChevronDown, Menu, Search, Sun, Moon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Footer } from "@/components/shared/Footer";

/* ROUTES — VERIFY against your app (guesses are marked) */
const ROUTES = {
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  signUpPro: "/auth/signup?plan=pro",
  dashboard: "/dashboard", // GUESS
  allRoles: "/roles", // GUESS
  about: "/about", // GUESS
  blog: "/blog", // GUESS
  privacy: "/privacy", // GUESS
  terms: "/terms", // GUESS
  contact: "/contact", // GUESS
  twitter: "https://x.com/B_Furqan07",
  linkedin: "https://www.linkedin.com/in/furqan-bodarni-132378327/",
  github: "https://github.com/Furqan-7",
};

const mono = { fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)" };
const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/* ───────── helpers ───────── */
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} className={className}>
      {children}
    </motion.div>
  );
}

function Item({ children, className = "", lift = false }: { children: ReactNode; className?: string; lift?: boolean }) {
  return (
    <motion.div variants={fadeUp} whileHover={lift ? { y: -4 } : undefined} className={className}>
      {children}
    </motion.div>
  );
}

function Head({ eyebrow, title, sub, dark = false }: { eyebrow: string; title: ReactNode; sub?: string; dark?: boolean }) {
  return (
    <Reveal className="text-center max-w-[700px] mx-auto mb-12">
      <div style={mono} className="text-[11px] font-bold uppercase tracking-[0.1em] text-dp-ac mb-4">{eyebrow}</div>
      <h2 className={`text-[28px] sm:text-[38px] font-bold tracking-[-0.03em] leading-[1.1] ${dark ? "text-white" : "text-dp-ink"}`}>{title}</h2>
      {sub && <p className="text-[15px] text-dp-mu mt-3">{sub}</p>}
    </Reveal>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light"), []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("devprep-theme", next); } catch { /* ignore storage errors */ }
    setTheme(next);
  };
  return { theme, toggle };
}

/* ───────── count-up stat ───────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    if (!inView) return;
    const m = value.match(/^(\D*)([\d,.]+)(\D*)$/);
    if (!m) return;
    const prefix = m[1] ?? "";
    const numStr = (m[2] ?? "").replace(/,/g, "");
    const suffix = m[3] ?? "";
    const num = parseFloat(numStr);
    const float = numStr.includes(".");
    let t0: number | null = null;
    const step = (ts: number) => {
      t0 = t0 ?? ts;
      const p = Math.min((ts - t0) / 1200, 1);
      const cur = num * (1 - Math.pow(1 - p, 3));
      setShown(`${prefix}${float ? cur.toFixed(1) : Math.floor(cur)}${suffix}`);
      if (p < 1) requestAnimationFrame(step); else setShown(value);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <div ref={ref} className="flex-1 px-8 py-9 text-center border-b sm:border-b-0 sm:border-r border-dp-ln last:border-0">
      <div className="text-[38px] sm:text-[46px] font-extrabold text-dp-ink tracking-tight">{shown}</div>
      <div className="text-[14px] text-dp-mu mt-2 leading-snug max-w-[260px] mx-auto">{label}</div>
    </div>
  );
}

/* ───────── nav ───────── */
const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

function GlobalNav() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) router.push(ROUTES.dashboard);
  }, [router]);

  const cta = "bg-dp-ink text-dp-bg hover:opacity-85 text-[12px] font-bold tracking-[0.08em] px-5 py-2.5 rounded-full cursor-pointer transition-opacity";

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-16 flex items-center border-b ${scrolled ? "bg-dp-bg/85 backdrop-blur-md border-dp-ln" : "bg-transparent border-transparent"}`}>
      <motion.div style={{ scaleX }} className="absolute top-0 inset-x-0 h-[3px] origin-left bg-dp-ac" />
      <div className="max-w-[1040px] w-full mx-auto px-6 flex items-center justify-between">
        <button onClick={() => router.push("/")} style={mono} className="flex items-center gap-2.5 text-[14px] font-bold text-dp-ink cursor-pointer">
          <Image src="/devprep-logo.png" alt="DevPrep logo" width={24} height={24} unoptimized className="rounded-sm shrink-0" />
          DevPrep
        </button>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <button key={l.id} onClick={() => scrollToId(l.id)} style={mono} className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-dp-mu hover:text-dp-ink transition-colors cursor-pointer">
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.button whileHover={{ rotate: 20 }} whileTap={{ scale: 0.9 }} onClick={toggle} aria-label="Toggle light and dark theme" className="w-9 h-9 rounded-full border border-dp-ln bg-dp-sf text-dp-ink grid place-items-center cursor-pointer">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push(ROUTES.signUp)} style={mono} className={`hidden md:block ${cta}`}>
            START PRACTICING
          </motion.button>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden text-dp-ink p-2 -mr-2" aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="md:hidden absolute top-16 inset-x-0 bg-dp-bg border-b border-dp-ln overflow-hidden">
            <div className="px-6 py-6 flex flex-col gap-5">
              {NAV_LINKS.map((l) => (
                <button key={l.id} onClick={() => { setOpen(false); scrollToId(l.id); }} style={mono} className="text-left text-[12px] font-bold uppercase tracking-[0.08em] text-dp-ink">
                  {l.label}
                </button>
              ))}
              <button onClick={() => router.push(ROUTES.signUp)} style={mono} className={cta}>START PRACTICING</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ───────── hero + role picker ───────── */
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
  const [q, setQ] = useState("");
  const roles = ROLE_GRID.filter((r) => `${r.category} ${r.name}`.toLowerCase().includes(q.toLowerCase()));
  const a = (d: number) => ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: d, ease } });
  const btn = "inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.08em] px-6 py-3 rounded-full cursor-pointer transition-all";

  return (
    <section className="bg-dp-bg">
      <div className="dp-glow pt-[108px] sm:pt-[124px] pb-[170px] sm:pb-[190px] px-6">
        <div className="max-w-[1040px] mx-auto flex flex-col items-center text-center">
          <motion.div {...a(0)} style={mono} className="inline-flex items-center gap-2 rounded-full bg-dp-soft px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-dp-ac mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-dp-ac animate-pulse" />
            AI-Powered Mock Interviews
          </motion.div>
          <motion.h1 {...a(0.08)} className="font-extrabold text-dp-ink text-[34px] sm:text-[48px] lg:text-[62px] leading-[1.02] tracking-[-0.04em] max-w-[780px]">
            Walk into your next interview <span className="text-dp-mu">already knowing what&rsquo;s coming.</span>
          </motion.h1>
          <motion.p {...a(0.16)} className="text-dp-mu text-[15.5px] leading-relaxed max-w-[460px] mt-5">
            Pick a role or upload your resume, practice with Zara your AI interviewer, get instant feedback.
          </motion.p>
          <motion.div {...a(0.24)} className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => router.push(ROUTES.signUp)} style={mono} className={`${btn} bg-dp-ac hover:shadow-[0_10px_30px_-8px_rgba(238,58,20,.6)] text-white`}>
              START PRACTICING <ArrowRight size={14} />
            </motion.button>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => scrollToId("how-it-works")} style={mono} className={`${btn} bg-white text-[#1a1a1a]`}>
              SEE HOW IT WORKS
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="px-6 pb-4 -mt-2">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease }} className="dp-card max-w-[960px] mx-auto rounded-[18px] border border-dp-ln bg-dp-sf overflow-hidden shadow-[0_30px_80px_-34px_rgba(0,0,0,.4)]">
          <div className="flex items-center justify-between gap-4 border-b border-dp-ln px-5 py-3.5">
            <span className="text-[14px] font-medium text-dp-ink">Choose Your Interview Role</span>
            <label className="hidden sm:flex items-center gap-2 bg-dp-bg border border-dp-ln focus-within:border-dp-ac rounded-md px-3 py-1.5 text-dp-mu text-[13px] w-[180px] focus-within:w-[220px] transition-all">
              <Search size={13} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles…" aria-label="Search roles" className="bg-transparent outline-none w-full text-dp-ink placeholder:text-dp-mu" />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-dp-ln gap-px">
            {roles.map((r) => (
              <div key={r.name} className="bg-dp-sf hover:bg-dp-soft hover:pl-6 transition-all px-5 py-3.5 text-left cursor-pointer">
                <div style={mono} className={`text-[10px] font-medium uppercase tracking-[0.08em] mb-1 ${r.highlight ? "text-dp-ac" : "text-dp-mu"}`}>{r.category}</div>
                <div className="text-[13.5px] font-semibold text-dp-ink">{r.name}</div>
              </div>
            ))}
            {roles.length === 0 && <div className="col-span-full bg-dp-sf px-5 py-6 text-[13px] text-dp-mu">No roles match &ldquo;{q}&rdquo;.</div>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── trusted-by marquee (placeholder names — swap in real logos) ───────── */
const TRUSTED = ["Google", "Meta", "Amazon", "Microsoft", "Stripe", "Shopify", "Netflix", "Adobe", "Uber", "Airbnb"];

function TrustedBy() {
  return (
    <section className="bg-dp-sf py-9 px-6 mt-12 overflow-hidden">
      <div style={mono} className="text-center text-[10.5px] font-bold uppercase tracking-[0.1em] text-dp-mu mb-5">Trusted by candidates preparing for</div>
      <div className="dp-fade-x overflow-hidden">
        <motion.div className="flex items-center gap-11 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
          {[...TRUSTED, ...TRUSTED].map((n, i) => (
            <span key={`${n}-${i}`} style={mono} className="text-[13px] font-bold text-dp-ink/35 whitespace-nowrap">{n}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── problem → "vs" comparison ───────── */
const OLD_WAY = [
  "Practicing alone with no feedback loop",
  "Generic questions that don't match your target role",
  "Guessing what interviewers actually want",
  "No way to practice speaking your answers out loud",
];
const NEW_WAY = [
  ["Instant feedback", "A breakdown of every answer, right after the session."],
  ["Role-specific questions", "Curated for 24+ engineering, data, and design roles."],
  ["Know what interviewers want", "Live code execution for DSA and technical rounds."],
  ["Speak it out loud", "Zara asks questions by voice, naturally."],
];

function ProblemSolution() {
  return (
    <section className="bg-dp-bg py-20 sm:py-28 px-6">
      <div className="max-w-[1040px] mx-auto">
        <Head eyebrow="The Problem" title={<>Stop winging it. <span className="text-dp-mu">Start preparing.</span></>} />
        <Reveal className="relative grid md:grid-cols-2 rounded-[24px] overflow-hidden border border-dp-ln bg-dp-sf">
          <div className="bg-dp-dk text-white p-7 sm:p-8">
            <div style={mono} className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 mb-4">✕ The Old Way</div>
            {OLD_WAY.map((t) => (
              <motion.div whileHover={{ x: 4 }} key={t} className="flex items-start gap-3.5 py-4 min-h-[68px] border-t border-white/10 first-of-type:border-0">
                <span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center shrink-0"><X size={12} className="text-white/40" /></span>
                <p className="text-[13.5px] text-white/55 line-through decoration-white/20 mt-0.5">{t}</p>
              </motion.div>
            ))}
          </div>
          <div className="dp-vs-glow relative overflow-hidden p-7 sm:p-8">
            <div style={mono} className="text-[10px] font-bold uppercase tracking-[0.1em] text-dp-ac mb-4">✓ The DevPrep Way</div>
            {NEW_WAY.map(([t, d]) => (
              <motion.div whileHover={{ x: 4 }} key={t} className="relative z-10 flex items-start gap-3.5 py-4 min-h-[68px] border-t border-dp-ln first-of-type:border-0">
                <span className="w-6 h-6 rounded-full bg-dp-ac grid place-items-center shrink-0 text-white"><Check size={12} strokeWidth={3} /></span>
                <div><b className="block text-[14.5px] text-dp-ink">{t}</b><p className="text-[13px] text-dp-mu">{d}</p></div>
              </motion.div>
            ))}
          </div>
          <div style={mono} className="hidden md:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-dp-ac text-white place-items-center text-[11px] font-bold border-[5px] border-dp-sf">VS</div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── features ───────── */
const FEATURES = [
  { icon: <Mic2 size={18} />, title: "AI Interviewer — Zara", body: "Natural voice conversations with an AI interviewer. Not a quiz — a real dialogue that mirrors how actual interviews feel." },
  { icon: <Code2 size={18} />, title: "Live Code Execution", body: "Solve DSA and coding problems with a real compiler. Write, run, and debug your solution — just like in a real technical screen." },
  { icon: <ListChecks size={18} />, title: "Role-Specific Questions", body: "24+ roles across Engineering, Data, Design, Product, and Behavioral. Every question set is curated for what that role actually tests." },
  { icon: <Zap size={18} />, title: "Instant Feedback", body: "Get a breakdown of your answers right after the session — strengths, gaps, and what to sharpen before your real interview." },
];

function FeaturesSection() {
  return (
    <section id="features" className="bg-dp-sf py-20 sm:py-28 px-6 scroll-mt-16">
      <div className="max-w-[1040px] mx-auto">
        <Head eyebrow="Features" title="Everything you need to ace your next interview" />
        <Stagger className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <Item lift key={f.title} className="bg-dp-bg rounded-[16px] p-6 flex gap-5 hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,.35)] transition-shadow">
              <div className="w-10 h-10 rounded-[10px] bg-dp-sf border border-dp-ln grid place-items-center text-dp-ac shrink-0">{f.icon}</div>
              <div>
                <h3 className="text-[16px] font-semibold text-dp-ink mb-1.5">{f.title}</h3>
                <p className="text-[13.5px] text-dp-mu leading-relaxed">{f.body}</p>
              </div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── how it works ───────── */
const STEPS = [
  { num: "01", title: "Pick your role", body: "Choose from 24+ roles across Engineering, Data, Design, and Product — or upload your resume for questions tailored to your background." },
  { num: "02", title: "Review what to expect", body: "See the top 10 most common questions for your role before you start. Know what's coming so you can walk in with a plan." },
  { num: "03", title: "Take the interview", body: "Talk naturally to Zara. Answer by voice, solve code live, and get a full breakdown of your performance right when you finish." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-dp-bg py-20 sm:py-28 px-6 scroll-mt-16">
      <div className="max-w-[1040px] mx-auto">
        <Head eyebrow="How It Works" title="From zero to interview-ready in three steps" />
        <Stagger className="dp-card grid md:grid-cols-3 rounded-[18px] overflow-hidden border border-dp-ln bg-dp-sf">
          {STEPS.map((s) => (
            <Item key={s.num} className="p-7 md:border-r border-b md:border-b-0 border-dp-ln last:border-0 hover:bg-dp-soft transition-colors">
              <div style={mono} className="text-[22px] font-bold text-dp-ac mb-4">{s.num}</div>
              <h3 className="text-[16px] font-semibold text-dp-ink mb-1.5">{s.title}</h3>
              <p className="text-[13.5px] text-dp-mu leading-relaxed">{s.body}</p>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── who it's for ───────── */
const USE_CASES = [
  { num: "001", title: "Students & Grads", body: "Preparing for your first technical role? DevPrep helps you simulate real interview pressure before the real thing — no prior experience needed." },
  { num: "002", title: "Job Switchers", body: "Changing industries or leveling up? Practice for a new role with questions that match exactly what your target company tests." },
  { num: "003", title: "Bootcamp Grads", body: "You know how to build. Now learn how to talk about it. DevPrep bridges the gap between your skills and your ability to demonstrate them." },
];

function UseCases() {
  return (
    <section className="dp-dark-glow bg-dp-dk py-20 sm:py-28 px-6">
      <div className="max-w-[1040px] mx-auto">
        <Head dark eyebrow="Who It's For" title="Built for anyone on the job hunt" />
        <Stagger className="grid md:grid-cols-3 gap-4">
          {USE_CASES.map((u) => (
            <Item lift key={u.num} className="bg-white/5 border border-white/10 hover:border-[#eb3a14] transition-colors rounded-[16px] p-6">
              <div style={mono} className="text-[11px] tracking-[0.1em] text-white/30 mb-5">{u.num}</div>
              <h3 className="text-[16px] font-semibold text-white mb-1.5">{u.title}</h3>
              <p className="text-[13.5px] text-white/60 leading-relaxed">{u.body}</p>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── stats ───────── */
const STATS = [
  { value: "87%", label: "of users feel more confident going into interviews after 3+ sessions" },
  { value: "3.2×", label: "more gaps identified through AI feedback vs practicing alone without any feedback" },
  { value: "24+", label: "roles supported across Engineering, Data, Design, Product, and Behavioral — in one unified interview flow" },
];

function ResultsStats() {
  return (
    <section className="bg-dp-sf py-20 sm:py-28 px-6">
      <div className="max-w-[1040px] mx-auto">
        <Head eyebrow="By the Numbers" title="Practice works. Here's the proof." />
        <Reveal className="dp-card flex flex-col sm:flex-row border border-dp-ln rounded-[18px] overflow-hidden">
          {STATS.map((s) => <AnimatedStat key={s.value} {...s} />)}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── pricing ───────── */
const FREE = ["3 practice sessions per month", "Core roles (Engineering, Behavioral)", "Basic AI feedback after each session"];
const PRO = ["Unlimited practice sessions", "Resume-tailored question sets", "Detailed feedback breakdowns per answer", "All 24+ roles including Data, Design & PM"];
const TEAMS = ["Everything in Pro for all seats", "Admin dashboard and progress tracking", "Dedicated onboarding support"];

function Plan({ name, price, note, items, cta, onClick, pro = false }: { name: string; price: string; note: string; items: string[]; cta: string; onClick: () => void; pro?: boolean }) {
  return (
    <Item lift className={`relative flex flex-col rounded-[20px] p-7 border ${pro ? "bg-dp-dk text-white border-white/10 md:py-9 shadow-[0_30px_60px_-28px_rgba(235,58,20,.55)]" : "bg-dp-sf border-dp-ln"}`}>
      {pro && <div style={mono} className="absolute -top-3 left-7 bg-dp-ac text-white text-[10px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full">Most Popular</div>}
      <div className={`text-[14px] font-medium ${pro ? "text-white" : "text-dp-ink"}`}>{name}</div>
      <div className={`text-[34px] font-extrabold tracking-tight mt-1 ${pro ? "text-white" : "text-dp-ink"}`}>{price}</div>
      <div className={`text-[12.5px] mb-5 ${pro ? "text-white/50" : "text-dp-mu"}`}>{note}</div>
      <ul className="space-y-2.5 mb-7 flex-1">
        {items.map((f) => (
          <li key={f} className={`flex items-start gap-2.5 text-[13px] ${pro ? "text-white/75" : "text-dp-ink/75"}`}>
            <Check size={14} className="text-dp-ac mt-0.5 shrink-0" />{f}
          </li>
        ))}
      </ul>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} style={mono} className={`text-[12px] font-bold tracking-[0.06em] py-3 rounded-full transition-colors cursor-pointer ${pro ? "bg-dp-ac hover:bg-[#d63410] text-white" : "bg-dp-bg hover:bg-dp-ln text-dp-ink"}`}>
        {cta}
      </motion.button>
    </Item>
  );
}

function PricingSection() {
  const router = useRouter();
  return (
    <section id="pricing" className="bg-dp-bg py-20 sm:py-28 px-6 scroll-mt-16">
      <div className="max-w-[1040px] mx-auto">
        <Head eyebrow="Pricing" title="Simple, transparent pricing" sub="Start for free. Upgrade when you're ready to go deeper." />
        <Stagger className="grid md:grid-cols-3 gap-4 items-center">
          <Plan name="Free" price="$0" note="Forever free" items={FREE} cta="GET STARTED FREE" onClick={() => router.push(ROUTES.signUp)} />
          <Plan pro name="Pro" price="$19" note="per month" items={PRO} cta="START WITH PRO" onClick={() => router.push(ROUTES.signUpPro)} />
          <Plan name="Teams / Campus" price="Custom" note="Bulk seats for bootcamps & colleges" items={TEAMS} cta="CONTACT US" onClick={() => router.push(ROUTES.contact)} />
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── testimonials ───────── */
const TESTIMONIALS = [
  { quote: "I had my Google SWE interview coming up and was terrified of the system design round. Three DevPrep sessions with Zara and I walked in actually knowing what to expect. Got the offer.", name: "Priya S.", role: "SWE — Google" },
  { quote: "As a bootcamp grad, I knew how to code but couldn't talk about it well. DevPrep's feedback pointed out exactly what I was missing — now I can explain my thought process clearly.", name: "Marcus T.", role: "Frontend Dev — Shopify" },
  { quote: "I switched from marketing to PM roles. The behavioral and product sense rounds were brutal until I started using DevPrep. The questions Zara asks are exactly what I faced in real interviews.", name: "Anika R.", role: "Product Manager — Stripe" },
];

function TestimonialsSection() {
  return (
    <section id="reviews" className="bg-dp-sf py-20 sm:py-28 px-6">
      <div className="max-w-[1040px] mx-auto">
        <Head eyebrow="Testimonials" title="Don't take our word for it" />
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <Item lift key={t.name} className="bg-dp-bg rounded-[16px] p-6 flex flex-col justify-between">
              <p className="text-[13.5px] text-dp-ink/80 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="text-[13.5px] font-semibold text-dp-ink">{t.name}</div>
                <div className="text-[12.5px] text-dp-mu">{t.role}</div>
              </div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
const FAQ_ITEMS = [
  { q: "Can I choose my role, or does DevPrep assign one?", a: "You choose. Pick from 24+ roles including Frontend Engineer, Backend, DSA, ML Engineer, Product Manager, Behavioral, and more — or upload your resume for a tailored question set." },
  { q: "What does a session actually look like?", a: "You'll review the top questions for your role, then Zara asks you questions one by one by voice. You answer out loud, the session transcribes your responses, and you get detailed feedback when it's done. Technical rounds include a live code editor." },
  { q: "Does it support coding/technical rounds?", a: "Yes. DSA, System Design, and engineering roles include a live code execution environment powered by Judge0. You write and run real code as part of the interview, just like you would in a real technical screen." },
  { q: "Is my data private?", a: "Your session data, transcripts, and resume are used only to personalize your practice experience. We never share or sell your personal information to third parties." },
  { q: "What's included in the Free plan?", a: "The Free plan gives you 3 practice sessions per month with access to core Engineering and Behavioral roles, plus basic AI feedback. Upgrade to Pro for unlimited sessions, resume-tailored questions, and detailed per-answer breakdowns." },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section id="faq" className="bg-dp-bg py-20 sm:py-28 px-6 scroll-mt-16">
      <div className="max-w-[720px] mx-auto">
        <Head eyebrow="FAQ" title="Frequently asked questions" />
        <Stagger className="space-y-2.5">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Item key={item.q} className="dp-card bg-dp-sf border border-dp-ln rounded-[14px] overflow-hidden">
                <button onClick={() => setOpenIndex(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer">
                  <span className="text-[14px] font-semibold text-dp-ink">{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className={`shrink-0 w-7 h-7 rounded-full grid place-items-center transition-colors ${isOpen ? "bg-dp-ac text-white" : "bg-dp-bg text-dp-ink"}`}>
                    <ChevronDown size={14} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-[13.5px] text-dp-mu leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Item>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── closing CTA ───────── */
function FinalCTA() {
  const router = useRouter();
  return (
    <section className="bg-dp-bg px-4 sm:px-6 pb-6">
      <Reveal className="dp-glow dp-glow--cta max-w-[1100px] mx-auto rounded-[32px] bg-dp-dk text-center px-6 pt-16 sm:pt-20 pb-32 sm:pb-40">
        <div style={mono} className="text-[11px] font-bold uppercase tracking-[0.1em] text-dp-ac mb-4">Ready?</div>
        <h2 className="text-[28px] sm:text-[44px] font-extrabold text-white tracking-[-0.04em] leading-[1.05] max-w-[600px] mx-auto mb-4">Ready for your next interview?</h2>
        <p className="text-[15px] text-white/60 leading-relaxed max-w-[440px] mx-auto mb-8">
          Join thousands of candidates who stopped guessing and started practicing. Free to start, no credit card required.
        </p>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => router.push(ROUTES.signUp)} style={mono} className="inline-flex items-center gap-2 bg-dp-ac text-white text-[12px] font-bold tracking-[0.08em] px-7 py-3.5 rounded-full cursor-pointer hover:shadow-[0_10px_30px_-8px_rgba(238,58,20,.7)] transition-shadow">
          START PRACTICING — IT&rsquo;S FREE <ArrowRight size={14} />
        </motion.button>
      </Reveal>
    </section>
  );
}

/* ───────── footer ───────── */
function LandingFooter() {
  return (
    <Footer
      copyrightText={"\u00a9 2026 DevPrep. All rights reserved."}
      attributionText="Built by Furqan"
      linkGroups={[
        {
          heading: "Product", links: [
            { label: "Features", onClick: () => scrollToId("features") },
            { label: "Pricing", onClick: () => scrollToId("pricing") },
            { label: "How It Works", onClick: () => scrollToId("how-it-works") },
            { label: "All Roles", href: ROUTES.allRoles },
          ]
        },
        {
          heading: "Company", links: [
            { label: "About", href: ROUTES.about },
            { label: "Blog", href: ROUTES.blog },
            { label: "Privacy Policy", href: ROUTES.privacy },
            { label: "Terms of Service", href: ROUTES.terms },
          ]
        },
        {
          heading: "Follow", links: [
            { label: "Twitter / X", href: ROUTES.twitter },
            { label: "LinkedIn", href: ROUTES.linkedin },
            { label: "GitHub", href: ROUTES.github },
          ]
        },
      ]}
    />
  );
}

/* ───────── root ───────── */
export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="dp min-h-screen bg-dp-bg text-dp-ink overflow-x-hidden selection:bg-[#eb3a14]/20">
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
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}