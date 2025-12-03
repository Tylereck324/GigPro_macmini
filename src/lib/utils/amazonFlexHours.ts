import { parseISO, subDays, isSameDay, isWithinInterval } from 'date-fns';
import type { IncomeEntry, AmazonFlexHours } from '@/types/income';
import { minutesToHours } from './timeCalculations';

/**
 * Calculate Amazon Flex hours used and remaining for a specific date
 * Uses rolling 7-day window for weekly limit
 */
export function calculateAmazonFlexHours(
  allIncomeEntries: IncomeEntry[],
  targetDate: Date,
  dailyLimitHours: number,
  weeklyLimitHours: number,
): AmazonFlexHours {
  // Filter Amazon Flex entries only
  const amazonEntries = allIncomeEntries.filter((e) => e.platform === 'AmazonFlex');

  // 1. Calculate daily hours for target date
  const dailyEntries = amazonEntries.filter((e) => {
    try {
      return isSameDay(parseISO(e.date), targetDate);
    } catch {
      return false;
    }
  });

  const dailyMinutes = dailyEntries.reduce(
    (total, entry) => total + (entry.blockLength || 0),
    0
  );
  const dailyHoursUsed = minutesToHours(dailyMinutes);

  // 2. Calculate rolling 7-day window (including target date)
  const weekStart = subDays(targetDate, 6); // 7 days including target
  const weekEnd = targetDate;

  const weeklyEntries = amazonEntries.filter((e) => {
    try {
      const entryDate = parseISO(e.date);
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });

  const weeklyMinutes = weeklyEntries.reduce(
    (total, entry) => total + (entry.blockLength || 0),
    0
  );
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
  if (hoursRemaining > 3) return 'text-success';
  if (hoursRemaining >= 1) return 'text-warning';
  return 'text-danger';
}

/**
 * Format hours remaining display
 */
export function formatHoursRemaining(hours: number): string {
  return `${hours.toFixed(1)}h`;
}
