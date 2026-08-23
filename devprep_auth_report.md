# DevPrep — Authentication System: Full Interview Reference

> Everything in this document is grounded in the actual code.
> File paths, route names, and variable names all come directly from the repo.

---

## 1. Auth Overview

DevPrep has **two independent authentication methods** that coexist:

| Method | Trigger | Token storage | Identity storage |
|---|---|---|---|
| **Email / password (JWT)** | Sign-up or Sign-in form | `localStorage["token"]` | `localStorage["username"]` |
| **Google OAuth (cookie)** | "Continue with Google" button | `httpOnly` cookie named `token` | Fetched on demand via `/api/auth/me` |

Both paths produce the same JWT format — `{ userId, username }` — signed with the same `JWT_TOKEN` secret. The difference is only **where** that JWT lives after the server creates it:

- Email/password → the server hands it to the client in a JSON response body → client stores it in `localStorage`.
- Google OAuth → the server sets it as an `httpOnly` cookie directly in the redirect response → it never touches the client's JavaScript.

Both methods exist because Google OAuth provides a fast, password-free experience while email/password gives users who don't have or don't want to use a Google account an alternative.

---

## 2. Google OAuth Flow (Cookie-Based) — Step by Step

### Files involved
| File | Role |
|---|---|
| `apps/frontend/app/auth/signin/page.tsx` | Has the "Continue with Google" button |
| `apps/backend/src/routes/auth.route.ts` | Registers `GET /api/auth/google` and `GET /api/auth/google/callback` |
| `apps/backend/src/controllers/auth.controller.ts` | `google()` and `googleCallback()` handlers |
| `apps/backend/src/index.ts` | Registers `cookieParser()` middleware so cookies can be read |
| `apps/frontend/hooks/useCurrentUser.ts` | Detects the Google path and calls `/api/auth/me` to resolve the name |
| `apps/backend/src/controllers/auth.controller.ts` | `me()` handler — decodes the cookie and returns `{ username, email }` |

### Step-by-step flow

```
User clicks "Continue with Google"
       │
       ▼
apps/frontend/app/auth/signin/page.tsx
  handleOauth()
  window.location.href = `${NEXT_PUBLIC_API_URL}/api/auth/google`
       │
       ▼  (browser navigates — full page redirect)
GET /api/auth/google  →  auth.controller.ts :: google()
  Builds Google's OAuth URL with scopes: userinfo.email + userinfo.profile
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?...")
       │
       ▼  (user sees Google consent screen, approves)
GET /api/auth/google/callback?code=<one-time-code>  →  auth.controller.ts :: googleCallback()
  1. POST https://oauth2.googleapis.com/token   ← exchange code for access_token
  2. GET  https://www.googleapis.com/oauth2/v2/userinfo  ← fetch { id, email, name }
  3. prisma.user.upsert({ where: { email }, update: { username: name }, create: { username: name, email } })
  4. prisma.account.upsert(...)  ← link the Google account to the user row
  5. jwt.sign({ userId: user.id, username: user.username }, JWT_TOKEN, { expiresIn: "7d" })
  6. res.cookie("token", token, { httpOnly: true, secure: (prod), sameSite: "lax", maxAge: 7d })
  7. res.redirect("http://localhost:3000/dashboard")   ← back to the frontend
       │
       ▼  (browser lands on /dashboard, cookie is now set automatically by the browser)
localStorage["username"] is EMPTY  ← nothing was written to localStorage
       │
       ▼
apps/frontend/hooks/useCurrentUser.ts  (runs inside DashboardShell)
  localStorage.getItem("username") → ""  → takes Path B
  fetch(`/api/auth/me`, { credentials: "include" })  ← sends the httpOnly cookie
       │
       ▼
GET /api/auth/me  →  auth.controller.ts :: me()
  req.cookies.token  ← cookie-parser middleware parsed this from the Cookie header
  jwt.verify(token, JWT_TOKEN)  → { userId: number, username: string }
  prisma.user.findUnique({ where: { id: decoded.userId }, select: { username, email } })
  return res.json({ username: "Furqan Ali", email: "furqan@example.com" })
       │
       ▼
useCurrentUser sets user = { name: "Furqan Ali", email: "furqan@example.com" }
DashboardShell passes displayName = "Furqan Ali" to <TopBar username="Furqan Ali" />
Profile card renders the correct name ✓
```

