import { DEFAULT_CONFIG } from '@/lib/constants/simulator';
import type { SimulatorConfig } from '@/types/simulator';

const STORAGE_KEY = 'gigpro_simulator_config';

export function loadConfigFromLocalStorage(): SimulatorConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;

    const parsed = JSON.parse(stored);

    // Validate and merge with defaults
    return {
      blocksBeforeGas: typeof parsed.blocksBeforeGas === 'number' && parsed.blocksBeforeGas > 0
        ? parsed.blocksBeforeGas
        : DEFAULT_CONFIG.blocksBeforeGas,
      gasPrice: typeof parsed.gasPrice === 'number' && parsed.gasPrice > 0
        ? parsed.gasPrice
        : DEFAULT_CONFIG.gasPrice,
      tankSize: typeof parsed.tankSize === 'number' && parsed.tankSize > 0
        ? parsed.tankSize
        : DEFAULT_CONFIG.tankSize,
      acceptableRates: {
        180: parsed.acceptableRates?.[180] ?? DEFAULT_CONFIG.acceptableRates[180],
        210: parsed.acceptableRates?.[210] ?? DEFAULT_CONFIG.acceptableRates[210],
        240: parsed.acceptableRates?.[240] ?? DEFAULT_CONFIG.acceptableRates[240],
        270: parsed.acceptableRates?.[270] ?? DEFAULT_CONFIG.acceptableRates[270],
      },
    };
  } catch (error) {
    console.error('Failed to load simulator config:', error);
    return DEFAULT_CONFIG;
  }
}

export function saveConfigToLocalStorage(config: SimulatorConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save simulator config:', error);
  }
}
