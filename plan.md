# GigPro — Project Plan / Feature & Function Inventory

This document is a living map of the current codebase: user-facing features, routes, major components, state/actions, APIs, and utility functions.

---

## 1) App Overview

**Purpose:** Track gig-work income, daily operating costs (mileage + gas), monthly fixed expenses, installment payment plans, goals, trends, and run an Amazon Flex earnings simulator.

**Tech stack (current):**
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Zustand (state)
- Supabase (Postgres + PostgREST via `@supabase/supabase-js`)
- date-fns
- Zod (validation)
- Vitest + Testing Library + Playwright (configured)

**Core files:**
- Supabase client: `src/lib/supabase.ts`
- Root layout + providers: `src/app/layout.tsx`
- Global store: `src/store/index.ts`

---

## 2) Routes / Pages (App Router)

### `/` — Calendar Dashboard
- File: `src/app/page.tsx`
- Main components:
  - `src/components/calendar/MonthlyCalendar.tsx` (calendar grid)
  - `src/components/stats/MonthlySummary.tsx` (sidebar summary)
- Loads data in parallel on mount:
  - `loadIncomeEntries()`, `loadDailyData()`, `loadFixedExpenses()`, `loadPaymentPlans()`, `loadPaymentPlanPayments()`, `loadGoals()`

### `/day/[date]` — Day Detail View
- Files:
  - Route: `src/app/day/[date]/page.tsx` (validates `YYYY-MM-DD`)
  - UI: `src/app/day/[date]/DayContent.tsx`
- Features:
  - Add/edit/delete income entries for the day
  - Edit daily mileage + gas expense
  - Daily profit and earnings-per-mile summary
  - Amazon Flex hours tracker (if Flex entries exist)

### `/expenses` — Monthly Expenses
- Files:
  - `src/app/expenses/page.tsx`
  - `src/app/expenses/ExpensesContent.tsx`
- Features:
  - Fixed expenses CRUD (active/inactive)
  - Payment plans CRUD (Affirm/Klarna/etc.)
  - Monthly “paid” marking for payment plans (per plan per month)
  - Local fallback if Supabase RLS blocks payment-mark writes
  - Monthly summary totals (fixed + payment plans due)

### `/goals` — Income Goals
- Files:
  - `src/app/goals/page.tsx`
  - `src/app/goals/GoalsContent.tsx`
- Features:
  - Weekly/monthly goals CRUD
  - Monthly goals prioritized by `priority`
  - Progress cards + list view

### `/trends` — Earnings Trends Heatmap
- Files:
  - `src/app/trends/page.tsx`
  - `src/app/trends/TrendsContent.tsx`
- Features:
  - Uses historical income + time blocks to build a day/time heatmap of hourly earnings
  - Platform filtering (all vs specific)

### `/settings` — App Settings & Data Tools
- Files:
  - `src/app/settings/page.tsx`
  - `src/app/settings/SettingsContent.tsx`
- Features:
  - Export/Import JSON backups
  - Clear all data
  - Data counts summary (income, daily data, fixed expenses, payment plans)
  - Theme + Amazon Flex capacity settings are stored in `app_settings`

### `/simulator` — Earnings Simulator (Amazon Flex)
- Files:
  - `src/app/simulator/page.tsx`
  - `src/app/simulator/SimulatorContent.tsx`
- Features:
  - User config (gas & minimum rates)
  - Reads historical Amazon Flex earnings by block length
  - Generates a best weekly block mix under 40h/week and 8h/day
  - Provides weekly projection + 7-day schedule visualization

---

## 3) Navigation / Layout / Providers

### Header Navigation
- Component: `src/components/layout/Header.tsx`
- Links: Calendar, Trends, Goals, Expenses, Simulator, Settings

### Theme
- Provider: `src/components/providers/ThemeProvider.tsx` (loads theme/settings)
- Script: `src/components/providers/ThemeScript.tsx` (applies early theme)
- Toggle: `src/components/ui/ThemeToggle.tsx`

### Error Boundaries
- Global: `src/components/errors/ErrorBoundary.tsx`

---

## 4) Data Model (Supabase Tables)

**Schema reference:** `sql/supabase-schema.sql`

Current tables used by the app:
- `income_entries`
- `daily_data`
- `fixed_expenses`
- `payment_plans`
- `payment_plan_payments`
- `goals`
- `app_settings`

Notes:
- Monetary and numeric fields are stored as `DECIMAL(10,2)` in Postgres.
- A mapper layer coerces numeric strings into JS numbers (see `src/lib/api/dbCoercion.ts`).

