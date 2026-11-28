"use client";

/** Left side of the coding workspace: the problem statement, the latest review and past submissions. */

import { ArrowRight, Check, Clock3, HardDrive, MessageCircleQuestion } from "lucide-react";
import { Ring } from "@/components/app/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/interview/report";
import { DIFFICULTY_CHIP, type CodingProblem, type Submission } from "@/lib/practice";
import { cn } from "@/lib/utils";

/** Parameter names from the starter code's signature, for "nums = [2,7,11,15]" style examples. */
function paramNames(problem: CodingProblem): string[] {
  const m = problem.starterCode.match(new RegExp(`function ${problem.functionName}\\(([^)]*)\\)`));
  return m?.[1] ? m[1].split(",").map((s) => s.trim()) : [];
}

const json = (v: unknown) => JSON.stringify(v);

export function ProblemPanel({
  problem,
  submissions,
  tab,
  onTab,
}: {
  problem: CodingProblem;
  submissions: Submission[];
  tab: string;
  onTab: (tab: string) => void;
}) {
  const names = paramNames(problem);
  const latest = submissions[0];

  return (
    <Tabs value={tab} onValueChange={onTab} className="flex min-h-0 flex-col gap-0">
      <div className="border-b border-white/[0.06] px-3 py-2">
        <TabsList className="h-8 bg-white/[0.04] p-0.5 [&>button]:h-7 [&>button]:px-2.5 [&>button]:text-[12.5px]">
          <TabsTrigger value="problem">Problem</TabsTrigger>
          <TabsTrigger value="review" disabled={!latest}>
            Review
          </TabsTrigger>
          <TabsTrigger value="submissions" disabled={!submissions.length}>
            Submissions{submissions.length ? ` (${submissions.length})` : ""}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="problem" className="min-h-0 overflow-y-auto px-5 py-5">
        <h2 className="m-0 text-[20px] font-semibold tracking-[-0.03em]">{problem.title}</h2>
        <p className="m-0 mt-2 flex items-center gap-2 text-[12.5px]">
          <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset", DIFFICULTY_CHIP[problem.difficulty])}>{problem.difficulty}</span>
          <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-white/55">{problem.topic}</span>
        </p>
        <div className="mt-5 grid gap-3 text-[14px] leading-[1.6] text-white/80">
          {problem.statement.map((p) => (
            <p key={p} className="m-0">
              {p}
            </p>
          ))}
        </div>

        {problem.tests.slice(0, problem.exampleCount).map((t, i) => (
          <div key={i} className="mt-5">
            <h3 className="m-0 text-[12.5px] font-semibold text-white/80">Example {i + 1}</h3>
            <pre className="m-0 mt-2 overflow-x-auto rounded-xl border border-white/[0.05] bg-black/30 px-3.5 py-3 font-mono text-[12.5px] leading-[1.6] text-white/80">
              <span className="text-muted-foreground">Input: </span>
              {t.args.map((a, j) => `${names[j] ?? `arg${j + 1}`} = ${json(a)}`).join(", ")}
              {"\n"}
              <span className="text-muted-foreground">Output: </span>
              {json(t.expected)}
            </pre>
          </div>
        ))}

        <h3 className="m-0 mt-6 text-[12.5px] font-semibold text-white/80">Constraints</h3>
        <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 font-mono text-[12px] text-white/65">
          {problem.constraints.map((c) => (
            <li key={c} className="w-fit rounded-md bg-white/[0.04] px-2 py-1">
              {c}
            </li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="review" className="min-h-0 overflow-y-auto px-5 py-5">
        {latest ? <Review submission={latest} /> : null}
      </TabsContent>

      <TabsContent value="submissions" className="min-h-0 overflow-y-auto">
        <ul className="m-0 list-none p-0">
          {submissions.map((s) => (
            <li key={s.id} className="border-b border-white/[0.05] px-5 py-3.5">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className={cn("flex items-center gap-2 font-medium", s.passed === s.total ? "text-[#6ee7b7]" : "text-[#fcd34d]")}>
                  <span className={cn("size-1.5 rounded-full", s.passed === s.total ? "bg-[#34d399]" : "bg-[#fbbf24]")} />
                  {s.passed}/{s.total} tests passed
                </span>
                <span className="font-semibold tabular-nums text-white">{s.score}/10</span>
              </div>
              <p className="m-0 mt-1 text-[12.5px] text-muted-foreground">
                {formatDate(s.createdAt)} · {s.review.verdict}
              </p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}

function Review({ submission }: { submission: Submission }) {
  const { review } = submission;
  const allPassed = submission.passed === submission.total;
  const color = review.score >= 8 ? "#34d399" : review.score >= 5 ? "#4d7cff" : "#fbbf24";
  return (
    <div>
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Ring value={review.score * 10} size={60} stroke={5} color={color}>
          <span className="text-[16px]">{review.score}</span>
        </Ring>
        <div className="min-w-0">
          <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold", allPassed ? "bg-[#34d399]/10 text-[#6ee7b7]" : "bg-[#fbbf24]/10 text-[#fcd34d]")}>
            {submission.passed}/{submission.total} tests passed
          </span>
          <p className="m-0 mt-1.5 text-[14px] font-medium leading-[1.5] text-white">{review.verdict}</p>
        </div>
      </div>
      {!allPassed ? <p className="m-0 mt-2.5 text-[12px] text-muted-foreground">Solutions that fail a test are capped at 5/10.</p> : null}

      <dl className="m-0 mt-4 grid grid-cols-2 gap-2.5">
        {(
          [
            ["Time", review.timeComplexity, Clock3],
            ["Space", review.spaceComplexity, HardDrive],
          ] as const
        ).map(([k, v, Icon]) => (
          <div key={k} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
            <dt className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Icon className="size-3.5" /> {k}
            </dt>
            <dd className="m-0 mt-1 font-mono text-[13px] text-white">{v}</dd>
          </div>
        ))}
      </dl>

      <ReviewList title="What worked" items={review.strengths} good />
      <ReviewList title="To improve" items={review.improvements} />

      <div className="mt-5 rounded-xl border border-[#a78bfa]/20 bg-[linear-gradient(135deg,rgba(77,124,255,0.06),rgba(167,139,250,0.06))] px-4 py-3.5">
        <p className="m-0 flex items-center gap-1.5 text-[12px] font-medium text-white/55">
          <MessageCircleQuestion className="size-3.5 text-[#c4b5fd]" /> The interviewer would ask next
        </p>
        <p className="m-0 mt-1.5 text-[14px] leading-[1.5] text-white">{review.followUp}</p>
      </div>
    </div>
  );
}

function ReviewList({ title, items, good = false }: { title: string; items: string[]; good?: boolean }) {
  if (!items.length) return null;
  return (
    <>
      <h3 className="m-0 mt-5 text-[12.5px] font-semibold text-white/80">{title}</h3>
      <ul className="m-0 mt-2 grid list-none gap-2 p-0 text-[13px] leading-[1.55] text-white/75">
        {items.map((s) => (
          <li key={s} className="flex gap-2.5">
            <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full", good ? "bg-[#34d399]/15 text-[#6ee7b7]" : "bg-[#fbbf24]/15 text-[#fcd34d]")}>
              {good ? <Check className="size-2.5" /> : <ArrowRight className="size-2.5" />}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </>
  );
}
