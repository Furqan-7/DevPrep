"use client";

/**
 * DevPrep landing page — gradient hero, "vs" comparison, light/dark theme,
 * scroll animations. Colors come from the --dp-* tokens in devprep-theme.css
 * (Tailwind classes: bg-dp-bg, text-dp-ink, text-dp-mu, border-dp-ln, bg-dp-ac, ...).
 */

import { motion, MotionConfig } from "motion/react";
import { Search } from "lucide-react";
import { useState } from "react";
import { Footer } from "@/components/shared/Footer";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { WhoItsForSection } from "@/components/landing/WhoItsForSection";
import { WhatsInsideSection } from "@/components/landing/WhatsInsideSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";

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
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/* ───────── helpers ───────── */

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