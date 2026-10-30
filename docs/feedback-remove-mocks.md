# Removing Feedback Mocks

This guide explains how to transition from the temporary mock data layer to the real backend API.

## 1. Disabling Mocks via Environment Variables

The frontend dynamically checks `NEXT_PUBLIC_FEEDBACK_MOCK`.

To switch to the live backend:
1. Open `.env` (or set the deployment environment variables).
2. Set:
   ```env
   NEXT_PUBLIC_FEEDBACK_MOCK=false
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com # or http://localhost:8080 in dev
   ```

The live backend is now the default: `apps/frontend/lib/feedback/api.ts` calls `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`) with the `token` header from `localStorage` plus `credentials: "include"` for cookie logins. Set `NEXT_PUBLIC_FEEDBACK_MOCK=true` to use the local mock data layer instead.

## 2. Backend Implementation Checklist

Ensure your backend implements all endpoints documented in `docs/feedback-api.md`:

- [x] `GET /api/feedback/summary`
- [x] `GET /api/feedback/sessions` (supports `category`, `q`, `sort`, `cursor`, `limit`)
- [x] `GET /api/feedback/gaps`
- [x] `GET /api/feedback/frequency`
- [x] `GET /api/feedback/goal`
- [x] `PUT /api/feedback/goal`
- [x] `GET /api/feedback/roles/:roleId` (supports role category tracks, returns `RoleFeedback` shape with per-skill aggregates, strengths, gaps, and next step)

## 3. Deleting Mock Files

Once all backend endpoints are deployed and validated:

1. Delete the mock directory:
   ```bash
   rm -rf apps/frontend/lib/feedback/mock
   ```

2. Clean up `apps/frontend/lib/feedback/api.ts`:
   - Remove the `useMock` constant.
   - Remove `mockRequest` and the dynamic `import("./mock")` blocks in:
     - `getSummary()`
     - `getSessions()`
     - `getGaps()`
     - `getFrequency()`
     - `getGoal()`
     - `putGoal()`
     - `getRoleFeedback()`
