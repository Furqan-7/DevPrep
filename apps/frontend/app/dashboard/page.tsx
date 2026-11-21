import type { Metadata } from "next";
import { OverviewView } from "@/components/overview/OverviewView";

export const metadata: Metadata = { title: "Overview · DevPrep" };

export default function DashboardPage() {
  return <OverviewView />;
}
