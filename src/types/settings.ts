/**
 * Application settings and data export/import types
 */

import type { Theme } from './common';
import type { IncomeEntry } from './income';
import type { DailyData } from './dailyData';
import type { FixedExpense, PaymentPlan, PaymentPlanPayment } from './expense';

// ============================================================================
// Application Settings
// ============================================================================

/**
 * Global application settings
 * Stored as a singleton record with fixed id 'settings'
 */
export interface AppSettings {
  /** Fixed identifier, always 'settings' */
  id: string;
  /** Current theme (light or dark) */
  theme: Theme;
  /** Timestamp of last data export, null if never exported */
  lastExportDate: number | null;
  /** Timestamp of last data import, null if never imported */
  lastImportDate: number | null;
  /** Amazon Flex daily hour capacity in minutes */
  amazonFlexDailyCapacity: number;
  /** Amazon Flex weekly hour capacity in minutes */
  amazonFlexWeeklyCapacity: number;
  /** Timestamp when settings were last updated */
  updatedAt: number;
}

/**
 * Data for updating application settings
 * All fields optional except id
 */
export type UpdateAppSettings = Partial<Omit<AppSettings, 'id' | 'updatedAt'>>;

// ============================================================================
// Data Export/Import
// ============================================================================

/**
 * Complete application data export structure
 * Used for backing up and restoring all application data
 */
export interface ExportData {
  /** Export format version for compatibility checking */
  version: '1.0';
  /** ISO timestamp when export was created */
  exportDate: string;
  /** All application data organized by type */
  data: {
    /** All income entries */
    incomeEntries: IncomeEntry[];
    /** All daily tracking data */
    dailyData: DailyData[];
    /** All fixed expenses */
    fixedExpenses: FixedExpense[];
    /** All payment plans */
    paymentPlans: PaymentPlan[];
    /** All payment plan installments */
    paymentPlanPayments: PaymentPlanPayment[];
    /** Application settings */
    settings: AppSettings;
  };
}
