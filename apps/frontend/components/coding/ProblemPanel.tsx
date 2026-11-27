"use client";

/** Left side of the coding workspace: the problem statement, the latest review and past submissions. */

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/interview/report";
import { DIFFICULTY_TONE, type CodingProblem, type Submission } from "@/lib/practice";
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
      <div className="border-b border-white/[0.06] px-4 py-2">
        <TabsList className="bg-white/[0.04]">
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
        <h1 className="m-0 text-[22px] font-medium tracking-[-0.03em]">{problem.title}</h1>
        <p className="m-0 mt-1.5 text-[13px]">
          <span className={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</span>
          <span className="text-muted-foreground"> · {problem.topic}</span>
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
            <h2 className="m-0 text-[13px] font-medium">Example {i + 1}</h2>
            <pre className="m-0 mt-2 overflow-x-auto rounded-lg bg-white/[0.03] px-3.5 py-3 font-mono text-[12.5px] leading-[1.6] text-white/80">
              <span className="text-muted-foreground">Input: </span>
              {t.args.map((a, j) => `${names[j] ?? `arg${j + 1}`} = ${json(a)}`).join(", ")}
              {"\n"}
              <span className="text-muted-foreground">Output: </span>
              {json(t.expected)}
            </pre>
          </div>
        ))}

        <h2 className="m-0 mt-6 text-[13px] font-medium">Constraints</h2>
        <ul className="m-0 mt-2 grid list-disc gap-1 pl-5 font-mono text-[12.5px] text-white/70">
          {problem.constraints.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="review" className="min-h-0 overflow-y-auto px-5 py-5">
        {latest ? <Review submission={latest} /> : null}
      </TabsContent>

      <TabsContent value="submissions" className="min-h-0 overflow-y-auto">
        <ul className="m-0 list-none p-0">
          {submissions.map((s) => (
            <li key={s.id} className="border-b border-white/[0.06] px-5 py-3.5">
              <div className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className={s.passed === s.total ? "text-[#7ee2a8]" : "text-[#ffc7a6]"}>
                  {s.passed}/{s.total} tests passed
                </span>
                <span className="tabular-nums">{s.score}/10</span>
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
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="text-[40px] font-medium leading-none tabular-nums tracking-[-0.04em]">
          {review.score}
          <span className="text-[18px] text-muted-foreground">/10</span>
        </span>
        <div>
          <Badge variant="outline" className={cn("border-white/12", allPassed ? "text-[#7ee2a8]" : "text-[#ffc7a6]")}>
            {submission.passed}/{submission.total} tests passed
          </Badge>
          <p className="m-0 mt-1.5 text-[14px] leading-[1.5]">{review.verdict}</p>
        </div>
      </div>
      {!allPassed ? <p className="m-0 mt-3 text-[12.5px] text-muted-foreground">Solutions that fail a test are capped at 5/10.</p> : null}

      <dl className="m-0 mt-6 grid grid-cols-2 gap-3">
        {[
          ["Time", review.timeComplexity],
          ["Space", review.spaceComplexity],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-white/[0.03] px-3.5 py-3">
            <dt className="text-[12px] text-muted-foreground">{k}</dt>
            <dd className="m-0 mt-1 text-[13.5px]">{v}</dd>
          </div>
        ))}
      </dl>

      <ReviewList title="What worked" items={review.strengths} />
      <ReviewList title="To improve" items={review.improvements} />

      <div className="mt-6 rounded-lg border border-white/[0.08] px-4 py-3.5">
        <p className="m-0 text-[12px] text-muted-foreground">The interviewer would ask next</p>
        <p className="m-0 mt-1.5 text-[14px] leading-[1.5]">{review.followUp}</p>
      </div>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h2 className="m-0 mt-6 text-[13px] font-medium">{title}</h2>
      <ul className="m-0 mt-2 grid list-disc gap-1.5 pl-5 text-[13.5px] leading-[1.55] text-white/80">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </>
  );
}
