# Codebase Audit & Integrity Check
**Date:** December 4, 2025
**Focus:** Supabase Integration, Next.js Architecture, Security

## Executive Summary
The application is currently structured as a **hybrid Next.js application** (App Router for UI, Pages Router for API) operating in a **"Single User Mode"**. Authentication is mocked at both the frontend and backend layers. 

**Critical Finding:** The backend API routes (`src/pages/api/*`) interact with Supabase using a static client that **lacks user context**. Even if "logged in" as the mock user, database operations are performed anonymously. This relies entirely on Row Level Security (RLS) being disabled or misconfigured to work, representing a significant security and data integrity risk.

## Prioritized Findings

| ID | Severity | Component | Issue Description | Recommendation |
|----|----------|-----------|-------------------|----------------|
| **1** | **CRITICAL** | `AuthContext` & `api/auth` | **Mock Authentication in Production Logic.** The app uses a hardcoded `MOCK_USER` and bypasses all real auth verification. This makes the app insecure for any real-world deployment. | Implement real Supabase Auth. Replace `getAuthenticatedUser` with `supabase.auth.getUser()` verification. |
| **2** | **CRITICAL** | `api/income.ts` (and others) | **Disconnected Database Context.** API routes use a global `supabase` client instance that has no session data. Writes to the DB are anonymous (no `user_id` attached), and RLS policies relying on `auth.uid()` will fail. | Instantiate a per-request Supabase client using `createServerClient` (from `@supabase/ssr`) or pass the user's access token to the client. |
| **3** | **HIGH** | Database | **RLS Likely Disabled.** The presence of `disable-all-rls.sql` and the anonymous API calls suggest RLS is turned off. If enabled, the current API code would break immediately. | Enable RLS. Create policies that restrict access based on `auth.uid()`. Ensure API calls send the user's context. |
| **4** | **MEDIUM** | `lib/supabase.ts` | **Service Role Key Exposure Risk.** The file exports `supabaseAdmin` initialized with `SUPABASE_SERVICE_ROLE_KEY`. While currently safe in `lib`, accidental import of this file into a Client Component would leak the admin key to the browser. | Move `supabaseAdmin` to a dedicated server-only file (e.g., `lib/supabase-admin.ts`) and add `'server-only'` package/directive to prevent client bundling. |
| **5** | **MEDIUM** | Architecture | **Hybrid Routing Complexity.** The app uses `src/app` (App Router) but fetches data via `src/pages/api` (Pages Router) using a generic `supabase` client. This adds unnecessary network latency and complexity (BFF pattern). | Refactor to use **Server Actions** or call Supabase directly from Server Components for data fetching, removing the `pages/api` layer entirely. |
| **6** | **LOW** | `incomeSlice.ts` | **Optimistic Update Consistency.** The optimistic update logic manually reverts state on error, which is good, but duplicating this logic across all slices (`income`, `expense`, etc.) is error-prone. | Use a library like `TanStack Query` (React Query) which handles optimistic updates, caching, and rollback automatically. |

## Detailed Analysis

### 1. The "Single User" Mirage
The file `src/contexts/AuthContext.tsx` hardcodes a user session.
```typescript
const MOCK_USER: User = { id: 'single-user-mode', ... };
```
The backend `src/lib/api/auth.ts` mirrors this:
```typescript
export async function getAuthenticatedUser(...) {
  return { id: 'single-user-mode', ... };
}
```
**Impact:** The application has no concept of identity. Data created now will be "orphaned" or belong to a null user in the database.

### 2. The RLS Disconnect
In `src/pages/api/income.ts`:
```typescript
const { data, error } = await supabase.from('income_entries').insert(...)
```
This `supabase` instance is initialized with the **Anon Key** but **no session**.
*   **If RLS is ON:** The Insert fails (or inserts with `auth.uid() = null`).
*   **If RLS is OFF:** The Insert succeeds, but `user_id` is likely NULL (unless manually passed, which it isn't).

### 3. Architecture Modernization
The current flow is:
`Client Component` -> `Zustand` -> `fetch('/api/income')` -> `Pages Router Handler` -> `Supabase`

Recommended modern flow (Next.js 14+):
`Server Component` -> `Supabase (Server Client)` -> `DB`
*or for mutations:*
`Client Component` -> `Server Action` -> `Supabase (Server Client)` -> `DB`

This removes the entire `src/pages/api` folder and `zustand` async thunks, simplifying the code by ~40%.
