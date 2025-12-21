'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { format } from 'date-fns';
import { isInSameMonth, isDateToday, formatDateKey } from '@/lib/utils/dateHelpers';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { DailyProfit } from '@/types/dailyData';
import {
  CELL_PADDING,
  CELL_BORDER_WIDTH,
  CELL_BORDER_RADIUS,
  CELL_TRANSITION,
  CELL_HOVER_TRANSFORM,
  FOCUS_RING,
  PROFIT_INDICATOR_SIZE,
} from './constants';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  profit: DailyProfit | null;
  onFocus?: () => void;
  tabIndex?: number;
  elementRef?: React.RefCallback<HTMLDivElement>;
}

export function DayCell({ date, currentMonth, profit, onFocus, tabIndex = 0, elementRef }: DayCellProps) {
  const router = useRouter();
  const isCurrentMonth = isInSameMonth(date, currentMonth);
  const today = isDateToday(date);
  const dateKey = formatDateKey(date);

  const hasAnyActivity =
    !!profit && (profit.totalIncome !== 0 || profit.gasExpense !== 0 || profit.profit !== 0);
  const isProfitable = profit ? profit.profit > 0 : false;
  const isLoss = profit ? profit.profit < 0 : false;

  const handleClick = () => {
    try {
      // formatDateKey already validates and returns empty string on error
      if (!dateKey) {
        console.error('Invalid date key:', dateKey);
        return;
      }
      router.push(`/day/${dateKey}`);
    } catch (error) {
      console.error('Error navigating to day:', error);
    }
  };

  return (
    <div
      ref={elementRef}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onFocus={onFocus}
      role="gridcell"
      tabIndex={tabIndex}
      aria-label={`View details for ${format(date, 'MMMM d, yyyy')}. ${profit
          ? profit.profit > 0
            ? `Profit: ${formatCurrency(profit.profit)}`
            : profit.profit < 0
              ? `Loss: ${formatCurrency(profit.profit)}`
              : 'Break-even'
          : 'No activity'
        }`}
      className={clsx(
        `min-h-[80px] sm:min-h-[100px] ${CELL_PADDING.mobile} ${CELL_PADDING.desktop} ${CELL_BORDER_WIDTH} ${CELL_BORDER_RADIUS} cursor-pointer`,
        CELL_TRANSITION,
        CELL_HOVER_TRANSFORM,
        FOCUS_RING,
        {
          'bg-surface': isCurrentMonth,
          'bg-background/30': !isCurrentMonth,
          'border-success/40 bg-success/5': isCurrentMonth && isProfitable,
          'border-danger/40 bg-danger/5': isCurrentMonth && isLoss,
          'ring-2 ring-primary border-primary bg-primary/5': today,
        }
      )}
    >
      <div className="flex flex-col h-full">
        {/* Date number and indicator */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={clsx('text-sm font-semibold', {
              'text-text': isCurrentMonth,
              'text-textSecondary/40': !isCurrentMonth,
              'text-primary': today,
            })}
          >
            {format(date, 'd')}
          </span>
          {hasAnyActivity && (
            <div
              className={clsx(`${PROFIT_INDICATOR_SIZE} rounded-full`, {
                'bg-success': isProfitable,
                'bg-danger': isLoss,
                'bg-textSecondary/40': !isProfitable && !isLoss,
              })}
            ></div>
          )}
        </div>

        {/* Profit information */}
        {hasAnyActivity && (
          <div className="mt-auto overflow-hidden">
            <div
              className={clsx('text-xs sm:text-sm font-bold truncate', {
                'text-success': isProfitable,
                'text-danger': isLoss,
                'text-textSecondary': !isProfitable && !isLoss,
              })}
              title={formatCurrency(profit.profit)}
            >
              {formatCurrency(profit.profit)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
