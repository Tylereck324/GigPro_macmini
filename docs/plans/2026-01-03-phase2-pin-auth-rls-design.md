# Phase 2 PIN Auth + Owner-Only RLS Design
**Date:** 2026-01-03

**Goal:** Make GigPro safe to deploy publicly by requiring login and enforcing Supabase Row Level Security (RLS) so **only one “owner” account** can read/write data.

## Constraints / Decisions
- Single-user app with login required (no multi-user data model, no `user_id` columns).
- User enters a **6-digit numeric PIN**.
- “Forgot PIN” / reset flow exists and is gated by a server-only `GIGPRO_SETUP_TOKEN`.
- Supabase is the source of truth for auth sessions (so RLS can enforce access).

## High-Level Approach
1. Add `/login` and `/setup` pages.
2. Add server Route Handlers under `src/app/api/auth/*`:
   - `POST /api/auth/setup`: create the owner Supabase Auth user + write `app_owner.owner_user_id`.
   - `POST /api/auth/login`: sign in using owner email + PIN, set auth cookies.
   - `POST /api/auth/logout`: sign out, clear cookies.
   - `POST /api/auth/reset-pin`: update the owner password (PIN), gated by setup token.
3. Add `middleware.ts` to enforce authentication for all app routes (except login/setup/auth endpoints).
4. Switch the client Supabase instance to use `@supabase/ssr` cookie storage so the browser client is authenticated after server login.
5. Add SQL script `sql/enable-rls-owner.sql` to:
   - create a singleton `public.app_owner` table
   - define `public.is_app_owner()` helper
   - enable RLS on all app tables
   - add “owner can do anything” policies per table

## Environment Variables (Runtime)
**Public (already required):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Server-only (new):**
- `SUPABASE_SERVICE_ROLE_KEY` (required for setup/reset routes; never expose to client)
- `GIGPRO_OWNER_EMAIL` (email used for the single owner Supabase Auth user; never expose to client)
- `GIGPRO_SETUP_TOKEN` (one-time token to allow setup + reset; never expose to client)

## Supabase RLS Model (Owner-Only)
### `public.app_owner` (singleton)
- Stores exactly one UUID: `owner_user_id`.
- RLS enabled, **no policies** (so clients cannot read/write it).
- Setup/reset routes use service role key (bypasses RLS) to write it.

### Helper: `public.is_app_owner()`
Returns `true` only if:
- user is authenticated, AND
- `auth.uid()` equals `app_owner.owner_user_id`.

### Policies
For each app table:
- Enable RLS.
- Add a single policy:
  - `FOR ALL USING (public.is_app_owner()) WITH CHECK (public.is_app_owner())`

## UX Notes
- `/login`: 6-digit PIN input + submit; shows error toast/message on failure.
- `/setup`: two sections:
  - Initial setup (setup token + PIN) → creates owner and signs in.
  - Reset PIN (setup token + new PIN) → updates password and signs in.
- Header: add a Logout action (POST `/api/auth/logout`), then redirect to `/login`.

## Deployment / Migration Order
1. Deploy code changes (login/setup/routes/middleware + SSR client).
2. Run `sql/enable-rls-owner.sql` in Supabase SQL editor.
3. Visit `/setup` and complete setup using `GIGPRO_SETUP_TOKEN` + new PIN.
4. Confirm normal app flows work; unauthenticated users should be redirected to `/login`.

## Non-Goals (for this phase)
- Multi-user support (no `user_id` columns; no sharing).
- Advanced brute-force protection (rate limiting). (Can be added later if needed.)
