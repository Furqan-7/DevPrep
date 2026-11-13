"use client";

/**
 * DevPrep landing page — gradient hero, "vs" comparison, light/dark theme,
 * scroll animations. Colors come from the --dp-* tokens in devprep-theme.css
 * (Tailwind classes: bg-dp-bg, text-dp-ink, text-dp-mu, border-dp-ln, bg-dp-ac, ...).
 */

import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ArrowRight, Check, ChevronDown, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/shared/Footer";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { WhoItsForSection } from "@/components/landing/WhoItsForSection";
import { WhatsInsideSection } from "@/components/landing/WhatsInsideSection";

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

/* ───────── role picker ───────── */
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

function RolePicker() {
  const [q, setQ] = useState("");
  const roles = ROLE_GRID.filter((r) => `${r.category} ${r.name}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="relative bg-[#0a0a0a] [clip-path:inset(-200px_0_0_0)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[45%] h-[420px] w-[min(1100px,100vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(92,100,220,0.18),rgba(60,62,170,0.08)_45%,rgba(10,10,10,0)_75%)]" />
      </div>
      <div className="relative z-10 px-6 pb-16 sm:pb-20 -mt-[96px] sm:-mt-[120px]">
        <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease }} className="max-w-[960px] mx-auto rounded-[18px] border border-white/10 bg-[#0d0d0f] overflow-hidden shadow-[0_30px_80px_-34px_rgba(0,0,0,.8)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5">
            <span className="text-[14px] font-medium text-[#f0f0f0]">Choose Your Interview Role</span>
            <label className="hidden sm:flex items-center gap-2 bg-[rgba(10,10,10,0.56)] border border-white/10 focus-within:border-white/30 rounded-md px-3 py-1.5 text-white/45 text-[13px] w-[180px] focus-within:w-[220px] transition-all">
              <Search size={13} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles…" aria-label="Search roles" className="bg-transparent outline-none w-full text-white placeholder:text-white/45" />
            </label>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 bg-white/10 gap-px">
            {roles.map((r) => (
              <motion.div key={r.name} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }} className="bg-[#0d0d0f] hover:bg-[#16161a] hover:pl-6 transition-all px-5 py-3.5 text-left cursor-pointer">
                <div style={mono} className={`text-[10px] font-medium uppercase tracking-[0.08em] mb-1 ${r.highlight ? "text-[#bec8ff]" : "text-white/45"}`}>{r.category}</div>
                <div className="text-[13.5px] font-semibold text-[#f0f0f0]">{r.name}</div>
              </motion.div>
            ))}
            {roles.length === 0 && <div className="col-span-full bg-[#0d0d0f] px-5 py-6 text-[13px] text-white/56">No roles match &ldquo;{q}&rdquo;.</div>}
          </motion.div>
        </motion.div>
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
      <div className="dp min-h-screen bg-dp-bg text-dp-ink overflow-x-clip selection:bg-[#eb3a14]/20">
        <LandingHero />
        <RolePicker />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhoItsForSection />
        <WhatsInsideSection />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}