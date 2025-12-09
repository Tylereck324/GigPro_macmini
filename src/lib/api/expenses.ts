// src/lib/api/expenses.ts
import type {
  FixedExpense, CreateFixedExpense, UpdateFixedExpense,
  VariableExpense, CreateVariableExpense, UpdateVariableExpense,
  PaymentPlan, CreatePaymentPlan, UpdatePaymentPlan,
  PaymentPlanPayment, CreatePaymentPlanPayment, UpdatePaymentPlanPayment
} from '@/types/expense';
import { supabase } from '../supabase'; // Use global supabase client

// ============================================================================
// Mappers (re-used)
// ============================================================================
const mapFixedExpense = (d: any): FixedExpense => ({
  id: d.id,
  name: d.name,
  amount: d.amount,
  dueDate: d.due_date,
  isActive: d.is_active,
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
});

const mapVariableExpense = (d: any): VariableExpense => ({
  id: d.id,
  name: d.name,
  amount: d.amount,
  category: d.category,
  month: d.month,
  isPaid: d.is_paid,
  paidDate: d.paid_date,
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
});

const mapPaymentPlan = (d: any): PaymentPlan => ({
  id: d.id,
  name: d.name,
  provider: d.provider,
  initialCost: d.initial_cost,
  totalPayments: d.total_payments,
  currentPayment: d.current_payment,
  paymentAmount: d.payment_amount,
  minimumMonthlyPayment: d.minimum_monthly_payment,
  startDate: d.start_date,
  frequency: d.frequency,
  endDate: d.end_date,
  minimumPayment: d.minimum_payment,
  isComplete: d.is_complete,
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
});

const mapPaymentPlanPayment = (d: any): PaymentPlanPayment => ({
  id: d.id,
  paymentPlanId: d.payment_plan_id,
  paymentNumber: d.payment_number,
  dueDate: d.due_date,
  isPaid: d.is_paid,
  paidDate: d.paid_date,
  month: d.month,
  createdAt: new Date(d.created_at).getTime(),
  updatedAt: new Date(d.updated_at).getTime(),
});


