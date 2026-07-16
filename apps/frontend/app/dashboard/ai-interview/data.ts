export type RoleData = {
  title: string;
  duration: number; // minutes
  skills: string[];
  questions: string[];
};

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[&]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
