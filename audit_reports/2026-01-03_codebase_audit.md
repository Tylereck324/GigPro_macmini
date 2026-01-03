# GigPro Codebase Audit & Production Readiness Review
**Date:** January 3, 2026  
**Scope:** `src/app`, `src/components`, `src/lib`, `src/store`, `src/types`, `sql/`, `package.json`, `tailwind.config.ts`  
**Target:** Elevate to production-quality: clean architecture, edge-case hardening, performance, consistent modern UI, and security posture.

---

## Executive Summary

GigPro has a solid foundation: strong TypeScript strictness, thoughtful UI tokens (CSS variables + Tailwind), and a clear domain split (income/expenses/goals/settings). Recent commits show active cleanup and correctness improvements.

The biggest blockers to “production-ready” are **security model (single-user / RLS disabled)** and **data integrity around export/import + settings**. There are also **browser support claims** that conflict with modern CSS usage, and **performance scalability** concerns due to “load everything” queries.

**Overall code health score:** **6/10**  
*(Good UX and structure; security + data integrity issues prevent a higher score.)*

### Top 5 Critical Issues
1. **Security / data isolation is not production-safe**: Supabase is accessed from the client with **RLS disabled** (intentional for single-user mode, but critical if deployed publicly). See `README.md:126` and `sql/supabase-schema.sql:236`.  
2. **Import settings upsert uses the wrong shape (camelCase vs snake_case)**, likely breaking settings restore. See `src/lib/utils/exportImport.ts:310`.  
3. **Export/import/clear operations ignore Supabase errors in multiple places**, allowing silent partial failure and data loss. See `src/lib/utils/exportImport.ts:12`, `src/lib/utils/exportImport.ts:137`, `src/lib/utils/exportImport.ts:171`, `src/lib/utils/exportImport.ts:340`, `src/lib/utils/exportImport.ts:388`.  
4. **User-facing “About” copy is factually incorrect** (claims IndexedDB + no server, contradicts Supabase usage). See `src/app/settings/SettingsContent.tsx:237` and `README.md:41`.  
5. **Timezone/date normalization may shift times or cause off-by-one behavior** (multiple `toISOString()` conversions; use of `parseISO` on date-only strings). See `src/lib/api/income.ts:6` and `src/lib/utils/amazonFlexHours.ts:1`.

### Top 5 Quick Wins (High value, low risk)
1. Fix settings import mapping (camelCase → snake_case) and add error checking for settings update paths.  
2. Fix Settings “About” copy + use consistent UI patterns for confirmations (replace `window.confirm`).  
3. Make `settingsApi.getSettings()` robust when settings row is missing (`maybeSingle()` can return `data: null` without error).  
4. Align browser support claims with actual CSS usage (or add PostCSS nesting + remove/guard unsupported selectors).  
5. Remove unused deps (e.g., `@supabase/ssr`) and dead code (`src/lib/api/apiClient.ts` if unused).

### Verification Snapshot (local)
- `npm run lint`: **PASS**
- `npm test` (Vitest): **FAIL** (1 failing test) — `src/lib/utils/__tests__/exportImport.test.ts`  
- `npm audit`: **4 high severity** (Next.js advisory + `glob` via `eslint-config-next`)

### Estimated Effort for Full Remediation
- **Production security + multi-user readiness (Auth + RLS + server-side data access):** 4–10 days
- **Data integrity fixes (export/import/clear, settings):** 0.5–2 days
- **Performance (pagination, month-scoped queries, caching):** 1–4 days
- **UI consistency pass + accessibility verification:** 1–3 days

---

## Detailed Findings

### 1) Clean Code & Architecture

#### 1.1 Data access boundaries are client-first, not production-safe
**Severity:** Critical • **Effort:** Significant refactor  
**Where:** `src/lib/api/*`, `src/lib/supabase.ts`, `README.md:39-42`, `sql/supabase-schema.sql:236`

**Current:** Client components call Supabase directly using `NEXT_PUBLIC_*` keys. This only works safely when RLS is correctly enforced per-user—currently it’s explicitly disabled for single-user mode.

**Recommendation:** For production:
- Move reads to Server Components / Route Handlers / Server Actions.
- Use `@supabase/ssr` server client with cookies/session.
- Enable RLS and scope data by `auth.uid()` (or `household_id` if multi-user model).

#### 1.2 “Mapping layer” is duplicated and inconsistently typed
**Severity:** Medium • **Effort:** Moderate  
**Where:** `src/lib/api/income.ts:27`, `src/lib/api/dailyData.ts:6`, `src/lib/api/goals.ts:6`, `src/lib/utils/exportImport.ts:35`

**Current:** Several mappers accept `any` and perform partial validation. Other places assume numbers/dates are valid. This leads to inconsistent handling and makes edge cases harder to reason about.

**Recommendation:** Centralize mapping + runtime validation:
- Define `*Db` interfaces for each table (like `src/lib/api/expenses.ts` already does).
- Convert/validate fields in one place (timestamps, nullable fields).
- Avoid `any` in production modules.

