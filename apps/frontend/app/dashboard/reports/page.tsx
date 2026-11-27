import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryView } from "@/components/report/HistoryView";

export const metadata: Metadata = { title: "Reports · DevPrep" };

export default function ReportsPage() {
  return (
    <Suspense>
      <HistoryView />
    </Suspense>
  );
}
