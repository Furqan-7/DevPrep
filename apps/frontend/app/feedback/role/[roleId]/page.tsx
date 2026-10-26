import { notFound } from "next/navigation";
import RoleFeedbackClient from "./RoleFeedbackClient";

// Strict format: lowercase letters, digits, and hyphens; 1 to 64 chars
const ROLE_ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface PageProps {
  params: Promise<{ roleId: string }>;
}

export default async function RoleFeedbackPage({ params }: PageProps) {
  const resolvedParams = await params;
  const roleId = resolvedParams?.roleId;

  // Validate the parameter on the server side of the route before doing anything
  if (
    !roleId ||
    typeof roleId !== "string" ||
    roleId.length > 64 ||
    !ROLE_ID_REGEX.test(roleId)
  ) {
    notFound();
  }

  return <RoleFeedbackClient roleId={roleId} />;
}
