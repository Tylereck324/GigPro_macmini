'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { DayCell } from './DayCell';
import { getCalendarDays, formatDateKey, getNextMonth, getPreviousMonth } from '@/lib/utils/dateHelpers';
import { calculateDailyProfit } from '@/lib/utils/profitCalculations';
import { useIncomeStore, useDailyDataStore } from '@/store';
import type { DailyProfit } from '@/types/dailyData';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthlyCalendarProps {
  onDateChange?: (date: Date) => void;
}

export function MonthlyCalendar({ onDateChange }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [profitByDate, setProfitByDate] = useState<Record<string, DailyProfit>>({});

  const { incomeEntries, loadIncomeEntries } = useIncomeStore();
  const { dailyData, loadDailyData } = useDailyDataStore();

  // Load data on mount
  useEffect(() => {
    loadIncomeEntries();
    loadDailyData();
  }, [loadIncomeEntries, loadDailyData]);

  // Calculate profit for all visible days whenever data changes
  useEffect(() => {
    const days = getCalendarDays(currentDate);
    const newProfitByDate: Record<string, DailyProfit> = {};

    days.forEach((day) => {
      const dateKey = formatDateKey(day);
      const dayData = dailyData[dateKey];
      const profit = calculateDailyProfit(dateKey, incomeEntries, dayData);
      newProfitByDate[dateKey] = profit;
    });

    setProfitByDate(newProfitByDate);
  }, [currentDate, incomeEntries, dailyData]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = getPreviousMonth(prev);
      onDateChange?.(newDate);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = getNextMonth(prev);
      onDateChange?.(newDate);
      return newDate;
    });
  };

  // Notify parent of initial date (runs once on mount)
  // Using useRef to track if initial notification has been sent
  const hasNotifiedInitialDate = useRef(false);
  useEffect(() => {
    if (!hasNotifiedInitialDate.current) {
      onDateChange?.(currentDate);
      hasNotifiedInitialDate.current = true;
    }
  }, [currentDate, onDateChange]);

  const days = getCalendarDays(currentDate);

  return (
    <div className="w-full">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-textSecondary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {days.length > 0 ? (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateKey = formatDateKey(day);
            return (
              <DayCell
                key={dateKey}
                date={day}
                currentMonth={currentDate}
                profit={profitByDate[dateKey] || null}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-textSecondary">
          Unable to load calendar days.
        </div>
      )}
    </div>
  );
}
