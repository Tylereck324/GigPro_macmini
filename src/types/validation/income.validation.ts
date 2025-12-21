/**
 * Zod validation schemas for income types
 */

import { z } from 'zod';
import { gigPlatformSchema } from './common.validation';

// Maximum reasonable block duration in minutes (16 hours)
const MAX_BLOCK_DURATION_MINUTES = 16 * 60;

// ============================================================================
// Income Entry Validation
// ============================================================================

const normalizeDatetime = (val: unknown) => {
  if (typeof val === 'string') {
    try {
      // First try to create a date object
      const date = new Date(val);
      // If valid date, return standard ISO string (which Zod accepts)
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      // If Date parsing fails, fall back to simple string replacement
    }
    
    if (val.includes(' ')) {
      return val.replace(' ', 'T');
    }
  }
  return val;
};

const incomeEntryBaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  platform: gigPlatformSchema,
  customPlatformName: z.string().optional(),
  blockStartTime: z.preprocess(normalizeDatetime, z.string().datetime().nullable()),
  blockEndTime: z.preprocess(normalizeDatetime, z.string().datetime().nullable()),
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
        return new Date(data.blockStartTime) <= new Date(data.blockEndTime);
      }
      return true;
    },
    {
      message: 'Block end time cannot be before start time',
      path: ['blockEndTime'],
    }
  )
  .refine(
    (data) => {
      // Validate maximum block duration (16 hours)
      if (data.blockLength !== null && data.blockLength > MAX_BLOCK_DURATION_MINUTES) {
        return false;
      }
      return true;
    },
    {
      message: `Block duration cannot exceed ${MAX_BLOCK_DURATION_MINUTES / 60} hours`,
      path: ['blockLength'],
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
        return new Date(data.blockStartTime) <= new Date(data.blockEndTime);
      }
      return true;
    },
    {
      message: 'Block end time cannot be before start time',
      path: ['blockEndTime'],
    }
  )
  .refine(
    (data) => {
      // Validate maximum block duration (16 hours)
      if (data.blockLength !== null && data.blockLength > MAX_BLOCK_DURATION_MINUTES) {
        return false;
      }
      return true;
    },
    {
      message: `Block duration cannot exceed ${MAX_BLOCK_DURATION_MINUTES / 60} hours`,
      path: ['blockLength'],
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
