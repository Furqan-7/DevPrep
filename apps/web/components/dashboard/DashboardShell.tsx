"use client";
import TopBar from "./TopBar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#000103",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#ffffff",
      }}
    >
      <TopBar />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
