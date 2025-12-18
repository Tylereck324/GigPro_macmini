// Block length in MINUTES (not hours)
export type BlockLength = 180 | 210 | 240 | 270;

export interface SimulatorConfig {
  blocksBeforeGas: number;        // How many blocks before refuel
  gasPrice: number;               // $ per gallon
  tankSize: number;               // Gallons per fill-up
  acceptableRates: {              // Minimum acceptable $ per block
    [K in BlockLength]: number;
  };
}

export interface HistoricalAverage {
  avgRate: number;                // Average $ per block
  avgPerHour: number;             // Average $ per hour
  count: number;                  // Number of blocks recorded
}

export interface HistoricalAverages {
  180: HistoricalAverage;
  210: HistoricalAverage;
  240: HistoricalAverage;
  270: HistoricalAverage;
}

export interface ScheduleBlock {
  blockLength: BlockLength;       // In minutes
  estimatedEarnings: number;      // $
  source: 'historical' | 'acceptable'; // Where rate came from
}

export interface DailySchedule {
  dayIndex: number;               // 0-6 (Sun-Sat)
  dayName: string;                // "Sun", "Mon", etc.
  blocks: ScheduleBlock[];
  totalHours: number;
  totalMinutes: number;
  remainingHours: number;         // 8 - totalHours
}

export interface WeeklyProjection {
  grossEarnings: number;
  totalGasCost: number;
  netEarnings: number;
  totalHours: number;
  totalBlocks: number;
  gasFillupsNeeded: number;
}

export interface BlockCombination {
  blocks: ScheduleBlock[];
  weeklyProjection: WeeklyProjection;
  dailySchedule: DailySchedule[];
  reasoning: string;
}

export interface SimulationResults {
  config: SimulatorConfig;
  historicalAverages: HistoricalAverages;
  optimalCombination: BlockCombination | null;
  weeklyProjection: WeeklyProjection;
  dailySchedule: DailySchedule[];
  reasoning: string;
}
