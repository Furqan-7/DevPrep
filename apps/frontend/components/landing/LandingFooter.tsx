"use client";

/**
 * Landing page footer: logo, tagline and socials, four link columns (only links that
 * go somewhere real), then an edge-to-edge DevPrep wordmark that slides up into view
 * and catches a soft light under the cursor.
 */

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { useInView } from "motion/react";
import { serif } from "@/lib/fonts";

const DEMO_URL = "https://github.com/user-attachments/assets/e849b172-3296-481f-a1bc-5e0ba44fd50e";
const SOCIAL = {
  x: "https://x.com/B_Furqan07",
  linkedin: "https://www.linkedin.com/in/furqan-bodarni-132378327/",
  github: "https://github.com/Furqan-7",
};

type FooterLink = { label: string; href: string; kind: "section" | "page" | "external" };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features", kind: "section" },
      { label: "How it works", href: "#how-it-works", kind: "section" },
      { label: "Pricing", href: "#pricing", kind: "section" },
      { label: "FAQ", href: "#faq", kind: "section" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Sign up free", href: "/auth/signup", kind: "page" },
      { label: "Sign in", href: "/auth/signin", kind: "page" },
      { label: "Watch demo", href: DEMO_URL, kind: "external" },
    ],
  },
  { heading: "Legal", links: [{ label: "Privacy Policy", href: "/privacy", kind: "page" }] },
  {
    heading: "Follow",
    links: [
      { label: "X / Twitter", href: SOCIAL.x, kind: "external" },
      { label: "LinkedIn", href: SOCIAL.linkedin, kind: "external" },
      { label: "GitHub", href: SOCIAL.github, kind: "external" },
    ],
  },
];

const LOGO_PATH =
  "M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z";

const ICONS = {
  x: "M9.4 6.9 14.6 1h-1.2L8.9 6.1 5.3 1H1.2l5.4 7.7L1.2 15h1.2l4.7-5.4 3.8 5.4h4.1zm-1.7 1.9-.6-.8-4.4-6.1h1.9l3.5 5 .6.8 4.6 6.4h-1.9z",
  linkedin: "M3.6 5.5H1.2V15h2.4zM2.4 1.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8M15 9.8c0-2.6-1.4-4.5-3.8-4.5-1.2 0-2 .6-2.4 1.2V5.5H6.5V15h2.4v-5c0-1.3.3-2.5 1.8-2.5s1.6 1.4 1.6 2.6V15H15z",
  github: "M8 .3a7.8 7.8 0 0 0-2.5 15.2c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.6-1-2.6-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.7-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.1.8a7 7 0 0 1 3.8 0c1.5-1 2.1-.8 2.1-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3-1.8 3.7-3.6 3.9.3.3.6.8.6 1.5v2.2c0 .2.1.5.6.4A7.8 7.8 0 0 0 8 .3",
} as const;

const linkCls =
  "relative block w-max py-[5px] text-[14px] tracking-[-0.02em] text-white/60 transition-colors duration-200 hover:text-[#f0f0f0] after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[#bec8ff] after:transition-transform after:duration-300 hover:after:scale-x-100";

function FooterAnchor({ link }: { link: FooterLink }) {
  if (link.kind === "page") return <Link href={link.href} className={linkCls}>{link.label}</Link>;
  if (link.kind === "external") {
    return <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkCls}>{link.label}</a>;
  }
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(link.href.slice(1));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <a href={link.href} onClick={onClick} className={linkCls}>{link.label}</a>;
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Dev<em className={`${serif.className} text-[1.06em] font-normal tracking-[-0.01em]`} style={{ fontStyle: "italic" }}>Prep</em>
    </span>
  );
}

export function LandingFooter() {
  const ref = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  // read after mount so server and client render the same HTML
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const onWordMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || !wordRef.current) return;
    const r = wordRef.current.getBoundingClientRect();
    wordRef.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    wordRef.current.style.setProperty("--lo", "1");
  };
  const onWordLeave = () => wordRef.current?.style.setProperty("--lo", "0");

  const risen = inView || reduce;
  const slide = `inline-block ${reduce ? "" : "transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"} ${risen ? "translate-y-0" : "translate-y-[40%]"}`;

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-white/[0.07] bg-[#0a0a0a] px-5 pt-16 font-sans text-[#f0f0f0] sm:px-6 sm:pt-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="DevPrep home" className="flex w-max items-center gap-[9px] leading-none">
              <svg viewBox="415 142 738 677" aria-hidden="true" className="h-[15.6px] w-[17px] fill-[#f0f0f0]">
                <path d={LOGO_PATH} />
              </svg>
              <Wordmark className="text-[19px] font-medium tracking-[-0.05em]" />
            </Link>
            <p className="mt-3.5 max-w-[260px] text-[14px] leading-[1.55] tracking-[-0.02em] text-white/50">
              Real-time AI mock interviews with Zara. Practice out loud for the role you want.
            </p>
            <div className="mt-[18px] flex gap-2">
              {(["x", "linkedin", "github"] as const).map((k) => (
                <a
                  key={k}
                  href={SOCIAL[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={k === "x" ? "DevPrep on X" : k === "linkedin" ? "LinkedIn" : "GitHub"}
                  className="grid h-[34px] w-[34px] place-items-center rounded-[9px] text-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-[color,background-color,box-shadow] duration-200 hover:bg-[rgba(190,200,255,0.08)] hover:text-[#f0f0f0] hover:shadow-[inset_0_0_0_1px_rgba(190,200,255,0.35)]"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d={ICONS[k]} fill="currentColor" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">{col.heading}</h2>
              <ul className="m-0 list-none p-0">
                {col.links.map((l) => (
                  <li key={l.label}><FooterAnchor link={l} /></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* edge-to-edge wordmark */}
        <div
          ref={wordRef}
          aria-hidden="true"
          onPointerMove={onWordMove}
          onPointerLeave={onWordLeave}
          className="relative mt-16 select-none whitespace-nowrap text-center text-[clamp(90px,19.5vw,300px)] font-medium leading-[0.78] tracking-[-0.065em] [--lo:0] [--mx:50%]"
        >
          <Wordmark className={`${slide} bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.03)_88%)] bg-clip-text text-transparent`} />
          <span className={`absolute inset-0 opacity-[var(--lo)] ${reduce ? "" : "transition-opacity duration-300"}`}>
            <Wordmark className={`${slide} bg-[radial-gradient(260px_200px_at_var(--mx)_40%,rgba(210,215,255,0.9),rgba(190,200,255,0)_70%)] bg-clip-text text-transparent`} />
          </span>
        </div>

        <div className="relative flex flex-col items-start justify-between gap-3 border-t border-white/[0.07] pb-[22px] pt-[18px] text-[12.5px] tracking-[-0.01em] text-white/40 sm:flex-row sm:items-center">
          <span>&copy; {new Date().getFullYear()} DevPrep &middot; Built by Furqan</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
            className="cursor-pointer text-white/55 transition-colors hover:text-[#f0f0f0]"
          >
            Back to top &uarr;
          </button>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
