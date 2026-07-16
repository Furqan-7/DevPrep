"use client";
import { useState } from "react";
import {
  Search, ChevronDown, ChevronRight, MoreHorizontal, PanelLeftClose,
} from "lucide-react";

type NavItem = { label: string; count?: number };

const HIRING_ITEMS: NavItem[] = [
  { label: "All Jobs" },
  { label: "Startup Jobs", count: 172 },
  { label: "Company Jobs", count: 116 },
  { label: "FAANG Jobs", count: 145 },
  { label: "HFT Jobs", count: 159 },
  { label: "Remote Jobs", count: 142 },
  { label: "Internships Hiring", count: 88 },
  { label: "Hiring Calendar" },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onCollapse: () => void;
  username?: string;
}

export default function Sidebar({
  activeNav, onNavChange, onCollapse, username = "Furqan",
}: SidebarProps) {
  const [hiringOpen, setHiringOpen] = useState(true);
  const [platformMode, setPlatformMode] = useState<"platform" | "candidate">("platform");

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000103",
        borderRight: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff",
          }}>
            D
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: 0.3 }}>
            DevPrep
          </span>
        </div>
        <button onClick={onCollapse} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "0 10px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, padding: "6px 10px",
        }}>
          <Search size={12} color="rgba(255,255,255,0.3)" />
          <input
            placeholder="Search..."
            style={{ background: "none", border: "none", outline: "none", color: "#ffffff", fontSize: 12, width: "100%", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 6px" }}>
        {/* Hiring section */}
        <button
          onClick={() => setHiringOpen((o) => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            padding: "6px 8px", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Hiring {hiringOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>

        {hiringOpen && HIRING_ITEMS.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onNavChange(item.label)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: isActive ? "rgba(255,255,255,0.07)" : "none",
                border: "none",
                color: isActive ? "#ffffff" : "#8a8f98",
                fontSize: 12, padding: "5px 8px", cursor: "pointer",
                borderRadius: 5, textAlign: "left", fontFamily: "inherit",
                fontWeight: isActive ? 600 : 400,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "none"; }}
            >
              {item.label}
              {item.count && (
                <span style={{
                  fontSize: 10, background: "rgba(255,255,255,0.1)",
                  padding: "1px 5px", borderRadius: 4, color: "#8a8f98",
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Library */}
        <div style={{ marginTop: 14 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
            letterSpacing: 1, textTransform: "uppercase", padding: "6px 8px", margin: 0,
          }}>
            Library
          </p>
          <button
            onClick={() => onNavChange("questions")}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              background: activeNav === "questions" ? "rgba(255,255,255,0.07)" : "none",
              border: "none", color: activeNav === "questions" ? "#ffffff" : "#8a8f98",
              fontSize: 12, padding: "5px 8px", cursor: "pointer",
              borderRadius: 5, textAlign: "left", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (activeNav !== "questions") e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { if (activeNav !== "questions") e.currentTarget.style.background = "none"; }}
          >
            Company Question Sets
          </button>

          <button
            onClick={() => onNavChange("cs-core")}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              background: activeNav === "cs-core" ? "rgba(255,255,255,0.07)" : "none",
              border: "none",
              color: activeNav === "cs-core" ? "#ffffff" : "#8a8f98",
              fontSize: 12, padding: "5px 8px", cursor: "pointer",
              borderRadius: 5, textAlign: "left", fontFamily: "inherit",
              fontWeight: activeNav === "cs-core" ? 600 : 400,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { if (activeNav !== "cs-core") e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { if (activeNav !== "cs-core") e.currentTarget.style.background = "none"; }}
          >
            CS Core
          </button>
        </div>
      </nav>

      {/* User chip */}
      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "8px 10px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{username}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#8a8f98" }}>Free plan</p>
          </div>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 0 }}>
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Mode switcher */}
        <div style={{
          display: "flex", marginTop: 8, borderRadius: 7, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {(["platform", "candidate"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPlatformMode(m)}
              style={{
                flex: 1, fontSize: 10, padding: "5px 0",
                background: platformMode === m ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                color: platformMode === m ? "#ffffff" : "rgba(255,255,255,0.3)",
                cursor: "pointer", fontWeight: 500, fontFamily: "inherit",
                textTransform: "capitalize",
              }}
            >
              {m === "platform" ? "Platform Mode" : "Candidate Mode"}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
