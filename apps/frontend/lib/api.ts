import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage on every request (client-side only)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    console.log("[api] token from localStorage:", token ? `${token.slice(0, 20)}…` : "null (not logged in)");
    if (token) {
      config.headers["token"] = token;
    }
  }
  return config;
});

export default api;

/* ───────── errors ───────── */

/** `conflict` (409) means a precondition isn't met yet, e.g. no answers or no resume. */
export type ApiErrorKind = "auth" | "not_found" | "conflict" | "limit" | "invalid" | "network" | "server";

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string) {
    super(message);
  }
}

function toError(err: unknown): ApiError {
  const e = err as { response?: { status?: number; data?: { message?: string } }; request?: unknown };
  const status = e.response?.status;
  const message = e.response?.data?.message;
  if (!e.response) return new ApiError("network", "Can't reach the server. Check your connection and try again.");
  // MiddleWhere answers 411 (no token), 403 (expired) or 404 with "Invalid Token".
  if (status === 411 || status === 403 || status === 401 || message === "Invalid Token") {
    return new ApiError("auth", "Please sign in again.");
  }
  if (status === 404) return new ApiError("not_found", message ?? "Not found.");
  if (status === 409) return new ApiError("conflict", message ?? "That can't be done yet.");
  if (status === 429) return new ApiError("limit", message ?? "You've reached the limit for this.");
  if (status === 400 || status === 422) return new ApiError("invalid", message ?? "Something about that request wasn't right.");
  return new ApiError("server", message ?? "Something went wrong. Please try again.");
}

/** Awaits an API call, turning failures into an ApiError with a message fit to show. */
export async function call<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    return (await p).data;
  } catch (err) {
    throw toError(err);
  }
}

/** Sign-in page that returns to `path` afterwards. */
export const signInHref = (path: string) => `/auth/signin?next=${encodeURIComponent(path)}`;
