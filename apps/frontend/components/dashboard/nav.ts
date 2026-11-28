import { ROLES, roleSlug } from "@/data/roles";
import { Code, FileChartColumn, FileText, LayoutGrid, Mic, SquareKanban, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Practice",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutGrid },
      { label: "Interviews", href: "/dashboard/ai-interview", icon: Mic },
      { label: "Reports", href: "/dashboard/reports", icon: FileChartColumn },
      { label: "Coding", href: "/dashboard/coding", icon: Code },
    ],
  },
  {
    label: "Career",
    items: [
      { label: "Applications", href: "/dashboard/applications", icon: SquareKanban },
      { label: "Resume", href: "/dashboard/resume", icon: FileText },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** The nav item for a path: the longest matching prefix. */
export function activeItem(pathname: string): NavItem | null {
  return (
    NAV_ITEMS.filter((l) => pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(`${l.href}/`))).sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}

/** Colour for a role's dot, by its place in the catalogue so it matches everywhere it appears. */
// muted, distinguishable hues; no purple or pink
const ROLE_COLORS = ["#7c9cff", "#d9b25c", "#5fb8a5", "#a1a1aa", "#e39a63", "#6fb3d9"];
const ROLE_INDEX = new Map(ROLES.map((r, i) => [roleSlug(r.title), i]));
export function roleColor(slug: string): string {
  const i = ROLE_INDEX.get(slug) ?? [...slug].reduce((h, c) => h + c.charCodeAt(0) * 7, 0);
  return ROLE_COLORS[i % ROLE_COLORS.length]!;
}
