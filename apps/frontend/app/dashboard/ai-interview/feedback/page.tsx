import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryView } from "@/components/report/HistoryView";

export const metadata: Metadata = { title: "Your interviews · DevPrep" };

export default function FeedbackHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0a]" />}>
      <HistoryView />
    </Suspense>
  );
}
