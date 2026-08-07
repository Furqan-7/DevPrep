import { redirect } from "next/navigation";

/**
 * /dashboard → redirect to AI Interview role-selection page.
 * Jobs, DSA, and CS Core are not part of the current deployment.
 */
export default function DashboardPage() {
  redirect("/dashboard/ai-interview");
}