// ============================================================================
// Fixed Expenses API
// ============================================================================
export const fixedExpensesApi = {
  async getFixedExpenses(): Promise<FixedExpense[]> {
    const { data, error } = await supabase.from('fixed_expenses').select('*');
    if (error) throw new Error(error.message);
    return data.map(mapFixedExpense);
  },

  async createFixedExpense(entry: CreateFixedExpense): Promise<FixedExpense> {
    const { data, error } = await supabase.from('fixed_expenses').insert({
      name: entry.name,
      amount: entry.amount,
      due_date: entry.dueDate,
      is_active: entry.isActive,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapFixedExpense(data);
  },

  async updateFixedExpense(id: string, updates: UpdateFixedExpense): Promise<FixedExpense> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase.from('fixed_expenses')
      .update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapFixedExpense(data);
  },

  async deleteFixedExpense(id: string): Promise<void> {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ============================================================================
// Variable Expenses API
// ============================================================================
export const variableExpensesApi = {
  async getVariableExpenses(month?: string): Promise<VariableExpense[]> { // Make month optional
    let query = supabase.from('variable_expenses').select('*');
    if (month) {
      query = query.eq('month', month);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.map(mapVariableExpense);
  },

  async createVariableExpense(entry: CreateVariableExpense): Promise<VariableExpense> {
    const { data, error } = await supabase.from('variable_expenses').insert({
      name: entry.name,
      amount: entry.amount,
      category: entry.category,
      month: entry.month,
      is_paid: entry.isPaid,
      paid_date: entry.paidDate,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapVariableExpense(data);
  },

  async updateVariableExpense(id: string, updates: UpdateVariableExpense): Promise<VariableExpense> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.month) dbUpdates.month = updates.month;
    if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid;
    if (updates.paidDate !== undefined) dbUpdates.paid_date = updates.paidDate;

    const { data, error } = await supabase.from('variable_expenses')
      .update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapVariableExpense(data);
  },

  async deleteVariableExpense(id: string): Promise<void> {
    const { error } = await supabase.from('variable_expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ============================================================================
// Payment Plans API
// ============================================================================
export const paymentPlansApi = {
  async getPaymentPlans(): Promise<PaymentPlan[]> {
    const { data, error } = await supabase.from('payment_plans').select('*');
    if (error) throw new Error(error.message);
    return data.map(mapPaymentPlan);
  },

  async createPaymentPlan(entry: CreatePaymentPlan): Promise<PaymentPlan> {
    const { data, error } = await supabase.from('payment_plans').insert({
      name: entry.name,
      provider: entry.provider,
      initial_cost: entry.initialCost,
      total_payments: entry.totalPayments,
      current_payment: entry.currentPayment,
      payment_amount: entry.paymentAmount,
      minimum_monthly_payment: entry.minimumMonthlyPayment,
      start_date: entry.startDate,
      frequency: entry.frequency,
      end_date: entry.endDate,
      minimum_payment: entry.minimumPayment,
      is_complete: entry.isComplete,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapPaymentPlan(data);
  },

  async updatePaymentPlan(id: string, updates: UpdatePaymentPlan): Promise<PaymentPlan> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.provider) dbUpdates.provider = updates.provider;
    if (updates.initialCost !== undefined) dbUpdates.initial_cost = updates.initialCost;
    if (updates.totalPayments !== undefined) dbUpdates.total_payments = updates.totalPayments;
    if (updates.currentPayment !== undefined) dbUpdates.current_payment = updates.currentPayment;
    if (updates.paymentAmount !== undefined) dbUpdates.payment_amount = updates.paymentAmount;
    if (updates.minimumMonthlyPayment !== undefined) dbUpdates.minimum_monthly_payment = updates.minimumMonthlyPayment;
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.frequency) dbUpdates.frequency = updates.frequency;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
    if (updates.isComplete !== undefined) dbUpdates.is_complete = updates.isComplete;

    const { data, error } = await supabase.from('payment_plans')
      .update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapPaymentPlan(data);
  },

  async deletePaymentPlan(id: string): Promise<void> {
    const { error } = await supabase.from('payment_plans').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ============================================================================
// Payment Plan Payments API
// ============================================================================
export const paymentPlanPaymentsApi = {
  async getPaymentPlanPayments(): Promise<PaymentPlanPayment[]> { // Changed to fetch all
    const { data, error } = await supabase.from('payment_plan_payments').select('*').order('payment_number', { ascending: true });
    if (error) throw new Error(error.message);
    return data.map(mapPaymentPlanPayment);
  },

  async createPaymentPlanPayment(entry: CreatePaymentPlanPayment): Promise<PaymentPlanPayment> {
    const { data, error } = await supabase.from('payment_plan_payments').insert({
      payment_plan_id: entry.paymentPlanId,
      payment_number: entry.paymentNumber,
      due_date: entry.dueDate,
      is_paid: entry.isPaid,
      paid_date: entry.paidDate,
      month: entry.month,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapPaymentPlanPayment(data);
  },

  async updatePaymentPlanPayment(id: string, updates: UpdatePaymentPlanPayment): Promise<PaymentPlanPayment> {
    const dbUpdates: any = {};
    if (updates.paymentPlanId) dbUpdates.payment_plan_id = updates.paymentPlanId;
    if (updates.paymentNumber !== undefined) dbUpdates.payment_number = updates.paymentNumber;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid;
    if (updates.paidDate !== undefined) dbUpdates.paid_date = updates.paidDate;
    if (updates.month) dbUpdates.month = updates.month;

    const { data, error } = await supabase.from('payment_plan_payments')
      .update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapPaymentPlanPayment(data);
  },

  async deletePaymentPlanPayment(id: string): Promise<void> {
    const { error } = await supabase.from('payment_plan_payments').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};