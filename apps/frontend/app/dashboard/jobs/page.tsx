import DashboardShell from "@/components/dashboard/DashboardShell";
import JobsGrid from "@/components/jobs/JobsGrid";
import { HARDCODED_JOBS } from "@/data/jobs";

export default function JobsPage() {
  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto px-10 pt-6 pb-12" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -0.3,
            }}
          >
            Live Job Openings
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8a8f98" }}>
            Track startups and companies that are hiring immediately.
          </p>
        </div>
        <JobsGrid jobs={HARDCODED_JOBS} showFilters={true} />
      </div>
    </DashboardShell>
  );
}
