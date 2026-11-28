import { Code, Database, MessagesSquare, PenTool, Target, type LucideIcon } from "lucide-react";

/** Icon and colour for each role category, shared by the role pages. */
export const CATEGORY_META: Record<string, { icon: LucideIcon; color: string }> = {
  Engineering: { icon: Code, color: "#7c9cff" },
  Data: { icon: Database, color: "#5fb8a5" },
  Design: { icon: PenTool, color: "#e39a63" },
  Product: { icon: Target, color: "#d9b25c" },
  Behavioral: { icon: MessagesSquare, color: "#a1a1aa" },
};

export const categoryMeta = (category: string) => CATEGORY_META[category] ?? { icon: Code, color: "#4d7cff" };
