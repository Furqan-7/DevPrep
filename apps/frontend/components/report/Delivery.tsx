/** "How you sounded": speaking pace and filler words across the interview's answers. */

import { AudioLines, Gauge, MessageSquareText } from "lucide-react";
import type { AnswerDelivery, SessionDelivery } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { card } from "./ui";

// Conversational pace is roughly 120-160 words a minute; interview answers sit a little lower.
const paceLabel = (wpm: number) => (wpm < 110 ? "On the slow side" : wpm > 170 ? "Fast. Slow down a little" : "A comfortable pace");
const fillerLabel = (per100: number) => (per100 < 2 ? "Rarely" : per100 <= 5 ? "Now and then" : "Often. Pause instead");

export function DeliveryCard({ delivery }: { delivery: SessionDelivery }) {
  const stats = [
    {
      icon: Gauge,
      tone: "bg-white/[0.06] text-white/70",
      label: "Speaking pace",
      value: delivery.wpm !== null ? `${delivery.wpm}` : "—",
      unit: delivery.wpm !== null ? "wpm" : "",
      note: delivery.wpm !== null ? paceLabel(delivery.wpm) : "Not recorded for this interview",
      // a 0–220 wpm scale with the comfortable band marked
      meter: delivery.wpm !== null ? Math.min(100, (delivery.wpm / 220) * 100) : null,
    },
    {
      icon: AudioLines,
      tone: "bg-white/[0.06] text-white/70",
      label: "Filler words",
      value: `${delivery.fillersPer100Words}`,
      unit: "per 100 words",
      note: delivery.topFillers.length ? `${fillerLabel(delivery.fillersPer100Words)} · most used: ${delivery.topFillers.map((f) => `“${f.word}” ×${f.count}`).join(", ")}` : "None picked up",
      meter: null,
    },
    {
      icon: MessageSquareText,
      tone: "bg-white/[0.06] text-white/70",
      label: "Answer length",
      value: `${Math.round(delivery.words / delivery.answers)}`,
      unit: "words",
      note: `Average over ${delivery.answers} ${delivery.answers === 1 ? "answer" : "answers"}`,
      meter: null,
    },
  ];
  return (
    <section className={cn(card, "p-5")} aria-labelledby="delivery">
      <h2 id="delivery" className="m-0 text-[14px] font-semibold tracking-[-0.015em]">
        How you sounded
      </h2>
      <dl className="m-0 mt-4 grid gap-2.5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <dt className="flex items-center gap-2 text-[12.5px] text-white/55">
              <span className={cn("grid size-6 place-items-center rounded-md", s.tone)}>
                <s.icon className="size-3.5" />
              </span>
              {s.label}
            </dt>
            <dd className="m-0 mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[24px] font-semibold tabular-nums tracking-[-0.04em] text-white">{s.value}</span>
              <span className="text-[12px] text-white/40">{s.unit}</span>
            </dd>
            {s.meter !== null ? (
              <dd className="relative m-0 mt-2 h-1.5 rounded-full bg-white/[0.07]" aria-hidden>
                <span className="absolute inset-y-0 rounded-full bg-[#34d399]/25" style={{ left: `${(110 / 220) * 100}%`, width: `${(60 / 220) * 100}%` }} />
                <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0f0f11] bg-white" style={{ left: `${s.meter}%` }} />
              </dd>
            ) : null}
            <dd className="m-0 mt-2 text-[12px] leading-[1.45] text-white/45">{s.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** One answer's stats, e.g. "64 words · 138 wpm · 2 filler words". */
export function deliveryLine(d: AnswerDelivery) {
  return [`${d.words} words`, d.wpm !== null ? `${d.wpm} wpm` : null, `${d.fillers} filler ${d.fillers === 1 ? "word" : "words"}`].filter(Boolean).join(" · ");
}
