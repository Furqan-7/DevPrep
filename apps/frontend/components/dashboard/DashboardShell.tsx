"use client";
import TopBar from "./TopBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface DashboardShellProps {
  children: React.ReactNode;
  /** Opt in to the light/dark DevPrep theme (AI interview pages). */
  themed?: boolean;
}

export default function DashboardShell({ children, themed = false }: DashboardShellProps) {
  // Resolve the logged-in user from whichever auth method was used:
  //  - JWT login  → reads "username" from localStorage (instant, no network)
  //  - Google OAuth → fetches /api/auth/me to decode the httpOnly cookie JWT
  const { user, isLoading } = useCurrentUser();

  // While resolving (only happens on the Google OAuth path — JWT is instant),
  // pass an empty string so TopBar shows initials placeholder gracefully.
  const displayName = isLoading ? "" : (user?.name ?? "");

  return (
    <div
      className={`flex flex-col min-h-screen font-sans ${themed ? "dp bg-dp-bg text-dp-ink" : ""}`}
      style={themed ? undefined : { backgroundColor: "#F5F5F7", color: "#1A1A1A" }}
    >
      <TopBar username={displayName} showThemeToggle={themed} />
      <main className="flex-1 pt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
