"use client";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import JobCard from "./JobCard";
import JobFilters, { type FilterState } from "./JobFilters";
import type { Job } from "@/types/job";

interface JobsGridProps {
  jobs: Job[];
  showFilters?: boolean;
}

function applyFilters(jobs: Job[], f: FilterState): Job[] {
  return jobs.filter((j) => {
    if (f.query) {
      const q = f.query.toLowerCase();
      if (
        !j.company.toLowerCase().includes(q) &&
        !j.title.toLowerCase().includes(q) &&
        !j.description.toLowerCase().includes(q)
      )
        return false;
    }
    if (f.category !== "all") {
      if (f.category === "remote" && j.type !== "remote") return false;
      if (f.category === "internship" && j.type !== "internship") return false;
      if (
        f.category !== "remote" &&
        f.category !== "internship" &&
        j.category !== f.category
      )
        return false;
    }
    if (j.salaryMax && j.salaryMax > f.salaryMax) return false;
    return true;
  });
}

export default function JobsGrid({ jobs, showFilters = true }: JobsGridProps) {
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    category: "all",
    salaryMax: 300,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = applyFilters(jobs, filters);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showFilters && (
        <JobFilters
          value={filters}
          onChange={setFilters}
          totalCount={jobs.length}
          filteredCount={filtered.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
            gap: 12,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          <Bookmark size={28} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14, color: "#8a8f98" }}>
            No jobs match your filters
          </p>
          <button
            onClick={() =>
              setFilters({ query: "", category: "all", salaryMax: 300 })
            }
            style={{
              marginTop: 4,
              padding: "6px 16px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#8a8f98",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              viewMode === "list" ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
