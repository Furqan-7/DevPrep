"use client";

/**
 * DevPrep — How It Works (dashboard)
 *
 * In-app explainer of the AI interview session flow.
 * Reuses the three-step copy from the landing page HowItWorks section.
 *
 * Design tokens: Tidiane DevOps Portfolio System v1.0.0
 *   bg #F5F5F7 · surface #FFFFFF · primary #1A1A1A
 *   secondary #666666 · accent #EB3A14 · line #E5E5E5
 *   Inter (sans) · JetBrains Mono (labels)
 *   rounded.lg 12px · motion.curve cubic-bezier(0.25,0.8,0.25,1)
 */

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic2, Code2, Zap } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";

const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

const EASE = [0.25, 0.8, 0.25, 1] as const;

/* ─────────────────────────────────────────────
   Three-step session flow
   Copy sourced from landing page HowItWorks section.
───────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Pick your role",
    body: "Choose from 24+ roles across Engineering, Data, Design, and Product. Every question set is curated for what that role actually tests.",
  },
  {
    num: "02",
    title: "Review what to expect",
    body: "See the top questions for your role before you start. Know what's coming so you can walk in with a plan — not a guess.",
  },
  {
    num: "03",
    title: "Take the interview",
    body: "Talk naturally to Zara. Answer by voice, solve code live, and get a full breakdown of your performance right when you finish.",
  },
] as const;

/* ─────────────────────────────────────────────
   Feature highlights
───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Mic2 size={18} />,
    title: "Voice-first interviews",
    body: "Zara asks questions naturally by voice. You speak your answers — no typing, no scripted prompts. It feels like the real thing.",
  },
  {
    icon: <Code2 size={18} />,
    title: "Live code execution",
    body: "Solve DSA and coding problems with a real compiler inside the session. Write, run, and debug without leaving the interview.",
  },
  {
    icon: <Zap size={18} />,
    title: "Instant feedback",
    body: "Get a breakdown of every answer right after the session — what you nailed, what to sharpen, and how to improve before the real interview.",
  },
] as const;

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#F5F5F7",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* ── Hero ─────────────────────────────── */}
        <section
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "72px 24px 56px",
            overflow: "hidden",
          }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden
            style={{
              pointerEvents: "none",
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 500,
              height: 300,
              borderRadius: "50%",
              filter: "blur(100px)",
              background: "rgba(235,58,20,0.07)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                ...monoStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                backgroundColor: "rgba(235,58,20,0.08)",
                padding: "6px 14px",
                fontSize: "0.625rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#EB3A14",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#EB3A14",
                }}
              />
              Session Flow
            </div>

            <h1
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(26px, 5vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#1A1A1A",
                marginBottom: 16,
                maxWidth: 640,
              }}
            >
              From zero to interview-ready{" "}
              <span style={{ color: "#EB3A14" }}>in three steps</span>
            </h1>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(13px, 2vw, 15px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.65,
                color: "#666666",
                maxWidth: 440,
                marginBottom: 32,
              }}
            >
              DevPrep simulates a real interview — role-specific questions,
              voice conversation with Zara, and instant feedback when you finish.
            </p>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/dashboard/ai-interview")}
              style={{
                ...monoStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 24px",
                fontSize: "0.6875rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EB3A14";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1A1A";
              }}
            >
              Start Practicing
              <ArrowRight size={13} />
            </motion.button>
          </motion.div>
        </section>

        {/* ── Steps ────────────────────────────── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px 64px",
          }}
        >
          {/* Label */}
          <p
            style={{
              ...monoStyle,
              fontSize: "0.625rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#666666",
              marginBottom: 20,
            }}
          >
            The session flow
          </p>

          {/* Step cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 1,
              backgroundColor: "#E5E5E5",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #E5E5E5",
              marginBottom: 48,
            }}
          >
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "40px 32px",
                }}
              >
                <div
                  style={{
                    ...monoStyle,
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#EB3A14",
                    marginBottom: 16,
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "#1A1A1A",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "#666666",
                    margin: 0,
                  }}
                >
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Feature highlights */}
          <p
            style={{
              ...monoStyle,
              fontSize: "0.625rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#666666",
              marginBottom: 20,
            }}
          >
            What happens inside
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.45, ease: EASE }}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: 12,
                  padding: "28px 24px",
                  display: "flex",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#F5F5F7",
                    border: "1px solid #E5E5E5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#EB3A14",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: "#1A1A1A",
                      marginBottom: 6,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: "#666666",
                      margin: 0,
                    }}
                  >
                    {f.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