### Why `httpOnly`?
An `httpOnly` cookie cannot be read or modified by JavaScript — only the browser can send it. This prevents XSS attacks from stealing the token. The trade-off is that the frontend cannot decode it client-side, which is why the `/api/auth/me` endpoint exists.

---

## 3. Normal Login / Signup Flow (JWT-Based) — Step by Step

### Files involved
| File | Role |
|---|---|
| `apps/frontend/app/auth/signin/page.tsx` | Login form, calls `/api/auth/signin` |
| `apps/frontend/app/auth/signup/page.tsx` | Signup form, calls `/api/auth/signup` |
| `apps/backend/src/routes/auth.route.ts` | `POST /api/auth/signin`, `POST /api/auth/signup` |
| `apps/backend/src/controllers/auth.controller.ts` | `signin()` and `signup()` handlers |
| `apps/backend/src/types.ts` | Zod schemas `signinSchema`, `signupSchema` for input validation |
| `apps/frontend/lib/api.ts` | Axios instance — attaches the JWT to every outbound request |
| `apps/backend/src/Middlewhere.ts` | Verifies the JWT on protected backend routes |
| `apps/frontend/hooks/useCurrentUser.ts` | Reads `localStorage["username"]` — no network call needed |

### Sign-up flow

```
User fills form → POST /api/auth/signup  →  auth.controller.ts :: signup()
  signupSchema.safeParse(req.body)  ← validates with Zod
  bcrypt.hash(password, 10)
  prisma.user.create({ username, email, password: hashedPassword })
  jwt.sign({ userId: user.id, username: user.username }, JWT_TOKEN, { expiresIn: "7d" })
  return res.json({ token, username: user.username, id: user.id, success: true })
       │
       ▼
apps/frontend/app/auth/signup/page.tsx
  localStorage.setItem("token", data.token)
  localStorage.setItem("username", data.username)
  router.push("/dashboard/ai-interview")
```

### Sign-in flow

```
User fills form → POST /api/auth/signin  →  auth.controller.ts :: signin()
  signinSchema.safeParse(req.body)  ← validates with Zod
  prisma.user.findUnique({ where: { email } })
  bcrypt.compareSync(password, user.password)
  jwt.sign({ userId, username }, JWT_TOKEN, { expiresIn: "7d" })
  return res.json({ token, username, id, success: true })
       │
       ▼
apps/frontend/app/auth/signin/page.tsx
  localStorage.setItem("token", res.data.token)
  localStorage.setItem("username", res.data.username)
  router.push("/dashboard/ai-interview")
       │
       ▼
apps/frontend/hooks/useCurrentUser.ts
  localStorage.getItem("username") → "Furqan"  → Path A (instant, no network call)
  setUser({ name: "Furqan", email: null })
```

### How the JWT is attached to API calls

```typescript
// apps/frontend/lib/api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["token"] = token;   // ← sent as a custom header, not Authorization
  }
  return config;
});
```

Every axios call made through the `api` instance automatically includes the JWT in a custom header called `token` (not the standard `Authorization: Bearer ...` header — a design choice worth noting, see Section 10).

### How the JWT is verified on the backend

```typescript
// apps/backend/src/Middlewhere.ts
const token = req.headers.token;              // reads the custom "token" header
const decoded = jwt.verify(token, JWT_TOKEN); // throws if expired/invalid
res.locals.userId = decoded.userId;           // downstream handlers read this
next();
```

---

## 4. How the Two Are Unified — The `useCurrentUser` Hook

**File:** `apps/frontend/hooks/useCurrentUser.ts`

The hook uses a simple two-path resolution that produces one consistent `{ name, email }` shape:

```
useCurrentUser() runs on mount
        │
        ├─── localStorage["username"] non-empty?
        │         YES → Path A (JWT login)
        │               setUser({ name: storedName, email: null })
        │               isLoading = false  (synchronous — no network)
        │
        └─── localStorage["username"] empty?
                  YES → Path B (Google OAuth)
                        fetch("/api/auth/me", { credentials: "include" })
                        → { username, email } from server
                        setUser({ name: username, email })
                        isLoading = false  (async — one network round-trip)
```

