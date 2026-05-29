"use client";
import { motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  Globe,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
}) => {
  const baseStyles = "px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-sm inline-flex items-center gap-2";
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]",
    secondary: "bg-brand-border text-white hover:bg-white/20 border border-white/10",
    ghost: "text-brand-muted hover:text-white transition-colors"
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-brand-muted mb-3 tracking-tight uppercase">
    {children}
  </div>
);

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard/jobs");
    }
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav id="top-nav" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-2" : "bg-transparent py-3.5"}`}>
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div id="logo" className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm" />
            </div>
            DevPrep
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs text-brand-muted">
            {["Jobs", "DSA", "Calendar", "Subjects", "Blog"].map((link) => (
              <a key={link} onClick={() => router.push(`/${link.toLowerCase()}`)} className="hover:text-white transition-colors hover:cursor-pointer">{link}</a>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button onClick={() => { router.push("/auth/signin") }} variant="ghost" className="text-xs hover:cursor-pointer">Sign in</Button>
          <Button onClick={() => { router.push("/auth/signup") }} className="text-xs hover:cursor-pointer">Get Started Free</Button>
        </div>
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-brand-bg border-b border-brand-border p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          {["Jobs", "DSA", "Calendar", "Subjects", "Blog"].map((link) => (
            <a key={link} onClick={() => { router.push(`/${link.toLowerCase()}`); setMobileMenuOpen(false); }} className="text-base text-brand-muted active:text-white hover:cursor-pointer">{link}</a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-brand-border">
            <Button onClick={() => { setMobileMenuOpen(false); router.push("/auth/signin"); }} variant="ghost" className="justify-center">Sign in</Button>
            <Button onClick={() => { setMobileMenuOpen(false); router.push("/auth/signup"); }} className="justify-center">Get Started Free</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

const MockupCard = ({ className = "" }: { className?: string }) => (
  <div className={`relative rounded-xl border border-white/10 bg-[#0a0a0b] overflow-hidden shadow-2xl group/card ${className}`}>
    <div className="h-6 border-b border-white/5 bg-white/5 flex items-center justify-between px-3">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
      </div>
      <div className="w-24 h-2 bg-white/5 rounded-full" />
    </div>
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-1/3 bg-white/10 rounded" />
          <div className="h-2 w-1/2 bg-white/5 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 bg-white/[0.03] rounded-lg border border-white/5 p-3 space-y-2">
          <div className="h-1.5 w-1/2 bg-white/10 rounded" />
          <div className="h-1.5 w-full bg-white/5 rounded" />
          <div className="h-1.5 w-2/3 bg-white/5 rounded" />
        </div>
        <div className="h-24 bg-white/[0.03] rounded-lg border border-white/5 p-3 space-y-2">
          <div className="h-1.5 w-1/2 bg-white/10 rounded" />
          <div className="h-1.5 w-full bg-white/5 rounded" />
          <div className="h-1.5 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full bg-white/5 rounded" />
        <div className="h-2 w-full bg-white/5 rounded" />
        <div className="h-2 w-4/5 bg-white/5 rounded" />
      </div>
    </div>
    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/5 blur-[80px] -z-10 group-hover/card:bg-white/10 transition-colors duration-500" />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
  </div>
);

export default function App() {
  const router = useRouter();
  return (
    <div id="tech-prep-app" className="relative min-h-screen selection:bg-white selection:text-black dot-background">
      <Nav />

      {/* Hero */}
      <section id="hero" className="pt-24 pb-14 md:pt-32 md:pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[300px] bg-white opacity-[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-start gap-5 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium"
            >
              <span className="text-white">🎓 Free for students</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="text-brand-muted">Placement season 2026</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.1]"
            >
              Everything you need to <br className="hidden md:block" />
              <span className="text-brand-muted">land your dream tech job</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm md:text-base text-brand-muted max-w-md leading-relaxed"
            >
              DSA practice, live job listings, hiring calendars, and core CS prep — all in one platform built for Indian engineering placements.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Button onClick={() => {
                router.push("/auth/signup")
              }} className="text-sm px-6 py-2.5 hover:cursor-pointer">Start Preparing Free</Button>
              <Button variant="secondary" className="text-sm px-6 py-2.5 group hover:cursor-pointer">
                See what's inside <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1"
            >
              {["10,000+ students", "500+ companies tracked", "Updated daily"].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted uppercase tracking-widest">
                  <CheckCircle2 size={12} className="text-white/40" />
                  {badge}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent z-10 h-32 bottom-0" />
            <MockupCard className="h-[280px] md:h-[400px] w-full" />
          </motion.div>

          <div className="mt-12 text-center">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-[0.2em] mb-6">Trusted resources, all in one place</p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {["LeetCode", "GeeksforGeeks", "Codeforces", "LinkedIn", "GitHub", "Internshala"].map((p) => (
                <span key={p} className="text-sm font-bold tracking-tighter opacity-70">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-16 md:py-24 px-6 dot-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">Your prep is scattered. <br className="hidden md:block" /> Your time isn't.</h2>
            <p className="text-sm text-brand-muted max-w-md px-4">
              You're jumping between 10 tabs — LeetCode for DSA, LinkedIn for jobs, random PDFs for DBMS, and a group chat for hiring dates. DevPrep ends that.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "You miss deadlines", desc: "Hiring windows close before you even knew they opened. Stay ahead with real-time updates." },
              { title: "You can't track progress", desc: "No single place to see what you've studied and what's left. Visibility is the key to confidence." },
              { title: "Resources are everywhere", desc: "Good content exists but finding it during crunch time is chaos. We curate the best of the web." }
            ].map((p, i) => (
              <motion.div
                whileHover={{ y: -4 }}
                key={p.title}
                className="p-5 rounded-xl bg-white/[0.03] border border-white/10 card-gradient group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-brand-muted group-hover:text-white transition-colors">
                  {i === 0 ? <Calendar size={15} /> : i === 1 ? <CheckCircle2 size={15} /> : <BookOpen size={15} />}
                </div>
                <h3 className="text-base font-bold mb-1.5">{p.title}</h3>
                <p className="text-brand-muted text-xs leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-20 md:space-y-28">

          <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="flex flex-col items-start gap-4">
              <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Most used feature</div>
              <h3 className="text-xl md:text-3xl font-display font-bold tracking-tight">Master DSA, <br /> topic by topic</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Every data structure and algorithm topic — Arrays, Trees, Graphs, DP — with curated problem lists, difficulty tags, and progress tracking. Built for placement-level preparation.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                {["Curated LeetCode lists", "Complexity analysis cheatsheets", "Company-specific problems"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-brand-muted">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-white/5 rounded-full blur-[60px] opacity-20 -z-10" />
              <MockupCard className="aspect-[4/3] w-full" />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-6 bg-white/5 rounded-full blur-[60px] opacity-20 -z-10" />
              <MockupCard className="aspect-[4/3] w-full" />
            </div>
            <div className="order-1 lg:order-2 flex flex-col items-start gap-4">
              <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Updated daily</div>
              <h3 className="text-xl md:text-3xl font-display font-bold tracking-tight">Every job and internship, in one feed</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Filtered listings across Startups, FAANG, HFT firms, and mass recruiters. Filter by role, location, CTC, and work mode. Updated daily. Never miss an opening again.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                {["Verified referral links", "Direct HR emails", "Off-campus & On-campus trackers"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-brand-muted">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="flex flex-col items-start gap-4">
              <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Time-critical</div>
              <h3 className="text-xl md:text-3xl font-display font-bold tracking-tight">Know exactly when companies are hiring</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                A month-by-month calendar of recruitment windows across 500+ companies. Color-coded by company type. One click shows deadlines, rounds, and application links.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                {["Deadline reminders", "Interview experience logs", "Batch-specific alerts"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-brand-muted">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-white/5 rounded-full blur-[60px] opacity-20 -z-10" />
              <MockupCard className="aspect-[4/3] w-full" />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-6 bg-white/5 rounded-full blur-[60px] opacity-20 -z-10" />
              <MockupCard className="aspect-[4/3] w-full" />
            </div>
            <div className="order-1 lg:order-2 flex flex-col items-start gap-4">
              <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Interview essentials</div>
              <h3 className="text-xl md:text-3xl font-display font-bold tracking-tight">OS, DBMS, CN, OOPs — all structured</h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Stop hunting across random PDFs and YouTube playlists. Every core CS subject is organized by topic with clean notes, key concepts, and common interview questions.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                {["Top 50 interview Qs per subject", "Visual concept explanations", "Mock quiz modules"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-brand-muted">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-brand-border py-10 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { val: "10,000+", label: "Students Prep Smarter" },
              { val: "500+", label: "Companies Tracked" },
              { val: "3,200+", label: "DSA Problems Curated" },
              { val: "24/7", label: "Daily Updates Active" }
            ].map((s) => (
              <div key={s.label} className="text-center space-y-1">
                <div className="text-xl md:text-2xl font-display font-bold">{s.val}</div>
                <div className="text-xs text-brand-muted uppercase tracking-widest font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <SectionLabel>Get started in minutes</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">From zero to placement-ready in 3 steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { step: "01", title: "Create your free account", desc: "Sign up in 30 seconds, no credit card needed. Get instant access to the platform." },
              { step: "02", title: "Pick your focus area", desc: "DSA, jobs, subjects, or all three — your prep, your pace. We customize your dashboard." },
              { step: "03", title: "Track and improve", desc: "Mark topics done, apply to jobs, and watch your readiness grow with visual progress bars." }
            ].map((s) => (
              <div key={s.step} className="p-5 rounded-xl bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                <div className="text-3xl font-display font-black text-white/5 absolute -top-1 -left-1 group-hover:text-white/10 transition-colors">{s.step}</div>
                <h3 className="text-base font-bold mb-1.5 relative z-10">{s.title}</h3>
                <p className="text-brand-muted text-xs leading-relaxed relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button className="px-7 py-3 text-sm group">
              Start Preparing Free <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 px-6 bg-[#080809]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <SectionLabel>What students say</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">Built for the grind. <br /> Loved by placees.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Arjun S.", role: "Placed at Flipkart", text: "I used to spend 30 minutes every morning just finding what to study. DevPrep cut that to zero." },
              { name: "Sneha R.", role: "Placed at Atlassian India", text: "The hiring calendar alone saved me. I almost missed Atlassian's window. It's a game changer." },
              { name: "Rahul M.", role: "SDE Intern at Razorpay", text: "Finally a platform that feels like it was built for Indian placements, not just American FAANG grind." }
            ].map((t) => (
              <div key={t.name} className="p-5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between h-full">
                <div className="space-y-2.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} className="fill-white/80 text-white/80" />)}
                  </div>
                  <p className="text-sm italic text-white/90 leading-relaxed font-serif">"{t.text}"</p>
                </div>
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                  <div>
                    <div className="font-bold text-xs">{t.name}</div>
                    <div className="text-xs text-brand-muted uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white text-black p-8 md:p-16 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-black opacity-[0.03] translate-x-1/2 scale-150 rotate-12 pointer-events-none" />
            <div className="relative z-10 max-w-lg space-y-5">
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter leading-none">Your placement <br /> season starts now</h2>
              <p className="text-sm md:text-base font-medium opacity-70">
                Join 10,000+ students who are preparing smarter, not harder. DevPrep is all you need.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button className="bg-black text-white px-7 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl text-sm">
                  Get Started Free
                </button>
                <button className="bg-transparent text-black border-2 border-black/10 px-7 py-3 rounded-full font-bold hover:bg-black/5 transition-colors text-sm">
                  Explore features
                </button>
              </div>
              <p className="text-xs font-medium opacity-50">Free forever for students. No credit card required.</p>
            </div>

            <div className="hidden lg:block absolute bottom-0 right-0 w-[280px] h-[210px] bg-black bg-opacity-5 translate-y-1/2 translate-x-8 rotate-[-12deg] rounded-2xl border-8 border-black/5 overflow-hidden">
              <div className="p-5 space-y-2.5">
                <div className="h-4 w-1/2 bg-black/10 rounded-full" />
                <div className="h-3 w-full bg-black/5 rounded-full" />
                <div className="h-3 w-4/5 bg-black/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-8 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-black rounded-sm" />
                </div>
                DevPrep
              </div>
              <p className="text-xs text-brand-muted max-w-xs leading-relaxed">
                The all-in-one platform for Indian engineering students to conquer placements. Built with passion for the grind.
              </p>
              <div className="flex gap-3">
                <Globe size={16} className="text-brand-muted hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-white/40">Product</h4>
              <ul className="space-y-2.5 text-xs text-brand-muted font-medium">
                {["Jobs", "DSA", "Calendar", "Subjects", "Roadmap"].map(l => <li key={l} className="hover:text-white transition-colors cursor-pointer">{l}</li>)}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-white/40">Resources</h4>
              <ul className="space-y-2.5 text-xs text-brand-muted font-medium">
                {["Blog", "Notes", "Quiz", "Cold DM templates"].map(l => <li key={l} className="hover:text-white transition-colors cursor-pointer">{l}</li>)}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-white/40">Company</h4>
              <ul className="space-y-2.5 text-xs text-brand-muted font-medium">
                {["About", "Contact", "Careers"].map(l => <li key={l} className="hover:text-white transition-colors cursor-pointer">{l}</li>)}
              </ul>
            </div>
          </div>

          <div className="pt-5 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-brand-muted font-medium">© 2026 DevPrep. Built for Indian placements.</p>
            <div className="flex gap-5 text-xs text-brand-muted font-medium">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}