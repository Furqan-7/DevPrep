"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Google's favicon service returns the wrong icon for a few domains.
const DOMAIN_OVERRIDES: Record<string, string> = {
  "amazon.com": "amazon.jobs",
  "meta.com": "facebook.com",
};

/** Company favicon on a neutral tile, falling back to the company's initial. */
export function CompanyLogo({ company, domain, letter, className }: { company: string; domain?: string; letter: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04] text-[13px] font-medium text-white/80", className)}>
      {domain && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- external favicon service, not worth next/image config
        <img src={`https://www.google.com/s2/favicons?domain=${DOMAIN_OVERRIDES[domain] ?? domain}&sz=64`} alt={company} width={20} height={20} className="size-5 object-contain" onError={() => setFailed(true)} />
      ) : (
        letter
      )}
    </span>
  );
}
