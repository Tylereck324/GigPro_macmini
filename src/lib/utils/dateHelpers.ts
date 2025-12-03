import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';

/**
 * Get all days to display in a calendar month view (including days from prev/next month)
 */
export function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Format a date as YYYY-MM-DD (ISO date string)
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse an ISO date string to Date object
 */
export function parseDateKey(dateKey: string): Date {
  return parseISO(dateKey);
}

/**
 * Get the current month and year as a readable string
 */
export function getMonthYearLabel(date: Date): string {
  return format(date, 'MMMM yyyy');
}

/**
 * Get the next month
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

/**
 * Get the previous month
 */
export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

/**
 * Check if a date is in the same month as another date
 */
export function isInSameMonth(date: Date, monthDate: Date): boolean {
  return isSameMonth(date, monthDate);
}

/**
 * Check if a date is today
 */
export function isDateToday(date: Date): boolean {
  return isToday(date);
}

/**
 * Check if two dates are the same day
 */
export function areSameDay(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * Get the current month in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Get month key from date
 */
export function getMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}
