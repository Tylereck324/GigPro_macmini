'use client';

import { Card } from '../ui';
import { formatCurrency, formatEarningsPerMile } from '@/lib/utils/profitCalculations';
import type { DailyProfit } from '@/types/dailyData';
import clsx from 'clsx';

interface DailyProfitCardProps {
  profit: DailyProfit;
}

const STAGGER_DELAY = 50;

export function DailyProfitCard({ profit }: DailyProfitCardProps) {
  const isProfitable = profit.profit > 0;
  const isLoss = profit.profit < 0;

  const statCards = [
    {
      label: 'Total Income',
      value: formatCurrency(profit.totalIncome),
      color: 'success',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'bg-gradient-success',
    },
    {
      label: 'Gas Expense',
      value: formatCurrency(profit.gasExpense),
      color: 'danger',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'bg-gradient-danger',
    },
    {
      label: 'Profit',
      value: formatCurrency(profit.profit),
      color: isProfitable ? 'success' : isLoss ? 'danger' : 'textSecondary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: isProfitable ? 'bg-gradient-success' : 'bg-gradient-danger',
      isHighlight: true,
    },
    {
      label: 'Earnings Per Mile',
      value: profit.earningsPerMile !== null ? formatCurrency(profit.earningsPerMile) : 'N/A',
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      gradient: 'bg-gradient-primary',
      suffix: profit.earningsPerMile !== null ? 'per mile' : '',
    },
  ];

  return (
    <Card elevated containerQuery>
      <div className="space-y-6">
        <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Daily Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={clsx(
                'cq-padding-responsive rounded-2xl border-2 transition-all duration-300 animate-fade-in',
                'hover:shadow-lg hover:-translate-y-1',
                {
                  'bg-gradient-to-br from-surface to-background border-border/50': !stat.isHighlight,
                  'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-primary/30': stat.isHighlight,
                }
              )}
              style={{ animationDelay: `${index * STAGGER_DELAY}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-sm font-semibold text-textSecondary uppercase tracking-wide">
                  {stat.label}
                </div>
                <div className={clsx(
                  'opacity-80',
                  {
                    'text-success': stat.color === 'success',
                    'text-danger': stat.color === 'danger',
                    'text-primary': stat.color === 'primary',
                    'text-textSecondary': stat.color === 'textSecondary',
                  }
                )}>
                  {stat.icon}
                </div>
              </div>
              <div
                className={clsx('font-bold mb-1 cq-text-responsive', {
                  'text-success': stat.color === 'success',
                  'text-danger': stat.color === 'danger',
                  'text-primary': stat.color === 'primary',
                  'text-textSecondary': stat.color === 'textSecondary',
                })}
              >
                {stat.value}
              </div>
              {stat.suffix && (
                <div className="text-xs text-textSecondary font-medium">
                  {stat.suffix}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
