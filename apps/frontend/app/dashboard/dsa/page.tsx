import type { Metadata } from "next";
import { Suspense } from "react";
import { DsaSheet } from "@/components/practice/DsaSheet";

export const metadata: Metadata = { title: "DSA sheet · DevPrep" };

export default function DsaPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0a]" />}>
      <DsaSheet />
    </Suspense>
  );
}
