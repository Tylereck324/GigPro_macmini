# State Management Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate unnecessary re-renders by partitioning income data by month, creating granular selectors, separating loading states, and caching derived data.

**Architecture:** Keep existing Zustand slice architecture. Add `incomeByMonth` data structure alongside existing `incomeEntries` for incremental migration. Create purpose-built selector hooks that subscribe to minimal state. Add a `DerivedDataSlice` for cached calculations.

**Tech Stack:** Zustand 4.5, React 18, TypeScript 5.5, Vitest for testing

---

## Phase 1: Data Structure Changes

### Task 1.1: Add incomeByMonth to IncomeSlice Interface

**Files:**
- Modify: `src/store/slices/incomeSlice.ts:21-32`
- Test: `src/store/slices/__tests__/incomeSlice.test.ts`

**Step 1: Update IncomeSlice interface**

Add new state properties to the interface:

```typescript
// In src/store/slices/incomeSlice.ts, update the interface
export interface IncomeSlice {
  // Existing flat array (kept for backwards compatibility during migration)
  incomeEntries: IncomeEntry[];

  // NEW: Partitioned by month key "YYYY-MM"
  incomeByMonth: Record<string, IncomeEntry[]>;

  // NEW: Per-month loading states
  incomeLoadingByMonth: Record<string, boolean>;

  // Existing (kept for backwards compatibility)
  incomeLoading: boolean;
  incomeError: string | null;

  // Actions (unchanged signatures)
  loadIncomeEntries: (options?: GetIncomeEntriesOptions) => Promise<void>;
  addIncomeEntry: (entry: CreateIncomeEntry) => Promise<IncomeEntry>;
  updateIncomeEntry: (id: string, updates: UpdateIncomeEntry) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;
  getIncomeByDate: (date: string) => IncomeEntry[];
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Errors about missing properties in createIncomeSlice (this is expected)

**Step 3: Initialize new state in createIncomeSlice**

Update the initial state in `createIncomeSlice`:

```typescript
export const createIncomeSlice: StateCreator<IncomeSlice> = (set, get) => ({
  incomeEntries: [],
  incomeByMonth: {},           // NEW
  incomeLoadingByMonth: {},    // NEW
  incomeLoading: false,
  incomeError: null,
  // ... rest of actions
```

**Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

**Step 5: Commit**

```bash
git add src/store/slices/incomeSlice.ts
git commit -m "feat(store): add incomeByMonth and per-month loading state"
```

---

### Task 1.2: Helper Functions for Month Key Extraction

**Files:**
- Modify: `src/store/slices/incomeSlice.ts`

**Step 1: Add helper function at top of file**

Add after imports, before interface:

```typescript
/**
 * Extract month key (YYYY-MM) from a date string (YYYY-MM-DD)
 */
function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * Group income entries by month key
 */
function groupEntriesByMonth(entries: IncomeEntry[]): Record<string, IncomeEntry[]> {
  const result: Record<string, IncomeEntry[]> = {};
  for (const entry of entries) {
    const monthKey = getMonthKey(entry.date);
    if (!result[monthKey]) {
      result[monthKey] = [];
    }
    result[monthKey].push(entry);
  }
  return result;
}
```

**Step 2: Commit**

```bash
git add src/store/slices/incomeSlice.ts
git commit -m "feat(store): add month key helper functions"
```

---

### Task 1.3: Update loadIncomeEntries to Populate incomeByMonth

**Files:**
- Modify: `src/store/slices/incomeSlice.ts:89-109`
- Test: `src/store/slices/__tests__/incomeSlice.test.ts`

**Step 1: Write the failing test**

Add to `src/store/slices/__tests__/incomeSlice.test.ts`:

```typescript
describe('incomeByMonth', () => {
  it('should populate incomeByMonth when loading entries', async () => {
    const mockEntries = [
      { id: '1', date: '2025-01-15', platform: 'AmazonFlex', amount: 100, notes: '', blockStartTime: null, blockEndTime: null, blockLength: null, createdAt: Date.now(), updatedAt: Date.now() },
      { id: '2', date: '2025-01-20', platform: 'DoorDash', amount: 50, notes: '', blockStartTime: null, blockEndTime: null, blockLength: null, createdAt: Date.now(), updatedAt: Date.now() },
      { id: '3', date: '2025-02-05', platform: 'AmazonFlex', amount: 75, notes: '', blockStartTime: null, blockEndTime: null, blockLength: null, createdAt: Date.now(), updatedAt: Date.now() },
    ];

    vi.mocked(incomeApi.getIncomeEntries).mockResolvedValueOnce(mockEntries);

    const { result } = renderHook(() => useStore());
    await act(async () => {
      await result.current.loadIncomeEntries();
    });

    // Check incomeByMonth is populated correctly
    expect(result.current.incomeByMonth['2025-01']).toHaveLength(2);
    expect(result.current.incomeByMonth['2025-02']).toHaveLength(1);
    expect(result.current.incomeByMonth['2025-01'].map(e => e.id)).toEqual(['1', '2']);
  });

  it('should set per-month loading state when dateRange provided', async () => {
    vi.mocked(incomeApi.getIncomeEntries).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useStore());

    const loadPromise = act(async () => {
      await result.current.loadIncomeEntries({
        dateRange: { start: '2025-01-01', end: '2025-01-31' }
      });
    });

    // Check loading state was set for the month
    // Note: This is tricky to test due to async timing
    await loadPromise;
    expect(result.current.incomeLoadingByMonth['2025-01']).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`
Expected: FAIL (incomeByMonth is empty)

**Step 3: Update loadIncomeEntries implementation**

Replace the `loadIncomeEntries` action in `createIncomeSlice`:

```typescript
loadIncomeEntries: async (options?: GetIncomeEntriesOptions) => {
  // Determine which month we're loading (if date range specified)
  const monthKey = options?.dateRange?.start
    ? getMonthKey(options.dateRange.start)
    : null;

  // Set loading state
  if (monthKey) {
    set((state) => ({
      incomeLoadingByMonth: { ...state.incomeLoadingByMonth, [monthKey]: true },
    }));
  }
  set({ incomeLoading: true, incomeError: null });

  try {
    const newEntries = await incomeApi.getIncomeEntries(options);

    // Group new entries by month
    const newEntriesByMonth = groupEntriesByMonth(newEntries);

    set((state) => {
      // Merge with existing entries (flat array - backwards compat)
      const existingIds = new Set(newEntries.map((e) => e.id));
      const existingToKeep = state.incomeEntries.filter((e) => !existingIds.has(e.id));

      // Merge incomeByMonth - replace months that were loaded
      const updatedByMonth = { ...state.incomeByMonth };
      for (const [month, entries] of Object.entries(newEntriesByMonth)) {
        // If loading a specific month, replace it entirely
        // If loading all, merge by replacing existing entries
        if (monthKey && month === monthKey) {
          updatedByMonth[month] = entries;
        } else {
          // Merge: keep entries not in new batch, add new entries
          const existingMonthEntries = state.incomeByMonth[month] || [];
          const filteredExisting = existingMonthEntries.filter(
            (e) => !existingIds.has(e.id)
          );
          updatedByMonth[month] = [...filteredExisting, ...entries];
        }
      }

      return {
        incomeEntries: [...existingToKeep, ...newEntries],
        incomeByMonth: updatedByMonth,
        incomeLoading: false,
        incomeLoadingByMonth: monthKey
          ? { ...state.incomeLoadingByMonth, [monthKey]: false }
          : state.incomeLoadingByMonth,
      };
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load income entries';
    console.error('Failed to load income entries:', error);
    set((state) => ({
      incomeLoading: false,
      incomeError: errorMessage,
      incomeLoadingByMonth: monthKey
        ? { ...state.incomeLoadingByMonth, [monthKey]: false }
        : state.incomeLoadingByMonth,
    }));
    throw error;
  }
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/slices/incomeSlice.ts src/store/slices/__tests__/incomeSlice.test.ts
git commit -m "feat(store): populate incomeByMonth on load"
```

---

### Task 1.4: Update addIncomeEntry to Maintain incomeByMonth

**Files:**
- Modify: `src/store/slices/incomeSlice.ts` (addIncomeEntry action)

**Step 1: Write the failing test**

Add to the `incomeByMonth` describe block:

```typescript
it('should add new entry to correct month bucket', async () => {
  const newEntry = {
    date: '2025-03-15',
    platform: 'AmazonFlex' as const,
    amount: 120,
    notes: '',
    blockStartTime: null,
    blockEndTime: null,
    blockLength: null,
  };

  const createdEntry = {
    ...newEntry,
    id: 'new-id',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  vi.mocked(incomeApi.createIncomeEntry).mockResolvedValueOnce(createdEntry);

  const { result } = renderHook(() => useStore());
  await act(async () => {
    await result.current.addIncomeEntry(newEntry);
  });

  expect(result.current.incomeByMonth['2025-03']).toHaveLength(1);
  expect(result.current.incomeByMonth['2025-03'][0].id).toBe('new-id');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`
Expected: FAIL

**Step 3: Update addIncomeEntry to maintain incomeByMonth**

In the `addIncomeEntry` action, update the final `set` call:

```typescript
// Update state with new entry
set((state) => {
  const monthKey = getMonthKey(newEntry.date);
  const existingMonthEntries = state.incomeByMonth[monthKey] || [];

  return {
    incomeEntries: [...state.incomeEntries, newEntry],
    incomeByMonth: {
      ...state.incomeByMonth,
      [monthKey]: [...existingMonthEntries, newEntry],
    },
  };
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/slices/incomeSlice.ts src/store/slices/__tests__/incomeSlice.test.ts
git commit -m "feat(store): maintain incomeByMonth on add"
```

---

### Task 1.5: Update updateIncomeEntry to Maintain incomeByMonth

**Files:**
- Modify: `src/store/slices/incomeSlice.ts` (updateIncomeEntry action)

**Step 1: Write the failing test**

```typescript
it('should update entry in correct month bucket', async () => {
  // Pre-populate state
  const existingEntry = {
    id: 'entry-1',
    date: '2025-01-15',
    platform: 'AmazonFlex' as const,
    amount: 100,
    notes: '',
    blockStartTime: null,
    blockEndTime: null,
    blockLength: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  vi.mocked(incomeApi.getIncomeEntries).mockResolvedValueOnce([existingEntry]);
  vi.mocked(incomeApi.updateIncomeEntry).mockResolvedValueOnce({
    ...existingEntry,
    amount: 150,
    updatedAt: Date.now(),
  });

  const { result } = renderHook(() => useStore());

  // Load initial data
  await act(async () => {
    await result.current.loadIncomeEntries();
  });

  // Update the entry
  await act(async () => {
    await result.current.updateIncomeEntry('entry-1', { amount: 150 });
  });

  expect(result.current.incomeByMonth['2025-01'][0].amount).toBe(150);
});

it('should move entry between months when date changes', async () => {
  const existingEntry = {
    id: 'entry-1',
    date: '2025-01-15',
    platform: 'AmazonFlex' as const,
    amount: 100,
    notes: '',
    blockStartTime: null,
    blockEndTime: null,
    blockLength: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  vi.mocked(incomeApi.getIncomeEntries).mockResolvedValueOnce([existingEntry]);
  vi.mocked(incomeApi.updateIncomeEntry).mockResolvedValueOnce({
    ...existingEntry,
    date: '2025-02-10',
    updatedAt: Date.now(),
  });

  const { result } = renderHook(() => useStore());

  await act(async () => {
    await result.current.loadIncomeEntries();
  });

  await act(async () => {
    await result.current.updateIncomeEntry('entry-1', { date: '2025-02-10' });
  });

  // Should be removed from January
  expect(result.current.incomeByMonth['2025-01'] || []).toHaveLength(0);
  // Should be added to February
  expect(result.current.incomeByMonth['2025-02']).toHaveLength(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`
Expected: FAIL

**Step 3: Update updateIncomeEntry implementation**

Replace both `set` calls in `updateIncomeEntry` (optimistic and server response):

```typescript
// Helper to update incomeByMonth when an entry changes
const updateByMonthForEntry = (
  state: { incomeByMonth: Record<string, IncomeEntry[]> },
  oldEntry: IncomeEntry | undefined,
  newEntry: IncomeEntry
): Record<string, IncomeEntry[]> => {
  const result = { ...state.incomeByMonth };
  const oldMonthKey = oldEntry ? getMonthKey(oldEntry.date) : null;
  const newMonthKey = getMonthKey(newEntry.date);

  // Remove from old month if it changed
  if (oldMonthKey && oldMonthKey !== newMonthKey) {
    result[oldMonthKey] = (result[oldMonthKey] || []).filter((e) => e.id !== newEntry.id);
  }

  // Update in new month
  const monthEntries = result[newMonthKey] || [];
  const existingIndex = monthEntries.findIndex((e) => e.id === newEntry.id);
  if (existingIndex >= 0) {
    result[newMonthKey] = [
      ...monthEntries.slice(0, existingIndex),
      newEntry,
      ...monthEntries.slice(existingIndex + 1),
    ];
  } else {
    result[newMonthKey] = [...monthEntries, newEntry];
  }

  return result;
};
```

Then update the optimistic update `set`:

```typescript
// Optimistic update
const optimisticEntry = { ...original, ...validatedUpdates, updatedAt: Date.now() };
set((state) => ({
  incomeEntries: state.incomeEntries.map((entry) =>
    entry.id === id ? optimisticEntry : entry
  ),
  incomeByMonth: updateByMonthForEntry(state, original, optimisticEntry as IncomeEntry),
}));
```

And the server response `set`:

```typescript
// Update with server data
set((state) => ({
  incomeEntries: state.incomeEntries.map((entry) =>
    entry.id === id ? updatedEntry : entry
  ),
  incomeByMonth: updateByMonthForEntry(state, original, updatedEntry),
}));
```

And the rollback `set`:

```typescript
// Rollback using original captured before update
if (original) {
  set((state) => ({
    incomeEntries: state.incomeEntries.map((entry) =>
      entry.id === id ? original : entry
    ),
    incomeByMonth: updateByMonthForEntry(state, optimisticEntry as IncomeEntry, original),
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/slices/incomeSlice.ts src/store/slices/__tests__/incomeSlice.test.ts
git commit -m "feat(store): maintain incomeByMonth on update"
```

---

### Task 1.6: Update deleteIncomeEntry to Maintain incomeByMonth

**Files:**
- Modify: `src/store/slices/incomeSlice.ts` (deleteIncomeEntry action)

**Step 1: Write the failing test**

```typescript
it('should remove entry from correct month bucket on delete', async () => {
  const existingEntry = {
    id: 'entry-1',
    date: '2025-01-15',
    platform: 'AmazonFlex' as const,
    amount: 100,
    notes: '',
    blockStartTime: null,
    blockEndTime: null,
    blockLength: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  vi.mocked(incomeApi.getIncomeEntries).mockResolvedValueOnce([existingEntry]);
  vi.mocked(incomeApi.deleteIncomeEntry).mockResolvedValueOnce(undefined);

  const { result } = renderHook(() => useStore());

  await act(async () => {
    await result.current.loadIncomeEntries();
  });

  expect(result.current.incomeByMonth['2025-01']).toHaveLength(1);

  await act(async () => {
    await result.current.deleteIncomeEntry('entry-1');
  });

  expect(result.current.incomeByMonth['2025-01']).toHaveLength(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run`
Expected: FAIL

**Step 3: Update deleteIncomeEntry implementation**

Update the optimistic delete `set`:

```typescript
// Optimistic delete
set((state) => {
  const monthKey = original ? getMonthKey(original.date) : null;
  return {
    incomeEntries: state.incomeEntries.filter((entry) => entry.id !== id),
    incomeByMonth: monthKey
      ? {
          ...state.incomeByMonth,
          [monthKey]: (state.incomeByMonth[monthKey] || []).filter((e) => e.id !== id),
        }
      : state.incomeByMonth,
  };
});
```

Update the rollback `set`:

```typescript
// Rollback with original captured data
if (original) {
  set((state) => {
    const monthKey = getMonthKey(original.date);
    return {
      incomeEntries: [...state.incomeEntries, original],
      incomeByMonth: {
        ...state.incomeByMonth,
        [monthKey]: [...(state.incomeByMonth[monthKey] || []), original],
      },
    };
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/slices/incomeSlice.ts src/store/slices/__tests__/incomeSlice.test.ts
git commit -m "feat(store): maintain incomeByMonth on delete"
```

---

## Phase 2: Granular Selector Hooks

### Task 2.1: Create useIncomeForMonth Selector

**Files:**
- Modify: `src/store/index.ts`

**Step 1: Add the new selector hook**

Add after existing exports in `src/store/index.ts`:

```typescript
import { useCallback } from 'react';

// Granular selectors for optimized re-renders

/**
 * Select income entries for a specific month
 * Only re-renders when that month's data changes
 */
export const useIncomeForMonth = (monthKey: string) =>
  useStore(
    useCallback(
      (state: AppStore) => state.incomeByMonth[monthKey] ?? [],
      [monthKey]
    )
  );

/**
 * Select income entries for a specific date
 * Filters from the month bucket for efficiency
 */
export const useIncomeForDate = (dateKey: string) =>
  useStore(
    useCallback(
      (state: AppStore) => {
        const monthKey = dateKey.slice(0, 7);
        return (state.incomeByMonth[monthKey] ?? []).filter(
          (e) => e.date === dateKey
        );
      },
      [dateKey]
    )
  );

/**
 * Select loading state for a specific month
 */
export const useIncomeLoadingForMonth = (monthKey: string) =>
  useStore(
    useCallback(
      (state: AppStore) => state.incomeLoadingByMonth[monthKey] ?? false,
      [monthKey]
    )
  );

/**
 * Select only income actions (no data subscription)
 * Components that only modify data use this to avoid re-renders
 */
export const useIncomeActions = () =>
  useStore(
    useShallow((state) => ({
      loadIncomeEntries: state.loadIncomeEntries,
      addIncomeEntry: state.addIncomeEntry,
      updateIncomeEntry: state.updateIncomeEntry,
      deleteIncomeEntry: state.deleteIncomeEntry,
    }))
  );
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "feat(store): add granular income selector hooks"
```

---

### Task 2.2: Separate Expense Loading States

**Files:**
- Modify: `src/store/slices/expenseSlice.ts`
- Modify: `src/store/index.ts`

**Step 1: Update ExpenseSlice interface**

In `src/store/slices/expenseSlice.ts`, update the interface:

```typescript
export interface ExpenseSlice {
  fixedExpenses: FixedExpense[];
  paymentPlans: PaymentPlan[];
  paymentPlanPayments: PaymentPlanPayment[];

  // Separate loading states (NEW)
  fixedExpensesLoading: boolean;
  paymentPlansLoading: boolean;
  paymentPlanPaymentsLoading: boolean;

  // Keep for backwards compatibility
  expenseLoading: boolean;
  expenseError: string | null;

  // ... rest of actions unchanged
}
```

**Step 2: Update initial state**

```typescript
export const createExpenseSlice: StateCreator<ExpenseSlice> = (set, get) => ({
  fixedExpenses: [],
  paymentPlans: [],
  paymentPlanPayments: [],
  fixedExpensesLoading: false,      // NEW
  paymentPlansLoading: false,       // NEW
  paymentPlanPaymentsLoading: false, // NEW
  expenseLoading: false,
  expenseError: null,
  // ... actions
```

**Step 3: Update loadFixedExpenses**

```typescript
loadFixedExpenses: async () => {
  set({ fixedExpensesLoading: true, expenseLoading: true, expenseError: null });
  try {
    const expenses = await fixedExpensesApi.getFixedExpenses();
    set({ fixedExpenses: expenses, fixedExpensesLoading: false, expenseLoading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load fixed expenses';
    console.error('Failed to load fixed expenses:', error);
    set({ fixedExpensesLoading: false, expenseLoading: false, expenseError: errorMessage });
    throw error;
  }
},
```

**Step 4: Update loadPaymentPlans**

```typescript
loadPaymentPlans: async () => {
  set({ paymentPlansLoading: true, expenseLoading: true, expenseError: null });
  try {
    const plans = await paymentPlansApi.getPaymentPlans();
    set({ paymentPlans: plans, paymentPlansLoading: false, expenseLoading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load payment plans';
    console.error('Failed to load payment plans:', error);
    set({ paymentPlansLoading: false, expenseLoading: false, expenseError: errorMessage });
    throw error;
  }
},
```

**Step 5: Update loadPaymentPlanPayments**

```typescript
loadPaymentPlanPayments: async () => {
  set({ paymentPlanPaymentsLoading: true, expenseLoading: true, expenseError: null });
  try {
    const payments = await paymentPlanPaymentsApi.getPaymentPlanPayments();
    set({ paymentPlanPayments: payments, paymentPlanPaymentsLoading: false, expenseLoading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load payment plan payments';
    console.error('Failed to load payment plan payments:', error);
    set({ paymentPlanPaymentsLoading: false, expenseLoading: false, expenseError: errorMessage });
    throw error;
  }
},
```

**Step 6: Add granular loading selectors to store/index.ts**

```typescript
/**
 * Select only fixed expenses loading state
 */
export const useFixedExpensesLoading = () =>
  useStore((state) => state.fixedExpensesLoading);

/**
 * Select only payment plans loading state
 */
export const usePaymentPlansLoading = () =>
  useStore((state) => state.paymentPlansLoading);

/**
 * Select only payment plan payments loading state
 */
export const usePaymentPlanPaymentsLoading = () =>
  useStore((state) => state.paymentPlanPaymentsLoading);
```

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 8: Run existing tests**

Run: `npm test -- --run`
Expected: PASS

**Step 9: Commit**

```bash
git add src/store/slices/expenseSlice.ts src/store/index.ts
git commit -m "feat(store): separate expense loading states"
```

---

## Phase 3: Component Migration

### Task 3.1: Update MonthlyCalendar to Use New Selectors

**Files:**
- Modify: `src/components/calendar/MonthlyCalendar.tsx`

**Step 1: Update imports**

```typescript
import { useIncomeForMonth, useStore } from '@/store';
```

**Step 2: Replace store subscription**

Replace:
```typescript
const { incomeEntries, dailyData } = useStore(
  useShallow((state) => ({
    incomeEntries: state.incomeEntries,
    dailyData: state.dailyData,
  }))
);
```

With:
```typescript
// Get current month key from currentDate state
const currentMonthKey = format(currentDate, 'yyyy-MM');

// Subscribe only to current month's income (granular)
const incomeEntries = useIncomeForMonth(currentMonthKey);

// Daily data is already keyed by date, keep as-is
const dailyData = useStore((state) => state.dailyData);
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/calendar/MonthlyCalendar.tsx
git commit -m "refactor(calendar): use granular income selector"
```

---

### Task 3.2: Update MonthlySummary to Use New Selectors

**Files:**
- Modify: `src/components/stats/MonthlySummary.tsx`

**Step 1: Update imports**

```typescript
import { useIncomeForMonth, useStore } from '@/store';
```

**Step 2: Replace store subscription**

Replace the existing `useStore` call with:

```typescript
const currentMonthKey = format(currentDate, 'yyyy-MM');

// Granular subscriptions
const incomeEntries = useIncomeForMonth(currentMonthKey);

const { fixedExpenses, paymentPlans, goals, dailyData } = useStore(
  useShallow((state) => ({
    fixedExpenses: state.fixedExpenses,
    paymentPlans: state.paymentPlans,
    goals: state.goals,
    dailyData: state.dailyData,
  }))
);
```

**Step 3: Update monthlyTotals useMemo dependencies**

The `incomeEntries` is now already filtered to current month, so update:

```typescript
const monthlyTotals = useMemo(() => {
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // incomeEntries is already for current month, just sum it
  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);

  // Get daily data for the month
  const dailyDataForMonth = Object.values(dailyData).filter(
    (day) => day.date >= monthStart && day.date <= monthEnd
  );

  const monthlyNet = calculateMonthlyNetProfit(
    totalIncome,
    fixedExpenses,
    paymentPlans,
    dailyDataForMonth
  );

  const totalMiles = dailyDataForMonth.reduce(
    (sum, day) => sum + (day.mileage ?? 0),
    0
  );

  return {
    totalIncome,
    ...monthlyNet,
    totalMiles,
  };
}, [currentDate, incomeEntries, fixedExpenses, paymentPlans, dailyData]);
```

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/stats/MonthlySummary.tsx
git commit -m "refactor(summary): use granular income selector"
```

---

### Task 3.3: Update DayContent to Use New Selectors

**Files:**
- Modify: `src/app/day/[date]/DayContent.tsx`

**Step 1: Update imports**

```typescript
import { useIncomeForDate, useIncomeActions, useDailyDataStore } from '@/store';
```

**Step 2: Replace store subscriptions**

Replace:
```typescript
const {
  incomeEntries,
  isLoading: incomeLoading,
  error: incomeError,
  loadIncomeEntries,
  addIncomeEntry,
  updateIncomeEntry,
  deleteIncomeEntry,
  getIncomeByDate,
} = useIncomeStore();
```

With:
```typescript
// Data subscription - only this date's entries
const incomeEntries = useIncomeForDate(dateKey);

// Actions only - no data subscription
const { loadIncomeEntries, addIncomeEntry, updateIncomeEntry, deleteIncomeEntry } = useIncomeActions();

// Loading state for this month
const monthKey = dateKey.slice(0, 7);
const incomeLoading = useStore((state) => state.incomeLoadingByMonth[monthKey] ?? false);
const incomeError = useStore((state) => state.incomeError);
```

**Step 3: Remove getIncomeByDate usage**

Since `incomeEntries` is already filtered to this date, remove any `getIncomeByDate` calls.

Search for `getIncomeByDate` in the file and replace with direct use of `incomeEntries`.

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/day/[date]/DayContent.tsx
git commit -m "refactor(day): use granular income selectors"
```

---

### Task 3.4: Update Home Page Loading

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update to use useIncomeActions**

Replace the `useStore` call with:

```typescript
import { useIncomeActions, useStore } from '@/store';

// Actions only - stable references, no re-renders on data change
const { loadIncomeEntries } = useIncomeActions();

const {
  loadDailyData,
  loadFixedExpenses,
  loadPaymentPlans,
  loadPaymentPlanPayments,
  loadGoals,
} = useStore(
  useShallow((state) => ({
    loadDailyData: state.loadDailyData,
    loadFixedExpenses: state.loadFixedExpenses,
    loadPaymentPlans: state.loadPaymentPlans,
    loadPaymentPlanPayments: state.loadPaymentPlanPayments,
    loadGoals: state.loadGoals,
  }))
);
```

**Step 2: Update useCallback dependencies**

Remove `loadIncomeEntries` from the dependencies if it's now from `useIncomeActions` (stable reference).

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor(home): use granular action selectors"
```

---

## Phase 4: Final Verification

### Task 4.1: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit any remaining changes**

```bash
git status
# If any changes:
git add -A
git commit -m "chore: fix any remaining issues from migration"
```

---

### Task 4.2: Manual Testing Checklist

Test in browser:

1. [ ] Load home page - calendar and summary render
2. [ ] Navigate months - data loads correctly
3. [ ] Click a day - day page loads with correct entries
4. [ ] Add income entry - appears in day view
5. [ ] Navigate back to calendar - new entry reflected
6. [ ] Edit income entry - updates correctly
7. [ ] Delete income entry - removes correctly
8. [ ] Check console for errors - none

---

## Summary

This plan implements:
- **incomeByMonth** data partitioning in the store
- **Per-month loading states** for granular loading indicators
- **Granular selector hooks** (`useIncomeForMonth`, `useIncomeForDate`, `useIncomeActions`)
- **Separated expense loading states**
- **Component migration** to use new selectors

Components will only re-render when their specific month's data changes, eliminating unnecessary re-renders across the application.
