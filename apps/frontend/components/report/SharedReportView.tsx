"use client";

/** Read-only report behind a share link: scores, feedback and delivery, without the answers. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, Link2Off, Target } from "lucide-react";
import { formatDate, getSharedReport, levelLabel, questionLabel, roleTitle, ReportApiError, type SharedReport } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { DeliveryCard } from "./Delivery";
import { PageShell, ScoreChip, StateMessage, bandColor, card, primaryBtn } from "./ui";

export function SharedReportView({ token }: { token: string }) {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [error, setError] = useState<ReportApiError | null>(null);

  useEffect(() => {
    getSharedReport(token)
      .then(setReport)
      .catch((err: unknown) => setError(err instanceof ReportApiError ? err : new ReportApiError("server", "Couldn't load this report.")));
  }, [token]);

  return (
    <PageShell standalone>
      {error ? (
        <StateMessage
          icon={<Link2Off className="size-5" />}
          title={error.kind === "not_found" ? "This link isn't active" : "Something went wrong"}
          body={error.kind === "not_found" ? "The report was unshared, or the link is wrong." : error.message}
        >
          <Link href="/" className={primaryBtn}>
            Go to DevPrep
          </Link>
        </StateMessage>
      ) : !report ? (
        <i aria-busy="true" className="block h-[260px] animate-pulse rounded-2xl bg-white/[0.04] motion-reduce:animate-none" />
      ) : (
        <Shared report={report} />
      )}
    </PageShell>
  );
}

function Shared({ report: r }: { report: SharedReport }) {
  const { report } = r;
  return (
    <div className="grid gap-4">
      <section className={cn(card, "grid gap-6 p-6 sm:grid-cols-[170px_1fr] sm:p-8")}>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-6">
          <b className="text-[58px] font-semibold leading-none tabular-nums tracking-[-0.05em]" style={{ color: bandColor(report.overallScore / 10) }}>
            {report.overallScore}
          </b>
          <span className="mt-1.5 text-[12px] text-white/45">out of 100</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {[roleTitle(r.role), levelLabel(r.difficulty), formatDate(r.createdAt)].map((m) => (
              <span key={m} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[12px] text-white/60">
                {m}
              </span>
            ))}
          </div>
          <h1 className="m-0 mt-4 text-[28px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[34px]">
            {r.candidate ? `${r.candidate}'s` : "A"} mock interview
          </h1>
          {report.summary ? <p className="m-0 mt-3 max-w-[560px] text-[14.5px] leading-[1.6] text-white/60">{report.summary}</p> : null}
          <dl className="m-0 mt-5 grid gap-2.5 sm:grid-cols-3">
            {(
              [
                ["Technical", report.technical],
                ["Communication", report.communication],
                ["Confidence", report.confidence],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <dt className="text-white/55">{label}</dt>
                  <dd className="m-0 text-[15px] font-semibold tabular-nums">{v}/10</dd>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <span className="block h-full rounded-full" style={{ width: `${v * 10}%`, background: bandColor(v) }} />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["Strengths", report.strengths, CircleCheck, "bg-[#34d399]/12 text-[#6ee7b7]", "#34d399"],
            ["Working on", report.improvements, Target, "bg-[#fbbf24]/12 text-[#fcd34d]", "#fbbf24"],
          ] as const
        ).map(([title, items, Icon, tone, dot]) =>
          items.length ? (
            <section key={title} className={cn(card, "p-5")}>
              <h2 className="m-0 flex items-center gap-2 text-[14px] font-semibold tracking-[-0.015em]">
                <span className={cn("grid size-7 place-items-center rounded-lg", tone)}>
                  <Icon className="size-4" />
                </span>
                {title}
              </h2>
              <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
                {items.map((s) => (
                  <li key={s} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-white/75">
                    <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: dot }} />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>

      {r.delivery ? <DeliveryCard delivery={r.delivery} /> : null}

      <section className={cn(card, "overflow-hidden")}>
        <h2 className="m-0 border-b border-white/[0.06] px-5 py-3.5 text-[14px] font-semibold tracking-[-0.015em]">Question by question</h2>
        <ul className="m-0 list-none divide-y divide-white/[0.05] p-0">
          {r.questions.map((q) => (
            <li key={q.order} className="flex items-start gap-3.5 px-5 py-4">
              <span className="mt-0.5 grid h-6 min-w-10 shrink-0 place-items-center rounded-md bg-white/[0.05] text-[11px] font-semibold text-white/50">{questionLabel(q.order)}</span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[14px] font-medium leading-[1.4] text-white/90">{q.question}</p>
                <p className="m-0 mt-1.5 text-[13px] leading-[1.5] text-white/55">{q.verdict}</p>
              </div>
              <ScoreChip value={q.score} />
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 text-center text-[13px] text-white/45">
        Practised on{" "}
        <Link href="/" className="font-medium text-white underline decoration-white/25 underline-offset-4 hover:decoration-white">
          DevPrep
        </Link>
        , AI mock interviews with feedback on every answer.
      </p>
    </div>
  );
}
