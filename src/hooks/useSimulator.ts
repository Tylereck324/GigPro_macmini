import { useCallback, useMemo, useState } from 'react';
import type { IncomeEntry } from '@/types/income';
import type {
  HistoricalAverages,
  SimulationResults,
  SimulatorConfig,
} from '@/lib/utils/simulatorCalculations';
import { calculateHistoricalAverages, runSimulation } from '@/lib/utils/simulatorCalculations';

export function getDefaultSimulatorConfig(): SimulatorConfig {
  return {
    blocksBeforeGas: 4,
    averageGasPrice: 3.5,
    tankSize: 12,
    acceptableRates: {
      '4.5': 90,
      '4': 80,
      '3.5': 70,
      '3': 60,
    },
  };
}

export function useSimulator(incomeEntries: IncomeEntry[]) {
  const historicalAverages: HistoricalAverages = useMemo(
    () => calculateHistoricalAverages(incomeEntries),
    [incomeEntries]
  );

  const [config, setConfig] = useState<SimulatorConfig>(getDefaultSimulatorConfig());
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async () => {
    setIsRunning(true);
    try {
      const computed = runSimulation(config, historicalAverages);
      setResults(computed);
      return computed;
    } finally {
      setIsRunning(false);
    }
  }, [config, historicalAverages]);

  return {
    config,
    setConfig,
    historicalAverages,
    results,
    setResults,
    isRunning,
    run,
  };
}

