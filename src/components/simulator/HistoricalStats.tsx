'use client';

import { Card } from '@/components/ui';
import { BLOCK_LENGTH_LABELS, BLOCK_LENGTHS } from '@/lib/constants/simulator';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { HistoricalAverages, BlockLength } from '@/types/simulator';

interface HistoricalStatsProps {
  historicalAverages: HistoricalAverages;
}

export function HistoricalStats({ historicalAverages }: HistoricalStatsProps) {
  const hasData = Object.values(historicalAverages).some((avg) => avg.count > 0);

  if (!hasData) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-textSecondary">
            No historical Amazon Flex data found. Start tracking blocks to see your averages!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text">Your Historical Averages</h2>
        <p className="text-sm text-textSecondary">Based on your tracked Amazon Flex blocks</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BLOCK_LENGTHS.map((blockLength) => {
            const avg = historicalAverages[blockLength as BlockLength];
            if (avg.count === 0) return null;

            return (
              <div
                key={blockLength}
                className="p-4 bg-background rounded-lg border border-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-text">
                    {BLOCK_LENGTH_LABELS[blockLength as BlockLength]}
                  </span>
                  <span className="text-xs text-textSecondary">
                    {avg.count} block{avg.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-text">
                    {formatCurrency(avg.avgRate)} avg
                  </div>
                  <div className="text-sm text-textSecondary">
                    {formatCurrency(avg.avgPerHour)}/hour
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
