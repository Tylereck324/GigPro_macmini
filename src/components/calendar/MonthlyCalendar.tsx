'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { DayCell } from './DayCell';
import { getCalendarDays, formatDateKey, getNextMonth, getPreviousMonth } from '@/lib/utils/dateHelpers';
import { calculateDailyProfit } from '@/lib/utils/profitCalculations';
import { useStore } from '@/store';
import type { DailyProfit } from '@/types/dailyData';
import type { IncomeEntry } from '@/types/income';
import {
  WEEKDAYS,
  SKELETON_CELL_COUNT,
  GRID_GAP,
  CELL_PADDING,
  CELL_BORDER_WIDTH,
  CELL_BORDER_RADIUS,
} from './constants';

interface MonthlyCalendarProps {
  onDateChange?: (date: Date) => void;
  isLoading?: boolean;
}

export function MonthlyCalendar({ onDateChange, isLoading = false }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusedDateIndex, setFocusedDateIndex] = useState<number | null>(0); // Start with first cell focusable
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // Optimized selectors - only subscribe to specific data
  const incomeEntries = useStore((state) => state.incomeEntries);
  const dailyData = useStore((state) => state.dailyData);

  const days = useMemo(() => getCalendarDays(currentDate), [currentDate]);

  // Handle focus changes when keyboard navigation updates focusedDateIndex
  useEffect(() => {
    if (focusedDateIndex !== null && calendarGridRef.current) {
      const cells = calendarGridRef.current.querySelectorAll('[role="gridcell"]');
      if (cells && cells[focusedDateIndex]) {
        (cells[focusedDateIndex] as HTMLElement).focus();
      }
    }
  }, [focusedDateIndex]);

  // Calculate profit for all visible days with optimized caching
  // Only recalculate when income entries or daily data actually change for visible dates
  const profitByDate = useMemo(() => {
    const newProfitByDate: Record<string, DailyProfit> = {};

    try {
      // Pre-filter income entries to only those in the visible date range
      const startDate = days[0] ? formatDateKey(days[0]) : null;
      const endDate = days[days.length - 1] ? formatDateKey(days[days.length - 1]) : null;

      // Only filter if we have valid date range
      const relevantIncome = (startDate && endDate)
        ? incomeEntries.filter((entry) => entry.date >= startDate && entry.date <= endDate)
        : incomeEntries; // Fallback to all entries if date range is invalid

      // Group income by date for O(1) lookups
      const incomeByDate: Record<string, IncomeEntry[]> = {};
      relevantIncome.forEach((entry) => {
        if (!incomeByDate[entry.date]) {
          incomeByDate[entry.date] = [];
        }
        incomeByDate[entry.date].push(entry);
      });

      // Calculate profit for each day
      days.forEach((day) => {
        const dateKey = formatDateKey(day);
        if (!dateKey) return; // Skip invalid dates

        const dayData = dailyData[dateKey];
        const dayIncome = incomeByDate[dateKey] || [];

        // Inline calculation for better performance with validation
        const totalIncome = dayIncome.reduce((sum, entry) => {
          const amount = typeof entry.amount === 'number' ? entry.amount : 0;
          return sum + amount;
        }, 0);
        const gasExpense = typeof dayData?.gasExpense === 'number' ? dayData.gasExpense : 0;
        const profit = totalIncome - gasExpense;
        const mileage = typeof dayData?.mileage === 'number' ? dayData.mileage : 0;
        const earningsPerMile = mileage > 0 ? totalIncome / mileage : null;

        newProfitByDate[dateKey] = {
          date: dateKey,
          totalIncome,
          gasExpense,
          profit,
          earningsPerMile,
        };
      });
    } catch (error) {
      console.error('Error calculating profit data:', error);
      // Return empty object on error - calendar will still render without profit data
    }

    return newProfitByDate;
  }, [days, dailyData, incomeEntries]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = getPreviousMonth(prev);
      onDateChange?.(newDate);
      return newDate;
    });
  }, [onDateChange]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = getNextMonth(prev);
      onDateChange?.(newDate);
      return newDate;
    });
  }, [onDateChange]);

  // Notify parent of date changes
  // Using useRef to store the callback to avoid dependency issues
  const onDateChangeRef = useRef(onDateChange);
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);

  // Notify parent of initial date (runs once on mount)
  const hasNotifiedInitialDate = useRef(false);
  useEffect(() => {
    if (!hasNotifiedInitialDate.current) {
      onDateChangeRef.current?.(currentDate);
      hasNotifiedInitialDate.current = true;
    }
  }, [currentDate]);

  // Keyboard navigation for calendar grid
  const handleCalendarKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (focusedDateIndex === null || days.length === 0) return;

    let newIndex = focusedDateIndex;
    let preventDefault = true;

    switch (e.key) {
      case 'ArrowLeft':
        newIndex = Math.max(0, focusedDateIndex - 1);
        break;
      case 'ArrowRight':
        newIndex = Math.min(days.length - 1, focusedDateIndex + 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(0, focusedDateIndex - 7);
        break;
      case 'ArrowDown':
        newIndex = Math.min(days.length - 1, focusedDateIndex + 7);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = days.length - 1;
        break;
      case 'PageUp':
        // Previous month
        e.preventDefault();
        handlePreviousMonth();
        setFocusedDateIndex(null);
        return;
      case 'PageDown':
        // Next month
        e.preventDefault();
        handleNextMonth();
        setFocusedDateIndex(null);
        return;
      default:
        preventDefault = false;
    }

    if (preventDefault) {
      e.preventDefault();
      setFocusedDateIndex(newIndex);
      // Focus is now handled by useEffect to avoid race conditions
    }
  }, [focusedDateIndex, days.length, handlePreviousMonth, handleNextMonth]);

  return (
    <section className="w-full" aria-labelledby="calendar-heading">
      <h2 id="calendar-heading" className="sr-only">
        Monthly Calendar - {format(currentDate, 'MMMM yyyy')}
      </h2>
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Weekday headers */}
      <div className={`grid grid-cols-7 ${GRID_GAP} mb-0 border-b border-border/30`} role="row">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="text-center text-xs font-semibold text-textSecondary/80 py-2 border-r border-border/30 last:border-r-0"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className={`grid grid-cols-7 ${GRID_GAP}`}>
          {Array.from({ length: SKELETON_CELL_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`min-h-[80px] sm:min-h-[100px] ${CELL_PADDING.mobile} ${CELL_PADDING.desktop} ${CELL_BORDER_WIDTH} ${CELL_BORDER_RADIUS} bg-surface border-border animate-pulse`}
            >
              <div className="h-4 w-6 bg-border rounded mb-2"></div>
              <div className="mt-auto space-y-1">
                <div className="h-4 w-16 bg-border rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : days.length > 0 ? (
        <div
          ref={calendarGridRef}
          className={`grid grid-cols-7 ${GRID_GAP}`}
          role="grid"
          aria-label="Calendar days"
          onKeyDown={handleCalendarKeyDown}
        >
          {days.map((day, index) => {
            const dateKey = formatDateKey(day);
            return (
              <DayCell
                key={dateKey}
                date={day}
                currentMonth={currentDate}
                profit={profitByDate[dateKey] || null}
                onFocus={() => setFocusedDateIndex(index)}
                tabIndex={focusedDateIndex === index ? 0 : -1}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-textSecondary">
          Unable to load calendar days.
        </div>
      )}
    </section>
  );
}
