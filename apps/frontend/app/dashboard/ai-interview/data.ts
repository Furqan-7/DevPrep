export type RoleData = {
  title: string;
  duration: number; // minutes
  skills: string[];
  questions: string[];
};

/** @deprecated use roleSlug from data/roles; kept so existing imports keep working. */
export { roleSlug as titleToSlug } from "@/data/roles";
