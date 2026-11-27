import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * Frame shared by every signed-in page. It lives in the layout rather than each page so
 * the sidebar stays mounted (and keeps its state) while moving between sections.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
