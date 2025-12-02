import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createIncomeSlice, IncomeSlice } from './slices/incomeSlice';
import { createDailyDataSlice, DailyDataSlice } from './slices/dailyDataSlice';
import { createExpenseSlice, ExpenseSlice } from './slices/expenseSlice';
import { createThemeSlice, ThemeSlice } from './slices/themeSlice';
import { createGoalSlice, GoalSlice } from './slices/goalSlice';

export type AppStore = IncomeSlice & DailyDataSlice & ExpenseSlice & ThemeSlice & GoalSlice;

export const useStore = create<AppStore>()(
  devtools((...args) => ({
    ...createIncomeSlice(...args),
    ...createDailyDataSlice(...args),
    ...createExpenseSlice(...args),
    ...createThemeSlice(...args),
    ...createGoalSlice(...args),
  }))
);

// Export individual slice hooks for convenience
export const useIncomeStore = () => useStore((state) => ({
  incomeEntries: state.incomeEntries,
  isLoading: state.incomeLoading,
  error: state.incomeError,
  loadIncomeEntries: state.loadIncomeEntries,
  addIncomeEntry: state.addIncomeEntry,
  updateIncomeEntry: state.updateIncomeEntry,
  deleteIncomeEntry: state.deleteIncomeEntry,
  getIncomeByDate: state.getIncomeByDate,
  clearError: state.clearIncomeError,
}));

export const useDailyDataStore = () => useStore((state) => ({
  dailyData: state.dailyData,
  isLoading: state.dailyDataLoading,
  error: state.dailyDataError,
  loadDailyData: state.loadDailyData,
  updateDailyData: state.updateDailyData,
  getDailyData: state.getDailyData,
  clearError: state.clearDailyDataError,
}));

export const useExpenseStore = () => useStore((state) => ({
  fixedExpenses: state.fixedExpenses,
  variableExpenses: state.variableExpenses,
  paymentPlans: state.paymentPlans,
  paymentPlanPayments: state.paymentPlanPayments,
  isLoading: state.expenseLoading,
  error: state.expenseError,
  loadFixedExpenses: state.loadFixedExpenses,
  addFixedExpense: state.addFixedExpense,
  updateFixedExpense: state.updateFixedExpense,
  deleteFixedExpense: state.deleteFixedExpense,
  loadVariableExpenses: state.loadVariableExpenses,
  addVariableExpense: state.addVariableExpense,
  updateVariableExpense: state.updateVariableExpense,
  deleteVariableExpense: state.deleteVariableExpense,
  loadPaymentPlans: state.loadPaymentPlans,
  addPaymentPlan: state.addPaymentPlan,
  updatePaymentPlan: state.updatePaymentPlan,
  deletePaymentPlan: state.deletePaymentPlan,
  loadPaymentPlanPayments: state.loadPaymentPlanPayments,
  addPaymentPlanPayment: state.addPaymentPlanPayment,
  updatePaymentPlanPayment: state.updatePaymentPlanPayment,
  deletePaymentPlanPayment: state.deletePaymentPlanPayment,
  clearError: state.clearExpenseError,
}));

export const useThemeStore = () => useStore((state) => ({
  theme: state.theme,
  isLoading: state.themeLoading,
  error: state.themeError,
  loadTheme: state.loadTheme,
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  clearError: state.clearThemeError,
}));

export const useGoalStore = () => useStore((state) => ({
  goals: state.goals,
  isLoading: state.goalsLoading,
  error: state.goalsError,
  loadGoals: state.loadGoals,
  addGoal: state.addGoal,
  updateGoal: state.updateGoal,
  deleteGoal: state.deleteGoal,
  getActiveGoals: state.getActiveGoals,
  getCurrentWeeklyGoal: state.getCurrentWeeklyGoal,
  getCurrentMonthlyGoal: state.getCurrentMonthlyGoal,
  clearError: state.clearGoalsError,
}));
