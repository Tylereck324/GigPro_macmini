import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
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
