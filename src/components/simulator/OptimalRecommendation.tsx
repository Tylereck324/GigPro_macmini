'use client';

import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { WeeklyProjection } from '@/types/simulator';

interface OptimalRecommendationProps {
  reasoning: string;
  projection: WeeklyProjection;
}

export function OptimalRecommendation({ reasoning, projection }: OptimalRecommendationProps) {
  const avgPerHour = projection.totalHours > 0
    ? projection.netEarnings / projection.totalHours
    : 0;

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text">Recommendation</h2>

        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-text leading-relaxed">{reasoning}</p>
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
          <span className="text-textSecondary">Net hourly rate:</span>
          <span className="text-xl font-bold text-success">
            {formatCurrency(avgPerHour)}/hour
          </span>
        </div>
      </div>
    </Card>
  );
}
