"use client";

/**
 * Landing hero: top nav, headline, CTAs and the glowing planet horizon with a
 * drifting starfield. Always dark, independent of the page's light/dark theme.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Instrument_Serif } from "next/font/google";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], display: "swap" });

const ROUTES = {
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  dashboard: "/dashboard",
  demo: "https://github.com/user-attachments/assets/e849b172-3296-481f-a1bc-5e0ba44fd50e",
};

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const ease = [0.16, 1, 0.3, 1] as const;

/* ───────── logo ───────── */
function DevPrepLogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="415 142 738 677" aria-hidden="true" className={className} fill="currentColor">
      <path d="M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z" />
    </svg>
  );
}

/* ───────── drifting starfield ───────── */
type Star = { x: number; y: number; vx: number; vy: number; r: number; a: number; tw: number; ph: number };

function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;

    const seed = () => {
      const count = Math.round(Math.min(220, Math.max(60, (w * h) / 8500)));
      stars = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.04 + Math.random() * 0.12; // px per frame
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: [0.6, 0.7, 0.8, 0.9, 1.1][Math.floor(Math.random() * 5)] ?? 0.8,
          a: [0.3, 0.45, 0.6, 0.8, 0.95][Math.floor(Math.random() * 5)] ?? 0.6,
          tw: 0.6 + Math.random() * 1.6,
          ph: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      for (const s of stars) {
        const twinkle = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
        ctx.globalAlpha = s.a * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (t: number) => {
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -2) s.x = w + 2;
        else if (s.x > w + 2) s.x = -2;
        if (s.y < -2) s.y = h + 2;
        else if (s.y > h + 2) s.y = -2;
      }
      draw(t);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!reduce && visible && !raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}

