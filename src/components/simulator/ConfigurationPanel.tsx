'use client';

import { useState } from 'react';
import { Card, Input, Button } from '@/components/ui';
import { BLOCK_LENGTH_LABELS, BLOCK_LENGTHS } from '@/lib/constants/simulator';
import type { SimulatorConfig, BlockLength } from '@/types/simulator';

interface ConfigurationPanelProps {
  config: SimulatorConfig;
  onChange: (config: SimulatorConfig) => void;
}

export function ConfigurationPanel({ config, onChange }: ConfigurationPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onChange(localConfig);
  };

  const handleReset = () => {
    const { DEFAULT_CONFIG } = require('@/lib/constants/simulator');
    setLocalConfig(DEFAULT_CONFIG);
    onChange(DEFAULT_CONFIG);
  };

  return (
    <Card>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text">Configuration</h2>

        {/* Gas & Vehicle Settings */}
        <div>
          <h3 className="text-lg font-semibold text-text mb-4">Gas & Vehicle Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Blocks before gas"
              value={localConfig.blocksBeforeGas}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                blocksBeforeGas: parseInt(e.target.value) || 1,
              })}
              min={1}
              max={10}
            />
            <Input
              type="number"
              label="Gas price per gallon"
              value={localConfig.gasPrice}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                gasPrice: parseFloat(e.target.value) || 0,
              })}
              min={0}
              step={0.01}
              placeholder="$3.50"
            />
            <Input
              type="number"
              label="Tank size (gallons)"
              value={localConfig.tankSize}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                tankSize: parseFloat(e.target.value) || 0,
              })}
              min={0}
              step={0.1}
            />
          </div>
        </div>

        {/* Minimum Acceptable Rates */}
        <div>
          <h3 className="text-lg font-semibold text-text mb-4">Minimum Acceptable Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BLOCK_LENGTHS.map((blockLength) => (
              <Input
                key={blockLength}
                type="number"
                label={`${BLOCK_LENGTH_LABELS[blockLength]} block`}
                value={localConfig.acceptableRates[blockLength]}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  acceptableRates: {
                    ...localConfig.acceptableRates,
                    [blockLength]: parseFloat(e.target.value) || 0,
                  },
                })}
                min={0}
                step={1}
                placeholder="$90.00"
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSave} variant="primary">
            Run Simulation
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset to Defaults
          </Button>
        </div>
      </div>
    </Card>
  );
}
