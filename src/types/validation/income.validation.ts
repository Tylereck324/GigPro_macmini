/**
 * Zod validation schemas for income types
 */

import { z } from 'zod';
import { gigPlatformSchema } from './common.validation';

// ============================================================================
// Income Entry Validation
// ============================================================================

const incomeEntryBaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  platform: gigPlatformSchema,
  customPlatformName: z.string().optional(),
  blockStartTime: z.string().datetime().nullable(),
  blockEndTime: z.string().datetime().nullable(),
  blockLength: z.number().int().nonnegative().nullable(),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().default(''),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const incomeEntrySchema = incomeEntryBaseSchema
  .refine(
    (data) => {
      // If platform is 'Other', customPlatformName is required
      if (data.platform === 'Other') {
        return !!data.customPlatformName && data.customPlatformName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Custom platform name is required when platform is "Other"',
      path: ['customPlatformName'],
    }
  )
  .refine(
    (data) => {
      // If blockStartTime and blockEndTime are provided, validate they make sense
      if (data.blockStartTime && data.blockEndTime) {
        return new Date(data.blockStartTime) < new Date(data.blockEndTime);
      }
      return true;
    },
    {
      message: 'Block end time must be after start time',
      path: ['blockEndTime'],
    }
  );

export const createIncomeEntrySchema = incomeEntryBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      if (data.platform === 'Other') {
        return !!data.customPlatformName && data.customPlatformName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Custom platform name is required when platform is "Other"',
      path: ['customPlatformName'],
    }
  )
  .refine(
    (data) => {
      if (data.blockStartTime && data.blockEndTime) {
        return new Date(data.blockStartTime) < new Date(data.blockEndTime);
      }
      return true;
    },
    {
      message: 'Block end time must be after start time',
      path: ['blockEndTime'],
    }
  );

export const updateIncomeEntrySchema = incomeEntryBaseSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Amazon Flex Hours Validation
// ============================================================================

export const amazonFlexHoursSchema = z.object({
  dailyHoursUsed: z.number().min(0).max(24),
  weeklyHoursUsed: z.number().min(0).max(168),
  dailyRemaining: z.number().min(0).max(24),
  weeklyRemaining: z.number().min(0).max(168),
});

// ============================================================================
// Income Summary Validation
// ============================================================================

export const incomeSummarySchema = z.record(z.string(), z.number()).and(
  z.object({
    total: z.number().nonnegative(),
  })
);

// ============================================================================
// Type Exports
// ============================================================================

export type IncomeEntryInput = z.infer<typeof incomeEntrySchema>;
export type CreateIncomeEntryInput = z.infer<typeof createIncomeEntrySchema>;
export type UpdateIncomeEntryInput = z.infer<typeof updateIncomeEntrySchema>;
