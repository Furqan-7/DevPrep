"use client";

/**
 * DevPrep landing page.
 *
 * The product is the hero: a looping demo of the interview room, then a pinned
 * scroll story of one interview turn, scroll-linked role rows, a feedback
 * preview and an honest FAQ. Motion: `motion` for scroll-linked/in-view
 * animation, Lenis for smooth scrolling (both disabled for reduced motion).
 */

import {
  motion,
  AnimatePresence,
  MotionConfig,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type Lenis from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { ArrowRight, ChevronDown, Menu, X, Sun, Moon, Mic, AudioLines } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/shared/Footer";
import DevPrepMark from "@/components/shared/DevPrepMark";
import { useTheme } from "@/hooks/useTheme";

const ROUTES = {
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  dashboard: "/dashboard",
  privacy: "/privacy",
  twitter: "https://x.com/B_Furqan07",
  linkedin: "https://www.linkedin.com/in/furqan-bodarni-132378327/",
  github: "https://github.com/Furqan-7",
};

const ease = [0.16, 1, 0.3, 1] as const;

// Set by <LenisBridge/> so anchor links go through Lenis instead of fighting it
let lenisInstance: Lenis | undefined;

function LenisBridge() {
  const lenis = useLenis();
  useEffect(() => {
    lenisInstance = lenis;
    return () => {
      lenisInstance = undefined;
    };
  }, [lenis]);
  return null;
}

function scrollToId(id: string) {
  if (lenisInstance) {
    lenisInstance.scrollTo(`#${id}`, { offset: id === "how-it-works" ? 0 : -64 });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToTop() {
  if (lenisInstance) lenisInstance.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="dp-mono inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-dp-mu">
      <span className="h-px w-6 bg-dp-ac" />
      {children}
    </span>
  );
}

/* ───────── nav ───────── */
const NAV_LINKS = [
  { label: "How it works", id: "how-it-works" },
  { label: "Roles", id: "roles" },
  { label: "Feedback", id: "feedback" },
  { label: "FAQ", id: "faq" },
];

function GlobalNav() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useMotionValueEvent(scrollYProgress, "change", () => setScrolled(window.scrollY > 12));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push(ROUTES.dashboard);
  }, [router]);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-16 flex items-center border-b transition-colors ${scrolled ? "bg-dp-bg/80 backdrop-blur-md border-dp-ln" : "bg-transparent border-transparent"}`}>
      <motion.div style={{ scaleX }} className="absolute bottom-0 inset-x-0 h-px origin-left bg-dp-ac" />
      <div className="max-w-[1180px] w-full mx-auto px-5 sm:px-8 flex items-center justify-between">
        <button onClick={scrollToTop} className="flex items-center gap-2.5 text-[17px] font-bold text-dp-ink cursor-pointer">
          <DevPrepMark size={24} />
          DevPrep
        </button>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <button key={l.id} onClick={() => scrollToId(l.id)} className="text-[14px] text-dp-mu hover:text-dp-ink transition-colors cursor-pointer">
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggle} aria-label="Toggle light and dark theme" className="w-9 h-9 rounded-full border border-dp-ln text-dp-ink grid place-items-center cursor-pointer hover:border-dp-ink transition-colors">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => router.push(ROUTES.signIn)} className="hidden sm:block text-[14px] text-dp-ink px-3 py-2 cursor-pointer hover:opacity-70">
            Sign in
          </button>
          <button onClick={() => router.push(ROUTES.signUp)} className="dp-mono hidden md:block dp-btn-ember h-10 px-5 rounded-full text-[12px] font-bold uppercase tracking-[0.06em] cursor-pointer">
            Start practicing
          </button>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden text-dp-ink p-2 -mr-2" aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="md:hidden absolute top-16 inset-x-0 bg-dp-bg border-b border-dp-ln overflow-hidden">
            <div className="px-5 py-6 flex flex-col gap-5">
              {NAV_LINKS.map((l) => (
                <button key={l.id} onClick={() => { setOpen(false); scrollToId(l.id); }} className="text-left text-[16px] text-dp-ink">
                  {l.label}
                </button>
              ))}
              <button onClick={() => router.push(ROUTES.signIn)} className="text-left text-[16px] text-dp-mu">Sign in</button>
              <button onClick={() => router.push(ROUTES.signUp)} className="dp-mono dp-btn-ember h-12 rounded-full text-[13px] font-bold uppercase tracking-[0.06em]">Start practicing</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ───────── hero: looping interview-room demo ───────── */
const DEMO = [
  { who: "zara", text: "Walk me through how the browser event loop keeps a page responsive." },
  { who: "you", text: "The call stack runs sync code, and queued tasks only run once it's empty — so long work blocks rendering." },
  { who: "zara", text: "Good, that's the core constraint. How would you split a long task so the page stays interactive?" },
] as const;

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <motion.span key={i} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.35, delay: i * 0.06 }}>
          {word}{" "}
        </motion.span>
      ))}
    </>
  );
}

function InterviewDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  // step: 0 Zara asks · 1 you speak · 2 you answered · 3 thinking · 4 Zara follows up · 5 scored
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const durations = [3400, 2200, 1800, 1100, 3600, 3200];
    const id = setTimeout(() => setStep((s) => (s + 1) % durations.length), durations[step]);
    return () => clearTimeout(id);
  }, [step, inView]);

  const zaraSpeaking = step === 0 || step === 4;
  const status = zaraSpeaking ? "Speaking to you…" : step === 3 ? "Thinking…" : step === 1 ? "Listening…" : "Your turn";

  return (
    <div ref={ref} aria-label="Demo of an interview with Zara" role="img" className="relative mx-auto w-full max-w-[860px] rounded-[28px] border border-dp-ln bg-dp-bg/70 backdrop-blur-xl shadow-[0_40px_120px_-40px_rgba(0,0,0,.55)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-dp-ln px-5 sm:px-7 h-14">
        <div className="flex items-center gap-2.5 text-[13px] text-dp-mu">
          <span className="h-2 w-2 rounded-full bg-dp-ok" />
          Front-End Developer
        </div>
        <div className="hidden sm:flex gap-5">
          {["HTML/CSS", "JavaScript", "React"].map((t, i) => (
            <div key={t} className="w-24">
              <p className="text-[11px] text-dp-mu mb-1">{t}</p>
              <div className="h-[3px] rounded-full bg-dp-ln overflow-hidden">
                <motion.div className="h-full bg-dp-ac" animate={{ width: i === 0 ? "100%" : i === 1 ? `${20 + step * 12}%` : "0%" }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          ))}
        </div>
        <span className="dp-mono text-[12px] text-dp-mu">DEMO</span>
      </div>

      <div className="grid sm:grid-cols-[0.8fr_1.2fr] min-h-[340px]">
        <div className="hidden sm:flex flex-col justify-between border-r border-dp-ln p-6">
          <div className="flex items-center gap-2 text-[13px]">
            <Mic size={15} className="text-dp-ac" /> Mic active
          </div>
          <div className="flex items-end justify-center gap-1.5 h-24" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <motion.span
                key={i}
                className="w-1.5 rounded-full bg-dp-ac"
                animate={{ height: step === 1 ? [8, 18 + ((i * 37) % 60), 8] : 6 }}
                transition={{ repeat: step === 1 ? Infinity : 0, duration: 0.7 + (i % 4) * 0.12, ease: "easeInOut" }}
              />
            ))}
          </div>
          <p className="text-[12px] text-dp-mu leading-relaxed">Pause for a second and Zara picks it up.</p>
        </div>

        <div className="p-5 sm:p-7 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <motion.span
              animate={zaraSpeaking ? { boxShadow: ["0 0 0 0 rgba(235,58,20,0)", "0 0 0 7px rgba(235,58,20,.18)", "0 0 0 0 rgba(235,58,20,0)"] } : {}}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="grid h-11 w-11 place-items-center rounded-full border border-dp-ln bg-dp-pill text-[17px] font-extrabold"
            >
              D<span className="text-dp-ac">.</span>
            </motion.span>
            <div>
              <p className="text-[14px] font-semibold">Zara</p>
              <p className={`text-[12px] ${step === 3 ? "text-dp-mu" : "text-dp-ok"}`}>{status}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-[14px] sm:text-[15px] leading-relaxed">
            <p className="max-w-[92%]">{step < 4 ? DEMO[0].text : <Words text={DEMO[2].text} />}</p>
            <AnimatePresence>
              {step >= 1 && step < 4 && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4, ease }}
                  className="self-end max-w-[88%] rounded-[18px] bg-gradient-to-b from-[#ff4f1f] to-[#eb3a14] px-4 py-3 text-white"
                >
                  {step === 1 ? (
                    <span className="inline-flex gap-1.5 py-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.15 }} />
                      ))}
                    </span>
                  ) : (
                    DEMO[1].text
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {step === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="dp-mono w-fit rounded-full border border-dp-ln bg-dp-pill px-3 py-1.5 text-[11px] uppercase tracking-[0.08em]"
                >
                  <span className="text-dp-ac font-bold">8/10</span> <span className="text-dp-mu">· clear, names the constraint</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const demoY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const a = (d: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay: d, ease } });

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 sm:pt-40 pb-24">
      <motion.div style={{ scale: glowScale }} className="dp-ember-hero" aria-hidden="true" />
      <div className="relative max-w-[1180px] mx-auto px-5 sm:px-8 text-center">
        <motion.div {...a(0)}>
          <Eyebrow>An AI interviewer you talk to</Eyebrow>
        </motion.div>
        <motion.h1 {...a(0.08)} className="mt-6 mx-auto max-w-[900px] text-[44px] sm:text-[72px] lg:text-[92px] font-bold leading-[0.95] tracking-[-0.045em]">
          Rehearse the interview <span className="dp-serif italic text-dp-ac">out loud.</span>
        </motion.h1>
        <motion.p {...a(0.16)} className="mt-7 mx-auto max-w-[520px] text-[16px] sm:text-[18px] leading-relaxed text-dp-mu">
          Zara asks real questions for your role, listens to your answer, follows up on what you actually said, and scores every response.
        </motion.p>
        <motion.div {...a(0.24)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => router.push(ROUTES.signUp)} className="dp-mono dp-btn-ember inline-flex items-center gap-2 h-13 px-7 py-4 rounded-full text-[13px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-transform active:scale-95">
            Start your first interview <ArrowRight size={15} />
          </button>
          <button onClick={() => scrollToId("how-it-works")} className="dp-mono inline-flex items-center h-13 px-7 py-4 rounded-full border border-dp-ln bg-dp-sf/60 backdrop-blur text-[13px] font-bold uppercase tracking-[0.06em] cursor-pointer hover:border-dp-ink transition-colors">
            How it works
          </button>
        </motion.div>
      </div>

      <motion.div style={{ y: demoY }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.35, ease }} className="relative mt-16 sm:mt-20 px-5 sm:px-8">
        <InterviewDemo />
      </motion.div>
      {/* Fade the glow into the page instead of hard-cutting it at the section edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-dp-bg" aria-hidden="true" />
    </section>
  );
}

/* ───────── pinned scroll story: one turn ───────── */
const STAGES = [
  { k: "01", title: "You answer out loud", body: "Your voice streams to Zara while you talk. No typing, no record button — just pause when you're done." },
  { k: "02", title: "It becomes text", body: "Your answer is transcribed in about a second and shows up in the chat, so you can see exactly what you said." },
  { k: "03", title: "Zara follows up", body: "She reacts to your answer — not a script — and asks the next question for your role, out loud." },
  { k: "04", title: "Every answer is scored", body: "Each response gets a score and a short note, rolled up into your feedback dashboard when you finish." },
];

function StageVisual({ stage }: { stage: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24, scale: 0.98 }}
        transition={{ duration: 0.45, ease }}
        className="absolute inset-0 flex flex-col justify-center gap-5 p-7 sm:p-10"
      >
        {stage === 0 && (
          <>
            <div className="flex items-center gap-2 text-[14px]"><Mic size={16} className="text-dp-ac" /> Listening…</div>
            <div className="flex items-center justify-center gap-1.5 h-32" aria-hidden="true">
              {Array.from({ length: 22 }, (_, i) => (
                <motion.span key={i} className="w-2 rounded-full bg-dp-ac" animate={{ height: [10, 20 + ((i * 53) % 90), 10] }} transition={{ repeat: Infinity, duration: 0.6 + (i % 5) * 0.1, ease: "easeInOut" }} />
              ))}
            </div>
          </>
        )}
        {stage === 1 && (
          <>
            <p className="dp-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Transcript</p>
            <div className="self-end max-w-[90%] rounded-[20px] bg-gradient-to-b from-[#ff4f1f] to-[#eb3a14] px-5 py-4 text-[16px] leading-relaxed text-white">
              <Words text="I'd memoize the expensive list with useMemo and virtualize rows so we only render what's on screen." />
            </div>
          </>
        )}
        {stage === 2 && (
          <>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-dp-ln bg-dp-pill text-[17px] font-extrabold">D<span className="text-dp-ac">.</span></span>
              <p className="text-[13px] text-dp-ok">Speaking to you…</p>
            </div>
            <p className="text-[18px] sm:text-[22px] leading-snug tracking-[-0.01em]">
              <Words text="Virtualization is the right call. What breaks if row heights aren't fixed, and how would you handle it?" />
            </p>
          </>
        )}
        {stage === 3 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-7">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--dp-ln)" strokeWidth="8" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#eb3a14" strokeWidth="8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.8 }} transition={{ duration: 1, ease }} />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[30px] font-bold">8<span className="text-[15px] text-dp-mu">/10</span></span>
            </div>
            <ul className="space-y-3 text-[15px]">
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-dp-ok shrink-0" />Named a concrete technique and why it helps</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-dp-ac shrink-0" />Mention the trade-off: memory vs. re-render cost</li>
            </ul>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function TurnStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [stage, setStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStage(Math.min(STAGES.length - 1, Math.floor(v * STAGES.length))));

  return (
    <section id="how-it-works" ref={ref} className="relative h-[340vh] scroll-mt-0">
      <div className="sticky top-0 h-[100svh] flex items-center">
        <div className="max-w-[1180px] w-full mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-16 items-center">
          <div>
            <Eyebrow>One turn, start to finish</Eyebrow>
            <h2 className="mt-5 text-[34px] sm:text-[52px] font-bold leading-[1] tracking-[-0.04em]">
              It works like a <span className="dp-serif italic">real</span> conversation.
            </h2>
            <div className="mt-8 sm:mt-10 relative pl-6">
              <div className="absolute left-0 top-1 bottom-1 w-px bg-dp-ln" />
              <motion.div style={{ scaleY: progress }} className="absolute left-0 top-1 bottom-1 w-px origin-top bg-dp-ac" />
              <ol className="space-y-4 sm:space-y-6">
                {STAGES.map((s, i) => (
                  <li key={s.k} className={`transition-opacity duration-500 ${i === stage ? "opacity-100" : "opacity-35"}`}>
                    <p className="flex items-baseline gap-3">
                      <span className="dp-mono text-[12px] text-dp-ac">{s.k}</span>
                      <span className="text-[17px] sm:text-[19px] font-semibold tracking-[-0.01em]">{s.title}</span>
                    </p>
                    <motion.p
                      initial={false}
                      animate={{ height: i === stage ? "auto" : 0, opacity: i === stage ? 1 : 0 }}
                      transition={{ duration: 0.4, ease }}
                      className="overflow-hidden pl-8 text-[14px] sm:text-[15px] leading-relaxed text-dp-mu"
                    >
                      <span className="block pt-1.5">{s.body}</span>
                    </motion.p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative h-[300px] sm:h-[380px] rounded-[28px] border border-dp-ln bg-dp-sf2 overflow-hidden">
            <div className="dp-ember-card" aria-hidden="true" />
            <StageVisual stage={stage} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── roles: scroll-linked rows ───────── */
const ROLE_ROWS = [
  ["Frontend Engineer", "Backend Engineer", "Full Stack Developer", "System Design", "Data Structures & Algorithms", "DevOps Engineer"],
  ["Machine Learning Engineer", "Data Engineer", "Android Developer", "iOS Developer", "Product Manager", "Behavioral Round"],
];

function Roles() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["4%", "-38%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-38%", "4%"]);

  return (
    <section id="roles" ref={ref} className="py-24 sm:py-36 overflow-hidden scroll-mt-16">
      <Reveal className="max-w-[1180px] mx-auto px-5 sm:px-8 mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <Eyebrow>Pick your round</Eyebrow>
          <h2 className="mt-5 text-[34px] sm:text-[52px] font-bold leading-[1] tracking-[-0.04em] max-w-[620px]">
            Questions written for <span className="dp-serif italic">the job</span> you want.
          </h2>
        </div>
        <p className="text-[15px] text-dp-mu max-w-[340px] leading-relaxed">
          Engineering, data, mobile, product and behavioral rounds — each with its own question bank and follow-ups.
        </p>
      </Reveal>
      {ROLE_ROWS.map((row, r) => (
        <motion.div key={r} style={{ x: r === 0 ? x1 : x2 }} className="flex gap-3 sm:gap-4 w-max mb-3 sm:mb-4">
          {[...row, ...row].map((role, i) => (
            <button
              key={`${role}-${i}`}
              onClick={() => router.push(ROUTES.signUp)}
              className="group flex items-center gap-3 rounded-full border border-dp-ln bg-dp-sf2 px-6 sm:px-8 h-16 sm:h-20 text-[18px] sm:text-[26px] font-semibold tracking-[-0.02em] whitespace-nowrap cursor-pointer transition-colors hover:border-dp-ac hover:text-dp-ac"
            >
              {role}
              <ArrowRight size={20} className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          ))}
        </motion.div>
      ))}
    </section>
  );
}

/* ───────── feedback preview ───────── */
const SKILLS = [
  { label: "Technical depth", value: 78 },
  { label: "Clarity", value: 86 },
  { label: "Problem solving", value: 71 },
  { label: "Trade-offs", value: 54 },
];

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setN(to); return; }
    let raf = 0;
    let t0: number | null = null;
    const step = (ts: number) => {
      t0 = t0 ?? ts;
      const p = Math.min((ts - t0) / 1200, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduce]);
  return <span ref={ref}>{n}</span>;
}

function FeedbackPreview() {
  return (
    <section id="feedback" className="py-24 sm:py-32 scroll-mt-16">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
        <Reveal>
          <Eyebrow>After the call</Eyebrow>
          <h2 className="mt-5 text-[34px] sm:text-[52px] font-bold leading-[1] tracking-[-0.04em]">
            Know exactly <span className="dp-serif italic">what to fix</span> next.
          </h2>
          <p className="mt-6 text-[16px] text-dp-mu leading-relaxed max-w-[440px]">
            Every session lands in your feedback dashboard: a score per answer, a breakdown by skill, and the gaps that keep showing up across interviews.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[28px] border border-dp-ln bg-dp-sf2 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="dp-mono text-[11px] uppercase tracking-[0.1em] text-dp-mu">Sample report · Front-End</p>
                <p className="mt-3 text-[64px] sm:text-[80px] font-bold leading-none tracking-[-0.05em]">
                  <CountUp to={74} /><span className="text-[24px] text-dp-mu tracking-normal">/100</span>
                </p>
              </div>
              <span className="dp-mono rounded-full bg-dp-soft text-dp-ac px-3 py-1.5 text-[11px] uppercase tracking-[0.08em]">+9 vs last</span>
            </div>
            <div className="mt-8 space-y-4">
              {SKILLS.map((s, i) => (
                <div key={s.label} className="grid grid-cols-[120px_1fr_32px] sm:grid-cols-[140px_1fr_36px] items-center gap-3 text-[14px]">
                  <span className="text-dp-mu">{s.label}</span>
                  <div className="h-2 rounded-full bg-dp-ln overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${s.value < 60 ? "bg-dp-ac" : "bg-dp-ink"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.value}%` }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 1, delay: 0.15 + i * 0.1, ease }}
                    />
                  </div>
                  <span className="dp-mono text-[12px] text-right">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-dp-ln bg-dp-bg p-4 flex items-start gap-3">
              <AudioLines size={18} className="text-dp-ac shrink-0 mt-0.5" />
              <p className="text-[14px] leading-relaxed">
                <span className="font-semibold">Recurring gap:</span> <span className="text-dp-mu">you describe the solution but rarely the trade-off. Practice saying what you gave up.</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
