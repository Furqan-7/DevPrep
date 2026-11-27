import type { Metadata } from "next";
import { RoleCatalog } from "@/components/interviews/RoleCatalog";

export const metadata: Metadata = { title: "Choose an interview · DevPrep" };

export default function InterviewsPage() {
  return <RoleCatalog />;
}
