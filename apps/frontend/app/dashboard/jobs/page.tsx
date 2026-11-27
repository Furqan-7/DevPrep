import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs/JobsBoard";

export const metadata: Metadata = { title: "Jobs · DevPrep" };

export default function JobsPage() {
  return <JobsBoard />;
}
