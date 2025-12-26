# Calendar Day Display Enhancement Design

## Goal

Improve how income and expense information is displayed on calendar day cells to show more detail at a glance while working well on mobile screens.

## Problem Statement

Currently, calendar day cells only show the net profit for each day. Users cannot see the breakdown of income vs expenses without clicking into the day detail page. This requires extra navigation to understand daily activity patterns.

## Design Overview

Enhance each calendar day cell to display three key metrics in a compact vertical stack:
- Income (total earned)
- Expenses (gas costs)
- Net profit

The design uses responsive typography and smart abbreviations to fit all information within existing cell dimensions while remaining readable on mobile devices.

---

## Section 1: Visual Layout & Structure

### Cell Organization

Each calendar day cell is divided into three zones:

**1. Header Zone** (unchanged)
- Date number in top-left corner
- Activity indicator dot in top-right corner
- Maintains current styling and behavior

**2. Metrics Zone** (new)
Three lines stacked vertically:
```
↑ Inc  $250    (Income line - green)
↓ Exp   $80    (Expenses line - red)
= Net  $170    (Profit line - colored by value)
```

Each line follows the pattern: `[icon] [label] [amount]`
- Icon: Visual categorical indicator
- Label: Text identifier (abbreviated on mobile)
- Amount: Compact-formatted currency value

**3. Empty State**
Days with no activity show nothing in the metrics zone, keeping them visually quiet.

### Cell Dimensions

- Mobile: `min-h-[60px]` - fits three lines with tight spacing
- Desktop: `min-h-[90px]` - fits three lines with comfortable spacing
- No dimension changes needed from current implementation

### Display Conditions

- **No activity**: Metrics zone empty
- **Activity without expenses**: Show 2 lines (income + profit)
- **Activity with expenses**: Show 3 lines (income + expenses + profit)

---

## Section 2: Responsive Typography & Sizing

### Mobile Breakpoint (< 640px)

```css
Icon size: 10px
Labels: Abbreviated ("Inc", "Exp", "Net")
Label font: 10px
Amount font: 11px (slightly larger for emphasis)
Line height: 1.2 (tight to fit three lines)
Line spacing: 2px between lines
```

### Desktop Breakpoint (≥ 640px)

```css
Icon size: 12px
Labels: Full words ("Income", "Expenses", "Profit")
Label font: 11px
Amount font: 12px
Line height: 1.3 (better readability)
Line spacing: 4px between lines
```

### Number Formatting

Uses existing `formatCurrencyCompact()` function:
- Amounts ≥ $100: Whole dollars only ("$235")
- Amounts < $100: Include cents ("$45.50")
- Negative values: Red text with minus sign ("-$50")

### Accessibility

Aria-label provides full context even when visual labels are abbreviated:

```
"View details for January 15, 2025. Income: $250, Expenses: $80, Profit: $170"
```

Screen readers get complete information regardless of responsive truncation.

---

## Section 3: Icons & Visual Hierarchy

### Icon Implementation

Simple Unicode characters (no icon library dependency):
- Income: `↑` (U+2191, upward arrow)
- Expenses: `↓` (U+2193, downward arrow)
- Profit: `=` (U+003D, equals sign)

Icons are rendered as inline colored text, keeping implementation simple.

### Color Scheme

**Income line**
- Icon and amount: `text-success` (green)
- Label: `text-textSecondary/70` (muted gray)

**Expenses line**
- Icon and amount: `text-danger` (red)
- Label: `text-textSecondary/70` (muted gray)

**Profit line** (dynamic based on value)
- Positive profit: `text-success` (green)
- Negative profit: `text-danger` (red)
- Zero/break-even: `text-textSecondary` (gray)
- Label: `text-textSecondary/70` (muted gray)

### Visual Weight Hierarchy

1. **Amounts** - `font-bold` (highest visual weight, most important)
2. **Icons** - Regular weight but colored (secondary emphasis)
3. **Labels** - Regular weight, muted color (tertiary/supporting)

This creates a clear scan pattern:
1. Eye goes to bold amounts first
2. Icons provide quick categorical recognition
3. Labels confirm interpretation

### Line Display Logic

```typescript
if (no activity) → render nothing
if (gasExpense === 0) → show 2 lines (income, profit)
if (gasExpense > 0) → show 3 lines (income, expenses, profit)
```

Avoids showing "$0" expenses cluttering the view.

