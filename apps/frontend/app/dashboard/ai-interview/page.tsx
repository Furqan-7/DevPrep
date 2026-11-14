import type { Metadata } from "next";
import { AppNav } from "@/components/dashboard/AppNav";
import { RoleCatalog } from "@/components/interviews/RoleCatalog";

export const metadata: Metadata = { title: "Choose an interview · DevPrep" };

export default function InterviewsPage() {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] font-sans text-[#f0f0f0] selection:bg-[#bec8ff]/25">
      <AppNav />
      <RoleCatalog />
    </div>
  );
}
