import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import styles from "./RoleFeedback.module.css";

export default function RoleNotFound() {
  return (
    <DashboardShell themed>
      <div className={styles.page}>
        <div className={styles.wrap} style={{ paddingTop: "48px" }}>
          <div className={styles.empty} role="alert">
            <Target size={36} color="#eb3a14" />
            <h2>Role Not Found</h2>
            <p>We could not find feedback records for this role.</p>
            <Link className={styles.ctaButton} href="/dashboard/ai-interview/feedback">
              <ArrowLeft size={14} /> Back to All Feedback
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
