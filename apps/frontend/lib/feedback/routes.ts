/**
 * DevPrep Feedback Routes
 * Single helper for building safe, URL-encoded role feedback URLs.
 */
export function roleFeedbackHref(roleId: string): string {
  return `/feedback/role/${encodeURIComponent(roleId)}`;
}