const FAQ_ITEMS = [
  { q: "Do I type or talk?", a: "You talk. Zara asks each question out loud, listens while you answer, and replies once you pause for about a second. Your words show up in the chat as you go." },
  { q: "Which roles can I practice?", a: "Engineering (frontend, backend, full stack, DevOps, mobile), DSA and system design, data and ML, product management, and a behavioral round. Each has its own question bank." },
  { q: "How long is a session?", a: "About ten questions after a short introduction — usually 15 to 30 minutes depending on the role. You can end early any time; answered questions are saved." },
  { q: "What do I get at the end?", a: "A score and a short note for every answer, plus your skill breakdown, score trend and recurring gaps in the feedback dashboard." },
  { q: "Is my data private?", a: "Your session data and transcripts are used only to personalize your practice. We never share or sell your personal information to third parties." },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-32 scroll-mt-16">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-20">
        <Reveal>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-5 text-[34px] sm:text-[52px] font-bold leading-[1] tracking-[-0.04em]">
            Before you <span className="dp-serif italic">start.</span>
          </h2>
        </Reveal>
        <div className="border-t border-dp-ln">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className="border-b border-dp-ln">
                <button onClick={() => setOpenIndex(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-6 py-6 text-left cursor-pointer group">
                  <span className="text-[17px] sm:text-[19px] font-medium tracking-[-0.01em] group-hover:text-dp-ac transition-colors">{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 text-dp-mu">
                    <ChevronDown size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                      <p className="pb-6 pr-10 text-[15px] text-dp-mu leading-relaxed">{item.a}</p>
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

/* ───────── closing CTA ───────── */
function FinalCTA() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const rise = useTransform(scrollYProgress, [0, 1], ["60%", "0%"]);

  return (
    <section ref={ref} className="px-3 sm:px-5 pb-5">
      <div className="relative max-w-[1240px] mx-auto overflow-hidden rounded-[32px] bg-dp-dk text-white text-center px-6 pt-24 sm:pt-32 pb-44 sm:pb-56">
        <motion.div style={{ y: rise }} className="dp-ember-cta" aria-hidden="true" />
        <Reveal className="relative">
          <h2 className="text-[40px] sm:text-[72px] font-bold leading-[0.95] tracking-[-0.045em] max-w-[820px] mx-auto">
            Your next interview is a conversation. <span className="dp-serif italic text-[#ff7a4d]">Rehearse it.</span>
          </h2>
          <button onClick={() => router.push(ROUTES.signUp)} className="dp-mono dp-btn-ember mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full text-[13px] font-bold uppercase tracking-[0.06em] cursor-pointer transition-transform active:scale-95">
            Talk to Zara <ArrowRight size={15} />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── footer ───────── */
function LandingFooter() {
  return (
    <Footer
      copyrightText={"© 2026 DevPrep. All rights reserved."}
      attributionText="Built by Furqan"
      linkGroups={[
        {
          heading: "Product",
          links: [
            { label: "How it works", onClick: () => scrollToId("how-it-works") },
            { label: "Roles", onClick: () => scrollToId("roles") },
            { label: "Feedback", onClick: () => scrollToId("feedback") },
            { label: "FAQ", onClick: () => scrollToId("faq") },
          ],
        },
        {
          heading: "Account",
          links: [
            { label: "Sign in", href: ROUTES.signIn },
            { label: "Create account", href: ROUTES.signUp },
            { label: "Privacy Policy", href: ROUTES.privacy },
          ],
        },
        {
          heading: "Follow",
          links: [
            { label: "Twitter / X", href: ROUTES.twitter },
            { label: "LinkedIn", href: ROUTES.linkedin },
            { label: "GitHub", href: ROUTES.github },
          ],
        },
      ]}
    />
  );
}

/* ───────── root ───────── */
export default function LandingPage() {
  const reduce = useReducedMotion();
  const page = (
    <MotionConfig reducedMotion="user">
      <div className="dp min-h-screen bg-dp-bg text-dp-ink overflow-x-clip selection:bg-[#eb3a14]/20">
        <GlobalNav />
        <main>
          <Hero />
          <TurnStory />
          <Roles />
          <FeedbackPreview />
          <FAQSection />
          <FinalCTA />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );

  if (reduce) return page;
  return (
    <ReactLenis root options={{ lerp: 0.1 }}>
      <LenisBridge />
      {page}
    </ReactLenis>
  );
}
