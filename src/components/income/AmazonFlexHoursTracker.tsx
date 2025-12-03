'use client';

import { useMemo, useEffect } from 'react';
import { parseISO } from 'date-fns';
import clsx from 'clsx';
import { Card } from '../ui';
import { calculateAmazonFlexHours, getHoursRemainingColor, formatHoursRemaining } from '@/lib/utils/amazonFlexHours';
import { useStore } from '@/store'; // Import useStore
import type { IncomeEntry } from '@/types/income';

interface AmazonFlexHoursTrackerProps {
  date: string; // YYYY-MM-DD
  allIncomeEntries: IncomeEntry[];
}

export function AmazonFlexHoursTracker({ date, allIncomeEntries }: AmazonFlexHoursTrackerProps) {
  const { amazonFlexDailyCapacity, amazonFlexWeeklyCapacity, loadTheme } = useStore((state) => ({
    amazonFlexDailyCapacity: state.amazonFlexDailyCapacity,
    amazonFlexWeeklyCapacity: state.amazonFlexWeeklyCapacity,
    loadTheme: state.loadTheme,
  }));

  // Load settings on mount (if not already loaded)
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const dailyLimitHours = amazonFlexDailyCapacity / 60;
  const weeklyLimitHours = amazonFlexWeeklyCapacity / 60;

  const hours = useMemo(() => {
    try {
      const targetDate = parseISO(date);
      return calculateAmazonFlexHours(allIncomeEntries, targetDate, dailyLimitHours, weeklyLimitHours);
    } catch {
      return {
        dailyHoursUsed: 0,
        weeklyHoursUsed: 0,
        dailyRemaining: dailyLimitHours,
        weeklyRemaining: weeklyLimitHours,
      };
    }
  }, [date, allIncomeEntries, dailyLimitHours, weeklyLimitHours]);

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text flex items-center gap-2">
          <span className="text-amazonFlex">Amazon Flex</span>
          Hours Tracker
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Limit */}
          <div className="p-4 bg-background rounded-lg border border-border">
            <div className="text-sm text-textSecondary mb-2">Daily Limit ({dailyLimitHours} hours)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text">
                {hours.dailyHoursUsed.toFixed(1)}
              </span>
              <span className="text-sm text-textSecondary">/ {dailyLimitHours}h</span>
            </div>
            <div className={clsx('text-sm font-medium mt-2', getHoursRemainingColor(hours.dailyRemaining))}>
              {formatHoursRemaining(hours.dailyRemaining)} remaining
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={clsx('h-full transition-all duration-300', {
                  'bg-success': hours.dailyRemaining > 3,
                  'bg-warning': hours.dailyRemaining >= 1 && hours.dailyRemaining <= 3,
                  'bg-danger': hours.dailyRemaining < 1,
                })}
                style={{ width: `${Math.min((hours.dailyHoursUsed / dailyLimitHours) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Weekly Limit */}
          <div className="p-4 bg-background rounded-lg border border-border">
            <div className="text-sm text-textSecondary mb-2">Weekly Limit ({weeklyLimitHours} hours, rolling 7 days)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text">
                {hours.weeklyHoursUsed.toFixed(1)}
              </span>
              <span className="text-sm text-textSecondary">/ {weeklyLimitHours}h</span>
            </div>
            <div className={clsx('text-sm font-medium mt-2', getHoursRemainingColor(hours.weeklyRemaining))}>
              {formatHoursRemaining(hours.weeklyRemaining)} remaining
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={clsx('h-full transition-all duration-300', {
                  'bg-success': hours.weeklyRemaining > 3,
                  'bg-warning': hours.weeklyRemaining >= 1 && hours.weeklyRemaining <= 3,
                  'bg-danger': hours.weeklyRemaining < 1,
                })}
                style={{ width: `${Math.min((hours.weeklyHoursUsed / weeklyLimitHours) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
