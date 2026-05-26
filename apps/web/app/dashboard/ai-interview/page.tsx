"use client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Mic, Brain, Clock, ChevronRight } from "lucide-react";

export default function AIInterviewPage() {
  return (
    <DashboardShell>
      <div
        style={{
          padding: "24px 28px",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -0.3,
            }}
          >
            AI Interview
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8a8f98" }}>
            Practice mock interviews with an AI that gives real-time feedback.
          </p>
        </div>

        {/* Coming Soon Card */}
        <div
          style={{
            maxWidth: 560,
            margin: "60px auto",
            textAlign: "center",
            padding: "48px 32px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Mic size={24} color="#fff" />
          </div>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -0.3,
            }}
          >
            AI Interview Practice
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
            Real-time mock interviews powered by AI — covering DSA walkthroughs,
            system design, and behavioral rounds. Launching soon.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 28,
            }}
          >
            {[
              { icon: Brain, text: "AI-powered question generation" },
              { icon: Mic,   text: "Voice & text response modes" },
              { icon: Clock, text: "Timed rounds with instant feedback" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  textAlign: "left",
                }}
              >
                <Icon size={14} color="#6366f1" />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{text}</span>
              </div>
            ))}
          </div>

          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 20px",
              cursor: "pointer",
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: 0.7,
            }}
          >
            Notify me when it launches <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
