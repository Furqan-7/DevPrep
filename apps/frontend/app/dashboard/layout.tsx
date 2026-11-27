import type { ReactNode } from "react";
import { AppNav } from "@/components/dashboard/AppNav";

/**
 * Frame shared by every signed-in page: the dark canvas and the top nav. The nav lives
 * here rather than in each page so it stays mounted while moving between sections.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] font-sans text-[#f0f0f0] selection:bg-[#bec8ff]/25">
      <AppNav />
      {children}
    </div>
  );
}
