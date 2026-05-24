"use client";
import { useState } from "react";
import { Search, X, LayoutGrid, LayoutList, RefreshCw } from "lucide-react";

export type FilterState = {
  query: string;
  category: "all" | "startup" | "faang" | "company" | "hft" | "remote" | "internship";
  salaryMax: number;
};

interface JobFiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const PILLS = [
  { key: "all", label: "All Jobs", count: null },
  { key: "startup", label: "Startup", count: 172 },
  { key: "company", label: "Company", count: 116 },
  { key: "faang", label: "FAANG", count: 145 },
  { key: "hft", label: "HFT", count: 159 },
  { key: "remote", label: "Remote", count: 142 },
  { key: "internship", label: "Internships", count: 88 },
] as const;

export default function JobFilters({
  value,
  onChange,
  filteredCount,
  viewMode,
  onViewModeChange,
}: JobFiltersProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const [showCategories, setShowCategories] = useState(true);
  const [refreshSpin, setRefreshSpin] = useState(false);

  const handleRefresh = () => {
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 700);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Search bar row + right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search bar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search by company or job title..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          {value.query && (
            <button
              onClick={() => set({ query: "" })}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right controls group */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Show categories checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
              color: "#8a8f98",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={showCategories}
              onChange={(e) => setShowCategories(e.target.checked)}
              style={{
                accentColor: "#6366f1",
                cursor: "pointer",
                width: 13,
                height: 13,
              }}
            />
            Show categories
          </label>

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 16,
              background: "rgba(255,255,255,0.1)",
              flexShrink: 0,
            }}
          />

          {/* Refresh hiring button */}
          <button
            onClick={handleRefresh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#8a8f98",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLButtonElement).style.color = "#8a8f98";
            }}
          >
            <RefreshCw
              size={12}
              style={{
                transition: "transform 0.65s ease",
                transform: refreshSpin ? "rotate(360deg)" : "rotate(0deg)",
              }}
            />
            Refresh hiring
            {/* Orange live dot */}
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#f97316",
                flexShrink: 0,
                boxShadow: "0 0 4px rgba(249,115,22,0.7)",
              }}
            />
          </button>

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 16,
              background: "rgba(255,255,255,0.1)",
              flexShrink: 0,
            }}
          />

          {/* Grid / List toggle */}
          <div style={{ display: "flex", gap: 0 }}>
            <button
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "6px 0 0 6px",
                borderTop: `1px solid ${viewMode === "grid" ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderLeft: `1px solid ${viewMode === "grid" ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderBottom: `1px solid ${viewMode === "grid" ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRight: "none",
                background:
                  viewMode === "grid"
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(255,255,255,0.03)",
                color: viewMode === "grid" ? "#6366f1" : "#8a8f98",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              title="List view"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "0 6px 6px 0",
                border: `1px solid ${
                  viewMode === "list"
                    ? "rgba(99,102,241,0.5)"
                    : "rgba(255,255,255,0.1)"
                }`,
                background:
                  viewMode === "list"
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(255,255,255,0.03)",
                color: viewMode === "list" ? "#6366f1" : "#8a8f98",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <LayoutList size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Salary slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#8a8f98", whiteSpace: "nowrap" }}>
          Salary:{" "}
          <span style={{ color: "#ffffff", fontWeight: 600 }}>
            0 – {value.salaryMax} LPA
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={300}
          value={value.salaryMax}
          onChange={(e) => set({ salaryMax: Number(e.target.value) })}
          style={{ flex: 1, accentColor: "#6366f1" }}
        />
      </div>

      {/* Filter pills + count — hidden when showCategories is off */}
      {showCategories && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PILLS.map((p) => {
              const active = value.category === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() =>
                    set({ category: p.key as FilterState["category"] })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 11px",
                    borderRadius: 20,
                    border: `1px solid ${
                      active ? "#ffffff" : "rgba(255,255,255,0.1)"
                    }`,
                    background: active
                      ? "#ffffff"
                      : "rgba(255,255,255,0.03)",
                    color: active ? "#000103" : "#8a8f98",
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                  {p.count && (
                    <span
                      style={{
                        fontSize: 10,
                        background: active
                          ? "rgba(0,0,0,0.1)"
                          : "rgba(255,255,255,0.08)",
                        color: active ? "#141416" : "#6b6a65",
                        padding: "1px 5px",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      {p.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <span
            style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}
          >
            {filteredCount} results
          </span>
        </div>
      )}
    </div>
  );
}
