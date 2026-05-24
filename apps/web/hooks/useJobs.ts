import { useState, useEffect, useCallback } from "react";
import type { Job } from "@/types/job";

interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches jobs from /api/jobs which calls Adzuna, Remotive, and JSearch in parallel.
 * Normalizes results into the unified Job type.
 *
 * NOTE: Not wired up yet — use HARDCODED_JOBS from data/jobs.ts for now.
 * Wire this up when /api/jobs route is implemented.
 */
export function useJobs(): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Job[] = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}
