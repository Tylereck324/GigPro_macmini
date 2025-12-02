'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { format } from 'date-fns';
import { isInSameMonth, isDateToday, formatDateKey } from '@/lib/utils/dateHelpers';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { DailyProfit } from '@/types/dailyData';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  profit: DailyProfit | null;
}

export function DayCell({ date, currentMonth, profit }: DayCellProps) {
  const router = useRouter();
  const isCurrentMonth = isInSameMonth(date, currentMonth);
  const today = isDateToday(date);
  const dateKey = formatDateKey(date);

  const hasIncome = profit && profit.totalIncome > 0;
  const isProfitable = profit && profit.profit > 0;
  const isLoss = profit && profit.profit < 0;

  const handleClick = () => {
    router.push(`/day/${dateKey}`);
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${format(date, 'MMMM d, yyyy')}`}
      className={clsx(
        'min-h-[100px] sm:min-h-[120px] p-2 sm:p-3 border-2 rounded-2xl cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:-translate-y-1',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        {
          'bg-surface border-border': isCurrentMonth,
          'bg-background/50 opacity-50 border-border/50': !isCurrentMonth,
          'ring-2 ring-primary ring-offset-2 border-primary shadow-lg': today,
          'hover:border-primary/50': isCurrentMonth && !today,
        }
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <span
            className={clsx('text-sm sm:text-base font-bold', {
              'text-text': isCurrentMonth,
              'text-textSecondary': !isCurrentMonth,
              'bg-gradient-primary bg-clip-text text-transparent': today,
            })}
          >
            {format(date, 'd')}
          </span>
          {hasIncome && (
            <div className="flex items-center gap-1">
              {isProfitable && (
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              )}
              {isLoss && (
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
              )}
            </div>
          )}
        </div>

        {hasIncome && (
          <div className="mt-auto space-y-1">
            <div
              className={clsx('text-sm sm:text-base font-bold', {
                'text-success': isProfitable,
                'text-danger': isLoss,
                'text-textSecondary': !isProfitable && !isLoss,
              })}
            >
              {isProfitable || isLoss ? formatCurrency(profit.profit) : formatCurrency(0)}
            </div>
            {profit.totalIncome > 0 && (
              <div className="text-xs text-textSecondary flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                {formatCurrency(profit.totalIncome)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
