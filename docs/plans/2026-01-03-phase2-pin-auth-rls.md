# Phase 2 PIN Auth + Owner-Only RLS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require a 6-digit PIN login and enforce Supabase RLS so only the configured “owner” account can access any data.

**Architecture:** Add `/login` + `/setup` flows backed by Next.js Route Handlers that manage Supabase Auth sessions via cookies (`@supabase/ssr`). Add middleware auth gating. Add an owner-only RLS SQL migration that does not require `user_id` columns.

**Tech Stack:** Next.js (App Router), TypeScript, Supabase JS + `@supabase/ssr`, Vitest, React Testing Library.

---

### Task 1: Add PIN parsing/validation utility (TDD)

**Files:**
- Create: `src/lib/auth/pin.ts`
- Create: `src/lib/auth/__tests__/pin.test.ts`

**Step 1: Write failing tests**

Create `src/lib/auth/__tests__/pin.test.ts`:
- Valid: `"000000"`, `"123456"`
- Invalid: `""`, `"12345"`, `"1234567"`, `"12 3456"`, `"abcdef"`

Run: `npm test src/lib/auth/__tests__/pin.test.ts`
Expected: FAIL (module doesn’t exist yet).

**Step 2: Implement minimal `parseSixDigitPin()`**

Create `src/lib/auth/pin.ts`:
- `parseSixDigitPin(input: unknown): string` → returns normalized pin string or throws `Error` with a clear message.

Run: `npm test src/lib/auth/__tests__/pin.test.ts`
Expected: PASS.

---

### Task 2: Add Supabase SSR helpers for middleware/route handlers (TDD)

**Files:**
- Create: `src/lib/supabase/ssr.ts`
- Create: `src/lib/supabase/__tests__/ssr.test.ts`

**Step 1: Write failing tests**

Test that:
- `createSupabaseServerClient(request, response)` calls `createServerClient()` with cookie adapters wired.

Run: `npm test src/lib/supabase/__tests__/ssr.test.ts`
Expected: FAIL (module doesn’t exist yet).

**Step 2: Implement helper**

Create `src/lib/supabase/ssr.ts` exporting:
- `createSupabaseServerClient(request: NextRequest, response: NextResponse)` using `createServerClient()`
- `getPublicSupabaseEnv()` that validates `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` at call-time (not module load)

Run: `npm test src/lib/supabase/__tests__/ssr.test.ts`
Expected: PASS.

---

### Task 3: Add owner admin client helper (TDD)

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/__tests__/admin.test.ts`

**Step 1: Write failing tests**
- Missing `SUPABASE_SERVICE_ROLE_KEY` throws.
- Creates client with service role key.

Run: `npm test src/lib/supabase/__tests__/admin.test.ts`
Expected: FAIL.

**Step 2: Implement**

Create `src/lib/supabase/admin.ts`:
- `getServerOwnerEnv()` reads `SUPABASE_SERVICE_ROLE_KEY`, `GIGPRO_OWNER_EMAIL`, `GIGPRO_SETUP_TOKEN` (throws if missing)
- `createSupabaseAdminClient()` returns `createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })`

Run: `npm test src/lib/supabase/__tests__/admin.test.ts`
Expected: PASS.

---

### Task 4: Implement `POST /api/auth/login` (TDD)

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/__tests__/login.test.ts`

**Step 1: Write failing tests**
- Invalid PIN returns 400.
- Supabase sign-in error returns 401 with message.
- Success returns 200 and uses SSR client.

Run: `npm test src/app/api/auth/__tests__/login.test.ts`
Expected: FAIL.

**Step 2: Implement**

`route.ts`:
- Parse JSON `{ pin }`
- Validate with `parseSixDigitPin`
- Create `NextResponse.json({ ok: true })` and SSR client via `createSupabaseServerClient`
- Call `supabase.auth.signInWithPassword({ email: ownerEmail, password: pin })`
- Return appropriate status + JSON

Run: `npm test src/app/api/auth/__tests__/login.test.ts`
Expected: PASS.

---

### Task 5: Implement `POST /api/auth/logout` (TDD)

