'use client';

import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { WeeklyProjection as WeeklyProjectionType } from '@/types/simulator';

interface WeeklyProjectionProps {
  projection: WeeklyProjectionType;
}

export function WeeklyProjection({ projection }: WeeklyProjectionProps) {
  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text">Weekly Projection</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-textSecondary">Gross Earnings:</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(projection.grossEarnings)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSecondary">Gas Expenses:</span>
              <span className="text-xl font-bold text-error">
                -{formatCurrency(projection.totalGasCost)}
              </span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text">Net Earnings:</span>
                <span className="text-2xl font-bold text-text">
                  {formatCurrency(projection.netEarnings)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-textSecondary">Total Hours:</span>
              <span className="text-lg font-semibold text-text">
                {projection.totalHours.toFixed(1)} / 40
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSecondary">Total Blocks:</span>
              <span className="text-lg font-semibold text-text">
                {projection.totalBlocks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSecondary">Gas Fill-ups:</span>
              <span className="text-lg font-semibold text-text">
                {projection.gasFillupsNeeded}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
