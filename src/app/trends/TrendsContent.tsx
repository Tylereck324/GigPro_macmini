'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIncomeStore } from '@/store';
import { PlatformSelector } from '@/components/trends/PlatformSelector';
import { TrendsHeatmap } from '@/components/trends/TrendsHeatmap';
import { calculateTrends } from '@/lib/utils/trendsCalculations';

export function TrendsContent() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const { incomeEntries, loadIncomeEntries, isLoading } = useIncomeStore();

  useEffect(() => {
    void loadIncomeEntries().catch(() => {});
  }, [loadIncomeEntries]);

  const heatmapData = useMemo(() => {
    return calculateTrends(incomeEntries, selectedPlatform);
  }, [incomeEntries, selectedPlatform]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Earnings Trends</h1>
        <p className="text-textSecondary">
          Discover the best times to work based on your historical hourly earnings.
        </p>
      </div>

      <PlatformSelector
        selected={selectedPlatform}
        onSelect={setSelectedPlatform}
      />

      <TrendsHeatmap data={heatmapData} isLoading={isLoading} />
    </div>
  );
}
