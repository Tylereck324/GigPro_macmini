'use client';

import { memo } from 'react';
import { formatCurrencyCompact } from '@/lib/utils/profitCalculations';
import type { DailyProfit } from '@/types/dailyData';

interface DayMetricsProps {
  profit: DailyProfit;
}

export const DayMetrics = memo(function DayMetrics({ profit }: DayMetricsProps) {
  // Check if there's any activity
  const hasActivity =
    profit.totalIncome !== 0 || profit.gasExpense !== 0 || profit.profit !== 0;

  if (!hasActivity) return null;

  // Determine profit color
  const profitColor =
    profit.profit > 0
      ? 'text-success'
      : profit.profit < 0
        ? 'text-danger'
        : 'text-textSecondary';

  return (
    <div className="space-y-0.5 sm:space-y-1">
      {/* Income line */}
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        <span className="text-success text-[10px] sm:text-xs">↑</span>
        <span className="text-textSecondary/70 text-[10px] sm:text-[11px]">
          <span className="sm:hidden">Inc</span>
          <span className="hidden sm:inline">Income</span>
        </span>
        <span className="text-success font-bold text-[11px] sm:text-xs">
          {formatCurrencyCompact(profit.totalIncome)}
        </span>
      </div>

      {/* Expenses line - only show if there are expenses */}
      {profit.gasExpense > 0 && (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <span className="text-danger text-[10px] sm:text-xs">↓</span>
          <span className="text-textSecondary/70 text-[10px] sm:text-[11px]">
            <span className="sm:hidden">Exp</span>
            <span className="hidden sm:inline">Expenses</span>
          </span>
          <span className="text-danger font-bold text-[11px] sm:text-xs">
            {formatCurrencyCompact(profit.gasExpense)}
          </span>
        </div>
      )}

      {/* Profit line */}
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        <span className={`${profitColor} text-[10px] sm:text-xs`}>=</span>
        <span className="text-textSecondary/70 text-[10px] sm:text-[11px]">
          <span className="sm:hidden">Net</span>
          <span className="hidden sm:inline">Profit</span>
        </span>
        <span className={`${profitColor} font-bold text-[11px] sm:text-xs`}>
          {formatCurrencyCompact(profit.profit)}
        </span>
      </div>
    </div>
  );
});
