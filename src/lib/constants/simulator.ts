import type { BlockLength } from '@/types/simulator';

export const BLOCK_LENGTHS: BlockLength[] = [180, 210, 240, 270];

export const BLOCK_LENGTH_LABELS: Record<BlockLength, string> = {
  180: '3 hours',
  210: '3.5 hours',
  240: '4 hours',
  270: '4.5 hours',
};

export const MAX_WEEKLY_HOURS = 40;
export const MAX_DAILY_HOURS = 8;
export const MAX_WEEKLY_MINUTES = MAX_WEEKLY_HOURS * 60; // 2400
export const MAX_DAILY_MINUTES = MAX_DAILY_HOURS * 60;   // 480

export const DEFAULT_CONFIG = {
  blocksBeforeGas: 4,
  gasPrice: 3.50,
  tankSize: 12,
  acceptableRates: {
    180: 60,   // 3hr block
    210: 70,   // 3.5hr block
    240: 80,   // 4hr block
    270: 90,   // 4.5hr block
  },
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
