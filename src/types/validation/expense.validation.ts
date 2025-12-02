/**
 * Zod validation schemas for expense types
 */

import { z } from 'zod';
import { expenseCategorySchema, paymentFrequencySchema, paymentPlanProviderSchema } from './common.validation';

// ============================================================================
// Fixed Expense Validation
// ============================================================================

export const fixedExpenseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.number().int().min(1, 'Due date must be between 1 and 31').max(31, 'Due date must be between 1 and 31'),
  isActive: z.boolean(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const createFixedExpenseSchema = fixedExpenseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFixedExpenseSchema = fixedExpenseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Variable Expense Validation
// ============================================================================

const variableExpenseBaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  amount: z.number().positive('Amount must be positive'),
  category: expenseCategorySchema,
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  isPaid: z.boolean(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const variableExpenseSchema = variableExpenseBaseSchema.refine(
  (data) => {
    // If isPaid is true, paidDate should be set
    if (data.isPaid && !data.paidDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Paid date is required when expense is marked as paid',
    path: ['paidDate'],
  }
);

export const createVariableExpenseSchema = variableExpenseBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    if (data.isPaid && !data.paidDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Paid date is required when expense is marked as paid',
    path: ['paidDate'],
  }
);

export const updateVariableExpenseSchema = variableExpenseBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Payment Plan Validation
// ============================================================================

const paymentPlanBaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  provider: paymentPlanProviderSchema,
  initialCost: z.number().positive('Initial cost must be positive'),
  totalPayments: z.number().int().positive('Total payments must be positive'),
  currentPayment: z.number().int().min(1).max(999),
  paymentAmount: z.number().positive('Payment amount must be positive'),
  minimumMonthlyPayment: z.number().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  frequency: paymentFrequencySchema,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  minimumPayment: z.number().positive().optional(),
  isComplete: z.boolean(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const paymentPlanSchema = paymentPlanBaseSchema
  .refine(
    (data) => data.currentPayment <= data.totalPayments,
    {
      message: 'Current payment cannot exceed total payments',
      path: ['currentPayment'],
    }
  )
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export const createPaymentPlanSchema = paymentPlanBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => data.currentPayment <= data.totalPayments,
    {
      message: 'Current payment cannot exceed total payments',
      path: ['currentPayment'],
    }
  )
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export const updatePaymentPlanSchema = paymentPlanBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Payment Plan Payment Validation
// ============================================================================

const paymentPlanPaymentBaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  paymentPlanId: z.string().min(1, 'Payment plan ID is required'),
  paymentNumber: z.number().int().positive('Payment number must be positive'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isPaid: z.boolean(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const paymentPlanPaymentSchema = paymentPlanPaymentBaseSchema.refine(
  (data) => {
    // If isPaid is true, paidDate should be set
    if (data.isPaid && !data.paidDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Paid date is required when payment is marked as paid',
    path: ['paidDate'],
  }
);

export const createPaymentPlanPaymentSchema = paymentPlanPaymentBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    if (data.isPaid && !data.paidDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Paid date is required when payment is marked as paid',
    path: ['paidDate'],
  }
);

export const updatePaymentPlanPaymentSchema = paymentPlanPaymentBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Monthly Expense Summary Validation
// ============================================================================

export const monthlyExpenseSummarySchema = z.object({
  fixedTotal: z.number().nonnegative(),
  variableTotal: z.number().nonnegative(),
  paymentPlansTotal: z.number().nonnegative(),
  grandTotal: z.number().nonnegative(),
  paidTotal: z.number().nonnegative(),
  remainingTotal: z.number().nonnegative(),
});
