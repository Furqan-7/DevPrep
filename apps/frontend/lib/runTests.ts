/**
 * Runs a coding-round solution against its tests in a throwaway Web Worker, so a bad
 * solution (an infinite loop, a thrown error) can't freeze or break the page.
 */

import type { CodingTest } from "@/lib/practice";

export interface TestResult {
  pass: boolean;
  actual?: string; // JSON of the returned value
  error?: string;
  ms?: number;
}

export type RunOutcome = { results: TestResult[] } | { error: string };

const TIME_LIMIT_MS = 4000;

// Plain JS so it can run from a Blob URL. Values are compared structurally, like JSON.
const WORKER_SOURCE = `
const equal = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => equal(a[k], b[k]));
};
const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));
self.onmessage = (e) => {
  const { code, functionName, tests } = e.data;
  let fn;
  try {
    fn = new Function('"use strict";\\n' + code + '\\n;return typeof ' + functionName + ' === "function" ? ' + functionName + ' : undefined;')();
  } catch (err) {
    self.postMessage({ error: String(err && err.message ? err.message : err) });
    return;
  }
  if (!fn) {
    self.postMessage({ error: "Define a function named " + functionName + "." });
    return;
  }
  const results = tests.map((t) => {
    const start = performance.now();
    try {
      const actual = fn(...structuredClone(t.args));
      return { pass: equal(actual, t.expected), actual: show(actual), ms: performance.now() - start };
    } catch (err) {
      return { pass: false, error: String(err && err.message ? err.message : err) };
    }
  });
  self.postMessage({ results });
};
`;

export function runTests(code: string, functionName: string, tests: CodingTest[]): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    const worker = new Worker(url);
    const done = (outcome: RunOutcome) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(outcome);
    };
    const timer = setTimeout(() => done({ error: `Stopped after ${TIME_LIMIT_MS / 1000} seconds. Check for an infinite loop.` }), TIME_LIMIT_MS);
    worker.onmessage = (e: MessageEvent<RunOutcome>) => done(e.data);
    worker.onerror = (e) => {
      e.preventDefault();
      done({ error: e.message || "Your code couldn't run." });
    };
    worker.postMessage({ code, functionName, tests });
  });
}
