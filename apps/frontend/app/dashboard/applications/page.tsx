import type { Metadata } from "next";
import { ApplicationsBoard } from "@/components/applications/ApplicationsBoard";

export const metadata: Metadata = { title: "Applications · DevPrep" };

export default function ApplicationsPage() {
  return <ApplicationsBoard />;
}
