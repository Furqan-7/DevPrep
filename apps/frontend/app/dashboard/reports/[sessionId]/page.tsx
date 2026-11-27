import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report/ReportView";

export const metadata: Metadata = { title: "Interview report · DevPrep" };

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ReportView sessionId={id} />;
}
