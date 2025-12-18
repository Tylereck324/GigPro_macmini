'use client';

import { Card } from '../ui';
import { getIncomeSummaryByPlatform, formatCurrency } from '@/lib/utils/profitCalculations';
import { getPlatformColor, getPlatformLabel } from '@/lib/utils/platformHelpers';
import type { IncomeEntry } from '@/types/income';
import clsx from 'clsx';

interface IncomeSummaryProps {
  entries: IncomeEntry[];
}

export function IncomeSummary({ entries }: IncomeSummaryProps) {
  if (entries.length === 0) {
    return null;
  }

  const summary = getIncomeSummaryByPlatform(entries);
  const platforms = Object.keys(summary);

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text">Income by Platform</h3>

        <div className="space-y-3">
          {platforms.map((platform) => (
            <div
              key={platform}
              className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
            >
              <span className={clsx('font-medium', getPlatformColor(platform))}>
                {getPlatformLabel(platform)}
              </span>
              <span className="text-lg font-bold text-text">
                {formatCurrency(summary[platform])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
