"use client";
import TopBar from "./TopBar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex flex-col min-h-screen text-white font-sans" style={{ backgroundColor: "#0d0e10" }}>
      <TopBar />
      <main className="flex-1 pt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
