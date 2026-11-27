"use client";

/** Read-only report behind a share link: scores, feedback and delivery, without the answers. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { serif } from "@/lib/fonts";
import { formatDate, getSharedReport, levelLabel, questionLabel, roleTitle, ReportApiError, type SharedReport } from "@/lib/interview/report";
import { DeliveryCard } from "./Delivery";
import { PageShell, ScoreChip, StateMessage, card, primaryBtn } from "./ui";

const italic = { fontStyle: "italic" } as const;

export function SharedReportView({ token }: { token: string }) {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [error, setError] = useState<ReportApiError | null>(null);

  useEffect(() => {
    getSharedReport(token)
      .then(setReport)
      .catch((err: unknown) => setError(err instanceof ReportApiError ? err : new ReportApiError("server", "Couldn't load this report.")));
  }, [token]);

  return (
    <PageShell>
      <header className="flex items-center justify-between py-[22px] text-[13.5px] text-white/50">
        <Link href="/" className="font-semibold tracking-[-0.04em] text-[#f0f0f0]">
          DevPrep
        </Link>
        <span>Shared interview report</span>
      </header>
      {error ? (
        <StateMessage title={error.kind === "not_found" ? "This link isn't active" : "Something went wrong"} body={error.kind === "not_found" ? "The report was unshared, or the link is wrong." : error.message}>
          <Link href="/" className={primaryBtn}>
            Go to DevPrep
          </Link>
        </StateMessage>
      ) : !report ? (
        <i aria-busy="true" className="block h-[264px] animate-pulse rounded-[20px] bg-[#0d0d0f] motion-reduce:animate-none" />
      ) : (
        <Shared report={report} />
      )}
    </PageShell>
  );
}

function Shared({ report: r }: { report: SharedReport }) {
  const { report } = r;
  return (
    <>
      <section className={`${card} grid gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-8`}>
        <div className="flex flex-col items-center justify-center rounded-[16px] bg-white/[0.03] py-6">
          <b className="text-[56px] font-medium leading-none tabular-nums tracking-[-0.05em]">{report.overallScore}</b>
          <span className="mt-1.5 text-[12.5px] text-white/45">out of 100</span>
        </div>
        <div>
          <div className="text-[13px] text-white/45">
            {roleTitle(r.role)} · {levelLabel(r.difficulty)} · {formatDate(r.createdAt)}
          </div>
          <h1 className="m-0 mb-3 mt-2 text-[30px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[36px]">
            {r.candidate ? `${r.candidate}'s` : "A"} mock{" "}
            <em className={`${serif.className} font-normal tracking-normal`} style={italic}>
              interview
            </em>
          </h1>
          {report.summary ? <p className="m-0 max-w-[520px] text-[15px] leading-[1.55] text-white/62">{report.summary}</p> : null}
          <dl className="m-0 mt-5 grid gap-4 sm:grid-cols-3">
            {(
              [
                ["Technical", report.technical],
                ["Communication", report.communication],
                ["Confidence", report.confidence],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="flex justify-between border-b border-white/[0.08] pb-2 text-[13px]">
                <dt className="text-white/55">{label}</dt>
                <dd className="m-0 font-medium">{v}/10</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
        {(
          [
            ["Strengths", report.strengths],
            ["Working on", report.improvements],
          ] as const
        ).map(([title, items]) =>
          items.length ? (
            <section key={title} className={`${card} px-6 py-5`}>
              <h2 className="m-0 mb-3 text-[13px] font-medium text-white/45">{title}</h2>
              <ul className="m-0 grid list-disc gap-1.5 pl-5 text-[14px] leading-[1.5] text-white/80">
                {items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>

      {r.delivery ? <DeliveryCard delivery={r.delivery} /> : null}

      <h2 className="m-0 mb-3 ml-1 mt-[34px] text-[13px] font-medium text-white/45">Question by question</h2>
      {r.questions.map((q) => (
        <article key={q.order} className={`${card} mt-2 flex items-start gap-3.5 px-5 py-[18px]`}>
          <span className="w-[34px] shrink-0 pt-0.5 text-[12px] text-white/38">{questionLabel(q.order)}</span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[15px] leading-[1.35] tracking-[-0.02em]">{q.question}</p>
            <p className="m-0 mt-1.5 text-[13.5px] leading-[1.45] text-white/55">{q.verdict}</p>
          </div>
          <ScoreChip value={q.score} />
        </article>
      ))}

      <p className="mt-10 text-center text-[13.5px] text-white/45">
        Practised on{" "}
        <Link href="/" className="text-[#f0f0f0] underline underline-offset-4">
          DevPrep
        </Link>
        , AI mock interviews with feedback on every answer.
      </p>
    </>
  );
}