**The normalized shape:**
```typescript
interface CurrentUser {
  name: string;        // "Furqan Ali" regardless of auth method
  email: string | null; // null for JWT path (not returned by the login endpoint)
}
```

`DashboardShell` (`apps/frontend/components/dashboard/DashboardShell.tsx`) is the single consumer:

```typescript
const { user, isLoading } = useCurrentUser();
const displayName = isLoading ? "" : (user?.name ?? "");
<TopBar username={displayName} />
```

`TopBar` just receives `username: string` — it has no idea which auth method was used.

---

## 5. Protected Routes / Middleware

### Backend protection

**File:** `apps/backend/src/Middlewhere.ts`

This middleware is applied to any route that requires a logged-in user. Currently it guards the interview routes:

```typescript
// apps/backend/src/routes/interview.route.ts
import { MiddleWhere } from "../Middlewhere";
router.use(MiddleWhere);  // all interview endpoints require a valid JWT header
```

It reads `req.headers.token`, verifies it, and writes `res.locals.userId` for downstream handlers to use.

### Frontend protection

There is **no Next.js `middleware.ts`** file in this project. Dashboard pages do not have explicit route guards at the framework level. Protection relies on:

1. The fact that the dashboard pages use `DashboardShell`, which calls `useCurrentUser()` — if this returns `null`, the user effectively sees empty state
2. Any API call from the dashboard to the backend will be rejected by `MiddleWhere` if the token is missing/expired

> **Interview note:** This is an acknowledged gap — see Section 10 for the improvement.

---

## 6. Logout Flow

**File:** `apps/frontend/components/dashboard/TopBar.tsx`

```typescript
const handleSignOut = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  router.push("/");
};
```

**For JWT users:** This fully logs them out — the token is deleted from localStorage so future API calls won't include it, and the frontend reads no name from `useCurrentUser`.

**For Google OAuth users:** This is a **partial logout**. The `localStorage` keys were never set in the first place (Google OAuth never writes them), but the `httpOnly` cookie is **not** cleared. The browser will continue sending it on requests. However, because the user is redirected to `/` (the landing page, outside the dashboard), and the cookie is not sent to the `/api/auth/me` fetch again until they navigate to the dashboard, in practice the session appears ended.

> **The correct fix** would be a `GET /api/auth/logout` endpoint that calls `res.clearCookie("token")`, which the frontend calls before redirecting. See Section 10.

---

## 7. Full File Map

### Backend (`apps/backend/src/`)

| File | What it does |
|---|---|
| `index.ts` | Express app setup: registers `cookieParser()`, `cors()`, and mounts auth + interview routers |
| `routes/auth.route.ts` | Declares auth routes: `POST /signup`, `POST /signin`, `GET /google`, `GET /google/callback`, `GET /me` |
| `routes/interview.route.ts` | Declares interview routes, all protected by `MiddleWhere` |
| `controllers/auth.controller.ts` | `signup`, `signin`, `google`, `googleCallback`, `me` — all auth business logic lives here |
| `Middlewhere.ts` | JWT verification middleware — reads `req.headers.token`, sets `res.locals.userId` |
| `types.ts` | Zod schemas: `signupSchema` (username, email, password), `signinSchema` (email, password) |

### Frontend (`apps/frontend/`)

| File | What it does |
|---|---|
| `hooks/useCurrentUser.ts` | Normalizes both auth methods into `{ name, email }` — the single source of truth for user identity |
| `lib/api.ts` | Axios instance with request interceptor that attaches `localStorage["token"]` as the `token` header |
| `app/auth/signin/page.tsx` | Sign-in form: calls `POST /api/auth/signin`, handles Google OAuth redirect, stores credentials |
| `app/auth/signup/page.tsx` | Sign-up form: calls `POST /api/auth/signup`, stores credentials in localStorage |
| `components/dashboard/DashboardShell.tsx` | Calls `useCurrentUser()` and passes `displayName` to `TopBar` |
| `components/dashboard/TopBar.tsx` | Renders the profile pill (avatar + name + dropdown); reads `username` prop only — no auth logic |
| `components/auth/AuthShared.tsx` | Shared UI primitives for auth pages (Logo, InputField, OAuthButton, etc.) |

---

## 8. Key Concepts to Know

