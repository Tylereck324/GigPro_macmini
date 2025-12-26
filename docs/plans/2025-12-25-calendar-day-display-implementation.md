# Calendar Day Display Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display income, expenses, and profit breakdown on each calendar day cell with responsive design

**Architecture:** Create a new `DayMetrics` component that receives `DailyProfit` data and renders a vertical stack of three metric lines (income, expenses, profit) with icons, labels, and amounts. Update `DayCell` to use this new component instead of the current single profit display.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, React Testing Library

---

## Task 1: Create DayMetrics Component Structure

**Files:**
- Create: `src/components/calendar/DayMetrics.tsx`
- Create: `src/components/calendar/__tests__/DayMetrics.test.tsx`

**Step 1: Write the failing test**

Create `src/components/calendar/__tests__/DayMetrics.test.tsx`:

```typescript
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayMetrics } from '../DayMetrics';
import type { DailyProfit } from '@/types/dailyData';

describe('DayMetrics', () => {
  test('renders nothing when no activity', () => {
    const profit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 0,
      gasExpense: 0,
      profit: 0,
      earningsPerMile: null,
    };

    const { container } = render(<DayMetrics profit={profit} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders income and profit when no expenses', () => {
    const profit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 250,
      gasExpense: 0,
      profit: 250,
      earningsPerMile: 5,
    };

    render(<DayMetrics profit={profit} />);

    // Should show income
    expect(screen.getByText(/250/)).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();

    // Should NOT show expenses line (gasExpense is 0)
    const expensesText = screen.queryByText('↓');
    expect(expensesText).not.toBeInTheDocument();

    // Should show profit
    expect(screen.getByText('=')).toBeInTheDocument();
  });

  test('renders all three lines when expenses exist', () => {
    const profit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 250,
      gasExpense: 80,
      profit: 170,
      earningsPerMile: 3.5,
    };

    render(<DayMetrics profit={profit} />);

    // Income line
    expect(screen.getByText('↑')).toBeInTheDocument();

    // Expenses line
    expect(screen.getByText('↓')).toBeInTheDocument();

    // Profit line
    expect(screen.getByText('=')).toBeInTheDocument();

    // All amounts should be visible
    expect(screen.getByText(/250/)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
    expect(screen.getByText(/170/)).toBeInTheDocument();
  });

  test('applies correct colors for profit line', () => {
    const positiveProfit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 250,
      gasExpense: 80,
      profit: 170,
      earningsPerMile: 3.5,
    };

    const { rerender } = render(<DayMetrics profit={positiveProfit} />);

    // Find profit amount (the one with 170)
    const profitElement = screen.getByText(/170/);
    expect(profitElement).toHaveClass('text-success');

    // Test negative profit
    const negativeProfit: DailyProfit = {
      ...positiveProfit,
      profit: -50,
    };

    rerender(<DayMetrics profit={negativeProfit} />);
    const lossElement = screen.getByText(/-50/);
    expect(lossElement).toHaveClass('text-danger');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- DayMetrics.test.tsx`
Expected: FAIL with "Cannot find module '../DayMetrics'"

**Step 3: Write minimal implementation**

Create `src/components/calendar/DayMetrics.tsx`:

```typescript
'use client';

import { memo } from 'react';
import { formatCurrencyCompact } from '@/lib/utils/profitCalculations';
import type { DailyProfit } from '@/types/dailyData';

interface DayMetricsProps {
  profit: DailyProfit;
}

export const DayMetrics = memo(function DayMetrics({ profit }: DayMetricsProps) {
  // Check if there's any activity
  const hasActivity =
    profit.totalIncome !== 0 || profit.gasExpense !== 0 || profit.profit !== 0;

  if (!hasActivity) return null;

  // Determine profit color
  const profitColor =
    profit.profit > 0
      ? 'text-success'
      : profit.profit < 0
        ? 'text-danger'
        : 'text-textSecondary';

  return (
    <div className="space-y-0.5 sm:space-y-1">
      {/* Income line */}
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        <span className="text-success text-[10px] sm:text-xs">↑</span>
        <span className="text-textSecondary/70 text-[10px] sm:text-[11px]">
          <span className="sm:hidden">Inc</span>
          <span className="hidden sm:inline">Income</span>
        </span>
        <span className="text-success font-bold text-[11px] sm:text-xs">
          {formatCurrencyCompact(profit.totalIncome)}
        </span>
      </div>

      {/* Expenses line - only show if there are expenses */}
      {profit.gasExpense > 0 && (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <span className="text-danger text-[10px] sm:text-xs">↓</span>
          <span className="text-textSecondary/70 text-[10px] sm:text-[11px]">
            <span className="sm:hidden">Exp</span>
            <span className="hidden sm:inline">Expenses</span>
          </span>
          <span className="text-danger font-bold text-[11px] sm:text-xs">
            {formatCurrencyCompact(profit.gasExpense)}
          </span>
        </div>
      )}

      {/* Profit line */}
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        <span className={`${profitColor} text-[10px] sm:text-xs`}>=</span>
        <span className="text-textSecondary/70 text-[10px] sm:text-[11px]">
          <span className="sm:hidden">Net</span>
          <span className="hidden sm:inline">Profit</span>
        </span>
        <span className={`${profitColor} font-bold text-[11px] sm:text-xs`}>
          {formatCurrencyCompact(profit.profit)}
        </span>
      </div>
    </div>
  );
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- DayMetrics.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/calendar/DayMetrics.tsx src/components/calendar/__tests__/DayMetrics.test.tsx
git commit -m "feat(calendar): add DayMetrics component with tests"
```

