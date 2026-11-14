import { redirect } from "next/navigation";

/** Old per-role feedback URL: show the real history, filtered to that role. */
export default async function RoleFeedbackRedirect({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  redirect(`/dashboard/ai-interview/feedback?role=${encodeURIComponent(roleId)}`);
}
