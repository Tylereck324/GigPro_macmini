// src/lib/api/expenses.ts
import type {
  CreateFixedExpense,
  UpdateFixedExpense,
  FixedExpense,
  CreateVariableExpense,
  UpdateVariableExpense,
  VariableExpense,
  CreatePaymentPlan,
  UpdatePaymentPlan,
  PaymentPlan,
  CreatePaymentPlanPayment,
  UpdatePaymentPlanPayment,
  PaymentPlanPayment,
} from '@/types/expense';
import { apiRequest } from './apiClient';

// ============================================================================
// Fixed Expenses API
// ============================================================================
const FIXED_BASE_URL = '/api/expenses/fixed';

export const fixedExpensesApi = {
  async createFixedExpense(expense: CreateFixedExpense): Promise<FixedExpense> {
    return apiRequest<FixedExpense>(FIXED_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async getFixedExpenses(): Promise<FixedExpense[]> {
    return apiRequest<FixedExpense[]>(FIXED_BASE_URL);
  },

  async getFixedExpense(id: string): Promise<FixedExpense> {
    return apiRequest<FixedExpense>(`${FIXED_BASE_URL}/${id}`);
  },

  async updateFixedExpense(id: string, updates: UpdateFixedExpense): Promise<FixedExpense> {
    return apiRequest<FixedExpense>(`${FIXED_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteFixedExpense(id: string): Promise<void> {
    return apiRequest<void>(`${FIXED_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Variable Expenses API
// ============================================================================
const VARIABLE_BASE_URL = '/api/expenses/variable';

export const variableExpensesApi = {
  async createVariableExpense(expense: CreateVariableExpense): Promise<VariableExpense> {
    return apiRequest<VariableExpense>(VARIABLE_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async getVariableExpenses(month?: string): Promise<VariableExpense[]> {
    const url = month ? `${VARIABLE_BASE_URL}?month=${month}` : VARIABLE_BASE_URL;
    return apiRequest<VariableExpense[]>(url);
  },

  async getVariableExpense(id: string): Promise<VariableExpense> {
    return apiRequest<VariableExpense>(`${VARIABLE_BASE_URL}/${id}`);
  },

  async updateVariableExpense(id: string, updates: UpdateVariableExpense): Promise<VariableExpense> {
    return apiRequest<VariableExpense>(`${VARIABLE_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteVariableExpense(id: string): Promise<void> {
    return apiRequest<void>(`${VARIABLE_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Payment Plans API
// ============================================================================
const PAYMENT_PLANS_BASE_URL = '/api/expenses/paymentPlans';

export const paymentPlansApi = {
  async createPaymentPlan(plan: CreatePaymentPlan): Promise<PaymentPlan> {
    return apiRequest<PaymentPlan>(PAYMENT_PLANS_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  },

  async getPaymentPlans(): Promise<PaymentPlan[]> {
    return apiRequest<PaymentPlan[]>(PAYMENT_PLANS_BASE_URL);
  },

  async getPaymentPlan(id: string): Promise<PaymentPlan> {
    return apiRequest<PaymentPlan>(`${PAYMENT_PLANS_BASE_URL}/${id}`);
  },

  async updatePaymentPlan(id: string, updates: UpdatePaymentPlan): Promise<PaymentPlan> {
    return apiRequest<PaymentPlan>(`${PAYMENT_PLANS_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePaymentPlan(id: string): Promise<void> {
    return apiRequest<void>(`${PAYMENT_PLANS_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Payment Plan Payments API
// ============================================================================
const PAYMENT_PLAN_PAYMENTS_BASE_URL = '/api/expenses/paymentPlanPayments';

export const paymentPlanPaymentsApi = {
  async createPaymentPlanPayment(payment: CreatePaymentPlanPayment): Promise<PaymentPlanPayment> {
    return apiRequest<PaymentPlanPayment>(PAYMENT_PLAN_PAYMENTS_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  async getPaymentPlanPayments(paymentPlanId?: string, month?: string): Promise<PaymentPlanPayment[]> {
    const params = new URLSearchParams();
    if (paymentPlanId) params.append('paymentPlanId', paymentPlanId);
    if (month) params.append('month', month);

    const url = params.toString() ? `${PAYMENT_PLAN_PAYMENTS_BASE_URL}?${params}` : PAYMENT_PLAN_PAYMENTS_BASE_URL;
    return apiRequest<PaymentPlanPayment[]>(url);
  },

  async getPaymentPlanPayment(id: string): Promise<PaymentPlanPayment> {
    return apiRequest<PaymentPlanPayment>(`${PAYMENT_PLAN_PAYMENTS_BASE_URL}/${id}`);
  },

  async updatePaymentPlanPayment(id: string, updates: UpdatePaymentPlanPayment): Promise<PaymentPlanPayment> {
    return apiRequest<PaymentPlanPayment>(`${PAYMENT_PLAN_PAYMENTS_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePaymentPlanPayment(id: string): Promise<void> {
    return apiRequest<void>(`${PAYMENT_PLAN_PAYMENTS_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