### Sessions vs Tokens
A **session** is server-side: the server stores state (who is logged in), and the client just holds a session ID (usually in a cookie). Every request, the server looks up that ID.

A **token** (JWT) is stateless: all the user's identity data is encoded inside the token itself. The server doesn't store anything — it just verifies the signature. DevPrep uses JWTs for both auth methods; the token contains `{ userId, username }`.

### Cookies vs localStorage
| | `localStorage` | `httpOnly` cookie |
|---|---|---|
| Accessible by JS | Yes | **No** |
| Sent automatically by browser | No — must be attached manually | **Yes** — on every matching request |
| XSS risk | **High** — any script can steal it | Low — JS can't read it |
| CSRF risk | Low | **Higher** — auto-sent by browser |
| DevPrep uses for | JWT login token + username | Google OAuth JWT |

### Custom Hooks for Data Fetching
`useCurrentUser` is a **custom React hook** — a function starting with `use` that encapsulates stateful logic so it can be reused across components. It uses `useState` + `useEffect` to fetch/read user data once on mount and expose `{ user, isLoading }`. This keeps the auth resolution logic in one place rather than duplicated across every page that needs the user's name.

### Data Normalization
Both auth paths return user data in different shapes — JWT login gives back `{ token, username }` from the backend; Google OAuth eventually gives `{ username, email }` from `/api/auth/me`. The hook normalizes both into `CurrentUser: { name, email }` so the rest of the UI only ever deals with one shape. This is the same concept as an API adapter or DTO (Data Transfer Object) pattern.

### OAuth 2.0 Authorization Code Flow
1. App redirects to provider (Google) with `client_id`, `redirect_uri`, `scopes`
2. User approves on Google's page
3. Google redirects back to `redirect_uri` with a one-time `code`
4. **Server** exchanges `code` for `access_token` (this step is server-side to keep `client_secret` private)
5. Server uses `access_token` to fetch user profile from Google API
6. Server creates/finds the user in its own DB and issues its own session/token

---

## 9. Likely Interview Questions

**Q1: "You had two different auth methods returning user data in different shapes — how did you handle that?"**

> I created a custom hook called `useCurrentUser` that acts as a single adapter for both paths. For email/password login, the sign-in page already stores the username in `localStorage`, so the hook reads it synchronously — no network call. For Google OAuth, `localStorage` is empty because the token was set as an `httpOnly` cookie by the server during the OAuth redirect. In that case, the hook calls a `/api/auth/me` endpoint with `credentials: "include"` so the browser sends the cookie, and the server decodes it and returns the username. Both paths produce the same `{ name, email }` shape, so every component downstream is completely unaware of which auth method was used.

---

**Q2: "Why is the Google OAuth token stored in an `httpOnly` cookie rather than localStorage like the JWT login?"**

> With Google OAuth, the token is set by the server during a redirect — there's no JSON response that JavaScript can intercept. The server calls `res.cookie("token", ...)` with `httpOnly: true`, which means the browser stores it automatically and sends it on future requests, but JavaScript can never read or modify it. This is actually more secure than localStorage for XSS protection. For email/password login, the token arrives in a JSON response body, so the client code stores it in `localStorage` manually. Ideally both would use `httpOnly` cookies, but that would require a bigger refactor of the email/password flow.

---

**Q3: "What happens if the user data hasn't loaded yet when the component renders?"**

> The `useCurrentUser` hook starts with `isLoading: true` and `user: null`. `DashboardShell` checks `isLoading` and passes an empty string to `TopBar` while waiting. `TopBar` handles an empty `username` gracefully — the avatar shows `"…"` as a placeholder instead of crashing on `.slice(0, 2)`. This loading state only ever occurs on the Google OAuth path; for JWT login, `localStorage` is synchronous so the name resolves immediately without any visible flash.

---

**Q4: "How does the frontend attach the JWT to API requests?"**

> I created a shared Axios instance in `lib/api.ts` with a request interceptor. Before every request fires, the interceptor reads `localStorage.getItem("token")` and sets it as a custom header named `token`. Every component that makes API calls imports this instance instead of raw axios, so the token attachment is automatic and centralized. The backend middleware (`Middlewhere.ts`) then reads `req.headers.token` to verify it.

---

