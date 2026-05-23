"use client";
import { useState } from "react";
import {
  Search, ChevronRight, ChevronDown, MoreHorizontal,
  RefreshCw, LayoutGrid, List, Bookmark, ExternalLink,
  BadgeCheck, PanelLeftClose, X
} from "lucide-react";

// ─── Data ───────────────────────────────────────────────────────────────────

const NAV_HIRING = [
  { label: "All Jobs", count: null },
  { label: "Startup Jobs", count: 172 },
  { label: "Company Jobs", count: 116 },
  { label: "FAANG Jobs", count: 145 },
  { label: "HFT Jobs", count: 159 },
  { label: "Remote Jobs", count: 142 },
  { label: "Internships Hiring", count: 88 },
  { label: "Hiring Calendar", count: null },
];

const JOBS = [
  {
    company: "Microsoft", verified: true,
    title: "Software Engineer – Frontend (Microsoft 365)",
    salary: "140 LPA",
    desc: "Join the Microsoft 365 team to build world-class productivity experiences used by millions of enterprise customers daily.",
    location: "Hyderabad / Redmond, WA",
    tag: "FAANG",
  },
  {
    company: "Google", verified: true,
    title: "Senior SWE – Infrastructure",
    salary: "180 LPA",
    desc: "Design and build large-scale distributed infrastructure powering Search, YouTube, and Cloud products globally.",
    location: "Bengaluru / Mountain View, CA",
    tag: "FAANG",
  },
  {
    company: "Zerodha", verified: true,
    title: "Backend Engineer – Trading Systems",
    salary: "60 LPA",
    desc: "Work on ultra-low-latency trading systems handling millions of orders per second on India's largest stock broker platform.",
    location: "Bengaluru, India",
    tag: "Startup",
  },
  {
    company: "Razorpay", verified: true,
    title: "Full Stack Engineer – Payments",
    salary: "55 LPA",
    desc: "Build payment APIs and dashboards used by over 8 million businesses across India and Southeast Asia.",
    location: "Bengaluru, India",
    tag: "Startup",
  },
  {
    company: "Jane Street", verified: true,
    title: "Quantitative Trader – Intern",
    salary: "120 LPA",
    desc: "Apply statistical and mathematical models to trade financial instruments across global markets with a world-class quant team.",
    location: "New York, NY / Remote",
    tag: "HFT",
  },
  {
    company: "Stripe", verified: true,
    title: "Software Engineer – Payments Core",
    salary: "160 LPA",
    desc: "Build the financial infrastructure that powers the internet, processing hundreds of billions of dollars annually.",
    location: "Remote / San Francisco, CA",
    tag: "Remote",
  },
  {
    company: "CRED", verified: false,
    title: "Android Engineer – Consumer App",
    salary: "45 LPA",
    desc: "Shape the Android experience for CRED's 11M+ premium members who manage their credit cards on the platform.",
    location: "Bengaluru, India",
    tag: "Startup",
  },
  {
    company: "Amazon", verified: true,
    title: "SDE II – AWS Lambda",
    salary: "145 LPA",
    desc: "Build serverless computing primitives for AWS Lambda, the backbone of event-driven cloud applications worldwide.",
    location: "Seattle, WA / Hyderabad",
    tag: "FAANG",
  },
];

