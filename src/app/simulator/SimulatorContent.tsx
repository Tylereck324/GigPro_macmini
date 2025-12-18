'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIncomeStore } from '@/store';
import { runSimulation } from '@/lib/utils/simulatorCalculations';
import { loadConfigFromLocalStorage, saveConfigToLocalStorage } from '@/lib/utils/simulatorStorage';
import { DEFAULT_CONFIG } from '@/lib/constants/simulator';
import type { SimulatorConfig } from '@/types/simulator';
import { ConfigurationPanel } from '@/components/simulator/ConfigurationPanel';
import { HistoricalStats } from '@/components/simulator/HistoricalStats';
import { WeeklyProjection } from '@/components/simulator/WeeklyProjection';
import { DailyScheduleGrid } from '@/components/simulator/DailyScheduleGrid';
import { OptimalRecommendation } from '@/components/simulator/OptimalRecommendation';

export function SimulatorContent() {
  const { incomeEntries, loadIncomeEntries } = useIncomeStore();
  const [config, setConfig] = useState<SimulatorConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Load config from localStorage after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const savedConfig = loadConfigFromLocalStorage();
    setConfig(savedConfig);
  }, []);

  // Load income data on mount
  useEffect(() => {
    loadIncomeEntries();
  }, [loadIncomeEntries]);

  // Run simulation whenever config or income data changes
  const results = useMemo(() => {
    return runSimulation(incomeEntries, config);
  }, [incomeEntries, config]);

  // Persist config changes to localStorage
  const handleConfigChange = (newConfig: SimulatorConfig) => {
    setConfig(newConfig);
    saveConfigToLocalStorage(newConfig);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Earnings Simulator</h1>
        <p className="text-textSecondary">
          Forecast weekly Amazon Flex earnings and find optimal block combinations
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuration Panel */}
        <ConfigurationPanel
          config={config}
          onChange={handleConfigChange}
        />

        {/* Historical Stats */}
        <HistoricalStats
          historicalAverages={results.historicalAverages}
        />

        {/* Results Section */}
        {results.optimalCombination ? (
          <>
            {/* Weekly Projection Card */}
            <WeeklyProjection
              projection={results.weeklyProjection}
            />

            {/* Daily Schedule Grid */}
            <DailyScheduleGrid
              schedule={results.dailySchedule}
            />

            {/* Optimal Recommendation */}
            <OptimalRecommendation
              reasoning={results.reasoning}
              projection={results.weeklyProjection}
            />
          </>
        ) : (
          <div className="text-center py-12 bg-surface rounded-lg border border-border">
            <p className="text-textSecondary">{results.reasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
