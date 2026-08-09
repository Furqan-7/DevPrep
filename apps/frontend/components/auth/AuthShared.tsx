/**
 * DevPrep — Auth Shared Components
 *
 * Single source of truth for all auth-page UI primitives.
 * Both sign-in and sign-up import from here — no style duplication.
 *
 * Design system: "Tidiane DevOps Portfolio System"
 *   bg #F5F5F7 · primary #1A1A1A · accent #EB3A14
 *   Inter (sans) + JetBrains Mono · pill buttons · 12px cards · 8px inputs
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";

/* ─────────────────────────────────────────────
   Design token helpers
───────────────────────────────────────────── */
export const monoStyle = {
  fontFamily:
    "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

/* ─────────────────────────────────────────────
   Noise texture (3% opacity per design system)
───────────────────────────────────────────── */
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-multiply"
      style={{ backgroundImage: NOISE_BG }}
    />
  );
}

/* ─────────────────────────────────────────────
   Logo — text wordmark + icon
───────────────────────────────────────────── */
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm shrink-0" />
      <span
        style={monoStyle}
        className={`text-[15px] font-bold tracking-[0.02em] ${
          dark ? "text-white" : "text-[#1a1a1a]"
        }`}
      >
        DevPrep
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Eyebrow / badge
───────────────────────────────────────────── */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={monoStyle}
      className="inline-flex items-center gap-2 rounded-full bg-[#eb3a14]/[0.08] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14]"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#eb3a14]" />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Input field
───────────────────────────────────────────── */
export function InputField({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  children,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        style={monoStyle}
        className="block text-[10px] font-bold text-[#999] uppercase tracking-[0.1em]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-white border rounded-[8px] px-4 py-3 text-[14px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-[#e5e5e5] focus:border-[#eb3a14] focus:ring-[#eb3a14]/15"
          }`}
          /* min-height of 44px ensures touch tap target */
          style={{ minHeight: 44 }}
        />
        {children}
      </div>
      {error && (
        <p className="text-[12px] text-rose-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   OAuth button — pill-shaped, full-width
───────────────────────────────────────────── */
export function OAuthButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      /* min-height 44px for touch */
      className="w-full flex items-center justify-center gap-3 px-4 rounded-full border border-[#e5e5e5] bg-white text-[13px] font-medium text-[#1a1a1a]/70 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a] transition-all duration-200 cursor-pointer"
      style={{ minHeight: 44 }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   Brand icons
───────────────────────────────────────────── */
export const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const GitHubIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

/* ─────────────────────────────────────────────
   Or-divider
───────────────────────────────────────────── */
export function OrDivider() {
  return (
    <div className="relative flex items-center gap-4">
      <div className="flex-1 h-px bg-[#e5e5e5]" />
      <span
        style={monoStyle}
        className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#bbb]"
      >
        or continue with
      </span>
      <div className="flex-1 h-px bg-[#e5e5e5]" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Magnetic submit button
   — magnetic hover only on pointer:fine (mouse) devices.
   — On pointer:coarse (touch) the magnetic effect is skipped.
───────────────────────────────────────────── */
export function MagneticButton({
  children,
  className,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 18 });
  const springY = useSpring(y, { stiffness: 200, damping: 18 });

  // Detect touch device; skip magnetic effect for pointer:coarse
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.15);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.3);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={isTouch ? undefined : { x: springX, y: springY }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   Terminal panel — left side, desktop only.
   Accepts custom lines + heading so sign-in and
   sign-up can each show contextually appropriate copy.
───────────────────────────────────────────── */
export type TerminalLineData = {
  text: string;
  tone: "cmd" | "ok" | "muted";
};

function TerminalLine({
  line,
  delay,
}: {
  line: TerminalLineData;
  delay: number;
}) {
  const color =
    line.tone === "cmd"
      ? "text-white"
      : line.tone === "ok"
      ? "text-[#22c55e]"
      : "text-white/35";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
      style={monoStyle}
      className={`text-[13px] leading-relaxed ${color}`}
    >
      {line.text}
    </motion.div>
  );
}

export function TerminalPanel({
  heading,
  subheading,
  lines,
  windowTitle,
}: {
  heading: string;
  subheading: string;
  lines: TerminalLineData[];
  windowTitle: string;
}) {
  return (
    <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#1a1a1a] px-14 py-16 relative overflow-hidden antialiased">
      {/* ambient glow */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-[#eb3a14]/[0.06] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative">
        <Logo dark />
        <h2 className="mt-16 text-[36px] leading-[1.1] font-bold text-white tracking-[-0.02em] max-w-[380px]">
          {heading}
        </h2>
        <p className="mt-4 text-[15px] text-white/50 leading-relaxed max-w-[360px]">
          {subheading}
        </p>
      </div>

      {/* Terminal window */}
      <div className="relative rounded-[12px] border border-white/10 bg-[#1e1e1e] overflow-hidden">
        <div className="flex items-center gap-2 bg-[#2a2a2a] px-4 py-3 border-b border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span style={monoStyle} className="ml-2 text-[11px] text-white/30">
            {windowTitle}
          </span>
        </div>
        <div className="px-5 py-5 space-y-2">
          {lines.map((line, i) => (
            <TerminalLine key={i} line={line} delay={0.15 + i * 0.12} />
          ))}
        </div>
      </div>

      {/* Bottom status */}
      <div className="relative flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
        <span
          style={monoStyle}
          className="text-[11px] uppercase tracking-[0.1em] text-white/30"
        >
          Free for students · No credit card required
        </span>
      </div>
    </div>
  );
}
