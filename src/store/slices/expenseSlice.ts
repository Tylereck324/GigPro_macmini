import { StateCreator } from 'zustand';
import type {
  FixedExpense,
  CreateFixedExpense,
  UpdateFixedExpense,
  VariableExpense,
  CreateVariableExpense,
  UpdateVariableExpense,
  PaymentPlan,
  CreatePaymentPlan,
  UpdatePaymentPlan,
} from '@/types/expense';
import {
  fixedExpensesApi,
  variableExpensesApi,
  paymentPlansApi,
} from '@/lib/api/expenses';
import {
  createFixedExpenseSchema,
  updateFixedExpenseSchema,
  createVariableExpenseSchema,
  updateVariableExpenseSchema,
  createPaymentPlanSchema,
  updatePaymentPlanSchema,
} from '@/types/validation';

export interface ExpenseSlice {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  paymentPlans: PaymentPlan[];
  expenseLoading: boolean;
  expenseError: string | null;

  // Fixed Expenses Actions
  loadFixedExpenses: () => Promise<void>;
  addFixedExpense: (expense: CreateFixedExpense) => Promise<FixedExpense>;
  updateFixedExpense: (id: string, updates: UpdateFixedExpense) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;

  // Variable Expenses Actions
  loadVariableExpenses: () => Promise<void>; // Reverted to no month parameter
  addVariableExpense: (expense: CreateVariableExpense) => Promise<VariableExpense>;
  updateVariableExpense: (id: string, updates: UpdateVariableExpense) => Promise<void>;
  deleteVariableExpense: (id: string) => Promise<void>;

  // Payment Plans Actions
  loadPaymentPlans: () => Promise<void>;
  addPaymentPlan: (plan: CreatePaymentPlan) => Promise<PaymentPlan>;
  updatePaymentPlan: (id: string, updates: UpdatePaymentPlan) => Promise<void>;
  deletePaymentPlan: (id: string) => Promise<void>;

  // Error handling
  clearExpenseError: () => void;
}

