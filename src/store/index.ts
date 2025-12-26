import { useCallback } from 'react';
import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { useShallow } from 'zustand/react/shallow';
import { createIncomeSlice, IncomeSlice } from './slices/incomeSlice';
import { createDailyDataSlice, DailyDataSlice } from './slices/dailyDataSlice';
import { createExpenseSlice, ExpenseSlice } from './slices/expenseSlice';
import { createThemeSlice, ThemeSlice } from './slices/themeSlice';
import { createGoalSlice, GoalSlice } from './slices/goalSlice';

export type AppStore = IncomeSlice & DailyDataSlice & ExpenseSlice & ThemeSlice & GoalSlice;

export const useStore = createWithEqualityFn<AppStore>()(
  devtools((...args) => ({
    ...createIncomeSlice(...args),
    ...createDailyDataSlice(...args),
    ...createExpenseSlice(...args),
    ...createThemeSlice(...args),
    ...createGoalSlice(...args),
  }))
);

// Export individual slice hooks for convenience
export const useIncomeStore = () =>
  useStore(
    (state) => ({
      incomeEntries: state.incomeEntries,
      isLoading: state.incomeLoading,
      error: state.incomeError,
      loadIncomeEntries: state.loadIncomeEntries,
      addIncomeEntry: state.addIncomeEntry,
      updateIncomeEntry: state.updateIncomeEntry,
      deleteIncomeEntry: state.deleteIncomeEntry,
      getIncomeByDate: state.getIncomeByDate,
    }),
    shallow
  );

export const useDailyDataStore = () =>
  useStore(
    (state) => ({
      dailyData: state.dailyData,
      isLoading: state.dailyDataLoading,
      error: state.dailyDataError,
      loadDailyData: state.loadDailyData,
      updateDailyData: state.updateDailyData,
    }),
    shallow
  );

export const useExpenseStore = () =>
  useStore(
    (state) => ({
      fixedExpenses: state.fixedExpenses,
      paymentPlans: state.paymentPlans,
      paymentPlanPayments: state.paymentPlanPayments,
      isLoading: state.expenseLoading,
      error: state.expenseError,
      loadFixedExpenses: state.loadFixedExpenses,
      addFixedExpense: state.addFixedExpense,
      updateFixedExpense: state.updateFixedExpense,
      deleteFixedExpense: state.deleteFixedExpense,
      loadPaymentPlans: state.loadPaymentPlans,
      addPaymentPlan: state.addPaymentPlan,
      updatePaymentPlan: state.updatePaymentPlan,
      deletePaymentPlan: state.deletePaymentPlan,
      loadPaymentPlanPayments: state.loadPaymentPlanPayments,
      addPaymentPlanPayment: state.addPaymentPlanPayment,
      updatePaymentPlanPayment: state.updatePaymentPlanPayment,
      deletePaymentPlanPayment: state.deletePaymentPlanPayment,
    }),
    shallow
  );

export const useThemeStore = () =>
  useStore(
    (state) => ({
      theme: state.theme,
      isLoading: state.themeLoading,
      error: state.themeError,
      loadTheme: state.loadTheme,
      setTheme: state.setTheme,
      toggleTheme: state.toggleTheme,
    }),
    shallow
  );

export const useGoalStore = () =>
  useStore(
    (state) => ({
      goals: state.goals,
      isLoading: state.goalsLoading,
      error: state.goalsError,
      loadGoals: state.loadGoals,
      addGoal: state.addGoal,
      updateGoal: state.updateGoal,
      deleteGoal: state.deleteGoal,
    }),
    shallow
  );

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
