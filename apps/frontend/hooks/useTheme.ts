"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

/** Reads and toggles the global `data-theme` attribute (initialised in app/layout.tsx). */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("devprep-theme", next);
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