---

## Section 4: Component Structure & Data Flow

### Component Architecture

**DayCell.tsx** (existing component, modified)
- Handles click/keyboard navigation
- Manages layout structure
- Passes profit data to metrics component
- Maintains current accessibility features

**DayMetrics.tsx** (new component)
- Receives `DailyProfit` object as prop
- Renders three-line metrics stack
- Handles responsive display logic
- Encapsulates formatting and icon logic

### Data Dependencies

Uses existing `DailyProfit` type from `profitCalculations.ts`:

```typescript
interface DailyProfit {
  date: string;
  totalIncome: number;    // → Income line
  gasExpense: number;     // → Expenses line
  profit: number;         // → Profit line
  earningsPerMile: number | null;
}
```

No additional API calls or store subscriptions needed. All data flows from existing `profitByDate` calculation in `MonthlyCalendar`.

### Component Interface

```typescript
interface DayMetricsProps {
  profit: DailyProfit;
}
```

Responsive behavior handled via Tailwind responsive classes (`sm:` prefix) rather than JavaScript breakpoint detection for simplicity.

### Rendering Strategy

```typescript
// Pseudo-code logic
function DayMetrics({ profit }) {
  const hasActivity = profit.totalIncome !== 0 ||
                      profit.gasExpense !== 0 ||
                      profit.profit !== 0;

  if (!hasActivity) return null;

  return (
    <div className="space-y-0.5 sm:space-y-1">
      {/* Income line - always shown if activity */}
      <MetricLine
        icon="↑"
        label="Inc/Income"
        amount={profit.totalIncome}
        color="success"
      />

      {/* Expenses line - only if expenses exist */}
      {profit.gasExpense > 0 && (
        <MetricLine
          icon="↓"
          label="Exp/Expenses"
          amount={profit.gasExpense}
          color="danger"
        />
      )}

      {/* Profit line - always shown if activity */}
      <MetricLine
        icon="="
        label="Net/Profit"
        amount={profit.profit}
        color={profit.profit > 0 ? 'success' : profit.profit < 0 ? 'danger' : 'neutral'}
      />
    </div>
  );
}
```

### File Changes Required

1. **Create**: `src/components/calendar/DayMetrics.tsx`
   - New component for metrics display
   - Includes `MetricLine` sub-component or inline rendering

2. **Modify**: `src/components/calendar/DayCell.tsx`
   - Replace current profit display with `<DayMetrics profit={profit} />`
   - Remove existing profit formatting code (moved to DayMetrics)

3. **No changes needed**: `src/components/calendar/MonthlyCalendar.tsx`
   - Already provides `profitByDate` data
   - Component boundary clean

---

## Implementation Notes

### Backward Compatibility

- Maintains all current features (click navigation, keyboard support, accessibility)
- Uses existing `DailyProfit` data structure
- No changes to data fetching or state management
- Cell dimensions remain the same

### Testing Considerations

1. **Visual Regression**: Compare calendar appearance across breakpoints
2. **Accessibility**: Verify aria-labels include all three metrics
3. **Edge Cases**:
   - Zero values (income, expenses, profit)
   - Very large numbers (> $1000)
   - Very small numbers (< $1)
   - Negative profit scenarios
4. **Responsive**: Test at 320px, 640px, and 1024px widths

### Performance Impact

Minimal - adds ~3 additional DOM elements per day cell (3 metric lines vs 1 profit line). Modern browsers handle 35-42 day cells with nested elements efficiently.

### Mobile Considerations

- Touch targets remain unchanged (entire cell is clickable)
- Text remains readable at 10-11px on modern mobile displays
- Truncation uses `formatCurrencyCompact` which handles space constraints
- No horizontal scrolling or overflow issues

---

## Success Criteria

1. **Information Density**: Users can see income, expenses, and profit for each day without clicking
2. **Mobile Readability**: All metrics legible on screens ≥ 320px width
3. **Visual Clarity**: Clear distinction between income (green), expenses (red), and profit (colored)
4. **Performance**: No noticeable rendering lag when switching months
5. **Accessibility**: Screen readers announce all three metrics for each day

---

## Future Enhancements (Out of Scope)

- Show hours worked or hourly rate metrics
- Display multiple expense types (not just gas)
- Configurable metrics (let users choose what to display)
- Hover/tap tooltips for additional detail
- Visual charts or sparklines within cells
