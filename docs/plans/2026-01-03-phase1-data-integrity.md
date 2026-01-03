# Phase 1 Data Integrity & Settings UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix Phase 1 correctness issues: settings import mapping, Supabase error handling for export/import/clear, robust settings loading, and consistent Settings confirmations/copy.

**Architecture:** Keep existing client-side Supabase flow (single-user mode) but harden behavior via correct field mapping, explicit error checks, and consistent UI confirmations. Avoid unrelated refactors.

**Tech Stack:** Next.js (App Router), TypeScript, Supabase JS client, Vitest, React Testing Library.

---

### Task 1: Fix failing `importData` test mocks

**Files:**
- Modify: `src/lib/utils/__tests__/exportImport.test.ts`

**Step 1: Reproduce current failure**

Run: `npm test`
Expected: FAIL at `should import valid data successfully` (mocks don’t match current Supabase delete/neq call chain).

**Step 2: Update the test mock to match `delete().neq()` awaitable behavior**

Expected: `npm test` now progresses past that test (may reveal other failures after Phase 1 changes).

---

### Task 2: Settings import mapping (camelCase → snake_case)

**Files:**
- Modify: `src/lib/utils/__tests__/exportImport.test.ts`
- Modify: `src/lib/utils/exportImport.ts`

**Step 1: Add failing test asserting `app_settings.upsert` uses snake_case columns**

Run: `npm test src/lib/utils/__tests__/exportImport.test.ts`
Expected: FAIL with assertion about `upsert` arguments.

**Step 2: Implement mapping fix**

Run: `npm test src/lib/utils/__tests__/exportImport.test.ts`
Expected: PASS.

---

### Task 3: Add explicit Supabase error handling for export/import/clear

**Files:**
- Modify: `src/lib/utils/__tests__/exportImport.test.ts`
- Modify: `src/lib/utils/exportImport.ts`

**Step 1: Add failing tests for “clear delete errors” and “export update errors”**

Run: `npm test src/lib/utils/__tests__/exportImport.test.ts`
Expected: FAIL.

**Step 2: Implement minimal error checks**

Run: `npm test src/lib/utils/__tests__/exportImport.test.ts`
Expected: PASS.

---

### Task 4: Make `settingsApi.getSettings()` resilient to missing settings row

**Files:**
- Create: `src/lib/api/__tests__/settings.test.ts`
- Modify: `src/lib/api/settings.ts`

**Step 1: Add failing test when `maybeSingle()` returns `{ data: null, error: null }`**

Run: `npm test src/lib/api/__tests__/settings.test.ts`
Expected: FAIL (current code reads `data.id`).

**Step 2: Implement fallback to create defaults (or return defaults)**

Run: `npm test src/lib/api/__tests__/settings.test.ts`
Expected: PASS.

---

### Task 5: Settings page UX consistency (ConfirmDialog + correct About copy)

**Files:**
- Create: `src/app/settings/__tests__/SettingsContent.test.tsx`
- Modify: `src/app/settings/SettingsContent.tsx`

**Step 1: Add failing test ensuring About copy reflects Supabase storage (not IndexedDB)**

Run: `npm test src/app/settings/__tests__/SettingsContent.test.tsx`
Expected: FAIL until copy is updated.

**Step 2: Replace `window.confirm` flows with `ConfirmDialog`**

Run: `npm test src/app/settings/__tests__/SettingsContent.test.tsx`
Expected: PASS.

---

### Task 6: Final verification

Run: `npm test`
Expected: PASS.