---

## Task 2: Update DayCell to Use DayMetrics

**Files:**
- Modify: `src/components/calendar/DayCell.tsx:113-127`
- Modify: `src/components/calendar/__tests__/DayMetrics.test.tsx` (add integration test)

**Step 1: Write the failing integration test**

Add to `src/components/calendar/__tests__/DayMetrics.test.tsx`:

```typescript
describe('DayMetrics integration', () => {
  test('handles null profit gracefully', () => {
    const { container } = render(<DayMetrics profit={null as any} />);
    expect(container.firstChild).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- DayMetrics.test.tsx`
Expected: FAIL with null reference error

**Step 3: Update DayMetrics to handle edge cases**

Modify `src/components/calendar/DayMetrics.tsx` (add null check at start):

```typescript
export const DayMetrics = memo(function DayMetrics({ profit }: DayMetricsProps) {
  // Handle null/undefined profit
  if (!profit) return null;

  // Check if there's any activity
  const hasActivity =
    profit.totalIncome !== 0 || profit.gasExpense !== 0 || profit.profit !== 0;

  if (!hasActivity) return null;

  // ... rest of component stays the same
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- DayMetrics.test.tsx`
Expected: PASS (5 tests)

**Step 5: Update DayCell component**

Modify `src/components/calendar/DayCell.tsx`:

Replace lines 113-127 (the old profit display):

```typescript
// OLD CODE TO REMOVE:
{/* Profit information */}
{hasAnyActivity && (
  <div className="mt-auto overflow-hidden">
    <div
      className={clsx('text-xs sm:text-sm font-bold truncate', {
        'text-success': isProfitable,
        'text-danger': isLoss,
        'text-textSecondary': !isProfitable && !isLoss,
      })}
      title={formatCurrency(profit.profit)}
    >
      {formatCurrencyCompact(profit.profit)}
    </div>
  </div>
)}
```

With:

```typescript
// NEW CODE:
{/* Metrics display */}
<div className="mt-auto overflow-hidden">
  <DayMetrics profit={profit} />
</div>
```

Add import at top of file (around line 9):

```typescript
import { DayMetrics } from './DayMetrics';
```

Remove unused imports (lines 9, 11):
- Remove: `import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/profitCalculations';`

Keep only:
```typescript
import { formatCurrency } from '@/lib/utils/profitCalculations';
```

(Still needed for aria-label on line 69)

**Step 6: Run tests to verify integration**

Run: `npm test`
Expected: PASS (all existing tests should still pass)

**Step 7: Commit**

```bash
git add src/components/calendar/DayCell.tsx src/components/calendar/__tests__/DayMetrics.test.tsx
git commit -m "refactor(calendar): integrate DayMetrics into DayCell"
```

---

## Task 3: Update Accessibility Labels

**Files:**
- Modify: `src/components/calendar/DayCell.tsx:67-74`

**Step 1: Update aria-label to include all metrics**

Modify the aria-label in `src/components/calendar/DayCell.tsx` (lines 67-74):

```typescript
aria-label={`View details for ${format(date, 'MMMM d, yyyy')}. ${
  profit
    ? profit.totalIncome > 0
      ? `Income: ${formatCurrency(profit.totalIncome)}${
          profit.gasExpense > 0
            ? `, Expenses: ${formatCurrency(profit.gasExpense)}`
            : ''
        }, ${
          profit.profit > 0
            ? `Profit: ${formatCurrency(profit.profit)}`
            : profit.profit < 0
              ? `Loss: ${formatCurrency(profit.profit)}`
              : 'Break-even'
        }`
      : 'No activity'
    : 'No activity'
}`}
```

