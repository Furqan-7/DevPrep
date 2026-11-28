"use client";

/**
 * Coding workspace: the problem on the left; the editor, test results and actions on the
 * right. "Run tests" runs the code in the browser; "Submit" runs it again and sends the
 * code with its result for an AI review. Drafts are kept per problem in localStorage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CodeMirror, { EditorView, Prec } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { ArrowLeft, CircleCheck, CircleX, FileCode2, FlaskConical, Loader2, Play, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { AppPage, EmptyState } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { ApiError, signInHref } from "@/lib/api";
import { DIFFICULTY_CHIP, listCodingProblems, listSubmissions, submitSolution, type CodingProblem, type Submission } from "@/lib/practice";
import { runTests, type RunOutcome } from "@/lib/runTests";
import { cn } from "@/lib/utils";
import { ProblemPanel } from "./ProblemPanel";

const draftKey = (slug: string) => `devprep-code-${slug}`;

const editorTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#0b0b0e", height: "100%", fontSize: "13px" },
    ".cm-gutters": { backgroundColor: "#0b0b0e", borderRight: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.22)" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.03)" },
    ".cm-content": { fontFamily: "var(--font-jbmono), ui-monospace, monospace", padding: "12px 0" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true },
);
// highest precedence so these colours win over the built-in dark theme
const extensions = [javascript(), Prec.highest(editorTheme)];

export function CodingWorkspace({ slug }: { slug: string }) {
  const router = useRouter();
  const [problem, setProblem] = useState<CodingProblem | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [tab, setTab] = useState("problem");
  const signedIn = useRef(false);

  useEffect(() => {
    signedIn.current = !!localStorage.getItem("token");
    let alive = true;
    listCodingProblems()
      .then((all) => {
        if (!alive) return;
        const p = all.find((x) => x.slug === slug) ?? null;
        setProblem(p);
        if (p) setCode(localStorage.getItem(draftKey(slug)) ?? p.starterCode);
      })
      .catch(() => alive && setProblem(null));
    if (signedIn.current) {
      listSubmissions(slug)
        .then((s) => alive && setSubmissions(s))
        .catch(() => {}); // history is optional here
    }
    return () => {
      alive = false;
    };
  }, [slug]);

  const onChange = useCallback(
    (value: string) => {
      setCode(value);
      try {
        localStorage.setItem(draftKey(slug), value);
      } catch {
        /* drafts are a convenience */
      }
    },
    [slug],
  );

  const run = async () => {
    if (!problem) return null;
    const result = await runTests(code, problem.functionName, problem.tests);
    setOutcome(result);
    return result;
  };

  const onRun = async () => {
    setBusy("run");
    await run();
    setBusy(null);
  };

  const onSubmit = async () => {
    if (!problem) return;
    if (!signedIn.current) return router.push(signInHref(`/dashboard/coding/${slug}`));
    setBusy("submit");
    const result = await run();
    if (!result || "error" in result) {
      setBusy(null);
      toast.error("Fix the error before submitting.");
      return;
    }
    try {
      const submission = await submitSolution({ problem: slug, code, passed: result.results.filter((r) => r.pass).length, total: result.results.length });
      setSubmissions((s) => [submission, ...s]);
      setTab("review");
    } catch (err) {
      if (err instanceof ApiError && err.kind === "auth") return router.push(signInHref(`/dashboard/coding/${slug}`));
      toast.error(err instanceof ApiError ? err.message : "Couldn't review your code. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    if (!problem) return;
    onChange(problem.starterCode);
    setOutcome(null);
  };

  const passed = useMemo(() => (outcome && "results" in outcome ? outcome.results.filter((r) => r.pass).length : 0), [outcome]);

  if (problem === null) {
    return (
      <AppPage>
        <EmptyState title="Problem not found" body="It may have been renamed. Pick one from the list.">
          <Button asChild variant="outline">
            <Link href="/dashboard/coding">All problems</Link>
          </Button>
        </EmptyState>
      </AppPage>
    );
  }

  const total = outcome && "results" in outcome ? outcome.results.length : 0;
  const allPassed = total > 0 && passed === total;

  return (
    <AppPage className="max-w-[1480px] pb-5 pt-4">
      <Toaster position="bottom-center" />
      {/* header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/coding" aria-label="All problems" className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/60 transition-colors hover:text-white">
          <ArrowLeft className="size-4" />
        </Link>
        {problem ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="m-0 truncate text-[16px] font-semibold tracking-[-0.02em] text-white">{problem.title}</h1>
            <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset", DIFFICULTY_CHIP[problem.difficulty])}>{problem.difficulty}</span>
            <span className="hidden text-[12.5px] text-white/40 sm:inline">{problem.topic}</span>
          </div>
        ) : (
          <Skeleton className="h-6 w-48 rounded-md bg-white/[0.05]" />
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onRun} disabled={!!busy || !problem} className="h-8 border-white/[0.1] bg-white/[0.03]">
            {busy === "run" ? <Loader2 className="animate-spin" /> : <Play />} Run tests
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={!!busy || !problem} className="h-8 font-semibold">
            {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />} Submit for review
          </Button>
        </div>
      </div>

      {!problem ? (
        <Skeleton className="mt-3 h-[calc(100dvh-140px)] rounded-2xl bg-white/[0.04]" />
      ) : (
        <div className="mt-3 grid gap-3 lg:h-[calc(100dvh-132px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-card lg:min-h-0">
            <ProblemPanel problem={problem} submissions={submissions} tab={tab} onTab={setTab} />
          </section>

          <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0e] lg:min-h-0">
            <div className="flex h-10 items-center justify-between border-b border-white/[0.06] pl-2 pr-2">
              <span className="flex h-full items-center gap-2 border-b-2 border-[#4d7cff] px-2.5 text-[12.5px] font-medium text-white">
                <FileCode2 className="size-3.5 text-[#8fb0ff]" /> solution.js
              </span>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-[12px] text-white/55">
                <RotateCcw /> Reset
              </Button>
            </div>
            <div className="min-h-[260px] flex-1 overflow-hidden">
              <CodeMirror value={code} onChange={onChange} theme="dark" extensions={extensions} height="100%" className="h-full" aria-label="Code editor" />
            </div>

            <div className="max-h-[42%] min-h-[128px] overflow-y-auto border-t border-white/[0.06] bg-card">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.05] bg-card px-4 py-2.5">
                <span className="flex items-center gap-2 text-[13px] font-medium" aria-live="polite">
                  <FlaskConical className="size-3.5 text-white/45" />
                  {!outcome ? (
                    "Tests"
                  ) : "error" in outcome ? (
                    <span className="text-[#fca5a5]">Couldn&rsquo;t run</span>
                  ) : (
                    <span className={allPassed ? "text-[#6ee7b7]" : "text-[#fcd34d]"}>
                      {passed}/{total} tests passed
                    </span>
                  )}
                </span>
                {outcome && "results" in outcome ? (
                  <span className="flex gap-1" aria-hidden>
                    {outcome.results.map((r, i) => (
                      <span key={i} className={cn("h-1.5 w-4 rounded-full", r.pass ? "bg-[#34d399]" : "bg-[#f87171]")} />
                    ))}
                  </span>
                ) : null}
              </div>
              {outcome && "error" in outcome ? (
                <pre className="m-3 whitespace-pre-wrap rounded-lg border border-[#f87171]/20 bg-[#f87171]/[0.06] px-3 py-2.5 font-mono text-[12.5px] text-[#fecaca]">{outcome.error}</pre>
              ) : outcome ? (
                <ol className="m-0 grid list-none gap-1.5 p-3">
                  {outcome.results.map((r, i) => {
                    const test = problem.tests[i]!;
                    return (
                      <li key={i} className={cn("rounded-lg border px-3 py-2 font-mono text-[12px]", r.pass ? "border-white/[0.05] bg-white/[0.015]" : "border-[#f87171]/20 bg-[#f87171]/[0.04]")}>
                        <div className="flex items-center gap-2">
                          {r.pass ? <CircleCheck className="size-3.5 text-[#34d399]" /> : <CircleX className="size-3.5 text-[#f87171]" />}
                          <span className={cn(r.pass ? "text-white/70" : "text-foreground")}>Test {i + 1}</span>
                          {r.ms !== undefined ? <span className="ml-auto text-muted-foreground">{r.ms < 1 ? "<1" : Math.round(r.ms)} ms</span> : null}
                        </div>
                        {!r.pass ? (
                          <div className="mt-1.5 grid gap-0.5 pl-[22px] text-white/70">
                            <span>
                              <span className="text-muted-foreground">input </span>
                              {test.args.map((a) => JSON.stringify(a)).join(", ")}
                            </span>
                            <span>
                              <span className="text-muted-foreground">expected </span>
                              {JSON.stringify(test.expected)}
                            </span>
                            <span>
                              <span className="text-muted-foreground">{r.error ? "error " : "got "}</span>
                              <span className={r.error ? "text-[#fecaca]" : undefined}>{r.error ?? r.actual}</span>
                            </span>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="m-0 px-4 py-3 text-[12.5px] text-muted-foreground">Run your code against {problem.tests.length} tests. Submitting runs them again and asks for a review.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </AppPage>
  );
}
