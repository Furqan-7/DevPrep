"use client";
import JobsGrid from "@/components/jobs/JobsGrid";
import { HARDCODED_JOBS } from "@/data/jobs";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function JobsPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000103",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e8e6e1",
      }}
    >
      {/* Simple top bar */}
      <div
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "#6b6a65",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ height: 16, width: 1, background: "rgba(255,255,255,0.1)" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e8e6e1", letterSpacing: -0.2 }}>
            Job &amp; Internship Board
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b6a65" }}>
            Live listings from Adzuna, Remotive, and JSearch
          </p>
        </div>
      </div>

      {/* Jobs grid */}
      <div style={{ padding: "24px 28px" }}>
        <JobsGrid jobs={HARDCODED_JOBS} showFilters={true} />
      </div>
    </div>
  );
}
