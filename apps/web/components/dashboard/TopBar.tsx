"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { User, ChevronDown, LogOut, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Jobs",         href: "/dashboard/jobs" },
  { label: "DSA",          href: "/dashboard/dsa" },
  { label: "AI Interview", href: "/dashboard/ai-interview" },
  { label: "CS Core",      href: "/dashboard/cs-core" },
];

interface TopBarProps {
  username?: string;
}

export default function TopBar({ username = "Furqan" }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  // Determine active nav: match the current pathname
  const isActive = (href: string) => {
    if (href === "/dashboard/jobs") {
      return pathname === "/dashboard" || pathname === "/dashboard/jobs";
    }
    return pathname === href;
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: 56,
        background: "rgba(0, 1, 3, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Left: Logo */}
      <div
        onClick={() => router.push("/dashboard")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          D
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 0.3,
          }}
        >
          DevPrep
        </span>
      </div>

      {/* Center: Nav Links */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              style={{
                background: active
                  ? "rgba(99, 102, 241, 0.15)"
                  : "transparent",
                border: active
                  ? "1px solid rgba(99, 102, 241, 0.35)"
                  : "1px solid transparent",
                color: active ? "#a5b4fc" : "#8a8f98",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                padding: "5px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                letterSpacing: 0.1,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#d1d5db";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#8a8f98";
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right: Profile */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setProfileOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "5px 10px 5px 6px",
            cursor: "pointer",
            color: "#ffffff",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {username[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
            {username}
          </span>
          <ChevronDown
            size={13}
            color="rgba(255,255,255,0.4)"
            style={{
              transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </button>

        {/* Dropdown */}
        {profileOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 180,
              background: "#0d0e10",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              zIndex: 200,
            }}
          >
            <div
              style={{
                padding: "10px 12px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
                {username}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6b7280" }}>
                Free plan
              </p>
            </div>
            {[
              { icon: User, label: "Profile" },
              { icon: Settings, label: "Settings" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  color: "#8a8f98",
                  fontSize: 12,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "background 0.1s, color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#8a8f98";
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  fontSize: 12,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