**Step 2: Run tests**

Run: `npm test`
Expected: PASS (all tests pass)

**Step 3: Manual verification**

1. Start dev server: `npm run dev`
2. Navigate to calendar
3. Use screen reader to verify aria-labels include all three metrics

**Step 4: Commit**

```bash
git add src/components/calendar/DayCell.tsx
git commit -m "a11y(calendar): update aria-labels to include income, expenses, profit"
```

---

## Task 4: Visual Testing and Refinement

**Files:**
- None (visual testing only)

**Step 1: Test responsive breakpoints**

1. Start dev server: `npm run dev`
2. Open calendar view
3. Test at different screen widths:
   - 320px (mobile small)
   - 375px (mobile medium)
   - 640px (sm breakpoint)
   - 1024px (desktop)

Verify:
- Labels abbreviate on mobile ("Inc", "Exp", "Net")
- Labels expand on desktop ("Income", "Expenses", "Profit")
- Font sizes scale appropriately
- Spacing adjusts (0.5 mobile, 1 desktop)
- All content fits within cell min-height

**Step 2: Test with real data**

Create test entries with various scenarios:
- High income day ($500+)
- Low income day ($20)
- Day with expenses
- Day without expenses
- Negative profit day
- Zero profit (break-even)

Verify:
- Numbers format correctly (whole dollars for >$100, cents for <$100)
- Colors apply correctly (green for income/positive, red for expenses/negative)
- Icons display correctly
- Layout doesn't break with large numbers

**Step 3: Test empty states**

Verify:
- Days with no activity show no metrics
- Days with only income (no expenses) show 2 lines
- Days with income and expenses show 3 lines

**Step 4: Cross-browser testing**

Test in:
- Chrome
- Safari
- Firefox
- Mobile Safari (iOS)
- Mobile Chrome (Android)

Verify consistent rendering across browsers.

**Step 5: Document any issues found**

If issues found, create tasks and fix them. If no issues, proceed to commit.

**Step 6: Commit any fixes**

```bash
# Only if fixes were needed
git add <files>
git commit -m "fix(calendar): address visual testing issues"
```

---

## Task 5: Final Testing and Verification

**Files:**
- None (testing only)

**Step 1: Run full test suite**

Run: `npm test -- --run`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Type checking**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Manual regression testing**

Test these existing features still work:
1. Clicking day cell navigates to day detail page
2. Keyboard navigation (arrow keys) works
3. Today indicator displays correctly
4. Month navigation works
5. Profit/loss background colors still apply
6. Activity indicator dot still shows

**Step 5: Accessibility audit**

1. Run Lighthouse accessibility audit
2. Use keyboard only to navigate calendar
3. Verify screen reader announces metrics correctly
4. Check color contrast ratios meet WCAG AA

Expected: No accessibility regressions

**Step 6: Final commit**

```bash
# If any final adjustments needed
git add .
git commit -m "chore(calendar): final testing and adjustments"
```

---

## Testing Checklist

- [ ] All unit tests pass (DayMetrics component)
- [ ] Integration tests pass (DayCell with DayMetrics)
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Visual regression testing complete
- [ ] Responsive design verified (320px to 1024px+)
- [ ] Accessibility labels include all metrics
- [ ] Screen reader testing complete
- [ ] Cross-browser testing complete
- [ ] No performance regressions
- [ ] Existing functionality unaffected

---

## Success Criteria

1. ✅ Calendar day cells show three distinct metrics (income, expenses, profit)
2. ✅ Icons clearly distinguish metric types (↑ income, ↓ expenses, = profit)
3. ✅ Labels abbreviate responsively (mobile: Inc/Exp/Net, desktop: Income/Expenses/Profit)
4. ✅ Colors apply correctly (green for income/positive, red for expenses/negative)
5. ✅ Expense line only shows when gasExpense > 0
6. ✅ Empty days show no metrics
7. ✅ All information fits within existing cell dimensions
8. ✅ Numbers format compactly (formatCurrencyCompact)
9. ✅ Accessibility labels comprehensive
10. ✅ No visual or functional regressions

---

## Notes

- Uses existing `DailyProfit` data structure (no API changes)
- Uses existing `formatCurrencyCompact` utility
- Maintains current cell dimensions (no layout shifts)
- Follows existing color scheme (success/danger/textSecondary)
- All changes isolated to calendar components (no store changes)
- Unicode icons (no icon library dependency)
- Follows TDD approach (tests first, then implementation)
