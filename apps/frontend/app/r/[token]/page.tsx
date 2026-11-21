import type { Metadata } from "next";
import { SharedReportView } from "@/components/report/SharedReportView";

export const metadata: Metadata = { title: "Shared interview report · DevPrep", robots: { index: false } };

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedReportView token={token} />;
}
