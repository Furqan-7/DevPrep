"use client";

/**
 * GitHub-style contribution grid: one column per week (Sunday first), the last 53 weeks,
 * shaded by how many practice actions happened that day.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const WEEKS = 53;
const DAY_MS = 86_400_000;
const LEVELS = ["bg-white/[0.05]", "bg-[#bec8ff]/25", "bg-[#bec8ff]/45", "bg-[#bec8ff]/70", "bg-[#bec8ff]"];

const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);

/** YYYY-MM-DD of a local date, matching the keys the API returns for the viewer's time zone. */
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function ActivityHeatmap({ activity }: { activity: { date: string; count: number }[] }) {
  const { weeks, months, total } = useMemo(() => {
    const counts = new Map(activity.map((a) => [a.date, a.count]));
    const today = new Date();
    today.setHours(12, 0, 0, 0); // noon keeps day steps clear of DST changes
    const start = new Date(today.getTime() - ((WEEKS - 1) * 7 + today.getDay()) * DAY_MS);

    const weeks: { date: Date; count: number; future: boolean }[][] = [];
    const months: { label: string; week: number }[] = [];
    for (let w = 0; w < WEEKS; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
        days.push({ date, count: counts.get(key(date)) ?? 0, future: date > today });
      }
      const first = days[0]!.date;
      if (first.getDate() <= 7 && w > 0) months.push({ label: first.toLocaleDateString(undefined, { month: "short" }), week: w });
      weeks.push(days);
    }
    return { weeks, months, total: activity.reduce((s, a) => s + a.count, 0) };
  }, [activity]);

  return (
    <div>
      {/* fills the panel; below ~700px wide the cells keep a minimum size and the grid scrolls */}
      <div className="overflow-x-auto pb-1">
        <div className="relative min-w-[690px] pt-5">
          {months.map((m) => (
            <span key={m.week} className="absolute top-0 text-[11px] text-muted-foreground" style={{ left: `${(m.week / WEEKS) * 100}%` }}>
              {m.label}
            </span>
          ))}
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }} role="img" aria-label={`${total} practice actions in the last year`}>
            {weeks.map((days, w) => (
              <div key={w} className="grid gap-[3px]">
                {days.map(({ date, count, future }) => (
                  <span
                    key={key(date)}
                    title={future ? undefined : `${count} ${count === 1 ? "action" : "actions"} on ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
                    className={cn("aspect-square w-full rounded-[3px]", future ? "bg-transparent" : LEVELS[level(count)])}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11.5px] text-muted-foreground">
        Less
        {LEVELS.map((c) => (
          <span key={c} className={cn("size-[11px] rounded-[3px]", c)} />
        ))}
        More
      </div>
    </div>
  );
}
