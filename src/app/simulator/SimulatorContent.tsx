'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useShallow } from 'zustand/react/shallow';
import { Card, Button, Input } from '@/components/ui';
import { useStore } from '@/store';
import { useSimulator, getDefaultSimulatorConfig } from '@/hooks/useSimulator';
import type { SimulatorConfig } from '@/lib/utils/simulatorCalculations';
import { formatCurrency } from '@/lib/utils/profitCalculations';

const SIMULATOR_STORAGE_KEY = 'gigpro-simulator-config';

export function SimulatorContent() {
  const { incomeEntries, loadIncomeEntries } = useStore(
    useShallow((state) => ({
      incomeEntries: state.incomeEntries,
      loadIncomeEntries: state.loadIncomeEntries,
    }))
  );

  const { config, setConfig, historicalAverages, results, isRunning, run, setResults } =
    useSimulator(incomeEntries);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    void loadIncomeEntries().catch(() => {});
  }, [loadIncomeEntries]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIMULATOR_STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<SimulatorConfig>;
      const defaults = getDefaultSimulatorConfig();

      setConfig({
        blocksBeforeGas: typeof parsed.blocksBeforeGas === 'number' ? parsed.blocksBeforeGas : defaults.blocksBeforeGas,
        averageGasPrice: typeof parsed.averageGasPrice === 'number' ? parsed.averageGasPrice : defaults.averageGasPrice,
        tankSize: typeof parsed.tankSize === 'number' ? parsed.tankSize : defaults.tankSize,
        acceptableRates: {
          '4.5': parsed.acceptableRates?.['4.5'] ?? defaults.acceptableRates['4.5'],
          '4': parsed.acceptableRates?.['4'] ?? defaults.acceptableRates['4'],
          '3.5': parsed.acceptableRates?.['3.5'] ?? defaults.acceptableRates['3.5'],
          '3': parsed.acceptableRates?.['3'] ?? defaults.acceptableRates['3'],
        },
      });
    } catch {
      // ignore parse errors
    } finally {
      setIsHydrated(true);
    }
  }, [setConfig]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config, isHydrated]);

  const historicalLines = useMemo(() => {
    const keys = ['4.5', '4', '3.5', '3'] as const;
    return keys.map((key) => {
      const avg = historicalAverages[key];
      const hours = Number(key);
      return {
        key,
        hours,
        count: avg.count,
        avgRate: avg.avgRate,
        avgPerHour: avg.avgPerHour,
      };
    });
  }, [historicalAverages]);

  const updateAcceptableRate = (key: keyof SimulatorConfig['acceptableRates'], value: number) => {
    setConfig((prev) => ({
      ...prev,
      acceptableRates: { ...prev.acceptableRates, [key]: value },
    }));
  };

  const resetConfig = () => {
    setConfig(getDefaultSimulatorConfig());
    setResults(null);
  };

  const handleRun = async () => {
    const blocksBeforeGas = Math.floor(config.blocksBeforeGas);
    if (!Number.isFinite(blocksBeforeGas) || blocksBeforeGas < 1 || blocksBeforeGas > 10) {
      toast.error('Blocks before gas must be between 1 and 10');
      return;
    }
    if (!Number.isFinite(config.averageGasPrice) || config.averageGasPrice < 0) {
      toast.error('Gas price must be 0 or higher');
      return;
    }
    if (!Number.isFinite(config.tankSize) || config.tankSize <= 0) {
      toast.error('Tank size must be greater than 0');
      return;
    }

    const computed = await run();
    if (!computed) {
      toast.error('No valid schedule found. Try lowering minimum acceptable rates.');
      return;
    }
    toast.success('Simulation updated');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Earnings Simulator</h1>
        <p className="text-textSecondary">
          Forecast weekly earnings and gas costs, and find an optimal Amazon Flex block mix under 40h/week and 8h/day.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Blocks Before Gas"
                value={config.blocksBeforeGas}
                min={1}
                max={10}
                onChange={(e) => setConfig((prev) => ({ ...prev, blocksBeforeGas: Number(e.target.value) }))}
                fullWidth
              />
              <Input
                type="number"
                label="Average Gas Price ($/gal)"
                value={config.averageGasPrice}
                min={0}
                step={0.01}
                onChange={(e) => setConfig((prev) => ({ ...prev, averageGasPrice: Number(e.target.value) }))}
                fullWidth
              />
              <Input
                type="number"
                label="Tank Size (gal)"
                value={config.tankSize}
                min={1}
                step={0.1}
                onChange={(e) => setConfig((prev) => ({ ...prev, tankSize: Number(e.target.value) }))}
                fullWidth
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-text mb-3">Minimum Acceptable Rates ($/block)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="4.5 hour block"
                  value={config.acceptableRates['4.5']}
                  min={0}
                  step={0.01}
                  onChange={(e) => updateAcceptableRate('4.5', Number(e.target.value))}
                  fullWidth
                />
                <Input
                  type="number"
                  label="4 hour block"
                  value={config.acceptableRates['4']}
                  min={0}
                  step={0.01}
                  onChange={(e) => updateAcceptableRate('4', Number(e.target.value))}
                  fullWidth
                />
                <Input
                  type="number"
                  label="3.5 hour block"
                  value={config.acceptableRates['3.5']}
                  min={0}
                  step={0.01}
                  onChange={(e) => updateAcceptableRate('3.5', Number(e.target.value))}
                  fullWidth
                />
                <Input
                  type="number"
                  label="3 hour block"
                  value={config.acceptableRates['3']}
                  min={0}
                  step={0.01}
                  onChange={(e) => updateAcceptableRate('3', Number(e.target.value))}
                  fullWidth
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="primary" onClick={() => void handleRun()} disabled={isRunning} fullWidth>
                {isRunning ? 'Running…' : 'Run Simulation'}
              </Button>
              <Button variant="outline" onClick={resetConfig} fullWidth>
                Reset
              </Button>
            </div>
          </Card>

          {results && (
            <Card>
              <h2 className="text-xl font-semibold text-text mb-4">Recommended Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {results.dailyBreakdown.map((day) => (
                  <div key={day.dayIndex} className="p-3 rounded-lg border border-border bg-background">
                    <div className="text-sm font-semibold text-text mb-1">{day.dayName}</div>
                    <div className="text-xs text-textSecondary mb-2">{day.totalHours.toFixed(1)}h / 8h</div>
                    {day.blocks.length === 0 ? (
                      <div className="text-sm text-textSecondary">—</div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {day.blocks.map((b, idx) => (
                          <span
                            key={`${day.dayIndex}-${idx}`}
                            className="px-2 py-1 rounded-md bg-surface text-xs text-text"
                          >
                            {b}h
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-textSecondary">{results.optimalSchedule.reasoning}</div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">Historical Averages</h2>
            <div className="space-y-3">
              {historicalLines.map((line) => (
                <div key={line.key} className="p-3 rounded-lg border border-border bg-background">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-text">{line.key}h blocks</div>
                    <div className="text-sm text-textSecondary">{line.count} blocks</div>
                  </div>
                  <div className="text-sm text-textSecondary mt-1">
                    {line.count > 0 ? (
                      <>
                        Avg per block: {formatCurrency(line.avgRate)} • Avg per hour:{' '}
                        {formatCurrency(line.avgPerHour)}/hr
                      </>
                    ) : (
                      <>No history yet — will use your minimum acceptable rate.</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">Weekly Projection</h2>
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Gross Earnings</span>
                  <span className="font-semibold text-text">{formatCurrency(results.weeklyProjection.grossEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Gas Expenses</span>
                  <span className="font-semibold text-danger">-{formatCurrency(results.weeklyProjection.totalGasCost)}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between">
                  <span className="font-semibold text-text">Net Earnings</span>
                  <span className="text-2xl font-bold text-success">{formatCurrency(results.weeklyProjection.netEarnings)}</span>
                </div>
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-sm">
                  <div className="text-textSecondary">Hours</div>
                  <div className="text-text font-semibold">
                    {results.weeklyProjection.totalHours.toFixed(1)} / 40
                  </div>
                  <div className="text-textSecondary">Blocks</div>
                  <div className="text-text font-semibold">{results.weeklyProjection.totalBlocks}</div>
                  <div className="text-textSecondary">Fill-ups</div>
                  <div className="text-text font-semibold">{results.weeklyProjection.gasFillupsNeeded}</div>
                </div>
              </div>
            ) : (
              <div className="text-textSecondary text-sm">
                Run the simulator to see a weekly projection and recommended schedule.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
