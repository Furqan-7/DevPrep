"use client";

import { useEffect, useState } from "react";

/** Whether a session token is stored; null until read after mount, so SSR and the first render match. */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setSignedIn(!!localStorage.getItem("token"));
    } catch {
      setSignedIn(false);
    }
  }, []);
  return signedIn;
}
