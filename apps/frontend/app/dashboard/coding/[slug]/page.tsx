import type { Metadata } from "next";
import { CodingWorkspace } from "@/components/coding/CodingWorkspace";

export const metadata: Metadata = { title: "Coding round · DevPrep" };

export default async function CodingProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CodingWorkspace slug={slug} />;
}