const FILTERS = [
  { label: "All Jobs", count: null },
  { label: "Startup", count: 172 },
  { label: "Company", count: 116 },
  { label: "FAANG", count: 145 },
  { label: "HFT", count: 159 },
  { label: "Remote", count: 142 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function JobCard({ job, saved, onSave }: { job: typeof JOBS[0]; saved: boolean; onSave: () => void }) {
  return (
    <div style={{
      background: "#1c1c1f",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
    >
      {/* Company */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#e8e6e1", letterSpacing: 0.5,
        }}>
          {job.company[0]}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e6e1" }}>{job.company}</span>
        {job.verified && <BadgeCheck size={14} color="#3b82f6" />}
      </div>

      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e6e1", lineHeight: 1.4, margin: 0 }}>
        {job.title}{" "}
        <span style={{ color: "#6b6a65", fontWeight: 400 }}>({job.salary})</span>
      </p>

      {/* Desc */}
      <p style={{
        fontSize: 12, color: "#6b6a65", lineHeight: 1.5, margin: 0,
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {job.desc}
      </p>

      {/* Location */}
      <p style={{ fontSize: 11, color: "#4b4a46", margin: 0 }}>{job.location}</p>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "7px 0",
          background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6, color: "#e8e6e1", fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <ExternalLink size={12} /> Apply
        </button>
        <button onClick={onSave} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "7px 0",
          background: saved ? "rgba(245,158,11,0.12)" : "transparent",
          border: `1px solid ${saved ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 6, color: saved ? "#f59e0b" : "#6b6a65", fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => !saved && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={e => !saved && (e.currentTarget.style.background = "transparent")}
        >
          <Bookmark size={12} fill={saved ? "#f59e0b" : "none"} /> {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hiringOpen, setHiringOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Jobs");
  const [activeTab, setActiveTab] = useState<"all" | "bookmarks">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [gridView, setGridView] = useState(true);
  const [salaryRange, setSalaryRange] = useState([25, 220]);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [showCats, setShowCats] = useState(false);

  const toggleSave = (i: number) =>
    setSavedJobs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const filteredJobs = JOBS.filter(j => {
    const matchFilter = activeFilter === "All Jobs" || j.tag === activeFilter;
    const matchSearch = !searchQuery ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === "all" || savedJobs.includes(JOBS.indexOf(j));
    return matchFilter && matchSearch && matchTab;
  });

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#141416", fontFamily: "Inter, system-ui, sans-serif",
      color: "#e8e6e1",
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease, min-width 0.25s ease",
        background: "#141416",
      }}>
        <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff",
            }}>S</div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.3 }}>DevPrep</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{
            background: "none", border: "none", color: "#4b4a46", cursor: "pointer", padding: 4,
          }}>
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "0 10px 12px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.05)", borderRadius: 7,
            padding: "6px 10px", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <Search size={13} color="#4b4a46" />
            <input placeholder="Search..." style={{
              background: "none", border: "none", outline: "none",
              color: "#e8e6e1", fontSize: 12, width: "100%",
            }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "0 6px" }}>
          {/* Hiring section */}
          <button onClick={() => setHiringOpen(o => !o)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "none", border: "none", color: "#4b4a46",
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            padding: "6px 8px", cursor: "pointer",
          }}>
            Hiring {hiringOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {hiringOpen && NAV_HIRING.map(item => (
            <button key={item.label} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "none", border: "none", color: "#9b9a95",
              fontSize: 12, padding: "5px 8px", cursor: "pointer", borderRadius: 5, textAlign: "left",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {item.label}
              {item.count && <span style={{
                fontSize: 10, background: "rgba(255,255,255,0.08)",
                padding: "1px 5px", borderRadius: 4, color: "#6b6a65",
              }}>{item.count}</span>}
            </button>
          ))}

          {/* Library */}
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "#4b4a46",
              letterSpacing: 1, textTransform: "uppercase", padding: "6px 8px", margin: 0,
            }}>Library</p>
            <button style={{
              width: "100%", display: "flex", alignItems: "center",
              background: "none", border: "none", color: "#9b9a95",
              fontSize: 12, padding: "5px 8px", cursor: "pointer", borderRadius: 5, textAlign: "left",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              Company Question Sets
            </button>
          </div>
        </nav>

        {/* User chip */}
        <div style={{
          padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", borderRadius: 8,
            padding: "8px 10px", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>F</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#e8e6e1" }}>Furqan</p>
              <p style={{ margin: 0, fontSize: 10, color: "#6b6a65" }}>Free plan</p>
            </div>
            <button style={{ background: "none", border: "none", color: "#4b4a46", cursor: "pointer", padding: 0 }}>
              <MoreHorizontal size={14} />
            </button>
          </div>
          {/* Mode switcher */}
          <div style={{
            display: "flex", marginTop: 8, borderRadius: 7, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {["Platform Mode", "Candidate Mode"].map(m => (
              <button key={m} style={{
                flex: 1, fontSize: 10, padding: "5px 0",
                background: m === "Platform Mode" ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none", color: m === "Platform Mode" ? "#e8e6e1" : "#4b4a46",
                cursor: "pointer", fontWeight: 500,
              }}>{m}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "16px 24px 0", display: "flex", alignItems: "flex-start",
          gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16,
        }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "none", color: "#4b4a46", cursor: "pointer", padding: "2px 0", marginTop: 4,
            }}>
              <PanelLeftClose size={16} style={{ transform: "scaleX(-1)" }} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e8e6e1", letterSpacing: -0.3 }}>
              Live Job Openings
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b6a65" }}>
              Track startups and companies that are hiring immediately.
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {(["all", "bookmarks"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 500, borderRadius: 6,
                border: "1px solid transparent", cursor: "pointer",
                background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
                color: activeTab === tab ? "#e8e6e1" : "#6b6a65",
                borderColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
              }}>
                {tab === "all" ? "All Jobs" : "Bookmarks"}
                {tab === "bookmarks" && savedJobs.length > 0 && (
                  <span style={{
                    marginLeft: 6, fontSize: 10, background: "#f59e0b",
                    color: "#000", borderRadius: 10, padding: "1px 5px", fontWeight: 700,
                  }}>{savedJobs.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search + controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "8px 12px",
            }}>
              <Search size={14} color="#4b4a46" />
              <input
                placeholder="Search by company or job..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: "none", border: "none", outline: "none",
                  color: "#e8e6e1", fontSize: 13, flex: 1,
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#4b4a46", cursor: "pointer", padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6a65", cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={showCats} onChange={e => setShowCats(e.target.checked)}
                style={{ accentColor: "#6366f1" }} />
              Show categories
            </label>

            <button style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7, color: "#e8e6e1", fontSize: 12, fontWeight: 500, cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
              <RefreshCw size={13} /> Refresh hiring
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", marginLeft: 2 }} />
            </button>

            <div style={{ display: "flex", gap: 2 }}>
              {[true, false].map(isGrid => (
                <button key={String(isGrid)} onClick={() => setGridView(isGrid)} style={{
                  padding: "7px 9px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: gridView === isGrid ? "rgba(255,255,255,0.1)" : "transparent",
                  color: gridView === isGrid ? "#e8e6e1" : "#4b4a46",
                }}>
                  {isGrid ? <LayoutGrid size={15} /> : <List size={15} />}
                </button>
              ))}
            </div>
          </div>

          {/* Salary slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#6b6a65", whiteSpace: "nowrap" }}>
              Salary: <span style={{ color: "#e8e6e1", fontWeight: 600 }}>{salaryRange[0]} – {salaryRange[1]} LPA</span>
            </span>
            <input type="range" min={0} max={300} value={salaryRange[1]}
              onChange={e => setSalaryRange([salaryRange[0], Number(e.target.value)])}
              style={{ flex: 1, accentColor: "#6366f1" }}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {FILTERS.map(f => {
              const active = activeFilter === f.label;
              return (
                <button key={f.label} onClick={() => setActiveFilter(f.label)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                  background: active ? "#e8e6e1" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? "#e8e6e1" : "rgba(255,255,255,0.1)"}`,
                  color: active ? "#141416" : "#9b9a95",
                  fontSize: 12, fontWeight: active ? 700 : 500, transition: "all 0.15s",
                }}>
                  {f.label}
                  {f.count && (
                    <span style={{
                      fontSize: 10, background: active ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)",
                      color: active ? "#141416" : "#6b6a65",
                      padding: "1px 5px", borderRadius: 8, fontWeight: 600,
                    }}>{f.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Job grid */}
          {filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4b4a46" }}>
              <Bookmark size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No jobs found</p>
            </div>
          ) : (
            <div style={{
              display: gridView ? "grid" : "flex",
              gridTemplateColumns: gridView ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
              flexDirection: gridView ? undefined : "column",
              gap: 12,
            }}>
              {filteredJobs.map((job, i) => (
                <JobCard
                  key={i}
                  job={job}
                  saved={savedJobs.includes(JOBS.indexOf(job))}
                  onSave={() => toggleSave(JOBS.indexOf(job))}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
