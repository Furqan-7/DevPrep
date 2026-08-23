/**
 * useCurrentUser — resolves the logged-in user's identity regardless of auth method.
 *
 * DevPrep supports two auth paths that store the user's identity differently:
 *
 *  1. JWT login (email/password sign-in or sign-up)
 *     → The backend returns { token, username } which the sign-in/up pages
 *       persist to localStorage under the keys "token" and "username".
 *     → We read `localStorage.getItem("username")` directly — no network call.
 *
 *  2. Google OAuth
 *     → The backend /api/auth/google/callback sets an httpOnly cookie called
 *       "token" (a signed JWT containing { userId, username }).  Because it is
 *       httpOnly, JS cannot read it directly.
 *     → We hit /api/auth/me — a lightweight endpoint that reads the cookie,
 *       verifies the JWT server-side, and returns { username, email }.
 *       localStorage.username will be empty for this path.
 *
 * Resolution order (both cases normalise into { name, email }):
 *   a) If localStorage.username is non-empty  → use it immediately (JWT path).
 *   b) Otherwise fetch /api/auth/me            → use the response (Google OAuth path).
 *   c) If the /me call fails or returns nothing → user is unauthenticated; name = null.
 */

"use client";

import { useState, useEffect } from "react";

export interface CurrentUser {
  /** Display name (username for JWT users, full name for Google users). */
  name: string;
  /** User's email address, if returned by the /me endpoint. */
  email: string | null;
}

interface UseCurrentUserResult {
  /** The resolved user, or null while loading / unauthenticated. */
  user: CurrentUser | null;
  /** True while the async /me fetch is in-flight (JWT path resolves synchronously). */
  isLoading: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safety: this hook only runs in the browser (no SSR side-effects).
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // ── Path A: JWT login ─────────────────────────────────────────────────
    // sign-in and sign-up both write "username" to localStorage immediately
    // after a successful response, so this resolves without any network call.
    const storedName = localStorage.getItem("username");
    if (storedName) {
      setUser({ name: storedName, email: null });
      setIsLoading(false);
      return;
    }

    // ── Path B: Google OAuth (httpOnly cookie) ────────────────────────────
    // No localStorage entry exists, which means the user authenticated via
    // Google OAuth. The backend set an httpOnly "token" cookie that we can't
    // read from JS, so we ask the server to decode it for us via /api/auth/me.
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    fetch(`${apiBase}/api/auth/me`, {
      // `include` sends the httpOnly cookie cross-origin so the server can
      // verify the JWT and return the user's identity.
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        if (data?.username) {
          setUser({ name: data.username, email: data.email ?? null });
        }
      })
      .catch(() => {
        // /me failed (expired cookie, not logged in, network error) — leave
        // user as null so the caller can handle the unauthenticated state.
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { user, isLoading };
}
