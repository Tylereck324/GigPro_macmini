import { StateCreator } from 'zustand';
import type {
  FixedExpense,
  CreateFixedExpense,
  UpdateFixedExpense,
  PaymentPlan,
  CreatePaymentPlan,
  UpdatePaymentPlan,
  PaymentPlanPayment,
  CreatePaymentPlanPayment,
  UpdatePaymentPlanPayment,
} from '@/types/expense';
import {
  fixedExpensesApi,
  paymentPlansApi,
  paymentPlanPaymentsApi,
} from '@/lib/api/expenses';
import {
  createFixedExpenseSchema,
  updateFixedExpenseSchema,
  createPaymentPlanSchema,
  updatePaymentPlanSchema,
  createPaymentPlanPaymentSchema,
  updatePaymentPlanPaymentSchema,
} from '@/types/validation';

export interface ExpenseSlice {
  fixedExpenses: FixedExpense[];
  paymentPlans: PaymentPlan[];
  paymentPlanPayments: PaymentPlanPayment[];
  expenseLoading: boolean;
  expenseError: string | null;

  // Fixed Expenses Actions
  loadFixedExpenses: () => Promise<void>;
  addFixedExpense: (expense: CreateFixedExpense) => Promise<FixedExpense>;
  updateFixedExpense: (id: string, updates: UpdateFixedExpense) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;

  // Payment Plans Actions
  loadPaymentPlans: () => Promise<void>;
  addPaymentPlan: (plan: CreatePaymentPlan) => Promise<PaymentPlan>;
  updatePaymentPlan: (id: string, updates: UpdatePaymentPlan) => Promise<void>;
  deletePaymentPlan: (id: string) => Promise<void>;

  // Payment Plan Payments Actions
  loadPaymentPlanPayments: () => Promise<void>; // Reverted to no planId parameter
  addPaymentPlanPayment: (payment: CreatePaymentPlanPayment) => Promise<PaymentPlanPayment>;
  updatePaymentPlanPayment: (id: string, updates: UpdatePaymentPlanPayment) => Promise<void>;
  deletePaymentPlanPayment: (id: string) => Promise<void>;

  // Combined loader for all expense data (more efficient)
  loadAllExpenseData: () => Promise<void>;
}

export const createExpenseSlice: StateCreator<ExpenseSlice> = (set, get) => ({
  fixedExpenses: [],
  paymentPlans: [],
  paymentPlanPayments: [],
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
    const relatedPayments = get().paymentPlanPayments.filter((p) => p.paymentPlanId === id);

    try {
      set((state) => ({
        paymentPlans: state.paymentPlans.filter((plan) => plan.id !== id),
        paymentPlanPayments: state.paymentPlanPayments.filter(
          (payment) => payment.paymentPlanId !== id
        ),
      }));

      await paymentPlansApi.deletePaymentPlan(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment plan';
      set({ expenseError: errorMessage });
      if (original) {
        set((state) => ({
          paymentPlans: [...state.paymentPlans, original],
          paymentPlanPayments: [...state.paymentPlanPayments, ...relatedPayments],
        }));
      }
      throw error;
    }
  },

  // Payment Plan Payments
  loadPaymentPlanPayments: async () => {
    set({ expenseLoading: true, expenseError: null });
    try {
      // Original API did not take planId, so fetch all payments
      const payments = await paymentPlanPaymentsApi.getPaymentPlanPayments(); // Call without planId argument
      set({ paymentPlanPayments: payments, expenseLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment plan payments';
      console.error('Failed to load payment plan payments:', error);
      set({ expenseLoading: false, expenseError: errorMessage });
      throw error;
    }
  },

  addPaymentPlanPayment: async (payment: CreatePaymentPlanPayment) => {
    set({ expenseError: null });
    try {
      const validatedPayment = createPaymentPlanPaymentSchema.parse(payment);

      const newPayment = await paymentPlanPaymentsApi.createPaymentPlanPayment(validatedPayment);

      set((state) => ({
        paymentPlanPayments: [...state.paymentPlanPayments, newPayment],
      }));

      return newPayment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment plan payment';
      set({ expenseError: errorMessage });
      throw error;
    }
  },

  updatePaymentPlanPayment: async (id: string, updates: UpdatePaymentPlanPayment) => {
    set({ expenseError: null });
    // Capture original BEFORE optimistic update
    const original = get().paymentPlanPayments.find((p) => p.id === id);

    try {
      const validatedUpdates = updatePaymentPlanPaymentSchema.parse(updates);

      set((state) => ({
        paymentPlanPayments: state.paymentPlanPayments.map((payment) =>
          payment.id === id ? { ...payment, ...validatedUpdates, updatedAt: Date.now() } : payment
        ),
      }));

      await paymentPlanPaymentsApi.updatePaymentPlanPayment(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment plan payment';
      set({ expenseError: errorMessage });
      // Rollback using original captured before update
      if (original) {
        set((state) => ({
          paymentPlanPayments: state.paymentPlanPayments.map((p) => (p.id === id ? original : p)),
        }));
      }
      throw error;
    }
  },

  deletePaymentPlanPayment: async (id: string) => {
    set({ expenseError: null });
    const original = get().paymentPlanPayments.find((p) => p.id === id);

    try {
      set((state) => ({
        paymentPlanPayments: state.paymentPlanPayments.filter((payment) => payment.id !== id),
      }));

      await paymentPlanPaymentsApi.deletePaymentPlanPayment(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment plan payment';
      set({ expenseError: errorMessage });
      if (original) {
        set((state) => ({
          paymentPlanPayments: [...state.paymentPlanPayments, original],
        }));
      }
      throw error;
    }
  },

  // Combined loader - fetches all expense data in parallel for better performance
  loadAllExpenseData: async () => {
    set({ expenseLoading: true, expenseError: null });
    try {
      // Fetch all three data sources in parallel
      const [expenses, plans, payments] = await Promise.all([
        fixedExpensesApi.getFixedExpenses(),
        paymentPlansApi.getPaymentPlans(),
        paymentPlanPaymentsApi.getPaymentPlanPayments(),
      ]);

      // Update all state at once
      set({
        fixedExpenses: expenses,
        paymentPlans: plans,
        paymentPlanPayments: payments,
        expenseLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load expense data';
      console.error('Failed to load expense data:', error);
      set({ expenseLoading: false, expenseError: errorMessage });
      throw error;
    }
  },

});
