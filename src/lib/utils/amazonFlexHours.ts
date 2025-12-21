import { minutesToHours } from './timeCalculations';
import type { IncomeEntry, AmazonFlexHours } from '@/types/income';

import {
  DEFAULT_TIME_ZONE,
  AMAZON_FLEX_ROLLING_WINDOW_DAYS,
  HOURS_REMAINING_WARNING_THRESHOLD,
  HOURS_REMAINING_CRITICAL_THRESHOLD
} from '../constants/amazonFlex';

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dateFormatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  dateFormatterCache.set(timeZone, formatter);
  return formatter;
}

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return utcDateToDateKey(date);
}

function formatDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = getDateFormatter(timeZone).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * Calculate Amazon Flex hours used and remaining for a specific date
 * Uses rolling 7-day window for weekly limit
 */
export function calculateAmazonFlexHours(
  allIncomeEntries: IncomeEntry[],
  targetDate: Date,
  dailyLimitHours: number,
  weeklyLimitHours: number,
  timeZone?: string,
): AmazonFlexHours;
export function calculateAmazonFlexHours(
  allIncomeEntries: IncomeEntry[],
  targetDateKey: string,
  dailyLimitHours: number,
  weeklyLimitHours: number,
  timeZone?: string,
): AmazonFlexHours;
export function calculateAmazonFlexHours(
  allIncomeEntries: IncomeEntry[],
  targetDateOrKey: Date | string,
  dailyLimitHours: number,
  weeklyLimitHours: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): AmazonFlexHours {
  const targetDateKey = isDateKey(targetDateOrKey)
    ? targetDateOrKey
    : formatDateKeyInTimeZone(targetDateOrKey, timeZone);

  // Calculate rolling 7-day window (including target date)
  // This uses calendar days based on the provided timezone:
  // at midnight in that timezone, the window shifts forward.
  const weekStartKey = addDaysToDateKey(targetDateKey, -(AMAZON_FLEX_ROLLING_WINDOW_DAYS - 1)); // e.g. -6 for 7 days

  const weekEndKey = targetDateKey;

  let dailyMinutes = 0;
  let weeklyMinutes = 0;

  for (const entry of allIncomeEntries) {
    if (entry.platform !== 'AmazonFlex') continue;
    const entryDate = entry.date;
    if (entryDate < weekStartKey || entryDate > weekEndKey) continue;

    const minutes = entry.blockLength ?? 0;
    weeklyMinutes += minutes;
    if (entryDate === targetDateKey) {
      dailyMinutes += minutes;
    }
  }

  const dailyHoursUsed = minutesToHours(dailyMinutes);
  const weeklyHoursUsed = minutesToHours(weeklyMinutes);

  return {
    dailyHoursUsed,
    weeklyHoursUsed,
    dailyRemaining: Math.max(0, dailyLimitHours - dailyHoursUsed),
    weeklyRemaining: Math.max(0, weeklyLimitHours - weeklyHoursUsed),
  };
}

/**
 * Get color class for hours remaining indicator
 */
export function getHoursRemainingColor(hoursRemaining: number): string {
  if (hoursRemaining > HOURS_REMAINING_WARNING_THRESHOLD) return 'text-success';
  if (hoursRemaining >= HOURS_REMAINING_CRITICAL_THRESHOLD) return 'text-warning';
  return 'text-danger';
}

/**
 * Format hours remaining display
 */
export function formatHoursRemaining(hours: number): string {
  return `${hours.toFixed(1)}h`;
}