**Q5: "How does the backend know which user is making a request?"**

> The `Middlewhere.ts` middleware runs before any protected route handler. It reads the JWT from the custom `token` header, calls `jwt.verify()` with the server's secret, and extracts `userId` from the decoded payload. It then writes `userId` to `res.locals.userId` — Express's per-request storage — so any downstream handler can access it without re-decoding the token.

---

**Q6: "What's the `/api/auth/me` endpoint for and when is it called?"**

> It's a "who am I?" endpoint specifically for the Google OAuth path. Because the OAuth token lives in an `httpOnly` cookie that JavaScript can't read, the frontend has no way to know the user's name without asking the server. The `me` endpoint reads `req.cookies.token` (made available by the `cookie-parser` middleware), verifies it, queries the database for fresh `username` and `email`, and returns them. It's only called when `localStorage.username` is empty — so JWT login users never trigger this endpoint.

---

**Q7: "What would you do differently if you rebuilt this auth system from scratch?"**

> A few things. First, I'd store the JWT in an `httpOnly` cookie for both auth methods — not just Google OAuth. That would eliminate the XSS risk from localStorage entirely and simplify the frontend since `useCurrentUser` would always use the `/me` endpoint. Second, I'd add a proper logout endpoint (`GET /api/auth/logout`) that calls `res.clearCookie("token")`, so Google OAuth sessions are actually terminated rather than just relying on the user navigating away. Third, I'd implement refresh tokens — the current JWTs expire in 7 days with no renewal mechanism, so users silently lose access.

---

**Q8: "How would you add route protection to the frontend?"**

> Right now there's no `middleware.ts` in the Next.js app, so dashboard pages aren't explicitly guarded at the framework level. To fix this, I'd add a `middleware.ts` at the root of the `app/` directory. It would check for either `localStorage.username` (not accessible in middleware, but the cookie is) or the `token` cookie — if neither is present, redirect to `/auth/signin`. Since Next.js middleware runs on the Edge and has access to `request.cookies`, this would work cleanly for the Google OAuth path. For the JWT path, the cookie approach would require moving the JWT to a cookie server-side as well.

---

## 10. Security Considerations & Trade-offs

### 1. JWT stored in `localStorage` is XSS-vulnerable
**Problem:** For email/password users, the JWT in `localStorage` can be stolen by any JavaScript running on the page (e.g., from a compromised npm package or a successful XSS injection). Once stolen, an attacker has a 7-day window to impersonate the user.

**Fix:** Move the JWT to an `httpOnly` cookie for the email/password path as well. The backend's `/signin` endpoint would call `res.cookie(...)` instead of returning `token` in the JSON body.

---

### 2. Missing logout for Google OAuth users
**Problem:** `handleSignOut` in `TopBar.tsx` only clears `localStorage`. It does **not** call any endpoint to clear the `token` cookie. A Google OAuth user who clicks "Sign out" still has a valid cookie in their browser for up to 7 days.

**Fix:** Add `GET /api/auth/logout` → `res.clearCookie("token")` on the backend. The frontend calls this before redirecting to `/`.

---

### 3. No refresh token mechanism
**Problem:** JWTs expire after 7 days. There's no silent refresh — the user is simply locked out on expiry with no graceful recovery.

**Fix:** Implement refresh tokens: a long-lived token (30 days) stored in a separate `httpOnly` cookie used only to issue new short-lived access tokens (15 minutes). This is the industry-standard pattern.

---

### 4. Non-standard header name for JWT (`token` instead of `Authorization`)
**Problem:** The Axios interceptor sets `config.headers["token"] = token` instead of the standard `Authorization: Bearer <token>`. This is a minor deviation from convention that could confuse other developers or be incompatible with some API gateways.

**Fix:** Change to `config.headers["Authorization"] = \`Bearer ${token}\`` and update `Middlewhere.ts` to parse `req.headers.authorization?.split(" ")[1]`.

---

### 5. CORS is configured broadly
**Problem:** The backend uses `process.env.CORS_ORIGIN || "*"` as a fallback, which in development means all origins are accepted. This is fine locally but would be dangerous if deployed without setting `CORS_ORIGIN`.

**Fix:** Always require `CORS_ORIGIN` to be explicitly set in production; throw a startup error if it's missing.