---

### 2) TypeScript Quality

#### 2.1 `any` in production code hides real data-shape risk
**Severity:** Medium • **Effort:** Moderate  
**Where:** `src/lib/api/income.ts:27`, `src/lib/api/dailyData.ts:6`, `src/lib/api/goals.ts:6`, `src/lib/utils/exportImport.ts:35`

**Recommendation:** Replace `any` with explicit DB row types per table, or generate types from Supabase and use `Database['public']['Tables']['...']['Row']`.

#### 2.2 Zod schema and TS types are mostly aligned, but there are mismatches
**Severity:** Low • **Effort:** Quick fix  
**Example:** `src/types/validation/dailyData.validation.ts:49` (`earningsPerMile` is `positive().nullable()`)  
**But:** `calculateDailyProfit()` can produce `0` when income is `0` and mileage > 0 (`src/lib/utils/profitCalculations.ts:64`).

**Recommendation:** Decide expected behavior (allow `0` or coerce to `null`) and align schema.

---

### 3) Supabase Integration & Data Integrity

#### 3.1 Settings import is likely broken (camelCase upsert into snake_case table)
**Severity:** Critical • **Effort:** Quick fix  
**Where:** `src/lib/utils/exportImport.ts:310`

**Issue:** `app_settings` columns are snake_case (`amazon_flex_daily_capacity`, etc.), but import does:
- `upsert({ ...imported.data.settings, id: 'settings' })` (camelCase fields)

**Impact:** Settings restore fails or silently doesn’t apply expected columns.

**Fix (example):**
```ts
// BEFORE: src/lib/utils/exportImport.ts:313
// .upsert({ ...imported.data.settings, id: 'settings' }, { onConflict: 'id' })

// AFTER (concept)
const s = imported.data.settings;
await supabase.from('app_settings').upsert(
  {
    id: 'settings',
    theme: s.theme,
    last_export_date: s.lastExportDate ? new Date(s.lastExportDate).toISOString() : null,
    last_import_date: s.lastImportDate ? new Date(s.lastImportDate).toISOString() : null,
    amazon_flex_daily_capacity: s.amazonFlexDailyCapacity,
    amazon_flex_weekly_capacity: s.amazonFlexWeeklyCapacity,
  },
  { onConflict: 'id' }
);
```

#### 3.2 Export/import flows ignore Supabase errors in multiple places
**Severity:** High • **Effort:** Moderate  
**Where:** `src/lib/utils/exportImport.ts:12`, `src/lib/utils/exportImport.ts:137`, `src/lib/utils/exportImport.ts:171`, `src/lib/utils/exportImport.ts:340`, `src/lib/utils/exportImport.ts:388`

**Issue:** `Promise.all([...select])` destructures only `data` and discards `error`. Similar for updates/deletes.

**Impact:** Silent partial export/import/clear with misleading “success” toasts.

**Fix approach:** Always capture `{ data, error }` and throw on `error` before continuing.

#### 3.3 `settingsApi.getSettings()` can crash when the settings row is missing
**Severity:** High • **Effort:** Quick fix  
**Where:** `src/lib/api/settings.ts:10-54`

**Issue:** `maybeSingle()` can return `data: null` with `error: null`, but code unconditionally reads `data.id`.

**Fix (example):**
```ts
// AFTER (concept)
if (error) throw new Error(error.message);
if (!data) {
  // create defaults OR return a safe default object
}
```

---

### 4) Edge Cases

#### 4.1 Timezone shifting risk via `toISOString()` normalization
**Severity:** Medium • **Effort:** Moderate  
**Where:** `src/lib/api/income.ts:6-25`, `src/types/validation/income.validation.ts:10-33`

**Issue:** Converting values to `toISOString()` can unintentionally shift wall-clock times to UTC. If users expect “local time”, round-tripping may display a different time.

**Recommendation:** Decide on a canonical storage/display strategy:
- Store UTC in DB, display in local time (recommended) — but avoid repeatedly converting already-UTC values.
- Or store “local time” as text fields (less recommended).

#### 4.2 `paidDate` stored as DATE but app sometimes passes datetime strings
**Severity:** Low • **Effort:** Quick fix  
**Where:** `src/app/expenses/ExpensesContent.tsx:146`

**Recommendation:** Store date-only strings (`yyyy-MM-dd`) for `DATE` columns for consistency.

---

### 5) Performance Optimization

#### 5.1 “Load everything” on home page does not scale
**Severity:** Medium • **Effort:** Moderate  
**Where:** `src/app/page.tsx:19-42`

**Issue:** Home loads all income, all daily data, all expenses, all goals on mount. For large histories, this becomes slow and memory heavy.

**Recommendation:**
- Fetch month-scoped data for the calendar view (or paginate).
- Fetch details lazily when navigating to `/day/[date]`.
- Consider server-side data fetching + caching.

#### 5.2 Recalculation and data shaping could move to selectors
**Severity:** Low • **Effort:** Moderate  
**Where:** `src/components/calendar/MonthlyCalendar.tsx:36-109`

