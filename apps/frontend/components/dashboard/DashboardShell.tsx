"use client";
import TopBar from "./TopBar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex flex-col min-h-screen font-sans" style={{ backgroundColor: "#F5F5F7", color: "#1A1A1A" }}>
      <TopBar />
      <main className="flex-1 pt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
