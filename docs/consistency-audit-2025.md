# GigPro Consistency Audit Report

**Date:** December 21, 2025
**Auditor:** Claude Sonnet 4.5
**Scope:** Comprehensive audit of all calculations, transformations, and business rules

---

## Executive Summary

This audit identified **10 major inconsistencies** in the GigPro codebase where the same logic, calculation, or business rule is implemented differently in multiple places. The primary goal is to eliminate these inconsistencies by establishing single sources of truth (canonical implementations) for all critical operations.

### Severity Breakdown
- **Critical (3):** Require immediate attention - affect core business logic or violate business rules
- **High (2):** Should be fixed soon - risk of divergence and maintenance burden
- **Medium (3):** Fix when convenient - style inconsistencies and duplication
- **Low (2):** Polish items - minor issues with low impact

### Already Consistent ✅
- Currency formatting (all use `formatCurrency()`)
- Time formatting (all use 12-hour with AM/PM)
- Week start configuration (all use Sunday)
- Goal progress calculations (canonical function used everywhere)

---

## Part 1: Financial Calculation Inconsistencies

### ID: CONSISTENCY-001
**Concept:** Daily Profit Calculation
**Severity:** HIGH
**Category:** Duplicate Implementation

**Locations Found:**
- `src/lib/utils/profitCalculations.ts:49` (Canonical)
- `src/components/calendar/MonthlyCalendar.tsx:89` (Duplicate)

**Implementation A (profitCalculations.ts - CANONICAL):**
```typescript
// Line 49
const profit = totalIncome - gasExpense;

// Full function: calculateDailyProfit()
export function calculateDailyProfit(
  date: string,
  incomeEntries: IncomeEntry[],
  dailyData: DailyData | undefined,
  entriesForDate?: IncomeEntry[]
): DailyProfit {
  // Calculate total income for the day
  let totalIncome = 0;
  if (entriesForDate) {
    for (const entry of entriesForDate) {
      totalIncome += entry.amount;
    }
  } else {
    for (const entry of incomeEntries) {
      if (entry.date === date) totalIncome += entry.amount;
    }
  }

  const gasExpense = dailyData?.gasExpense ?? 0;
  const profit = totalIncome - gasExpense;
  const mileage = dailyData?.mileage ?? 0;
  const earningsPerMile = mileage > 0 ? totalIncome / mileage : null;

  return { date, totalIncome, gasExpense, profit, earningsPerMile };
}
```

**Implementation B (MonthlyCalendar.tsx - DUPLICATE):**
```typescript
// Lines 83-89
const totalIncome = dayIncome.reduce((sum, entry) => {
  const amount = typeof entry.amount === 'number' ? entry.amount : 0;
  return sum + amount;
}, 0);
const gasExpense = typeof dayData?.gasExpense === 'number' ? dayData.gasExpense : 0;
const profit = totalIncome - gasExpense;
```

**Discrepancy:**
The `MonthlyCalendar` component re-implements the profit calculation inline instead of using the canonical `calculateDailyProfit()` function. While currently mathematically identical, any future change to the "daily profit" definition (e.g., including a daily portion of fixed expenses) would require changes in two places, risking inconsistency.

**Impact:**
- Maintenance burden - changes must be made in two places
- Risk of divergence if one location is updated but not the other
- Potential future data mismatches between Calendar and Dashboard views

**Canonical Solution:**
**File:** `src/lib/utils/profitCalculations.ts`
**Function:** `calculateDailyProfit()` is already the canonical implementation.

**Replacements Needed:**
- `src/components/calendar/MonthlyCalendar.tsx:83-91` → Use `calculateDailyProfit(dateKey, incomeEntries, dayData, dayIncome)`

---

### ID: CONSISTENCY-002
**Concept:** Earnings Per Mile Calculation
**Severity:** MEDIUM
**Category:** Duplicate Implementation

**Locations Found:**
- `src/lib/utils/profitCalculations.ts:53` (Canonical)
- `src/components/calendar/MonthlyCalendar.tsx:91` (Duplicate)

