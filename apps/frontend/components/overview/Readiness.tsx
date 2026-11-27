"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Insights } from "@/lib/insights";
import { formatDate, roleTitle } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { roleColor } from "@/components/dashboard/nav";
import { Card, Chip, Ring, scoreColor } from "./parts";

// columns per number of roles, so the gap-px grid never shows an empty cell
const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 min-[1600px]:grid-cols-4" };

export const readinessLabel = (score: number) => (score >= 80 ? "Interview-ready" : score >= 60 ? "Getting close" : "Keep practising");

/** One cell per role (up to four): readiness ring, title and when it was last practised. */
export function ReadinessStrip({ readiness, delay }: { readiness: Insights["readiness"]; delay?: number }) {
  const roles = readiness.slice(0, 4);
  return (
    <Card
      delay={delay}
      title="Readiness by role"
      hint="Worked out from your interview reports for each role, weighted toward your last three."
      aside={readiness.length ? <Chip>{readiness.length} {readiness.length === 1 ? "role" : "roles"} practised</Chip> : null}
      bodyClassName="px-2 pb-2"
    >
      {roles.length ? (
        <div className={cn("grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06]", COLS[roles.length])}>
          {roles.map((r) => (
            <Link
              key={r.role}
              href={`/dashboard/ai-interview/${r.role}`}
              className="group flex items-center gap-3 bg-[#111113] px-4 py-3.5 transition-colors hover:bg-[#151518]"
            >
              <Ring value={r.score} size={38} color={scoreColor(r.score)}>
                {r.score}
              </Ring>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-[13.5px] font-medium text-white">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: roleColor(r.role) }} />
                  <span className="truncate">{roleTitle(r.role)}</span>
                </span>
                <span className="mt-0.5 block truncate text-[11.5px] text-white/40">
                  {readinessLabel(r.score)} · {formatDate(r.lastAt)}
                </span>
              </span>
              <ArrowUpRight className="size-3.5 shrink-0 text-white/20 transition-colors group-hover:text-white/70" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/[0.08] px-6 py-8 text-center">
          <p className="m-0 text-[13.5px] text-white/55">Readiness shows up after your first interview report.</p>
          <Button asChild size="sm" variant="outline" className="border-white/10">
            <Link href="/dashboard/ai-interview">Choose a role</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
