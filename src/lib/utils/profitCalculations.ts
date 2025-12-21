/**
 * Profit and income calculation utilities
 * Provides functions for calculating daily profits, income summaries, and formatting currency
 */

import type { IncomeEntry } from '@/types/income';
import type { DailyData, DailyProfit } from '@/types/dailyData';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// ============================================================================
// Profit Calculations
// ============================================================================

/**
 * Calculate daily profit from income entries and daily data
 *
 * @param date - The date to calculate profit for (YYYY-MM-DD)
 * @param incomeEntries - All income entries to filter from
 * @param dailyData - Daily tracking data for expenses
 * @param entriesForDate - Optional pre-filtered entries for the date
 * @returns Computed profit data for the day
 */
export function calculateDailyProfit(
  date: string,
  incomeEntries: IncomeEntry[],
  dailyData: DailyData | undefined,
  entriesForDate?: IncomeEntry[]
): DailyProfit {
  // Calculate total income for the day
  let totalIncome = 0;
  if (entriesForDate) {
    for (const entry of entriesForDate) {
      totalIncome += entry.amount;
    }
  } else {
    for (const entry of incomeEntries) {
      if (entry.date === date) totalIncome += entry.amount;
    }
  }

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
  // Use Map for better performance during accumulation, then convert to object
  const summaryMap = new Map<string, number>();

  for (const entry of incomeEntries) {
    // Use custom platform name for "Other", otherwise use the platform value
    const key = entry.platform === 'Other' && entry.customPlatformName
      ? entry.customPlatformName
      : entry.platform;

    summaryMap.set(key, (summaryMap.get(key) || 0) + entry.amount);
  }

  // Convert Map to object for backward compatibility
  return Object.fromEntries(summaryMap);
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
  return currencyFormatter.format(amount);
}

/**
 * Format a number as compact currency (for space-constrained displays)
 * Shows whole dollars for amounts >= $100, otherwise shows cents
 *
 * @param amount - Dollar amount to format
 * @returns Compact formatted currency string (e.g., "$123" or "$45.50")
 */
export function formatCurrencyCompact(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 100) {
    // For larger amounts, show whole dollars only
    return amount < 0 ? `-$${Math.round(absAmount)}` : `$${Math.round(absAmount)}`;
  }
  // For smaller amounts, keep cents
  return currencyFormatter.format(amount);
}
