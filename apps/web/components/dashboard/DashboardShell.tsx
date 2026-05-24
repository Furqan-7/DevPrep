"use client";
import { useState } from "react";
import { PanelLeftClose } from "lucide-react";
import Sidebar from "./Sidebar";

interface DashboardShellProps {
  children: (activeNav: string) => React.ReactNode;
  defaultNav?: string;
}

export default function DashboardShell({
  children,
  defaultNav = "All Jobs",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState(defaultNav);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#000103",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 240 : 0,
          minWidth: sidebarOpen ? 240 : 0,
          overflow: "hidden",
          transition: "width 0.25s ease, min-width 0.25s ease",
          flexShrink: 0,
        }}
      >
        {sidebarOpen && (
          <Sidebar
            activeNav={activeNav}
            onNavChange={setActiveNav}
            onCollapse={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Re-open sidebar button when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: "fixed",
              top: 16,
              left: 12,
              background: "rgba(0,1,3,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "#8a8f98",
              cursor: "pointer",
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              zIndex: 200,
              backdropFilter: "blur(8px)",
            }}
          >
            <PanelLeftClose size={15} style={{ transform: "scaleX(-1)" }} />
          </button>
        )}

        {/* Scrollable content area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0",
          }}
        >
          {children(activeNav)}
        </div>
      </main>
    </div>
  );
}
