import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page itself is a client component, so its title is set here.
export const metadata: Metadata = { title: "How it works · DevPrep" };

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return children;
}