RLS helpers:
- `sql/disable-all-rls.sql` disables RLS for single-user mode.
- `sql/disable-rls-payment-plan-payments.sql` disables RLS for only `payment_plan_payments`.
- `sql/enable-rls.sql` contains a multi-user migration/policies (if you later add auth).

---

## 5) State Management (Zustand Store)

Root store:
- `src/store/index.ts` combines all slices and exports helper hooks.

### Income Slice — `src/store/slices/incomeSlice.ts`
State:
- `incomeEntries: IncomeEntry[]`
- `incomeLoading`, `incomeError`
Actions:
- `loadIncomeEntries()`
- `addIncomeEntry(entry)`
- `updateIncomeEntry(id, updates)`
- `deleteIncomeEntry(id)`
- `getIncomeByDate(date)`
- `clearIncomeError()`

### Daily Data Slice — `src/store/slices/dailyDataSlice.ts`
State:
- `dailyData: Record<YYYY-MM-DD, DailyData>`
- `dailyDataLoading`, `dailyDataError`
Actions:
- `loadDailyData()`
- `updateDailyData(date, updates)` (upsert)
- `getDailyData(date)`
- `clearDailyDataError()`

### Expense Slice — `src/store/slices/expenseSlice.ts`
State:
- `fixedExpenses: FixedExpense[]`
- `paymentPlans: PaymentPlan[]`
- `paymentPlanPayments: PaymentPlanPayment[]`
- `expenseLoading`, `expenseError`
Actions:
- Fixed: `loadFixedExpenses()`, `addFixedExpense()`, `updateFixedExpense()`, `deleteFixedExpense()`
- Payment plans: `loadPaymentPlans()`, `addPaymentPlan()`, `updatePaymentPlan()`, `deletePaymentPlan()`
- Plan payments: `loadPaymentPlanPayments()`, `addPaymentPlanPayment()`, `updatePaymentPlanPayment()`, `deletePaymentPlanPayment()`
- `clearExpenseError()`

### Goal Slice — `src/store/slices/goalSlice.ts`
State:
- `goals: Goal[]`, `goalsLoading`, `goalsError`
Actions:
- `loadGoals()`, `addGoal()`, `updateGoal()`, `deleteGoal()`
- Derived helpers: `getActiveGoals()`, `getCurrentWeeklyGoal()`, `getCurrentMonthlyGoal()`
- `clearGoalsError()`

### Theme/Settings Slice — `src/store/slices/themeSlice.ts`
State:
- `theme`, `themeLoading`, `themeError`
- `amazonFlexDailyCapacity` (minutes), `amazonFlexWeeklyCapacity` (minutes)
Actions:
- `loadTheme()`, `setTheme(theme)`, `toggleTheme()`
- `setAmazonFlexDailyCapacity(minutes)`, `setAmazonFlexWeeklyCapacity(minutes)`
- `clearThemeError()`

---

## 6) API Layer (Supabase/PostgREST)

Supabase client:
- `src/lib/supabase.ts` requires:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Numeric coercion helpers:
- `src/lib/api/dbCoercion.ts`
  - `coerceNumber()`, `coerceNullableNumber()`
  - `coerceInteger()`, `coerceNullableInteger()`

Table APIs:
- Income: `src/lib/api/income.ts`
  - `createIncomeEntry`, `getIncomeEntries`, `updateIncomeEntry`, `deleteIncomeEntry`
- Daily data: `src/lib/api/dailyData.ts`
  - `getAllDailyData`, `upsertDailyData`
- Goals: `src/lib/api/goals.ts`
  - `createGoal`, `getGoals`, `updateGoal`, `deleteGoal`
- Expenses: `src/lib/api/expenses.ts`
  - Fixed expenses API
  - Payment plans API
  - Payment plan payments API
- Settings: `src/lib/api/settings.ts`
  - `getSettings`, `updateSettings`

---

## 7) Major Feature Modules (UI Components)

### Calendar
- `src/components/calendar/MonthlyCalendar.tsx`
  - Keyboard navigation across the grid
  - Uses `incomeEntries` + `dailyData` to compute profit per day
- `src/components/calendar/DayCell.tsx`
  - Click/keyboard navigation to `/day/YYYY-MM-DD`
- `src/components/calendar/CalendarHeader.tsx`
  - Month controls

