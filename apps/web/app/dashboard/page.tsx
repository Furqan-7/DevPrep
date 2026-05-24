"use client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import JobsGrid from "@/components/jobs/JobsGrid";
import { HARDCODED_JOBS } from "@/data/jobs";
import DSAPage from "@/app/DSA/page";

const NAV_TITLES: Record<string, string> = {
  "All Jobs": "Live Job Openings",
  "Startup Jobs": "Startup Hiring",
  "Company Jobs": "Company Hiring",
  "FAANG Jobs": "FAANG Openings",
  "HFT Jobs": "HFT Openings",
  "Remote Jobs": "Remote Openings",
  "Internships Hiring": "Internships",
  "Hiring Calendar": "Hiring Calendar",
  "questions": "Company Question Sets",
};

const NAV_SUBTITLES: Record<string, string> = {
  "All Jobs": "Track startups and companies that are hiring immediately.",
  "Startup Jobs": "Early-stage to Series C startups actively hiring.",
  "Company Jobs": "Established companies with open engineering roles.",
  "FAANG Jobs": "Facebook, Amazon, Apple, Netflix, Google and more.",
  "HFT Jobs": "High-frequency trading and quant finance firms.",
  "Remote Jobs": "Fully remote roles from companies worldwide.",
  "Internships Hiring": "Summer and off-cycle internship opportunities.",
};

function getCategoryFilter(nav: string) {
  const map: Record<string, string> = {
    "Startup Jobs": "startup",
    "Company Jobs": "company",
    "FAANG Jobs": "faang",
    "HFT Jobs": "hft",
    "Remote Jobs": "remote",
    "Internships Hiring": "internship",
  };
  return map[nav] ?? "all";
}

export default function DashboardPage() {
  return (
    <DashboardShell defaultNav="All Jobs">
      {(activeNav) => {
        const title = NAV_TITLES[activeNav] ?? activeNav;
        const subtitle = NAV_SUBTITLES[activeNav] ?? "";

        // Filter jobs based on active nav
        const categoryFilter = getCategoryFilter(activeNav);
        const jobs =
          categoryFilter === "all"
            ? HARDCODED_JOBS
            : HARDCODED_JOBS.filter((j) => {
                if (categoryFilter === "remote") return j.type === "remote";
                if (categoryFilter === "internship") return j.type === "internship";
                return j.category === categoryFilter;
              });

        // Show DSA page for "Company Question Sets"
        if (activeNav === "questions") {
          return <DSAPage />;
        }

        return (
          <div style={{ padding: "24px 28px", fontFamily: "Inter, system-ui, sans-serif" }}>
            {/* Page header */}
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
                {title}
              </h1>
              {subtitle && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8a8f98" }}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Jobs grid with filters */}
            <JobsGrid jobs={jobs} showFilters={true} />
          </div>
        );
      }}
    </DashboardShell>
  );
}