export const createExpenseSlice: StateCreator<ExpenseSlice> = (set, get) => ({
  fixedExpenses: [],
  variableExpenses: [],
  paymentPlans: [],
  expenseLoading: false,
  expenseError: null,

  // Fixed Expenses
  loadFixedExpenses: async () => {
    set({ expenseLoading: true, expenseError: null });
    try {
      const expenses = await fixedExpensesApi.getFixedExpenses();
      set({ fixedExpenses: expenses, expenseLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load fixed expenses';
      console.error('Failed to load fixed expenses:', error);
      set({ expenseLoading: false, expenseError: errorMessage });
      throw error;
    }
  },

  addFixedExpense: async (expense: CreateFixedExpense) => {
    set({ expenseError: null });
    try {
      const validatedExpense = createFixedExpenseSchema.parse(expense);

      const newExpense = await fixedExpensesApi.createFixedExpense(validatedExpense);

      set((state) => ({
        fixedExpenses: [...state.fixedExpenses, newExpense],
      }));

      return newExpense;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add fixed expense';
      set({ expenseError: errorMessage });
      throw error;
    }
  },

  updateFixedExpense: async (id: string, updates: UpdateFixedExpense) => {
    set({ expenseError: null });
    // Capture original BEFORE optimistic update
    const original = get().fixedExpenses.find((e) => e.id === id);

    try {
      const validatedUpdates = updateFixedExpenseSchema.parse(updates);

      set((state) => ({
        fixedExpenses: state.fixedExpenses.map((expense) =>
          expense.id === id ? { ...expense, ...validatedUpdates, updatedAt: Date.now() } : expense
        ),
      }));

      await fixedExpensesApi.updateFixedExpense(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update fixed expense';
      set({ expenseError: errorMessage });
      // Rollback using original captured before update
      if (original) {
        set((state) => ({
          fixedExpenses: state.fixedExpenses.map((e) => (e.id === id ? original : e)),
        }));
      }
      throw error;
    }
  },

  deleteFixedExpense: async (id: string) => {
    set({ expenseError: null });
    const original = get().fixedExpenses.find((e) => e.id === id);

    try {
      set((state) => ({
        fixedExpenses: state.fixedExpenses.filter((expense) => expense.id !== id),
      }));

      await fixedExpensesApi.deleteFixedExpense(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete fixed expense';
      set({ expenseError: errorMessage });
      if (original) {
        set((state) => ({
          fixedExpenses: [...state.fixedExpenses, original],
        }));
      }
      throw error;
    }
  },

  // Variable Expenses
  loadVariableExpenses: async () => {
    set({ expenseLoading: true, expenseError: null });
    try {
      const expenses = await variableExpensesApi.getVariableExpenses(); // Call without month argument
      set({ variableExpenses: expenses, expenseLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load variable expenses';
      console.error('Failed to load variable expenses:', error);
      set({ expenseLoading: false, expenseError: errorMessage });
      throw error;
    }
  },

  addVariableExpense: async (expense: CreateVariableExpense) => {
    set({ expenseError: null });
    try {
      const validatedExpense = createVariableExpenseSchema.parse(expense);

      const newExpense = await variableExpensesApi.createVariableExpense(validatedExpense);

      set((state) => ({
        variableExpenses: [...state.variableExpenses, newExpense],
      }));

      return newExpense;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add variable expense';
      set({ expenseError: errorMessage });
      throw error;
    }
  },

  updateVariableExpense: async (id: string, updates: UpdateVariableExpense) => {
    set({ expenseError: null });
    // Capture original BEFORE optimistic update
    const original = get().variableExpenses.find((e) => e.id === id);

    try {
      const validatedUpdates = updateVariableExpenseSchema.parse(updates);

      set((state) => ({
        variableExpenses: state.variableExpenses.map((expense) =>
          expense.id === id ? { ...expense, ...validatedUpdates, updatedAt: Date.now() } : expense
        ),
      }));

      await variableExpensesApi.updateVariableExpense(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update variable expense';
      set({ expenseError: errorMessage });
      // Rollback using original captured before update
      if (original) {
        set((state) => ({
          variableExpenses: state.variableExpenses.map((e) => (e.id === id ? original : e)),
        }));
      }
      throw error;
    }
  },

  deleteVariableExpense: async (id: string) => {
    set({ expenseError: null });
    const original = get().variableExpenses.find((e) => e.id === id);

    try {
      set((state) => ({
        variableExpenses: state.variableExpenses.filter((expense) => expense.id !== id),
      }));

      await variableExpensesApi.deleteVariableExpense(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete variable expense';
      set({ expenseError: errorMessage });
      if (original) {
        set((state) => ({
          variableExpenses: [...state.variableExpenses, original],
        }));
      }
      throw error;
    }
  },

  // Payment Plans
  loadPaymentPlans: async () => {
    set({ expenseLoading: true, expenseError: null });
    try {
      const plans = await paymentPlansApi.getPaymentPlans();
      set({ paymentPlans: plans, expenseLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment plans';
      console.error('Failed to load payment plans:', error);
      set({ expenseLoading: false, expenseError: errorMessage });
      throw error;
    }
  },

  addPaymentPlan: async (plan: CreatePaymentPlan) => {
    set({ expenseError: null });
    try {
      const validatedPlan = createPaymentPlanSchema.parse(plan);

      const newPlan = await paymentPlansApi.createPaymentPlan(validatedPlan);

      set((state) => ({
        paymentPlans: [...state.paymentPlans, newPlan],
      }));

      return newPlan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment plan';
      set({ expenseError: errorMessage });
      throw error;
    }
  },

  updatePaymentPlan: async (id: string, updates: UpdatePaymentPlan) => {
    set({ expenseError: null });
    // Capture original BEFORE optimistic update
    const original = get().paymentPlans.find((p) => p.id === id);

    try {
      const validatedUpdates = updatePaymentPlanSchema.parse(updates);

      set((state) => ({
        paymentPlans: state.paymentPlans.map((plan) =>
          plan.id === id ? { ...plan, ...validatedUpdates, updatedAt: Date.now() } : plan
        ),
      }));

      await paymentPlansApi.updatePaymentPlan(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment plan';
      set({ expenseError: errorMessage });
      // Rollback using original captured before update
      if (original) {
        set((state) => ({
          paymentPlans: state.paymentPlans.map((p) => (p.id === id ? original : p)),
        }));
      }
      throw error;
    }
  },

  deletePaymentPlan: async (id: string) => {
    set({ expenseError: null });
    const original = get().paymentPlans.find((p) => p.id === id);

    try {
      set((state) => ({
        paymentPlans: state.paymentPlans.filter((plan) => plan.id !== id),
      }));

      await paymentPlansApi.deletePaymentPlan(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment plan';
      set({ expenseError: errorMessage });
      if (original) {
        set((state) => ({
          paymentPlans: [...state.paymentPlans, original],
        }));
      }
      throw error;
    }
  },

  clearExpenseError: () => {
    set({ expenseError: null });
  },
});