**Current:** Good use of `useMemo`, but similar aggregation patterns exist in multiple components.

**Recommendation:** Add reusable selectors/derived state utilities (e.g., `selectIncomeByDateRange`) to avoid re-implementing grouping logic.

---

### 6) Modern UI/UX Consistency

#### 6.1 Settings “About” copy contradicts actual behavior (privacy risk)
**Severity:** High • **Effort:** Quick fix  
**Where:** `src/app/settings/SettingsContent.tsx:237-239`

**Issue:** Claims IndexedDB + no server, but the app clearly uses Supabase (`README.md:41`, `src/lib/supabase.ts:4`).

**Fix:** Update copy to accurately describe storage (or actually move to offline-first storage if desired).

#### 6.2 Confirmation UX is inconsistent (`window.confirm` vs `ConfirmDialog`)
**Severity:** Medium • **Effort:** Quick fix  
**Where:** `src/app/settings/SettingsContent.tsx:56`, `src/app/settings/SettingsContent.tsx:88`, vs `src/app/goals/GoalsContent.tsx:192`

**Recommendation:** Standardize on `ConfirmDialog` for destructive actions and add a typed “danger phrase” for `clearAllData()`/`importData()` if productionizing.

---

### 7) Accessibility

Strengths:
- Touch target sizing (44px) is explicitly considered (`src/app/globals.css:315`).
- Keyboard navigation implemented for calendar grid (`src/components/calendar/MonthlyCalendar.tsx:140`).
- ErrorBoundary provides user recovery paths (`src/components/errors/ErrorBoundary.tsx`).

Risks:
- Heavy reliance on modern CSS selectors (`:has`, nesting) may break in older browsers and degrade accessibility if styles fail to parse.

---

### 8) Security Review

#### 8.1 Single-user mode is not safe for public deployment
**Severity:** Critical • **Effort:** Significant refactor  
**Where:** `README.md:39-42`, `README.md:126`, `sql/disable-all-rls.sql`, `sql/supabase-schema.sql:236`

**Impact:** If this app is deployed publicly, anyone with the URL can access the DB using the embedded anon key if RLS is off or permissive.

**Recommendation:** Before any production deployment:
- Turn on RLS for all tables.
- Add authentication.
- Enforce ownership policies.

#### 8.2 Dependency vulnerabilities (high severity)
**Severity:** High • **Effort:** Quick fix / Moderate  
**Where:** `npm audit`

**Findings:**
- `next` has high severity advisories (DoS issues).  
- `glob` advisory via `eslint-config-next` chain.

**Recommendation:**
- Run `npm audit fix` (safe updates).
- Evaluate upgrading `next` and `eslint-config-next` to patched versions; avoid `--force` unless you accept major upgrades.

---

## Design System (Current Tokens + Guidance)

### Spacing Scale (existing)
Defined in `src/app/globals.css:83` and wired into Tailwind in `tailwind.config.ts:35`.
- `xs`, `sm`, `md`, `lg`, `xl`, `2xl` via `--spacing-*` (clamp-based, responsive)

### Typography Scale (existing)
Defined in `src/app/globals.css:74` and wired into Tailwind in `tailwind.config.ts:46`.
- `xs` … `3xl` via `--font-size-*` (clamp-based, responsive)

### Color Tokens (existing)
Defined in `src/app/globals.css:37` and wired into Tailwind in `tailwind.config.ts:58`.
- Semantic colors: `primary`, `secondary`, `success`, `danger`, `warning`, `background`, `surface`, `border`, `text`

### Component Patterns (recommended)
- Buttons: use `src/components/ui/Button.tsx` variants consistently (avoid custom `<span>` buttons).
- Confirmations: use `src/components/ui/ConfirmDialog.tsx` for destructive actions.
- Forms: use `Input` + `Select` components for consistent labels/errors.

---

## Refactoring Roadmap

### Phase 1 — Critical correctness + integrity (1–3 days)
- Fix settings import mapping and Supabase error handling in export/import/clear.
- Fix `settingsApi.getSettings()` null handling.
- Fix Settings “About” copy and confirmation UX.

### Phase 2 — Security hardening (4–10 days)
- Enable RLS and implement auth (or explicitly wall off public deployment).
- Move mutations server-side.

### Phase 3 — Performance scaling (1–4 days)
- Month-scoped queries/pagination.
- Derived selectors and memoization consolidation.

### Phase 4 — UI consistency + docs (1–3 days)
- Standardize dialogs, forms, empty states.
- Update README browser support statement and privacy/storage wording.

---

## Test Recommendations

### Unit/Integration
- `settingsApi.getSettings()` — missing settings row; insert fallback path.
- `exportImport.importData()` — verify settings mapping (camelCase → snake_case).
- Date/time normalization — ensure user-entered times display as expected across timezones.

### E2E (Playwright)
- Add income entry → verify appears on calendar/day view and totals update.
- Export → clear → import → verify totals and settings restored.
- “Danger Zone” clear data flow requires confirmation dialog.

