import { Code, Database, MessagesSquare, PenTool, Target, type LucideIcon } from "lucide-react";

/** Icon and colour for each role category, shared by the role pages. */
export const CATEGORY_META: Record<string, { icon: LucideIcon; color: string }> = {
  Engineering: { icon: Code, color: "#4d7cff" },
  Data: { icon: Database, color: "#2dd4bf" },
  Design: { icon: PenTool, color: "#f472b6" },
  Product: { icon: Target, color: "#f59e0b" },
  Behavioral: { icon: MessagesSquare, color: "#a78bfa" },
};

export const categoryMeta = (category: string) => CATEGORY_META[category] ?? { icon: Code, color: "#4d7cff" };
