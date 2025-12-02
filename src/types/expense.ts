/**
 * Expense tracking types for managing fixed expenses, variable expenses, and payment plans
 */

import type { ExpenseCategory, PaymentFrequency, PaymentPlanProvider } from './common';

// ============================================================================
// Fixed Expenses
// ============================================================================

/**
 * Fixed recurring expense (e.g., rent, subscriptions)
 * Tracked monthly with a specific due date
 */
export interface FixedExpense {
  /** Unique identifier */
  id: string;
  /** Expense name */
  name: string;
  /** Monthly amount in dollars */
  amount: number;
  /** Day of month when due (1-31) */
  dueDate: number;
  /** Whether expense is currently active */
  isActive: boolean;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

/**
 * Data required to create a new fixed expense
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateFixedExpense = Omit<FixedExpense, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing fixed expense
 * All fields optional except id
 */
export type UpdateFixedExpense = Partial<Omit<FixedExpense, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Variable Expenses
// ============================================================================

/**
 * Variable one-time expense for a specific month
 * Tracks payment status and categorization
 */
export interface VariableExpense {
  /** Unique identifier */
  id: string;
  /** Expense name */
  name: string;
  /** Amount in dollars */
  amount: number;
  /** Expense category for grouping */
  category: ExpenseCategory;
  /** Month in YYYY-MM format */
  month: string;
  /** Whether expense has been paid */
  isPaid: boolean;
  /** ISO date string when expense was paid, null if unpaid */
  paidDate: string | null;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

/**
 * Data required to create a new variable expense
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateVariableExpense = Omit<VariableExpense, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing variable expense
 * All fields optional except id
 */
export type UpdateVariableExpense = Partial<Omit<VariableExpense, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Payment Plans
// ============================================================================

/**
 * Installment payment plan (e.g., Affirm, Klarna)
 * Tracks progress through a multi-payment purchase
 */
export interface PaymentPlan {
  /** Unique identifier */
  id: string;
  /** Item or purchase name */
  name: string;
  /** Payment plan provider */
  provider: PaymentPlanProvider;
  /** Initial cost of purchase in dollars */
  initialCost: number;
  /** Total number of payments in the plan */
  totalPayments: number;
  /** Current payment number (1-indexed) */
  currentPayment: number;
  /** Amount per payment in dollars */
  paymentAmount: number;
  /** Minimum monthly payment due (for calculating monthly obligations) */
  minimumMonthlyPayment?: number;
  /** ISO date string when plan started */
  startDate: string;
  /** Payment frequency (weekly, biweekly, monthly) */
  frequency: PaymentFrequency;
  /** Optional end date for 'Other' provider (ISO date string) */
  endDate?: string;
  /** Optional minimum payment for 'Other' provider */
  minimumPayment?: number;
  /** Whether all payments have been completed */
  isComplete: boolean;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

/**
 * Data required to create a new payment plan
 * Omits auto-generated fields (id, timestamps)
 */
export type CreatePaymentPlan = Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing payment plan
 * All fields optional except id
 */
export type UpdatePaymentPlan = Partial<Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Payment Plan Payments
// ============================================================================

/**
 * Individual payment within a payment plan
 * Tracks due date and payment status for each installment
 */
export interface PaymentPlanPayment {
  /** Unique identifier */
  id: string;
  /** Foreign key to parent payment plan */
  paymentPlanId: string;
  /** Payment number in sequence (1-indexed) */
  paymentNumber: number;
  /** ISO date string when payment is due */
  dueDate: string;
  /** Whether payment has been made */
  isPaid: boolean;
  /** ISO date string when payment was made, null if unpaid */
  paidDate: string | null;
  /** Month in YYYY-MM format */
  month: string;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

/**
 * Data required to create a new payment plan payment
 * Omits auto-generated fields (id, timestamps)
 */
export type CreatePaymentPlanPayment = Omit<PaymentPlanPayment, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing payment plan payment
 * All fields optional except id
 */
export type UpdatePaymentPlanPayment = Partial<Omit<PaymentPlanPayment, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Composite Types
// ============================================================================

/**
 * Payment plan with all related payments and computed totals
 * Used for displaying detailed payment plan information
 */
export interface PaymentPlanWithPayments extends PaymentPlan {
  /** All payment records for this plan */
  payments: PaymentPlanPayment[];
  /** Number of payments remaining */
  remainingPayments: number;
  /** Total amount remaining to be paid */
  remainingAmount: number;
}

// ============================================================================
// Summary Types
// ============================================================================

/**
 * Aggregated expense totals for a month
 * Combines all expense types for financial overview
 */
export interface MonthlyExpenseSummary {
  /** Total of all fixed expenses */
  fixedTotal: number;
  /** Total of all variable expenses */
  variableTotal: number;
  /** Total of all payment plan installments */
  paymentPlansTotal: number;
  /** Combined total of all expenses */
  grandTotal: number;
  /** Total amount already paid */
  paidTotal: number;
  /** Total amount still owed */
  remainingTotal: number;
}
