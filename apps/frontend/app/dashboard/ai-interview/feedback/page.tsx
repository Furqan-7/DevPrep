"use client";

/**
 * DevPrep — Your Feedback (dashboard)
 *
 * Past session feedback / history view.
 * Currently an empty-state screen — sessions will populate this
 * once the session storage API is wired up.
 *
 * Design tokens: Tidiane DevOps Portfolio System v1.0.0
 *   bg #F5F5F7 · surface #FFFFFF · primary #1A1A1A
 *   secondary #666666 · accent #EB3A14 · line #E5E5E5
 *   Inter (sans) · JetBrains Mono (labels)
 *   rounded.lg 12px · motion.curve cubic-bezier(0.25,0.8,0.25,1)
 */

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";

const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

const EASE = [0.25, 0.8, 0.25, 1] as const;

export default function FeedbackPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#F5F5F7",
          WebkitFontSmoothing: "antialiased",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Page header ───────────────────────── */}
        <section
          style={{
            position: "relative",
            padding: "64px 24px 40px",
            maxWidth: 1120,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
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
              Session History
            </div>

            <h1
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(24px, 4vw, 40px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#1A1A1A",
                marginBottom: 10,
              }}
            >
              Your Feedback
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                letterSpacing: "-0.02em",
                lineHeight: 1.6,
                color: "#666666",
                maxWidth: 480,
                margin: 0,
              }}
            >
              After each session, Zara's full breakdown of your answers — strengths,
              gaps, and what to sharpen — will appear here.
            </p>
          </motion.div>
        </section>

        {/* ── Divider ──────────────────────────── */}
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            width: "100%",
            padding: "0 24px",
          }}
        >
          <div style={{ height: 1, backgroundColor: "#E5E5E5" }} />
        </div>

        {/* ── Empty state ───────────────────────── */}
        <section
          style={{
            flex: 1,
            maxWidth: 1120,
            margin: "0 auto",
            padding: "64px 24px 96px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: 420,
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EB3A14",
                marginBottom: 24,
              }}
            >
              <ClipboardList size={28} />
            </div>

            {/* Label */}
            <p
              style={{
                ...monoStyle,
                fontSize: "0.625rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#666666",
                marginBottom: 10,
              }}
            >
              No sessions yet
            </p>

            {/* Heading */}
            <h2
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#1A1A1A",
                marginBottom: 10,
              }}
            >
              Complete your first interview
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                lineHeight: 1.65,
                color: "#666666",
                marginBottom: 28,
              }}
            >
              Pick a role, talk to Zara, and your feedback will show up here
              right after you finish — every answer scored and explained.
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
                backgroundColor: "#EB3A14",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 24px",
                fontSize: "0.6875rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background-color 0.2s",
                boxShadow: "0 4px 16px rgba(235,58,20,0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d63410";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EB3A14";
              }}
            >
              Browse Roles
              <ArrowRight size={13} />
            </motion.button>
          </motion.div>
        </section>
      </div>
    </DashboardShell>
  );
}
