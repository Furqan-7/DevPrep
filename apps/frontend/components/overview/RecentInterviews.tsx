"use client";

import { useState } from "react";
import Link from "next/link";
import { Ellipsis, FileChartColumn, Mic, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, levelLabel, roleTitle, type SessionSummary } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { roleColor } from "@/components/dashboard/nav";
import { Card, scoreColor } from "@/components/app/kit";

type Filter = "all" | "scored" | "open";

function status(s: SessionSummary) {
  if (s.overallScore !== null) return { label: "Scored", dot: "bg-[#34d399]", text: "text-[#6ee7b7]" };
  if (s.status === "completed") return { label: "Not scored yet", dot: "bg-[#4d7cff]", text: "text-[#8fb0ff]" };
  return { label: "In progress", dot: "bg-[#fbbf24]", text: "text-[#fcd34d]" };
}

const initials = (title: string) =>
  title
    .split(/[\s/&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

export function SessionRow({ s }: { s: SessionSummary }) {
  const st = status(s);
  const title = roleTitle(s.role);
  const href = `/dashboard/reports/${s.id}`;
  return (
    <li className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
        style={{ background: `linear-gradient(135deg, ${roleColor(s.role)}, ${roleColor(s.role)}88)` }}
      >
        {initials(title)}
      </span>
      <Link href={href} className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] text-white">
          <span className="font-medium">{title}</span> <span className="text-white/45">· {levelLabel(s.difficulty)}</span>
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-white/40">
          {formatDate(s.createdAt)} · {s.answered}/{s.totalQuestions} answered
        </span>
      </Link>
      <span className={cn("hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[11.5px] font-medium sm:inline-flex", st.text)}>
        <span className={cn("size-1.5 rounded-full", st.dot)} />
        {st.label}
      </span>
      <span className="w-9 text-right text-[14px] font-semibold tabular-nums" style={{ color: s.overallScore !== null ? scoreColor(s.overallScore) : "rgba(255,255,255,0.25)" }}>
        {s.overallScore ?? "—"}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${title}`} className="text-white/40 hover:text-white">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[190px] border-white/10">
          <DropdownMenuItem asChild>
            <Link href={href}>
              <FileChartColumn /> Open report
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/ai-interview/${s.role}`}>
              <RotateCcw /> Practise this role
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function RecentInterviews({ sessions, limit = 5, delay }: { sessions: SessionSummary[]; limit?: number; delay?: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = sessions.filter((s) => (filter === "all" ? true : filter === "scored" ? s.overallScore !== null : s.overallScore === null));
  const shown = filtered.slice(0, limit);

  return (
    <Card
      delay={delay}
      title="Recent interviews"
      aside={
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="h-7 bg-white/[0.04] p-0.5">
              <TabsTrigger value="all" className="h-6 px-2 text-[12px]">
                All
              </TabsTrigger>
              <TabsTrigger value="scored" className="h-6 px-2 text-[12px]">
                Scored
              </TabsTrigger>
              <TabsTrigger value="open" className="h-6 px-2 text-[12px]">
                Unscored
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/dashboard/reports" className="hidden font-medium text-white/60 transition-colors hover:text-white sm:inline">
            View all
          </Link>
        </>
      }
    >
      {shown.length ? (
        <ul className="m-0 list-none divide-y divide-white/[0.05] p-0 pb-2">
          {shown.map((s) => (
            <SessionRow key={s.id} s={s} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 text-center">
          <p className="m-0 text-[13.5px] text-white/55">{sessions.length ? "No interviews match this filter." : "Your interviews will show up here."}</p>
          {!sessions.length && (
            <Button asChild size="sm">
              <Link href="/dashboard/ai-interview">
                <Mic /> Start your first interview
              </Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
