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
  PaymentPlanPayment,
  CreatePaymentPlanPayment,
  UpdatePaymentPlanPayment,
} from '@/types/expense';
import {
  fixedExpenseRepository,
  variableExpenseRepository,
  paymentPlanRepository,
  paymentPlanPaymentRepository,
} from '@/lib/db';
import {
  createFixedExpenseSchema,
  updateFixedExpenseSchema,
  createVariableExpenseSchema,
  updateVariableExpenseSchema,
  createPaymentPlanSchema,
  updatePaymentPlanSchema,
  createPaymentPlanPaymentSchema,
  updatePaymentPlanPaymentSchema,
} from '@/types/validation';

export interface ExpenseSlice {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  paymentPlans: PaymentPlan[];
  paymentPlanPayments: PaymentPlanPayment[];
  expenseLoading: boolean;
  expenseError: string | null;

  // Fixed Expenses Actions
  loadFixedExpenses: () => Promise<void>;
  addFixedExpense: (expense: CreateFixedExpense) => Promise<FixedExpense>;
  updateFixedExpense: (id: string, updates: UpdateFixedExpense) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;

  // Variable Expenses Actions
  loadVariableExpenses: () => Promise<void>;
  addVariableExpense: (expense: CreateVariableExpense) => Promise<VariableExpense>;
  updateVariableExpense: (id: string, updates: UpdateVariableExpense) => Promise<void>;
  deleteVariableExpense: (id: string) => Promise<void>;

  // Payment Plans Actions
  loadPaymentPlans: () => Promise<void>;
  addPaymentPlan: (plan: CreatePaymentPlan) => Promise<PaymentPlan>;
  updatePaymentPlan: (id: string, updates: UpdatePaymentPlan) => Promise<void>;
  deletePaymentPlan: (id: string) => Promise<void>;

  // Payment Plan Payments Actions
  loadPaymentPlanPayments: () => Promise<void>;
  addPaymentPlanPayment: (payment: CreatePaymentPlanPayment) => Promise<PaymentPlanPayment>;
  updatePaymentPlanPayment: (id: string, updates: UpdatePaymentPlanPayment) => Promise<void>;
  deletePaymentPlanPayment: (id: string) => Promise<void>;

  // Error handling
  clearExpenseError: () => void;
}

