# GigPro Comprehensive Audit Report

**Date:** December 21, 2025
**Auditor:** Gemini CLI

This audit identifies critical bugs, security risks, performance bottlenecks, and code quality issues in the GigPro application.

## 1. Executive Summary

-   **Security Critical:** Row Level Security (RLS) is disabled, and Supabase credentials (anon key) are client-side. This allows **anyone** with the key to read/modify/delete all user data.
-   **Critical Logic Bug:** Amazon Flex rolling window calculation relies on a mix of UTC and timezone-aware logic that may be brittle.
-   **Major Logic Bug:** Monthly Net Profit calculation ignores the `isActive` status of fixed expenses, potentially overstating expenses.
-   **Performance:** Missing database indexes will cause slowdowns as data grows. `MonthlyCalendar` re-calculates data on every render for all days.
-   **Architecture:** The app fetches *all* income entries at once. This is not scalable.

## 2. Findings

### Part 1: Dead Code & Cleanup

#### [DEAD-001] Logic: Unused Variable in Profit Calculation
-   **Location:** `src/lib/utils/profitCalculations.ts:calculateMonthlyNetProfit`
-   **Severity:** **High** (Logic Error/Dead Logic)
-   **Description:** The function sums `fixedExpenses` without filtering by `isActive`. While not "dead code" in the strict sense, the `isActive` property is effectively ignored/dead for this calculation.
-   **Fix:** Filter by `isActive` before reducing.
    ```typescript
    const totalBills = fixedExpenses
      .filter(e => e.isActive) // Add this
      .reduce((sum, expense) => sum + expense.amount, 0);
    ```

#### [DEAD-002] Dependencies: Unused transitive dependencies
-   **Location:** `package-lock.json`
-   **Severity:** **Low**
-   **Description:** `@asamuzakjp/dom-selector` appears in lockfile but usage is unclear. Likely safe to ignore if `npm audit` is clean.

### Part 2: Bug Detection

#### [BUG-001] Logic: Amazon Flex Rolling Window Timezone Mismatch
-   **Location:** `src/lib/utils/amazonFlexHours.ts`
-   **Severity:** **Critical**
-   **Description:** `calculateAmazonFlexHours` uses `dateKeyToUtcDate` (UTC-based) for date math but `formatDateKeyInTimeZone` (Timezone-based) for the target date. This mixing can lead to off-by-one errors near midnight in non-UTC timezones.
-   **Impact:** Workers could exceed or underutilize their 40-hour limit.
-   **Fix:** Standardize on one date handling method (preferably timezone-aware using `date-fns-tz` or strictly UTC if all dates are stored as YYYY-MM-DD).

#### [BUG-002] Logic: Net Profit Ignores Inactive Expenses
-   **Location:** `src/lib/utils/profitCalculations.ts`
-   **Severity:** **High**
-   **Description:** As noted in DEAD-001, inactive fixed expenses are deducted from profit.
-   **Impact:** Users see lower profit than reality.

#### [BUG-003] Logic: Overnight Shift Date Handling
-   **Location:** `src/lib/utils/timeCalculations.ts:calculateMissingTime`
-   **Severity:** **Medium**
-   **Description:** The logic `lengthMinutes += 24 * 60` correctly calculates *duration*, but it does not update the `blockEndTime` **date** to be the next day. If the user only provides time, the system assumes same-day (causing the "end before start" issue).
-   **Impact:** Durations are correct, but `blockEndTime` stored in DB might be wrong (same date as start, but earlier time).

### Part 3: Performance Optimization

#### [PERF-001] Database: Missing Indexes
-   **Location:** `sql/supabase-schema.sql` vs `sql/recommended-indexes.sql`
-   **Severity:** **High**
-   **Description:** `recommended-indexes.sql` defines indexes (e.g., `idx_income_entries_date_platform`) that are NOT present in the active schema.
-   **Fix:** Apply the recommended indexes.

#### [PERF-002] Frontend: O(N) Filtering in Calendar
-   **Location:** `src/components/calendar/MonthlyCalendar.tsx`
-   **Severity:** **Medium**
-   **Description:** `profitByDate` memo re-filters `incomeEntries` (which contains *all* history) on every render or date change.
-   **Fix:** `incomeEntries` should be stored in a Map or normalized structure in Zustand, or the filtering should be optimized.

#### [PERF-003] Architecture: Fetching All Data
-   **Location:** `src/store/slices/incomeSlice.ts:loadIncomeEntries`
-   **Severity:** **High**
-   **Description:** `incomeApi.getIncomeEntries()` fetches `select('*')` without a `limit` or `where` clause.
-   **Impact:** App will crash or become unusable after a few months/years of data.
-   **Fix:** Implement pagination or "fetch by month" ranges.

