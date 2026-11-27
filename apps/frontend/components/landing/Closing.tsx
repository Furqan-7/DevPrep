"use client";

/** Final call to action and the site footer. */

import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DEMO_URL, Reveal, SOCIAL } from "./primitives";

export function FinalCTA() {
  return (
    <section className="relative bg-[#050506] px-4 pb-24 sm:px-6">
      <Reveal className="mx-auto max-w-[1120px]">
        <div className="fx-grain fx-border relative isolate overflow-hidden rounded-[28px] bg-[#08080b] px-6 pb-36 pt-20 text-center sm:pb-48 sm:pt-28">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="fx-grid absolute inset-0 opacity-60" />
            <div className="absolute -bottom-[340px] left-1/2 h-[560px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(196,166,255,0.55),rgba(77,124,255,0.35)_35%,rgba(255,110,180,0.12)_55%,transparent_70%)] blur-[20px]" />
            <div className="absolute -bottom-[480px] left-1/2 h-[600px] w-[1500px] -translate-x-1/2 rounded-[100%] bg-[#050506] shadow-[0_-2px_40px_rgba(220,210,255,0.55),inset_0_2px_12px_rgba(255,255,255,0.7)]" />
          </div>
          <h2 className="fx-text-fade m-0 mx-auto max-w-[760px] text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[64px]">Your next interview starts with a practice one</h2>
          <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-[1.6] text-white/55">Ten questions, out loud, with feedback on every answer. Free while we&rsquo;re in early access.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-[14.5px] font-semibold tracking-[-0.02em] text-black shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)] transition-transform active:scale-[0.98]"
            >
              <Mic className="size-4" />
              Start a free interview
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-[14.5px] font-medium text-white backdrop-blur transition-colors hover:bg-white/[0.08]"
            >
              Watch the demo
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Create account", href: "/auth/signup" },
      { label: "Sign in", href: "/auth/signin" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "More",
    links: [
      { label: "Watch the demo", href: DEMO_URL, external: true },
      { label: "GitHub", href: SOCIAL.github, external: true },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] px-4 pt-16 sm:px-6">
      <div className="mx-auto grid max-w-[1120px] gap-12 md:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo />
          <p className="m-0 mt-4 max-w-[280px] text-[14px] leading-[1.6] text-white/45">AI mock interviews that talk back. Practise out loud, then fix what the report finds.</p>
          <div className="mt-6 flex gap-2">
            {(
              [
                ["X", SOCIAL.x],
                ["LinkedIn", SOCIAL.linkedin],
                ["GitHub", SOCIAL.github],
              ] as const
            ).map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12.5px] text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="text-[12.5px] font-medium text-white/40">{col.heading}</div>
              <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[14px] text-white/70 transition-colors hover:text-white">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[14px] text-white/70 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-14 flex max-w-[1120px] flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] py-6 text-[12.5px] text-white/35">
        <span>© {new Date().getFullYear()} DevPrep. Built by Bodarni Furqan.</span>
        <span>Made for the interview after this one.</span>
      </div>

      <div aria-hidden className="pointer-events-none mx-auto max-w-[1200px] select-none overflow-hidden">
        <div
          className="translate-y-[22%] text-center text-[clamp(96px,22vw,300px)] font-semibold leading-[0.8] tracking-[-0.07em] text-transparent"
          style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0))", WebkitBackgroundClip: "text", backgroundClip: "text" }}
        >
          DevPrep
        </div>
      </div>
    </footer>
  );
}
