"use client";
import { useState } from "react";
import { ExternalLink, Bookmark, BadgeCheck } from "lucide-react";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  onSave?: (id: string) => void;
}

export default function JobCard({ job, onSave }: JobCardProps) {
  const [saved, setSaved] = useState(job.isSaved);
  const [hovered, setHovered] = useState(false);

  const handleSave = () => {
    setSaved((s) => !s);
    onSave?.(job.id);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "background 0.15s, border-color 0.15s",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Company row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#374151,#1f2937)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#ffffff",
            flexShrink: 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {job.companyLetter}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
          {job.company}
        </span>
        {job.isVerified && (
          <BadgeCheck size={14} color="#3b82f6" strokeWidth={2.5} />
        )}
      </div>

      {/* Title + Salary */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 600,
          color: "#ffffff",
          lineHeight: 1.45,
        }}
      >
        {job.title}{" "}
        {job.salary && (
          <span style={{ fontWeight: 400, color: "#8a8f98" }}>
            ({job.salary})
          </span>
        )}
      </p>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "#8a8f98",
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          flex: 1,
        }}
      >
        {job.description}
      </p>

      {/* Location */}
      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
        {job.location}
      </p>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "7px 0",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ExternalLink size={12} />
          Apply
        </a>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "7px 0",
            background: saved ? "rgba(245,158,11,0.1)" : "transparent",
            border: `1px solid ${saved ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 6,
            color: saved ? "#f59e0b" : "#8a8f98",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!saved)
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            if (!saved) e.currentTarget.style.background = "transparent";
          }}
        >
          <Bookmark size={12} fill={saved ? "#f59e0b" : "none"} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