**Implementation A (profitCalculations.ts - CANONICAL):**
```typescript
// Line 53
const earningsPerMile = mileage > 0 ? totalIncome / mileage : null;
```

**Implementation B (MonthlyCalendar.tsx - DUPLICATE):**
```typescript
// Line 91
const earningsPerMile = mileage > 0 ? totalIncome / mileage : null;
```

**Discrepancy:**
Same calculation duplicated in calendar component, part of the same inline profit calculation block.

**Impact:**
- Same risks as CONSISTENCY-001 but for a less critical metric
- Still creates maintenance burden

**Canonical Solution:**
**File:** `src/lib/utils/profitCalculations.ts:53`
Already included in `calculateDailyProfit()` return value.

**Replacements Needed:**
- Same as CONSISTENCY-001 (fixed together)

---

### ID: CONSISTENCY-003
**Concept:** Payment Plan Remaining Calculation
**Severity:** HIGH
**Category:** Duplicate Implementation

**Locations Found:**
- `src/lib/utils/expenseCalculations.ts:30-54` (Canonical)
- `src/components/expenses/PaymentPlanForm.tsx:103-124` (Duplicate)

**Implementation A (expenseCalculations.ts - CANONICAL):**
```typescript
export function calculatePaymentPlanRemaining(plan: PaymentPlan): {
  paymentsMade: number;
  remainingPayments: number;
  remainingAmount: number;
} {
  // currentPayment is 1-indexed (represents the NEXT payment to make)
  const paymentsMade = Math.max((plan.currentPayment ?? 1) - 1, 0);
  const clampedPaymentsMade = Math.min(paymentsMade, plan.totalPayments);

  const remainingPayments = Math.max(plan.totalPayments - clampedPaymentsMade, 0);
  const remainingAmount = Math.max(
    plan.initialCost - clampedPaymentsMade * getPaymentAmount(plan),
    0
  );

  return { paymentsMade: clampedPaymentsMade, remainingPayments, remainingAmount };
}
```

**Implementation B (PaymentPlanForm.tsx - DUPLICATE):**
```typescript
const calculateRemaining = () => {
  if (!totalPayments || !currentPayment || !initialCost) {
    return { payments: 0, amount: 0 };
  }

  const paymentAmount = calculatePaymentAmount();
  const total = parseInt(totalPayments, 10);
  const current = parseInt(currentPayment, 10);
  const principal = parseFloat(initialCost);

  const paymentsMade = Math.max(current - 1, 0);
  const remainingPayments = Math.max(total - paymentsMade, 0);
  const remainingAmount = Math.max(principal - paymentsMade * paymentAmount, 0);

  return { payments: remainingPayments, amount: remainingAmount };
};
```

**Discrepancy:**
The payment plan form implements its own local calculation for preview instead of using the canonical `calculatePaymentPlanRemaining()` function. The form version lacks the `clampedPaymentsMade` safeguard.

**Impact:**
- Could diverge if business logic changes (e.g., interest calculations added)
- Form preview might not match actual stored calculation

**Canonical Solution:**
**File:** `src/lib/utils/expenseCalculations.ts`
**Function:** `calculatePaymentPlanRemaining()`

**Replacements Needed:**
- `src/components/expenses/PaymentPlanForm.tsx:103-124` → Build temp plan object and call canonical function

---

### ID: CONSISTENCY-004
**Concept:** Monthly Net Profit Calculation
**Severity:** CRITICAL
**Category:** Missing Canonical Function

**Locations Found:**
- `src/components/stats/MonthlySummary.tsx:64` (Only implementation - inline)

