"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-dp-ln bg-dp-sf text-dp-ink transition-colors hover:border-dp-ink cursor-pointer ${className}`}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
