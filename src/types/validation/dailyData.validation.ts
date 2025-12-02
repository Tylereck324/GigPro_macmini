/**
 * Zod validation schemas for daily data types
 */

import { z } from 'zod';

// ============================================================================
// Daily Data Validation
// ============================================================================

export const dailyDataSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mileage: z.number().nonnegative('Mileage cannot be negative').nullable(),
  gasExpense: z.number().nonnegative('Gas expense cannot be negative').nullable(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const createDailyDataSchema = dailyDataSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDailyDataSchema = dailyDataSchema
  .omit({
    id: true,
    date: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Daily Profit Validation
// ============================================================================

export const dailyProfitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  totalIncome: z.number().nonnegative(),
  gasExpense: z.number().nonnegative(),
  profit: z.number(),
  earningsPerMile: z.number().positive().nullable(),
});