### Day View (Income + Daily Expenses + Stats)
- Income form: `src/components/income/IncomeEntry.tsx`
- Income list: `src/components/income/IncomeList.tsx`
- Time helper UI: `src/components/income/TimeCalculator.tsx`
- Amazon Flex hours tracker: `src/components/income/AmazonFlexHoursTracker.tsx`
- Daily expenses form: `src/components/expenses/DailyExpenses.tsx`
- Daily profit card: `src/components/stats/DailyProfitCard.tsx`
- Daily income summary: `src/components/stats/IncomeSummary.tsx`

### Expenses (Monthly)
- Fixed expense form: `src/components/expenses/FixedExpenseForm.tsx`
- Payment plan form: `src/components/expenses/PaymentPlanForm.tsx`
- Monthly list/summary: `src/components/expenses/MonthlyExpenseList.tsx`
  - Totals: fixed total, payment plans minimum due, plan remaining amount
  - Monthly “paid” status for plans derived from `payment_plan_payments` by month

### Goals
- Goal form: `src/components/goals/GoalForm.tsx`
- Goal list: `src/components/goals/GoalList.tsx`
- Progress display: `src/components/goals/GoalProgressCard.tsx`, `src/components/goals/GoalProgressBar.tsx`

### Trends
- Platform selector: `src/components/trends/PlatformSelector.tsx`
- Heatmap visualization: `src/components/trends/TrendsHeatmap.tsx`

### Simulator
- Page UI: `src/app/simulator/SimulatorContent.tsx`
- Hook: `src/hooks/useSimulator.ts`

---

## 8) Utility Functions (Pure Logic)

Date helpers:
- `src/lib/utils/dateHelpers.ts`
  - `getCalendarDays()`, `formatDateKey()`, month navigation helpers, date validation, etc.

Profit/income helpers:
- `src/lib/utils/profitCalculations.ts`
  - `calculateDailyProfit()`, `formatCurrency()`, `getTotalIncome()`

Time helpers:
- `src/lib/utils/timeCalculations.ts`
  - Missing-time computation, duration formatting, minute/hour conversion

Amazon Flex hour limits:
- `src/lib/utils/amazonFlexHours.ts`
  - Rolling week calculation and remaining-hours formatting

Goal math:
- `src/lib/utils/goalCalculations.ts`
  - Weekly/monthly totals, prioritized monthly goals, date-range helpers

Trends math:
- `src/lib/utils/trendsCalculations.ts`
  - Heatmap aggregation + max rate

Simulator math:
- `src/lib/utils/simulatorCalculations.ts`
  - `calculateHistoricalAverages(incomeEntries)`
  - `runSimulation(config, historicalAverages)`
  - `distributeBlocksToDays(blocks)`

Export/Import:
- `src/lib/utils/exportImport.ts`
  - `exportData()`, `importData(file)`, `getDataStats()`, `clearAllData()`

Logging:
- `src/lib/utils/logger.ts`
  - `logError()` helper for structured error logging

---

## 9) Persistence (Local Storage)

- Theme cache:
  - Key: `gigpro-theme` (written by theme slice)
- Payment plan payment fallback marks (when RLS blocks DB writes):
  - Key: `paymentPlanPaymentsLocal` (written by Expenses page)
- Simulator configuration:
  - Key: `gigpro-simulator-config` (written by Simulator page)

---

## 10) Validation (Zod)

Validation exports:
- `src/types/validation/index.ts`

Key schemas:
- Expenses: `src/types/validation/expense.validation.ts` (fixed, payment plans, payment plan payments)
- Income: `src/types/validation/income.validation.ts`
- Daily data: `src/types/validation/dailyData.validation.ts`
- Goals: `src/types/validation/goal.validation.ts`
- Settings/export: `src/types/validation/settings.validation.ts`

---

## 11) Testing & Scripts

Scripts (package.json):
- `npm run dev`, `npm run build`, `npm start`
- `npm run lint`
- `npm test` (vitest)
- `npm run test:e2e` (playwright)

Existing unit tests:
- `src/components/income/__tests__/TimeCalculator.test.tsx`
- `src/store/slices/__tests__/incomeSlice.test.ts`
- `src/lib/utils/__tests__/exportImport.test.ts`

---

## 12) Known Design Constraints / Assumptions

- Single-user “no-auth” mode is supported, but Supabase RLS (if enabled) will block reads/writes unless policies exist.
- Postgres numeric fields may arrive as strings; this app coerces them in API mappers to keep calculations correct.
- Simulator is currently Amazon Flex–focused and relies on `IncomeEntry.platform === 'AmazonFlex'` and `blockLength` (minutes) being present.
