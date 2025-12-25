# State Management Optimization Design

## Problem Statement

The current Zustand store architecture causes unnecessary re-renders:

1. **Flat data arrays** - All `incomeEntries` in one array. Adding income for one date triggers re-renders in components viewing different months.

2. **Wide subscriptions** - `MonthlySummary` subscribes to 5 data sources. Any change triggers re-render + expensive recalculations.

3. **Shared loading states** - `expenseLoading` shared across fixed expenses, payment plans, and payments.

4. **Component-level computation** - Expensive calculations in `useMemo` still recalculate when unrelated data changes.

## Solution Overview

**Approach: Fine-Grained Selectors + Data Partitioning**

Keep current slice architecture but fix root causes through:
- Data partitioning by month
- Purpose-built selector hooks
- Separated loading states
- Store-level derived data caching

---

## 1. Data Partitioning

### Current Structure
```ts
incomeEntries: IncomeEntry[]           // Flat array of ALL entries
dailyData: Record<string, DailyData>   // Keyed by date
```

### Proposed Structure
```ts
incomeByMonth: Record<string, IncomeEntry[]>  // { "2024-12": [...], "2025-01": [...] }
dailyData: Record<string, DailyData>          // Keep as-is (already partitioned)
```

### Behavior
- Loading income for January 2025 populates `incomeByMonth["2025-01"]`
- Adding entry for Jan 15 only changes `incomeByMonth["2025-01"]` reference
- Components viewing December remain untouched

### Migration Path
1. Add `incomeByMonth` alongside `incomeEntries`
2. Update components one-by-one to new selectors
3. Remove `incomeEntries` once migration complete

### Edge Cases
- Cross-month queries (Amazon Flex 7-day window): fetch multiple month buckets, merge
- Simulator historical data: fetch specific months on demand
- `fixedExpenses`, `paymentPlans`, `goals`: remain flat (small, rarely change)

---

## 2. Granular Selector Hooks

### Current Pattern
```ts
export const useIncomeStore = () =>
  useStore(
    (state) => ({
      incomeEntries: state.incomeEntries,  // ALL entries
      isLoading: state.incomeLoading,
      // ... all actions
    }),
    shallow
  );
```

### Proposed Pattern

```ts
// Data selectors - subscribe to specific slices
export const useIncomeForMonth = (monthKey: string) =>
  useStore(useCallback(
    (state) => state.incomeByMonth[monthKey] ?? [],
    [monthKey]
  ));

export const useIncomeForDate = (dateKey: string) =>
  useStore(useCallback(
    (state) => {
      const monthKey = dateKey.slice(0, 7);
      return (state.incomeByMonth[monthKey] ?? [])
        .filter(e => e.date === dateKey);
    },
    [dateKey]
  ));

// Action-only hooks - no data subscription
export const useIncomeActions = () =>
  useStore(useShallow((state) => ({
    loadIncomeEntries: state.loadIncomeEntries,
    addIncomeEntry: state.addIncomeEntry,
    updateIncomeEntry: state.updateIncomeEntry,
    deleteIncomeEntry: state.deleteIncomeEntry,
  })));
```

### Component Updates
| Component | Current | Proposed |
|-----------|---------|----------|
| MonthlyCalendar | `useStore` with all incomeEntries | `useIncomeForMonth(monthKey)` |
| MonthlySummary | `useStore` with 5 data sources | `useMonthlyTotals(monthKey)` |
| DayContent | `useIncomeStore()` | `useIncomeForDate(dateKey)` + `useIncomeActions()` |

---

## 3. Separated Loading States

### Current Structure
```ts
incomeLoading: boolean;
expenseLoading: boolean;  // Shared across 3 resources
```

### Proposed Structure
```ts
// Per-month loading for income
incomeLoadingByMonth: Record<string, boolean>;  // { "2025-01": true }

// Separate flags for expenses
fixedExpensesLoading: boolean;
paymentPlansLoading: boolean;
paymentPlanPaymentsLoading: boolean;
```

### Selector Hooks
```ts
export const useIncomeLoadingForMonth = (monthKey: string) =>
  useStore((state) => state.incomeLoadingByMonth[monthKey] ?? false);

export const useFixedExpensesLoading = () =>
  useStore((state) => state.fixedExpensesLoading);
```

### Backwards Compatibility
```ts
// Derived getter for existing consumers
get incomeLoading() {
  return Object.values(this.incomeLoadingByMonth).some(Boolean);
}
```

---

## 4. Derived Data Caching

### Current Pattern (Component-Level)
```tsx
// MonthlySummary.tsx
const monthlyTotals = useMemo(() => {
  // Expensive calculations
}, [currentDate, incomeEntries, fixedExpenses, paymentPlans, dailyData]);
```

### Proposed Pattern (Store-Level)

```ts
interface DerivedDataSlice {
  // Cached computed values
  monthlyTotalsCache: Record<string, MonthlyTotals>;
  dailyProfitCache: Record<string, DailyProfit>;

  // Cache management
  invalidateMonthCache: (monthKey: string) => void;
  invalidateDayCache: (dateKey: string) => void;

  // Compute-on-demand with caching
  getMonthlyTotals: (monthKey: string) => MonthlyTotals;
  getDailyProfit: (dateKey: string) => DailyProfit;
}
```

### Cache Invalidation Strategy
| Mutation | Invalidates |
|----------|-------------|
| Add/update/delete income | Month cache + affected day caches |
| Update daily data | Day cache + month cache |
| Add/update/delete fixed expense | All month caches |
| Add/update/delete payment plan | All month caches |

### What Gets Cached
- Monthly totals (income, expenses, net, miles)
- Daily profit by date (for calendar cells)

### What Stays Fresh
- Goal progress (dynamic date ranges)
- Amazon Flex rolling 7-day hours (crosses month boundaries)

---

## Implementation Order

1. **Phase 1: Data Structure** - Add `incomeByMonth`, update `incomeSlice` actions
2. **Phase 2: Selectors** - Create granular hooks, keep old ones working
3. **Phase 3: Loading States** - Split loading flags, add per-month tracking
4. **Phase 4: Derived Cache** - Add `DerivedDataSlice`, migrate calculations
5. **Phase 5: Component Migration** - Update components one-by-one
6. **Phase 6: Cleanup** - Remove deprecated selectors and flat arrays

---

## Files to Modify

### Store Layer
- `src/store/index.ts` - New selector exports
- `src/store/slices/incomeSlice.ts` - Data partitioning + loading states
- `src/store/slices/expenseSlice.ts` - Separate loading states
- `src/store/slices/derivedDataSlice.ts` - New file for caching

### Components
- `src/app/page.tsx` - Use new loading selectors
- `src/components/calendar/MonthlyCalendar.tsx` - Use `useIncomeForMonth`
- `src/components/stats/MonthlySummary.tsx` - Use `useMonthlyTotals`
- `src/app/day/[date]/DayContent.tsx` - Use `useIncomeForDate`
- `src/components/income/AmazonFlexHoursTracker.tsx` - Cross-month selector

---

## Success Criteria

1. Adding income entry only re-renders components viewing that month
2. Editing expenses doesn't re-render calendar
3. Loading states are granular and accurate
4. Monthly totals don't recalculate on unrelated changes
5. Existing tests continue passing
6. No regression in functionality
