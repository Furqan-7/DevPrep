import type { Metadata } from "next";
import { CodingList } from "@/components/coding/CodingList";

export const metadata: Metadata = { title: "Coding round · DevPrep" };

export default function CodingPage() {
  return <CodingList />;
}
