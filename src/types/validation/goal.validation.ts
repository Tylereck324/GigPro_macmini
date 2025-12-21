/**
 * Zod validation schemas for goal types
 */

import { z } from 'zod';

// ============================================================================
// Goal Validation
// ============================================================================

export const goalPeriodSchema = z.enum(['weekly', 'monthly']);

const goalBaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  period: goalPeriodSchema,
  targetAmount: z.number().positive('Target amount must be positive'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isActive: z.boolean(),
  priority: z.number().int().min(1, 'Priority must be at least 1'),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const goalSchema = goalBaseSchema.refine(
  (data) => {
    // endDate should be after startDate
    return new Date(data.endDate) > new Date(data.startDate);
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const createGoalSchema = goalBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    return new Date(data.endDate) > new Date(data.startDate);
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const updateGoalSchema = goalBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Goal Progress Validation
// ============================================================================

export const goalProgressSchema = z.object({
  goal: goalSchema,
  currentAmount: z.number().nonnegative(),
  percentComplete: z.number().min(0).max(100),
  remainingAmount: z.number(),
  isComplete: z.boolean(),
});
