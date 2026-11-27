"use client";

/** Coding round problem list, with the signed-in user's status and best review score on each. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { AppPage, EmptyState, panel } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { DIFFICULTY_TONE, listCodingProblems, listSubmissions, type CodingProblem, type Submission } from "@/lib/practice";
import { cn } from "@/lib/utils";

export function CodingList() {
  const [problems, setProblems] = useState<CodingProblem[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    listCodingProblems()
      .then((p) => alive && setProblems(p))
      .catch((err: unknown) => alive && setError(err instanceof ApiError ? err.message : "Couldn't load the problems."));
    if (localStorage.getItem("token")) {
      listSubmissions()
        .then((s) => alive && setSubmissions(s))
        .catch(() => {}); // statuses are optional; the list works without them
    }
    return () => {
      alive = false;
    };
  }, []);

  const status = useMemo(() => {
    const map = new Map<string, { solved: boolean; best: number }>();
    for (const s of submissions) {
      const prev = map.get(s.problem);
      map.set(s.problem, { solved: (prev?.solved ?? false) || s.passed === s.total, best: Math.max(prev?.best ?? 0, s.score) });
    }
    return map;
  }, [submissions]);

  return (
    <AppPage
      title="Coding round"
      description="Solve interview problems in JavaScript, run the tests in your browser, then get your code reviewed like a real interviewer would."
    >
      <div className={panel}>
        {error ? (
          <EmptyState title="The problems didn't load" body={error}>
            <Button variant="outline" onClick={() => location.reload()}>
              Try again
            </Button>
          </EmptyState>
        ) : !problems ? (
          <div className="grid gap-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent [&>th]:text-[12.5px] [&>th]:font-normal [&>th]:text-muted-foreground">
                <TableHead className="w-10 pl-5" />
                <TableHead>Problem</TableHead>
                <TableHead className="hidden sm:table-cell">Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="pr-5 text-right">Best review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map((p) => {
                const s = status.get(p.slug);
                const Icon = s?.solved ? CheckCircle2 : s ? CircleDot : Circle;
                return (
                  <TableRow key={p.slug} className="relative border-white/[0.06]">
                    <TableCell className="pl-5">
                      <Icon aria-label={s?.solved ? "Solved" : s ? "Attempted" : "Not started"} className={cn("size-4", s?.solved ? "text-[#7ee2a8]" : "text-white/25")} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/coding/${p.slug}`} className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring">
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{p.topic}</TableCell>
                    <TableCell className={DIFFICULTY_TONE[p.difficulty]}>{p.difficulty}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums text-muted-foreground">{s ? `${s.best}/10` : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AppPage>
  );
}
