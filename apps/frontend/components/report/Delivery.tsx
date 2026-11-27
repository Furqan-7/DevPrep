/** "How you sounded": speaking pace and filler words across the interview's answers. */

import type { AnswerDelivery, SessionDelivery } from "@/lib/interview/report";
import { card } from "./ui";

// Conversational pace is roughly 120-160 words a minute; interview answers sit a little lower.
const paceLabel = (wpm: number) => (wpm < 110 ? "On the slow side" : wpm > 170 ? "Fast. Slow down a little" : "A comfortable pace");
const fillerLabel = (per100: number) => (per100 < 2 ? "Rarely" : per100 <= 5 ? "Now and then" : "Often. Pause instead");

export function DeliveryCard({ delivery }: { delivery: SessionDelivery }) {
  const stats = [
    {
      label: "Speaking pace",
      value: delivery.wpm !== null ? `${delivery.wpm} wpm` : "—",
      note: delivery.wpm !== null ? paceLabel(delivery.wpm) : "Not recorded for this interview",
    },
    {
      label: "Filler words",
      value: `${delivery.fillersPer100Words} per 100 words`,
      note: delivery.topFillers.length ? `${fillerLabel(delivery.fillersPer100Words)} · most used: ${delivery.topFillers.map((f) => `“${f.word}” ×${f.count}`).join(", ")}` : "None picked up",
    },
    {
      label: "Answer length",
      value: `${Math.round(delivery.words / delivery.answers)} words`,
      note: `Average over ${delivery.answers} ${delivery.answers === 1 ? "answer" : "answers"}`,
    },
  ];
  return (
    <section className={`${card} mt-3.5 px-6 py-6 sm:px-7`} aria-labelledby="delivery">
      <h2 id="delivery" className="m-0 mb-3.5 text-[13px] font-medium text-white/45">
        How you sounded
      </h2>
      <dl className="m-0 grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12.5px] text-white/55">{s.label}</dt>
            <dd className="m-0 mt-1 text-[20px] font-medium tabular-nums tracking-[-0.03em]">{s.value}</dd>
            <dd className="m-0 mt-0.5 text-[12.5px] leading-[1.45] text-white/45">{s.note}</dd>
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