/* ───────── nav ───────── */
function HeroNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) router.push(ROUTES.dashboard);
  }, [router]);

  const link = "text-[14px] tracking-[-0.03em] text-white/[0.56] hover:text-[#f0f0f0] transition-colors cursor-pointer";

  return (
    <nav aria-label="Primary" className="absolute inset-x-0 top-0 z-20 font-sans">
      <div className="flex items-center justify-between px-5 py-4 md:px-10 md:py-[22px]">
        <button type="button" onClick={() => router.push("/")} className="flex items-center gap-[9px] leading-none text-[#f0f0f0] cursor-pointer" aria-label="DevPrep home">
          <DevPrepLogoMark className="h-[15.6px] w-[17px] shrink-0" />
          <span className="text-[19px] font-medium tracking-[-0.05em]">
            Dev<em className={`${serif.className} ml-px text-[21px] tracking-normal`} style={{ fontStyle: "italic" }}>Prep</em>
          </span>
        </button>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
          {NAV_LINKS.map((l) => (
            <button key={l.id} type="button" onClick={() => scrollToId(l.id)} className={link}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button type="button" onClick={() => router.push(ROUTES.signIn)} className={`hidden lg:block ${link}`}>
            Sign In
          </button>
          <button
            type="button"
            onClick={() => router.push(ROUTES.signUp)}
            className="rounded-lg bg-[#f0f0f0] px-3.5 py-[9px] text-[14px] font-medium tracking-[-0.04em] text-[#0a0a0a] transition-colors hover:bg-white cursor-pointer"
          >
            Get Started
          </button>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open} className="-mr-1 grid h-9 w-9 place-items-center rounded-lg text-[#f0f0f0] lg:hidden">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              {open ? (
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2.5 5h11M2.5 11h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease }}
            className="mx-5 flex flex-col gap-1 rounded-xl bg-[rgba(10,10,10,0.56)] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-[10px] lg:hidden"
          >
            {NAV_LINKS.map((l) => (
              <button key={l.id} type="button" onClick={() => { setOpen(false); scrollToId(l.id); }} className={`rounded-lg px-3 py-2.5 text-left ${link}`}>
                {l.label}
              </button>
            ))}
            <button type="button" onClick={() => router.push(ROUTES.signIn)} className={`rounded-lg px-3 py-2.5 text-left ${link}`}>
              Sign In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ───────── horizon scene (1200×800 stage, clipped and centered like the original) ───────── */
function Horizon() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-[170px] left-1/2 h-[800px] w-[1200px] -translate-x-1/2 overflow-hidden bg-[#0a0a0a] sm:-bottom-[100px]">
      {/* blue-violet glow rising from the rim */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 300px 150px at 50% 510px, rgba(190,200,255,.95), rgba(190,200,255,0) 100%), radial-gradient(ellipse 330px 400px at 50% 470px, rgba(92,100,220,.85), rgba(60,62,170,.5) 50%, rgba(40,40,120,0) 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[588px] bg-[linear-gradient(#0a0a0a_0%,rgba(0,0,0,0)_100%)] backdrop-blur-[80px]" />
      <div className="absolute inset-x-0 top-0 h-[100px] bg-[linear-gradient(#0a0a0a_0%,rgba(10,10,10,0)_100%)]" />
      {/* soft white flare above the rim */}
      <div className="absolute bottom-[265px] left-[calc(47.9167%-393.5px)] h-[111px] w-[787px] bg-[radial-gradient(50%_50%,rgba(255,255,255,0.5)_0%,rgba(10,10,10,0)_100%)] blur-[57px]" />
      {/* atmosphere + planet */}
      <div className="absolute -bottom-[662px] -left-[443px] -right-[443px] h-[955px] rounded-[100%] bg-[linear-gradient(#fff_0%,rgba(10,10,10,0)_100%)]" />
      <div className="absolute -bottom-[668px] -left-[521px] -right-[521px] aspect-[2.34682/1] rounded-[100%] bg-[#0a0a0a] shadow-[inset_0_2px_20px_#fff,0_-10px_50px_1px_rgba(255,255,255,0.49)]" />
      {/* side fades */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-full w-[600px] shrink-0 bg-[linear-gradient(90deg,#0a0a0a_0%,rgba(10,10,10,0)_100%)]" />
        <div className="h-full w-[600px] shrink-0 bg-[linear-gradient(270deg,#0a0a0a_0%,rgba(10,10,10,0)_100%)]" />
      </div>
    </div>
  );
}

/* ───────── hero ───────── */
function MicIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4" fill="currentColor" />
      <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M5.5 3.8v8.4L12.2 8z" fill="currentColor" />
    </svg>
  );
}

const HEADLINE_1 = ["Ace", "the", "interview"];
const HEADLINE_2 = ["before"];
const HEADLINE_SERIF = ["it", "begins."];

export function LandingHero() {
  const router = useRouter();
  let i = 0;
  const word = (w: string, serifWord = false) => {
    const delay = 0.1 + i++ * 0.07;
    return (
      <motion.span
        key={`${w}-${delay}`}
        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.8, delay, ease }}
        className={`inline-block ${serifWord ? `${serif.className} font-normal tracking-normal` : ""}`}
        style={serifWord ? { fontStyle: "italic" } : undefined}
      >
        {w}
      </motion.span>
    );
  };
  const fade = (delay: number) => ({
    initial: { opacity: 0, filter: "blur(8px)", y: 12 },
    animate: { opacity: 1, filter: "blur(0px)", y: 0 },
    transition: { duration: 0.8, delay, ease },
  });

  const btn = "inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg px-5 text-[14px] font-medium tracking-[-0.04em] transition-[background-color,box-shadow] duration-200 cursor-pointer";

  return (
    <section className="relative isolate flex h-[100svh] min-h-[680px] w-full flex-col items-center justify-center overflow-hidden sm:pb-24 border-b border-[#00000012] bg-[#0a0a0a] font-sans">
      <HeroNav />
      <Horizon />
      <Starfield className="pointer-events-none absolute inset-0 z-[1] h-full w-full [mask-image:linear-gradient(to_bottom,transparent_0,#000_96px,#000_60%,transparent_76%)]" />

      <div className="relative z-10 flex w-full max-w-[1200px] flex-col items-center gap-6 px-5">
        <div className="flex w-full flex-col items-center gap-4">
          <h1 className="text-center text-[42px] font-medium leading-[110%] tracking-[-0.05em] text-[#f0f0f0] sm:text-[60px]">
            {HEADLINE_1.map((w, idx) => (
              <span key={w}>{word(w)}{idx < HEADLINE_1.length - 1 ? " " : ""}</span>
            ))}
            <br />
            {HEADLINE_2.map((w) => <span key={w}>{word(w)} </span>)}
            {HEADLINE_SERIF.map((w, idx) => (
              <span key={w}>{word(w, true)}{idx < HEADLINE_SERIF.length - 1 ? " " : ""}</span>
            ))}
          </h1>
          <motion.p {...fade(0.55)} className="max-w-[302px] text-center text-[16px] leading-[150%] tracking-[-0.04em] text-white/[0.56]">
            Real-time AI voice interviews, coding challenges, and personalized feedback.
          </motion.p>
        </div>

        <motion.div {...fade(0.7)} className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => router.push(ROUTES.signUp)} className={`${btn} bg-[#f0f0f0] text-[#0a0a0a] hover:bg-white`}>
            <MicIcon />
            Start a Mock Interview
          </button>
          <a
            href={ROUTES.demo}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-[rgba(10,10,10,0.56)] text-[#f0f0f0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-[10px] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]`}
          >
            <PlayIcon />
            Watch Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default LandingHero;