**Implementation (MonthlySummary.tsx - INLINE ONLY):**
```typescript
// Lines 30-74 (consolidated logic)
const totalIncome = calculateIncomeForRange(incomeEntries, monthStart, monthEnd);

// Sum fixed expenses
const totalBills = fixedExpenses
  .filter(e => e.isActive)
  .reduce((sum, expense) => sum + expense.amount, 0);

// Sum payment plans
const paymentPlansMinimumDue = paymentPlans
  .filter(p => !p.isComplete)
  .reduce((sum, plan) => sum + getPaymentAmount(plan), 0);

// Sum gas expenses
const totalGasExpenses = Object.values(dailyData)
  .filter(day => day.date >= monthStart && day.date <= monthEnd)
  .reduce((sum, day) => sum + (day.gasExpense ?? 0), 0);

// Calculate net
const net = totalIncome - totalBills - paymentPlansMinimumDue - totalGasExpenses;
```

**Discrepancy:**
The concept of "Monthly Net Profit" is defined inline only in the `MonthlySummary` component. There is no canonical utility function for this calculation, meaning other views (like Trends, Simulator, or future dashboard widgets) cannot easily access the "official" monthly net profit formula.

**Impact:**
- CRITICAL - Core financial metric with no canonical definition
- Cannot be reused in other components
- Formula is "hidden" in component code rather than explicitly defined in calculations library
- If definition changes (e.g., only counting *paid* bills vs *due* bills), this component might diverge from others

**Canonical Solution:**
**File:** `src/lib/utils/profitCalculations.ts`
**New Function:** `calculateMonthlyNetProfit()`

```typescript
export function calculateMonthlyNetProfit(
  totalIncome: number,
  fixedExpenses: FixedExpense[],
  paymentPlans: PaymentPlan[],
  dailyDataForMonth: DailyData[]
): {
  net: number;
  totalBills: number;
  paymentPlansMinimumDue: number;
  totalGasExpenses: number;
} {
  const totalBills = fixedExpenses
    .filter(e => e.isActive)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const paymentPlansMinimumDue = paymentPlans
    .filter(p => !p.isComplete)
    .reduce((sum, plan) => sum + getPaymentAmount(plan), 0);

  const totalGasExpenses = dailyDataForMonth
    .reduce((sum, day) => sum + (day.gasExpense ?? 0), 0);

  const net = totalIncome - totalBills - paymentPlansMinimumDue - totalGasExpenses;

  return { net, totalBills, paymentPlansMinimumDue, totalGasExpenses };
}
```

**Replacements Needed:**
- `src/components/stats/MonthlySummary.tsx:30-74` → Use `calculateMonthlyNetProfit()`

---

### ID: CONSISTENCY-005
**Concept:** Cost Per Mile Calculation
**Severity:** LOW
**Category:** Feature Gap (Not Actually Inconsistent)

**Status:** NOT FOUND in codebase

**Details:**
Mileage (`dailyData.mileage`) and gas expenses (`dailyData.gasExpense`) are both tracked, but there is no calculation for cost-per-mile (gas expense / miles driven). This is a feature gap rather than an inconsistency.

**Impact:** LOW - Missing useful metric, but not causing bugs

**Recommendation:**
Consider adding to `profitCalculations.ts`:
```typescript
export function calculateCostPerMile(gasExpense: number, mileage: number): number | null {
  return mileage > 0 ? gasExpense / mileage : null;
}
```

---

## Part 2: Constants and Configuration Inconsistencies

### ID: CONSISTENCY-006
**Concept:** Amazon Flex Limit Constants
**Severity:** CRITICAL
**Category:** Duplicate Constants

**Locations Found:**
- `src/lib/constants/gigPlatforms.ts:10-11` (Duplicate)
- `src/lib/constants/amazonFlex.ts:6-7` (Canonical)

**Implementation A (gigPlatforms.ts - DUPLICATE):**
```typescript
// Lines 10-11
export const AMAZON_FLEX_DAILY_LIMIT = 8; // hours
export const AMAZON_FLEX_WEEKLY_LIMIT = 40; // hours
```

**Implementation B (amazonFlex.ts - CANONICAL):**
```typescript
// Lines 6-7
export const AMAZON_FLEX_DAILY_LIMIT_HOURS = 8;
export const AMAZON_FLEX_WEEKLY_LIMIT_HOURS = 40;
```

