/**
 * Profit and income calculation utilities
 * Provides functions for calculating daily profits, income summaries, and formatting currency
 */

import type { IncomeEntry } from '@/types/income';
import type { DailyData } from '@/types/dailyData';
import type { DailyProfit } from '@/types/dailyData';

// ============================================================================
// Profit Calculations
// ============================================================================

/**
 * Calculate daily profit from income entries and daily data
 *
 * @param date - The date to calculate profit for (YYYY-MM-DD)
 * @param incomeEntries - All income entries to filter from
 * @param dailyData - Daily tracking data for expenses
 * @returns Computed profit data for the day
 */
export function calculateDailyProfit(
  date: string,
  incomeEntries: IncomeEntry[],
  dailyData: DailyData | undefined
): DailyProfit {
  // Calculate total income for the day
  const dayIncomeEntries = incomeEntries.filter((entry) => entry.date === date);
  const totalIncome = dayIncomeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // Get gas expense
  const gasExpense = dailyData?.gasExpense ?? 0;

  // Calculate profit
  const profit = totalIncome - gasExpense;

  // Calculate earnings per mile
  const mileage = dailyData?.mileage ?? 0;
  const earningsPerMile = mileage > 0 ? totalIncome / mileage : null;

  return {
    date,
    totalIncome,
    gasExpense,
    profit,
    earningsPerMile,
  };
}

// ============================================================================
// Income Summary
// ============================================================================

/**
 * Get income summary aggregated by platform
 * Groups income by platform name or custom platform name for "Other"
 *
 * @param incomeEntries - Income entries to summarize
 * @returns Object mapping platform names to total amounts
 */
export function getIncomeSummaryByPlatform(incomeEntries: IncomeEntry[]): Record<string, number> {
  const summary: Record<string, number> = {};

  incomeEntries.forEach((entry) => {
    // Use custom platform name for "Other", otherwise use the platform value
    const key = entry.platform === 'Other' && entry.customPlatformName
      ? entry.customPlatformName
      : entry.platform;

    if (!summary[key]) {
      summary[key] = 0;
    }
    summary[key] += entry.amount;
  });

  return summary;
}

/**
 * Get total income for a set of entries
 *
 * @param incomeEntries - Income entries to sum
 * @returns Total income amount
 */
export function getTotalIncome(incomeEntries: IncomeEntry[]): number {
  return incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format a number as US currency
 *
 * @param amount - Dollar amount to format
 * @returns Formatted currency string (e.g., "$123.45")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format earnings per mile with currency
 *
 * @param earningsPerMile - Earnings per mile value, or null
 * @returns Formatted string (e.g., "$2.50/mile") or "N/A" if null
 */
export function formatEarningsPerMile(earningsPerMile: number | null): string {
  if (earningsPerMile === null) return 'N/A';
  return `${formatCurrency(earningsPerMile)}/mile`;
}
