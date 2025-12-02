/**
 * Zod validation schemas for settings types
 */

import { z } from 'zod';
import { themeSchema } from './common.validation';
import { incomeEntrySchema } from './income.validation';
import { dailyDataSchema } from './dailyData.validation';
import { fixedExpenseSchema, variableExpenseSchema, paymentPlanSchema, paymentPlanPaymentSchema } from './expense.validation';

// ============================================================================
// App Settings Validation
// ============================================================================

export const appSettingsSchema = z.object({
  id: z.literal('settings'),
  theme: themeSchema,
  lastExportDate: z.number().int().positive().nullable(),
  lastImportDate: z.number().int().positive().nullable(),
  updatedAt: z.number().int().positive(),
});

export const updateAppSettingsSchema = appSettingsSchema
  .omit({
    id: true,
    updatedAt: true,
  })
  .partial();

// ============================================================================
// Export Data Validation
// ============================================================================

export const exportDataSchema = z.object({
  version: z.literal('1.0'),
  exportDate: z.string().datetime(),
  data: z.object({
    incomeEntries: z.array(incomeEntrySchema),
    dailyData: z.array(dailyDataSchema),
    fixedExpenses: z.array(fixedExpenseSchema),
    variableExpenses: z.array(variableExpenseSchema),
    paymentPlans: z.array(paymentPlanSchema),
    paymentPlanPayments: z.array(paymentPlanPaymentSchema),
    settings: appSettingsSchema,
  }),
});