**Discrepancy:**
The same Amazon Flex operational limits are defined in TWO separate files with slightly different names. This is a violation of the DRY (Don't Repeat Yourself) principle for configuration constants.

**Impact:**
- CRITICAL - Business rules duplicated
- If limits change (e.g., Amazon updates policy), must update in two places
- High risk of one being updated but not the other
- Different parts of code might reference different constants

**Canonical Solution:**
**File:** `src/lib/constants/amazonFlex.ts`
**Constants:** `AMAZON_FLEX_DAILY_LIMIT_HOURS`, `AMAZON_FLEX_WEEKLY_LIMIT_HOURS`

**Actions Required:**
1. Remove lines 10-11 from `src/lib/constants/gigPlatforms.ts`
2. Search codebase for any imports of the old constants
3. Update all imports to use `amazonFlex.ts` constants
4. Verify no build errors

---

## Part 3: Date/Time Calculation Inconsistencies

### ID: CONSISTENCY-007
**Concept:** Date Creation Methods
**Severity:** MEDIUM
**Category:** Inconsistent Patterns

**Pattern A (Preferred - date-fns):**
```typescript
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd')
```
**Used in:** `goalCalculations.ts`, `dateHelpers.ts`, `MonthlySummary.tsx`

**Pattern B (Legacy - String manipulation):**
```typescript
new Date().toISOString().split('T')[0]
```
**Used in:**
- `src/components/expenses/PaymentPlanForm.tsx:193, 225`
- `src/app/expenses/ExpensesContent.tsx:196`
- `src/lib/utils/exportImport.ts:171`

**Discrepancy:**
Two different approaches for creating YYYY-MM-DD date strings. While both produce correct output, the inconsistency violates the codebase's established pattern of using `date-fns` for all date operations.

**Impact:**
- MEDIUM - Style inconsistency
- Makes code harder to maintain (multiple patterns for same operation)
- Pattern B is less readable and more error-prone

**Canonical Solution:**
**Option 1:** Direct use of date-fns
```typescript
import { format } from 'date-fns';
const today = format(new Date(), 'yyyy-MM-dd');
```

**Option 2:** Create helper function
```typescript
// In src/lib/utils/dateHelpers.ts
export function getCurrentDateKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
```

**Replacements Needed:**
- `PaymentPlanForm.tsx:193, 225` → Use date-fns pattern
- `ExpensesContent.tsx:196` → Use date-fns pattern
- `exportImport.ts:171` → Use date-fns pattern

---

### ID: CONSISTENCY-008
**Concept:** Day-of-Week Extraction
**Severity:** MEDIUM
**Category:** Inconsistent Pattern

**Implementation (trendsCalculations.ts:52-54):**
```typescript
const date = new Date(entry.blockStartTime);
const dayIndex = date.getDay(); // Native JS
const dayName = DAYS[dayIndex]; // Manual array: ['Sun', 'Mon', 'Tue', ...]
```

**Preferred Pattern:**
```typescript
import { format } from 'date-fns';
const dayName = format(new Date(entry.blockStartTime), 'EEE');
```

**Discrepancy:**
Uses native JavaScript `Date.getDay()` and a manual `DAYS` array instead of `date-fns` like the rest of the codebase.

**Impact:**
- MEDIUM - Style inconsistency
- Requires maintaining a separate `DAYS` constant array
- Doesn't align with the project's standard approach

**Canonical Solution:**
**File:** `src/lib/utils/dateHelpers.ts`

**Option 1:** Direct use
```typescript
import { format } from 'date-fns';
const dayName = format(date, 'EEE'); // Returns 'Sun', 'Mon', etc.
```

**Option 2:** Create helper
```typescript
export function getDayOfWeekShort(date: Date): string {
  return format(date, 'EEE');
}
```

**Replacements Needed:**
- `src/lib/utils/trendsCalculations.ts:52-54` → Use date-fns pattern

---

## Part 4: Validation and Business Rule Gaps

### ID: CONSISTENCY-009
**Concept:** Amazon Flex Hours Limit Enforcement
**Severity:** CRITICAL
**Category:** Business Rule Not Enforced

**Current State:**
- **Calculation:** `src/lib/utils/amazonFlexHours.ts` - Calculates used/remaining hours ✅
- **Display:** `src/components/income/AmazonFlexHoursTracker.tsx` - Shows limits ✅
- **Validation:** MISSING in `src/store/slices/incomeSlice.ts` ❌
- **Validation:** MISSING in `src/lib/api/income.ts` ❌

**Details:**
The business rules for Amazon Flex (8 hours daily limit, 40 hours rolling 7-day limit) are calculated for display purposes, but there is **no enforcement** during data entry. Users can unknowingly or knowingly violate platform limits.

**Impact:**
- CRITICAL - Business rule violation
- Users can exceed limits without warning
- Could lead to account issues if user relies on GigPro for compliance
- Tracking data becomes unreliable if limits are violated

**Example Violation:**
1. User adds 8-hour Amazon Flex block for today ✅
2. User tries to add another 4-hour block for same day ❌ (should be blocked/warned)
3. Currently: Entry is accepted, total = 12 hours (violates 8h limit)

**Canonical Solution:**
**File:** `src/store/slices/incomeSlice.ts`
**Location:** In `addIncomeEntry` and `updateIncomeEntry` actions

**Add Validation:**
```typescript
import { calculateAmazonFlexHours } from '@/lib/utils/amazonFlexHours';
import {
  AMAZON_FLEX_DAILY_LIMIT_HOURS,
  AMAZON_FLEX_WEEKLY_LIMIT_HOURS,
  DEFAULT_TIME_ZONE
} from '@/lib/constants/amazonFlex';

// Before state mutation
if (entry.platform === 'AmazonFlex' && entry.blockLength) {
  const settings = get().settings;
  const dailyCapacity = settings.amazonFlexDailyCapacity ?? (AMAZON_FLEX_DAILY_LIMIT_HOURS * 60);
  const weeklyCapacity = settings.amazonFlexWeeklyCapacity ?? (AMAZON_FLEX_WEEKLY_LIMIT_HOURS * 60);

  const hoursData = calculateAmazonFlexHours(
    entry.date,
    [...get().incomeEntries, entry], // Include new entry
    settings.amazonFlexTimeZone ?? DEFAULT_TIME_ZONE,
    dailyCapacity,
    weeklyCapacity
  );

  // Option 1: Hard error (recommended)
  if (hoursData.dailyHoursUsed > hoursData.dailyLimitHours) {
    throw new Error(
      `This entry would exceed the daily limit of ${hoursData.dailyLimitHours}h ` +
      `(total: ${hoursData.dailyHoursUsed.toFixed(1)}h)`
    );
  }

  if (hoursData.weeklyHoursUsed > hoursData.weeklyLimitHours) {
    throw new Error(
      `This entry would exceed the 7-day rolling limit of ${hoursData.weeklyLimitHours}h ` +
      `(total: ${hoursData.weeklyHoursUsed.toFixed(1)}h)`
    );
  }

  // Option 2: Warning (alternative)
  // Store warning in state for UI to display
  // User can still proceed but is warned
}
```

**Implementation Required:**
- Add validation in `addIncomeEntry` action
- Add validation in `updateIncomeEntry` action
- Decide: Hard error vs warning
- Update UI to display validation errors/warnings

---

### ID: CONSISTENCY-010
**Concept:** Maximum Block Duration Validation
**Severity:** LOW
**Category:** Missing Validation

**Current State:**
Block duration (`blockLength`) is calculated from start/end times via `calculateMissingTime()` in `timeCalculations.ts`. There is **no validation** for maximum reasonable block duration.

**Details:**
- Overnight shifts are supported (crossing midnight adds 24 hours)
- No upper limit validation exists
- User could accidentally create a 48-hour block if they select wrong times

**Impact:**
- LOW - Edge case, but could allow unrealistic data entry
- Mostly a data quality issue rather than business rule violation

**Example Issue:**
- User selects Start: 8:00 PM, End: 8:00 PM (next day)
- System calculates: 24 hours (valid)
- User selects Start: 8:00 PM, End: 8:00 PM (meant same day)
- System calculates: 24 hours (should be 0 hours or error)

**Recommendation:**
Add reasonable maximum (e.g., 16 hours) with optional override:
```typescript
const MAX_BLOCK_DURATION_HOURS = 16;
const MAX_BLOCK_DURATION_MINUTES = MAX_BLOCK_DURATION_HOURS * 60;

if (blockLength > MAX_BLOCK_DURATION_MINUTES) {
  throw new Error(`Block duration cannot exceed ${MAX_BLOCK_DURATION_HOURS} hours`);
}
```

**Priority:** Low - Not a critical fix

---

## Part 5: Already Consistent (No Action Needed)

### Currency Formatting ✅
**Status:** CONSISTENT
**Implementation:** All locations use `formatCurrency()` from `profitCalculations.ts`

**Canonical:**
```typescript
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}
```

**Usage:** Consistent across all components - no issues found.

---

### Time Formatting ✅
**Status:** CONSISTENT
**Display Format:** 12-hour with AM/PM everywhere
**Storage Format:** ISO datetime strings everywhere
**Library:** `date-fns` used consistently

**No issues found.**

---

### Week Start Configuration ✅
**Status:** CONSISTENT
**Configuration:** `weekStartsOn: 0` (Sunday) everywhere
**Usage:** `goalCalculations.ts`, `dateHelpers.ts`

**No issues found.**

---

### Goal Progress Calculation ✅
**Status:** CONSISTENT
**Canonical:** `src/lib/utils/goalCalculations.ts` - `calculateGoalProgress()`
**Formula:** `percentComplete = (currentAmount / targetAmount) * 100` (capped at 100)

**All components use the canonical function - no issues found.**

---

### Expense Calculations ✅
**Status:** MOSTLY CONSISTENT
**Canonical:** `src/lib/utils/expenseCalculations.ts`
- `getPaymentAmount()` - Used consistently everywhere
- `calculatePaymentPlanRemaining()` - Used everywhere except PaymentPlanForm preview (see CONSISTENCY-003)

**Only issue:** Form preview duplication (CONSISTENCY-003)

---

## Summary Tables

### Inconsistency Matrix

| ID | Concept | Severity | Locations | Status |
|----|---------|----------|-----------|--------|
| **CONSISTENCY-001** | Daily Profit | HIGH | `profitCalculations.ts`, `MonthlyCalendar.tsx` | 🔴 Duplicated |
| **CONSISTENCY-002** | Earnings Per Mile | MEDIUM | `profitCalculations.ts`, `MonthlyCalendar.tsx` | 🔴 Duplicated |
| **CONSISTENCY-003** | Payment Plan Remaining | HIGH | `expenseCalculations.ts`, `PaymentPlanForm.tsx` | 🔴 Duplicated |
| **CONSISTENCY-004** | Monthly Net Profit | CRITICAL | `MonthlySummary.tsx` (inline only) | 🔴 Missing Canonical |
| **CONSISTENCY-005** | Cost Per Mile | LOW | Not implemented | 🟡 Feature Gap |
| **CONSISTENCY-006** | Amazon Flex Constants | CRITICAL | `gigPlatforms.ts`, `amazonFlex.ts` | 🔴 Duplicated |
| **CONSISTENCY-007** | Date Creation | MEDIUM | Multiple files, two patterns | 🟡 Style Inconsistency |
| **CONSISTENCY-008** | Day of Week | MEDIUM | `trendsCalculations.ts` | 🟡 Style Inconsistency |
| **CONSISTENCY-009** | Amazon Flex Validation | CRITICAL | Missing in store/API | 🔴 Not Enforced |
| **CONSISTENCY-010** | Max Block Duration | LOW | No validation exists | 🟡 Missing Validation |

### Priority Summary

| Priority | Count | IDs |
|----------|-------|-----|
| **CRITICAL** | 3 | 004, 006, 009 |
| **HIGH** | 2 | 001, 003 |
| **MEDIUM** | 3 | 002, 007, 008 |
| **LOW** | 2 | 005, 010 |
| **✅ Consistent** | 5 | Currency, Time, Week Start, Goals, Expenses |

---

## Implementation Recommendations

### Immediate (Critical Priority)
1. **[CONSISTENCY-006]** Remove duplicate Amazon Flex constants
2. **[CONSISTENCY-004]** Add `calculateMonthlyNetProfit()` canonical function
3. **[CONSISTENCY-009]** Implement Amazon Flex validation in store

### Soon (High Priority)
4. **[CONSISTENCY-001]** Consolidate daily profit calculation
5. **[CONSISTENCY-003]** Update PaymentPlanForm to use canonical function

### When Convenient (Medium Priority)
6. **[CONSISTENCY-007]** Standardize date creation to date-fns pattern
7. **[CONSISTENCY-008]** Update day-of-week extraction to use date-fns
8. **[CONSISTENCY-002]** Consolidate earnings per mile (fixed with #4)

### Low Priority (Polish)
9. **[CONSISTENCY-005]** Consider adding cost-per-mile calculation
10. **[CONSISTENCY-010]** Add maximum block duration validation

---

## Appendix: Canonical Function Locations

### Current Canonical Functions
| Function | File | Line | Purpose |
|----------|------|------|---------|
| `calculateDailyProfit()` | `profitCalculations.ts` | 27-62 | Daily profit and earnings per mile |
| `formatCurrency()` | `profitCalculations.ts` | 112-114 | Currency formatting |
| `formatCurrencyCompact()` | `profitCalculations.ts` | 123-131 | Compact currency for calendar |
| `calculatePaymentPlanRemaining()` | `expenseCalculations.ts` | 30-54 | Payment plan calculations |
| `getPaymentAmount()` | `expenseCalculations.ts` | 17-19 | Effective payment amount |
| `calculateAmazonFlexHours()` | `amazonFlexHours.ts` | 61-117 | Amazon Flex hours tracking |
| `calculateGoalProgress()` | `goalCalculations.ts` | 50-75 | Goal progress percentage |
| `calculateMissingTime()` | `timeCalculations.ts` | 49-124 | Duration from start/end times |
| `formatDuration()` | `timeCalculations.ts` | 136-147 | Format minutes as "Xh Ym" |

### New Canonical Functions (To Be Added)
| Function | File | Purpose |
|----------|------|---------|
| `calculateMonthlyNetProfit()` | `profitCalculations.ts` | Monthly net profit calculation |
| `getCurrentDateKey()` | `dateHelpers.ts` | Consistent date creation |
| `getDayOfWeekShort()` | `dateHelpers.ts` | Day-of-week extraction |
| `calculateCostPerMile()` | `profitCalculations.ts` | Cost per mile metric (optional) |

---

## Testing Recommendations

### Unit Tests Required
1. **profitCalculations.test.ts**
   - Test `calculateDailyProfit()` with various scenarios
   - Test `calculateMonthlyNetProfit()` once added
   - Edge cases: zero income, no expenses, negative gas

2. **expenseCalculations.test.ts**
   - Test `calculatePaymentPlanRemaining()` edge cases
   - Test with various payment states

3. **amazonFlexHours.test.ts**
   - Test validation logic
   - Test rolling 7-day window boundaries
   - Test daily/weekly limit enforcement

4. **dateHelpers.test.ts**
   - Test `getCurrentDateKey()` format
   - Test `getDayOfWeekShort()` for all days

---

**End of Audit Report**