**Files:**
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/__tests__/logout.test.ts`

**Step 1: Write failing test**
- Calls `supabase.auth.signOut()` and returns `{ ok: true }`.

Run: `npm test src/app/api/auth/__tests__/logout.test.ts`
Expected: FAIL.

**Step 2: Implement**

Run: `npm test src/app/api/auth/__tests__/logout.test.ts`
Expected: PASS.

---

### Task 6: Implement `POST /api/auth/setup` (TDD)

**Files:**
- Create: `src/app/api/auth/setup/route.ts`
- Create: `src/app/api/auth/__tests__/setup.test.ts`

**Step 1: Write failing tests**
- Wrong setup token returns 403.
- Invalid pin returns 400.
- When owner already configured (app_owner row exists), returns 409.
- When not configured: creates user, writes app_owner, signs in.

Run: `npm test src/app/api/auth/__tests__/setup.test.ts`
Expected: FAIL.

**Step 2: Implement**
- Use admin client to:
  - check `app_owner` row
  - create user (`auth.admin.createUser`) (handle “already exists” by `listUsers` lookup)
  - upsert `app_owner` singleton row
- Use SSR anon client to sign in and set cookies on response

Run: `npm test src/app/api/auth/__tests__/setup.test.ts`
Expected: PASS.

---

### Task 7: Implement `POST /api/auth/reset-pin` (TDD)

**Files:**
- Create: `src/app/api/auth/reset-pin/route.ts`
- Create: `src/app/api/auth/__tests__/resetPin.test.ts`

**Step 1: Write failing tests**
- Wrong setup token returns 403.
- Missing owner row returns 409/400 (decide and encode).
- Updates password via `auth.admin.updateUserById`.
- Signs in and returns ok.

Run: `npm test src/app/api/auth/__tests__/resetPin.test.ts`
Expected: FAIL.

**Step 2: Implement**

Run: `npm test src/app/api/auth/__tests__/resetPin.test.ts`
Expected: PASS.

---

### Task 8: Add middleware auth gating (TDD)

**Files:**
- Create: `middleware.ts`
- Create: `src/__tests__/middleware.test.ts`

**Step 1: Write failing tests**
- Requests to `/login`, `/setup`, `/api/auth/*`, and `/_next/*` are not redirected.
- Unauthed request to `/` redirects to `/login`.

Run: `npm test src/__tests__/middleware.test.ts`
Expected: FAIL.

**Step 2: Implement**
- Use `createSupabaseServerClient()` in middleware.
- `supabase.auth.getUser()` to determine auth.
- Redirect as needed.

Run: `npm test src/__tests__/middleware.test.ts`
Expected: PASS.

---

### Task 9: Switch browser Supabase client to cookie-based SSR storage (TDD)

**Files:**
- Modify: `src/lib/supabase.ts`
- Create: `src/lib/__tests__/supabaseBrowser.test.ts`

**Step 1: Write failing test**
- Module exports a client created with `createBrowserClient()` (mock `@supabase/ssr`).

Run: `npm test src/lib/__tests__/supabaseBrowser.test.ts`
Expected: FAIL.

**Step 2: Implement**
- Replace `createClient()` usage with `createBrowserClient()` and keep runtime env check.

Run: `npm test src/lib/__tests__/supabaseBrowser.test.ts`
Expected: PASS.

---

### Task 10: Add `/login` + `/setup` pages (TDD)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/setup/page.tsx`
- Create: `src/app/login/__tests__/loginPage.test.tsx`
- Create: `src/app/setup/__tests__/setupPage.test.tsx`

**Step 1: Write failing UI tests**
- Login page renders PIN input and submit.
- Setup page renders setup token + PIN fields and reset section.

Run: `npm test src/app/login/__tests__/loginPage.test.tsx`
Expected: FAIL.

**Step 2: Implement pages**
- Use `Card`, `Input`, `Button`, `toast`.
- Submit via `fetch('/api/auth/login', { method:'POST', body: JSON.stringify({ pin }) })`.
- On success: `window.location.href = '/'`.

Run: `npm test src/app/login/__tests__/loginPage.test.tsx`
Expected: PASS.

---

### Task 11: Add Logout button (TDD)

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Create: `src/components/layout/__tests__/HeaderLogout.test.tsx`

**Step 1: Write failing test**
- Clicking “Logout” calls `/api/auth/logout` and redirects to `/login`.

Run: `npm test src/components/layout/__tests__/HeaderLogout.test.tsx`
Expected: FAIL.

**Step 2: Implement**

Run: `npm test src/components/layout/__tests__/HeaderLogout.test.tsx`
Expected: PASS.

---

### Task 12: Add owner-only RLS SQL migration

**Files:**
- Create: `sql/enable-rls-owner.sql`

**Step 1: Write SQL**
- Create `public.app_owner` singleton table.
- Create `public.is_app_owner()` helper.
- Enable RLS + create owner-only policies for all app tables.

No automated test (manual in Supabase SQL editor).

---

### Task 13: Final verification

Run:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm audit`

Expected:
- All pass, 0 vulnerabilities.
