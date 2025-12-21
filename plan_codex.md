# GigPro Audit Checklist (Codex)

## High Severity
- [ ] BUG-001: `src/lib/utils/exportImport.ts` - Treat Supabase `error` on fulfilled responses as export failure.
- [ ] BUG-002: `src/lib/utils/exportImport.ts` - Map imported settings to snake_case fields on upsert.
- [ ] BUG-003: `src/store/slices/incomeSlice.ts` - Validate Amazon Flex limits using merged entry data on updates.
- [ ] SECURITY-001: `src/lib/supabase.ts` - Enable RLS or move writes server-side with service role key.

## Medium Severity
- [ ] BUG-004: `src/types/validation/income.validation.ts`, `src/components/income/TimeCalculator.tsx` - Support overnight shifts end-to-end.
- [ ] BUG-005: `src/components/expenses/DailyExpenses.tsx` - Preserve zero values for mileage/gas.
- [ ] BUG-006: `src/app/day/[date]/DayContent.tsx`, `src/app/goals/GoalsContent.tsx` - Add error handling for async actions.
- [ ] PERF-001: `src/app/page.tsx`, `src/store/slices/incomeSlice.ts`, `src/lib/api/dailyData.ts` - Add date range filters/pagination for core loaders.
- [ ] PERF-002: `src/lib/api/expenses.ts` - Filter payment plan payments by month/plan and select only needed columns.
- [ ] PERF-003: `sql/recommended-indexes.sql` - Apply recommended DB indexes (date/platform/payment plan queries).
- [ ] QUALITY-002: `src/store/slices/incomeSlice.ts` - Replace `get() as any` with `AppStore` typing.

## Low Severity
- [ ] DEAD-001: `src/store/slices/expenseSlice.ts` - Remove or use `loadAllExpenseData`.
- [ ] DEAD-002: `src/lib/utils/timeCalculations.ts`, `src/lib/constants/amazonFlex.ts` - Remove or wire unused helpers/constants.
- [ ] DEAD-003: `src/app/globals.css` - Remove or apply unused global utilities/animations.
- [ ] QUALITY-001: `src/app/settings/SettingsContent.tsx` - Fix "IndexedDB" copy to reflect Supabase storage.

## Tests to Add or Update
- [ ] Export handles fulfilled Supabase responses with `error` (export should fail).
- [ ] Import maps settings to snake_case and persists correctly.
- [ ] Amazon Flex limit validation on update when platform/date not in payload.
- [ ] Overnight shift validation and TimeCalculator behavior.
- [ ] DailyExpenses accepts zero values.
- [ ] Async delete/toggle actions show error toasts on failure.
- [ ] Profit calculation unit tests (monthly net profit).
- [ ] Amazon Flex rolling window boundary tests (month/year crossover).

## Suggested Fix Order (Quick Wins First)
- [ ] BUG-005, BUG-006
- [ ] DEAD-001, DEAD-003
- [ ] BUG-004
- [ ] BUG-003
- [ ] BUG-001, BUG-002
- [ ] QUALITY-002
- [ ] PERF-002, PERF-001, PERF-003
- [ ] SECURITY-001