### Part 4: Code Quality

#### [QUAL-001] Type Safety: `any` usage in Store
-   **Location:** `src/store/slices/incomeSlice.ts`
-   **Severity:** **Medium**
-   **Description:** `const store = get() as any;` is used to access other slices.
-   **Fix:** Use proper type definition for the combined store in `src/store/index.ts` and use it in `StateCreator`.

### Part 5: Security Review

#### [SEC-001] Critical: RLS Disabled
-   **Location:** `sql/supabase-schema.sql`
-   **Severity:** **Critical**
-   **Description:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is commented out. The anon key is public.
-   **Impact:** **Total Data Compromise.** Any user can wipe the database.
-   **Fix:** Enable RLS immediately. Even for "Single User", use a policy that restricts access (e.g., matching a specific user ID or using a Service Role for admin tasks if client-side access isn't strictly needed for everything). If "Single User" means "Localhost only", it's fine, but if deployed to Vercel, it's open to the world.

## 3. Findings from Other Audits (Codex/Claude)

These findings were identified in concurrent audits and are confirmed to be valid:

#### [BUG-004] Payment Plan Deletion Rollback Order (Source: Claude BUG-008)
-   **Location:** `src/store/slices/expenseSlice.ts`
-   **Severity:** **High**
-   **Description:** When deleting a payment plan, the rollback logic appends deleted payments to the *end* of the array, potentially changing the display order if the UI relies on array index order.
-   **Fix:** Snapshot the original array state before deletion and restore the exact state on rollback.

#### [BUG-005] Missing Weekly Capacity Setter (Source: Claude DC-008)
-   **Location:** `src/store/slices/themeSlice.ts`
-   **Severity:** **Medium**
-   **Description:** The `themeSlice` has `amazonFlexWeeklyCapacity` in state but no action to update it. The settings UI cannot persist changes to this value.
-   **Fix:** Add `setAmazonFlexWeeklyCapacity` action and wire it to the settings API.

#### [SEC-002] Supabase URL Validation (Source: Claude SEC-001)
-   **Location:** `src/lib/supabase.ts`
-   **Severity:** **Low**
-   **Description:** `NEXT_PUBLIC_SUPABASE_URL` is used without validation.
-   **Fix:** Add a check to ensure the URL matches the expected pattern to prevent configuration errors.

#### [BUG-006] Export/Import Error Handling (Source: Codex BUG-001)
-   **Location:** `src/lib/utils/exportImport.ts`
-   **Severity:** **Medium**
-   **Description:** Supabase may return a 200 OK response with an error body. The export logic might not check `error` property correctly on "fulfilled" responses.
-   **Fix:** Ensure `error` property is checked even on successful promises.

#### [UX-001] Zero Values in Expenses (Source: Codex BUG-005)
-   **Location:** `src/components/expenses/DailyExpenses.tsx`
-   **Severity:** **Low**
-   **Description:** Form might treat `0` as "empty" or "null", preventing users from explicitly setting "0 mileage" if they want to override a previous value.
-   **Fix:** Ensure form checks `value !== null` or `value !== undefined` instead of truthiness.

## 4. Test Coverage Gaps

-   **`src/lib/utils/profitCalculations.ts`**: Core financial logic is untested. **Critical gap.**
-   **`src/lib/utils/amazonFlexHours.ts`**: Complex rolling window logic is untested. **Critical gap.**
-   **`src/lib/utils/simulatorCalculations.ts`**: Untested.
-   **`src/store/slices`**: Only `incomeSlice` has some tests.

## 5. Recommended Action Plan

1.  **Security:** Enable RLS or warn the user extensively if this is a specialized "open" app.
2.  **Fix Bugs:** Fix `profitCalculations.ts` (inactive expenses) and `amazonFlexHours.ts`.
3.  **Add Tests:** Write tests for `profitCalculations` and `amazonFlexHours` to verify fixes.
4.  **Performance:** Apply SQL indexes.
5.  **Refactor:** Switch `loadIncomeEntries` to fetch by date range.
6.  **Cleanup:** Add missing `setAmazonFlexWeeklyCapacity` action.

## 6. Context7 Findings
Using the `/pmndrs/zustand` context:
- The project correctly uses `useShallow` for selectors, aligning with modern Zustand best practices for performance.
- However, the architectural decision to load *all* data into the store contradicts the "small, fast, and scalable" philosophy when datasets grow large.