export const createExpenseSlice: StateCreator<ExpenseSlice> = (set, get) => ({
  fixedExpenses: [],
  variableExpenses: [],
  paymentPlans: [],
  paymentPlanPayments: [],
  expenseLoading: false,
  expenseError: null,

  // Fixed Expenses
  loadFixedExpenses: async () => {
    set({ expenseLoading: true, expenseError: null });
    try {
      const expenses = await fixedExpenseRepository.getAll();
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
      const tempId = `temp-${Date.now()}`;
      const optimisticExpense = {
        ...validatedExpense,
        id: tempId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as FixedExpense;

      set((state) => ({
        fixedExpenses: [...state.fixedExpenses, optimisticExpense],
      }));

      const newExpense = await fixedExpenseRepository.create(validatedExpense);

      set((state) => ({
        fixedExpenses: state.fixedExpenses.map((e) => (e.id === tempId ? newExpense : e)),
      }));

      return newExpense;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add fixed expense';
      set({ expenseError: errorMessage });
      set((state) => ({
        fixedExpenses: state.fixedExpenses.filter((e) => !e.id.startsWith('temp-')),
      }));
      throw error;
    }
  },

  updateFixedExpense: async (id: string, updates: UpdateFixedExpense) => {
    set({ expenseError: null });
    try {
      const validatedUpdates = updateFixedExpenseSchema.parse(updates);
      const original = get().fixedExpenses.find((e) => e.id === id);

      set((state) => ({
        fixedExpenses: state.fixedExpenses.map((expense) =>
          expense.id === id ? { ...expense, ...validatedUpdates, updatedAt: Date.now() } : expense
        ),
      }));

      await fixedExpenseRepository.update(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update fixed expense';
      set({ expenseError: errorMessage });
      const original = get().fixedExpenses.find((e) => e.id === id);
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
    try {
      const original = get().fixedExpenses.find((e) => e.id === id);

      set((state) => ({
        fixedExpenses: state.fixedExpenses.filter((expense) => expense.id !== id),
      }));

      await fixedExpenseRepository.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete fixed expense';
      set({ expenseError: errorMessage });
      const original = get().fixedExpenses.find((e) => e.id === id);
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
      const expenses = await variableExpenseRepository.getAll();
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
      const tempId = `temp-${Date.now()}`;
      const optimisticExpense = {
        ...validatedExpense,
        id: tempId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as VariableExpense;

      set((state) => ({
        variableExpenses: [...state.variableExpenses, optimisticExpense],
      }));

      const newExpense = await variableExpenseRepository.create(validatedExpense);

      set((state) => ({
        variableExpenses: state.variableExpenses.map((e) => (e.id === tempId ? newExpense : e)),
      }));

      return newExpense;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add variable expense';
      set({ expenseError: errorMessage });
      set((state) => ({
        variableExpenses: state.variableExpenses.filter((e) => !e.id.startsWith('temp-')),
      }));
      throw error;
    }
  },

  updateVariableExpense: async (id: string, updates: UpdateVariableExpense) => {
    set({ expenseError: null });
    try {
      const validatedUpdates = updateVariableExpenseSchema.parse(updates);
      const original = get().variableExpenses.find((e) => e.id === id);

      set((state) => ({
        variableExpenses: state.variableExpenses.map((expense) =>
          expense.id === id ? { ...expense, ...validatedUpdates, updatedAt: Date.now() } : expense
        ),
      }));

      await variableExpenseRepository.update(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update variable expense';
      set({ expenseError: errorMessage });
      const original = get().variableExpenses.find((e) => e.id === id);
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
    try {
      const original = get().variableExpenses.find((e) => e.id === id);

      set((state) => ({
        variableExpenses: state.variableExpenses.filter((expense) => expense.id !== id),
      }));

      await variableExpenseRepository.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete variable expense';
      set({ expenseError: errorMessage });
      const original = get().variableExpenses.find((e) => e.id === id);
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
      const plans = await paymentPlanRepository.getAll();
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
      const tempId = `temp-${Date.now()}`;
      const optimisticPlan = {
        ...validatedPlan,
        id: tempId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as PaymentPlan;

      set((state) => ({
        paymentPlans: [...state.paymentPlans, optimisticPlan],
      }));

      const newPlan = await paymentPlanRepository.create(validatedPlan);

      set((state) => ({
        paymentPlans: state.paymentPlans.map((p) => (p.id === tempId ? newPlan : p)),
      }));

      return newPlan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment plan';
      set({ expenseError: errorMessage });
      set((state) => ({
        paymentPlans: state.paymentPlans.filter((p) => !p.id.startsWith('temp-')),
      }));
      throw error;
    }
  },

  updatePaymentPlan: async (id: string, updates: UpdatePaymentPlan) => {
    set({ expenseError: null });
    try {
      const validatedUpdates = updatePaymentPlanSchema.parse(updates);
      const original = get().paymentPlans.find((p) => p.id === id);

      set((state) => ({
        paymentPlans: state.paymentPlans.map((plan) =>
          plan.id === id ? { ...plan, ...validatedUpdates, updatedAt: Date.now() } : plan
        ),
      }));

      await paymentPlanRepository.update(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment plan';
      set({ expenseError: errorMessage });
      const original = get().paymentPlans.find((p) => p.id === id);
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
    try {
      const original = get().paymentPlans.find((p) => p.id === id);
      const relatedPayments = get().paymentPlanPayments.filter((p) => p.paymentPlanId === id);

      set((state) => ({
        paymentPlans: state.paymentPlans.filter((plan) => plan.id !== id),
        paymentPlanPayments: state.paymentPlanPayments.filter(
          (payment) => payment.paymentPlanId !== id
        ),
      }));

      await paymentPlanRepository.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment plan';
      set({ expenseError: errorMessage });
      const original = get().paymentPlans.find((p) => p.id === id);
      if (original) {
        const relatedPayments = get().paymentPlanPayments.filter((p) => p.paymentPlanId === id);
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
      const payments = await paymentPlanPaymentRepository.getAll();
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
      const tempId = `temp-${Date.now()}`;
      const optimisticPayment = {
        ...validatedPayment,
        id: tempId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as PaymentPlanPayment;

      set((state) => ({
        paymentPlanPayments: [...state.paymentPlanPayments, optimisticPayment],
      }));

      const newPayment = await paymentPlanPaymentRepository.create(validatedPayment);

      set((state) => ({
        paymentPlanPayments: state.paymentPlanPayments.map((p) =>
          p.id === tempId ? newPayment : p
        ),
      }));

      return newPayment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment plan payment';
      set({ expenseError: errorMessage });
      set((state) => ({
        paymentPlanPayments: state.paymentPlanPayments.filter((p) => !p.id.startsWith('temp-')),
      }));
      throw error;
    }
  },

  updatePaymentPlanPayment: async (id: string, updates: UpdatePaymentPlanPayment) => {
    set({ expenseError: null });
    try {
      const validatedUpdates = updatePaymentPlanPaymentSchema.parse(updates);
      const original = get().paymentPlanPayments.find((p) => p.id === id);

      set((state) => ({
        paymentPlanPayments: state.paymentPlanPayments.map((payment) =>
          payment.id === id ? { ...payment, ...validatedUpdates, updatedAt: Date.now() } : payment
        ),
      }));

      await paymentPlanPaymentRepository.update(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment plan payment';
      set({ expenseError: errorMessage });
      const original = get().paymentPlanPayments.find((p) => p.id === id);
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
    try {
      const original = get().paymentPlanPayments.find((p) => p.id === id);

      set((state) => ({
        paymentPlanPayments: state.paymentPlanPayments.filter((payment) => payment.id !== id),
      }));

      await paymentPlanPaymentRepository.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment plan payment';
      set({ expenseError: errorMessage });
      const original = get().paymentPlanPayments.find((p) => p.id === id);
      if (original) {
        set((state) => ({
          paymentPlanPayments: [...state.paymentPlanPayments, original],
        }));
      }
      throw error;
    }
  },

  clearExpenseError: () => {
    set({ expenseError: null });
  },
});
