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
  isValid,
} from 'date-fns';

/**
 * Validate if a date is a valid Date object
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date);
}

/**
 * Validate if a string is in YYYY-MM-DD format
 */
export function isValidDateKey(dateKey: string): boolean {
  if (typeof dateKey !== 'string') return false;
  const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateKeyRegex.test(dateKey)) return false;

  // Validate it's an actual valid date
  const parsed = parseISO(dateKey);
  return isValid(parsed);
}

/**
 * Safely parse a date key with validation
 */
export function safeParseDateKey(dateKey: string): Date | null {
  if (!isValidDateKey(dateKey)) {
    console.error('Invalid date key format:', dateKey);
    return null;
  }
  return parseISO(dateKey);
}

/**
 * Get all days to display in a calendar month view (including days from prev/next month)
 */
export function getCalendarDays(date: Date): Date[] {
  if (!isValidDate(date)) {
    console.error('Invalid date provided to getCalendarDays:', date);
    return [];
  }

  try {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  } catch (error) {
    console.error('Error generating calendar days:', error);
    return [];
  }
}

/**
 * Format a date as YYYY-MM-DD (ISO date string)
 */
export function formatDateKey(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date provided to formatDateKey:', date);
    return '';
  }

  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Get the current month and year as a readable string
 */
export function getMonthYearLabel(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date provided to getMonthYearLabel:', date);
    return 'Invalid Date';
  }

  try {
    return format(date, 'MMMM yyyy');
  } catch (error) {
    console.error('Error formatting month year label:', error);
    return 'Invalid Date';
  }
}

/**
 * Get the next month
 */
export function getNextMonth(date: Date): Date {
  if (!isValidDate(date)) {
    console.error('Invalid date provided to getNextMonth:', date);
    return new Date();
  }

  try {
    return addMonths(date, 1);
  } catch (error) {
    console.error('Error getting next month:', error);
    return new Date();
  }
}

/**
 * Get the previous month
 */
export function getPreviousMonth(date: Date): Date {
  if (!isValidDate(date)) {
    console.error('Invalid date provided to getPreviousMonth:', date);
    return new Date();
  }

  try {
    return subMonths(date, 1);
  } catch (error) {
    console.error('Error getting previous month:', error);
    return new Date();
  }
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
  try {
    return format(new Date(), 'yyyy-MM');
  } catch (error) {
    console.error('Error getting current month key:', error);
    return '';
  }
}

/**
 * Get month key from date
 */
export function getMonthKey(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date provided to getMonthKey:', date);
    return '';
  }

  try {
    return format(date, 'yyyy-MM');
  } catch (error) {
    console.error('Error getting month key:', error);
    return '';
  }
}
