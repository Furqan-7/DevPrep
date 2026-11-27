"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearInsightsCache } from "@/lib/insights";

export interface Account {
  signedIn: boolean;
  name: string;
  initials: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "·";

/**
 * The signed-in user as stored by the auth pages. null until read after mount, so the
 * server render and the first client render match.
 */
export function useAccount() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let name = "";
    let signedIn = false;
    try {
      signedIn = !!localStorage.getItem("token");
      name = localStorage.getItem("username") ?? "";
    } catch {
      /* storage blocked: treat as signed out */
    }
    setAccount({ signedIn, name, initials: initialsOf(name) });
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    } catch {
      /* ignore */
    }
    clearInsightsCache();
    router.push("/");
  }, [router]);

  return { account, signOut };
}
