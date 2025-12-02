import { nanoid } from 'nanoid';
import { db } from '../schema';
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

// Fixed Expenses Repository
export const fixedExpenseRepository = {
  async create(data: CreateFixedExpense): Promise<FixedExpense> {
    const now = Date.now();
    const expense: FixedExpense = {
      id: nanoid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.fixedExpenses.add(expense);
    return expense;
  },

  async getAll(): Promise<FixedExpense[]> {
    return await db.fixedExpenses.toArray();
  },

  async getActive(): Promise<FixedExpense[]> {
    return await db.fixedExpenses.where('isActive').equals(1).toArray();
  },

  async getById(id: string): Promise<FixedExpense | undefined> {
    return await db.fixedExpenses.get(id);
  },

  async update(id: string, updates: UpdateFixedExpense): Promise<void> {
    await db.fixedExpenses.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.fixedExpenses.delete(id);
  },

  async deleteAll(): Promise<void> {
    await db.fixedExpenses.clear();
  },
};

// Variable Expenses Repository
export const variableExpenseRepository = {
  async create(data: CreateVariableExpense): Promise<VariableExpense> {
    const now = Date.now();
    const expense: VariableExpense = {
      id: nanoid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.variableExpenses.add(expense);
    return expense;
  },

  async getAll(): Promise<VariableExpense[]> {
    return await db.variableExpenses.toArray();
  },

  async getByMonth(month: string): Promise<VariableExpense[]> {
    return await db.variableExpenses.where('month').equals(month).toArray();
  },

  async getUnpaid(month: string): Promise<VariableExpense[]> {
    return await db.variableExpenses
      .where('[month+isPaid]')
      .equals([month, 0])
      .toArray();
  },

  async getById(id: string): Promise<VariableExpense | undefined> {
    return await db.variableExpenses.get(id);
  },

  async update(id: string, updates: UpdateVariableExpense): Promise<void> {
    await db.variableExpenses.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.variableExpenses.delete(id);
  },

  async deleteAll(): Promise<void> {
    await db.variableExpenses.clear();
  },
};

// Payment Plans Repository
export const paymentPlanRepository = {
  async create(data: CreatePaymentPlan): Promise<PaymentPlan> {
    const now = Date.now();
    const plan: PaymentPlan = {
      id: nanoid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.paymentPlans.add(plan);
    return plan;
  },

  async getAll(): Promise<PaymentPlan[]> {
    return await db.paymentPlans.toArray();
  },

  async getActive(): Promise<PaymentPlan[]> {
    return await db.paymentPlans.where('isComplete').equals(0).toArray();
  },

  async getById(id: string): Promise<PaymentPlan | undefined> {
    return await db.paymentPlans.get(id);
  },

  async update(id: string, updates: UpdatePaymentPlan): Promise<void> {
    await db.paymentPlans.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.paymentPlans.delete(id);
    // Also delete related payments
    await db.paymentPlanPayments.where('paymentPlanId').equals(id).delete();
  },

  async deleteAll(): Promise<void> {
    await db.paymentPlans.clear();
  },
};

// Payment Plan Payments Repository
export const paymentPlanPaymentRepository = {
  async create(data: CreatePaymentPlanPayment): Promise<PaymentPlanPayment> {
    const now = Date.now();
    const payment: PaymentPlanPayment = {
      id: nanoid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.paymentPlanPayments.add(payment);
    return payment;
  },

  async getAll(): Promise<PaymentPlanPayment[]> {
    return await db.paymentPlanPayments.toArray();
  },

  async getByPlan(paymentPlanId: string): Promise<PaymentPlanPayment[]> {
    return await db.paymentPlanPayments
      .where('paymentPlanId')
      .equals(paymentPlanId)
      .toArray();
  },

  async getByMonth(month: string): Promise<PaymentPlanPayment[]> {
    return await db.paymentPlanPayments.where('month').equals(month).toArray();
  },

  async getUnpaidByMonth(month: string): Promise<PaymentPlanPayment[]> {
    return await db.paymentPlanPayments
      .where('[month+isPaid]')
      .equals([month, 0])
      .toArray();
  },

  async getById(id: string): Promise<PaymentPlanPayment | undefined> {
    return await db.paymentPlanPayments.get(id);
  },

  async update(id: string, updates: UpdatePaymentPlanPayment): Promise<void> {
    await db.paymentPlanPayments.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.paymentPlanPayments.delete(id);
  },

  async deleteAll(): Promise<void> {
    await db.paymentPlanPayments.clear();
  },
};
