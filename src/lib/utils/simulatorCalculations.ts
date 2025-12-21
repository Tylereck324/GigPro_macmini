import type { IncomeEntry } from '@/types/income';

export type BlockTypeKey = '4.5' | '4' | '3.5' | '3';

export interface SimulatorConfig {
  blocksBeforeGas: number;
  averageGasPrice: number;
  tankSize: number;
  acceptableRates: Record<BlockTypeKey, number>;
}

export interface BlockHistoricalAverage {
  avgRate: number;
  avgPerHour: number;
  count: number;
}

export type HistoricalAverages = Record<BlockTypeKey, BlockHistoricalAverage>;

export interface DaySchedule {
  dayIndex: number;
  dayName: string;
  blocks: number[];
  totalHours: number;
}

export interface WeeklyProjection {
  grossEarnings: number;
  totalGasCost: number;
  netEarnings: number;
  totalHours: number;
  totalBlocks: number;
  gasFillupsNeeded: number;
}

export interface SimulationResults {
  weeklyProjection: WeeklyProjection;
  dailyBreakdown: DaySchedule[];
  optimalSchedule: {
    blocks: number[];
    reasoning: string;
  };
}

const BLOCK_TYPES: number[] = [4.5, 4, 3.5, 3];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function toBlockTypeKey(hours: number): BlockTypeKey | null {
  const key = hours.toString();
  if (key === '4.5' || key === '4' || key === '3.5' || key === '3') return key;
  return null;
}

function getBlockTypeHoursFromMinutes(minutes: number): BlockTypeKey | null {
  const candidates: Array<{ minutes: number; key: BlockTypeKey }> = [
    { minutes: 270, key: '4.5' },
    { minutes: 240, key: '4' },
    { minutes: 210, key: '3.5' },
    { minutes: 180, key: '3' },
  ];

  const toleranceMinutes = 10;
  for (const candidate of candidates) {
    if (Math.abs(minutes - candidate.minutes) <= toleranceMinutes) {
      return candidate.key;
    }
  }

  return null;
}

export function calculateHistoricalAverages(incomeEntries: IncomeEntry[]): HistoricalAverages {
  const totals: Record<BlockTypeKey, { total: number; count: number }> = {
    '4.5': { total: 0, count: 0 },
    '4': { total: 0, count: 0 },
    '3.5': { total: 0, count: 0 },
    '3': { total: 0, count: 0 },
  };

  for (const entry of incomeEntries) {
    if (entry.platform !== 'AmazonFlex') continue;
    if (!entry.blockLength || entry.blockLength <= 0) continue;

    const typeKey = getBlockTypeHoursFromMinutes(entry.blockLength);
    if (!typeKey) continue;

    totals[typeKey].total += entry.amount;
    totals[typeKey].count += 1;
  }

  const averages: HistoricalAverages = {
    '4.5': { avgRate: 0, avgPerHour: 0, count: totals['4.5'].count },
    '4': { avgRate: 0, avgPerHour: 0, count: totals['4'].count },
    '3.5': { avgRate: 0, avgPerHour: 0, count: totals['3.5'].count },
    '3': { avgRate: 0, avgPerHour: 0, count: totals['3'].count },
  };

  for (const key of Object.keys(totals) as BlockTypeKey[]) {
    const { total, count } = totals[key];
    const hours = Number(key);
    if (count > 0 && Number.isFinite(hours) && hours > 0) {
      const avgRate = total / count;
      averages[key] = {
        avgRate,
        avgPerHour: avgRate / hours,
        count,
      };
    }
  }

  return averages;
}

export function distributeBlocksToDays(blocks: number[], maxDailyHours = 8): DaySchedule[] | null {
  const schedule: DaySchedule[] = Array.from({ length: 7 }, (_, index) => ({
    dayIndex: index,
    dayName: DAY_NAMES[index],
    blocks: [],
    totalHours: 0,
  }));

  const sortedBlocks = [...blocks].sort((a, b) => b - a);
  for (const block of sortedBlocks) {
    let bestIndex = -1;
    let bestTotal = Infinity;

    for (let i = 0; i < schedule.length; i++) {
      const nextTotal = schedule[i].totalHours + block;
      if (nextTotal <= maxDailyHours && schedule[i].totalHours < bestTotal) {
        bestTotal = schedule[i].totalHours;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) return null;
    schedule[bestIndex].blocks.push(block);
    schedule[bestIndex].totalHours += block;
  }

  return schedule;
}

function isValidDailyDistribution(blocks: number[], maxDailyHours = 8): boolean {
  return distributeBlocksToDays(blocks, maxDailyHours) !== null;
}

function expectedBlockEarnings(
  blockHours: number,
  config: SimulatorConfig,
  historicalAverages: HistoricalAverages
): number | null {
  const key = toBlockTypeKey(blockHours);
  if (!key) return null;

  const minAcceptable = config.acceptableRates[key];
  const historical = historicalAverages[key];
  const expected = historical.count > 0 ? historical.avgRate : minAcceptable;

  if (!Number.isFinite(expected) || expected <= 0) return null;
  if (expected < minAcceptable) return null;

  return expected;
}

function getEligibleBlockTypes(config: SimulatorConfig, historicalAverages: HistoricalAverages): number[] {
  const eligible: number[] = [];
  for (const hours of BLOCK_TYPES) {
    const expected = expectedBlockEarnings(hours, config, historicalAverages);
    if (expected !== null) eligible.push(hours);
  }
  return eligible;
}

function generateCombinationsByCounts(
  eligibleTypes: number[],
  maxWeeklyHours: number
): number[][] {
  const results: number[][] = [];
  const sortedTypes = [...eligibleTypes].sort((a, b) => b - a);

  const maxCounts = sortedTypes.map((hours) => Math.floor(maxWeeklyHours / hours));
  const counts = new Array(sortedTypes.length).fill(0);

  const buildBlocksFromCounts = (): number[] => {
    const blocks: number[] = [];
    for (let i = 0; i < counts.length; i++) {
      for (let j = 0; j < counts[i]; j++) blocks.push(sortedTypes[i]);
    }
    return blocks;
  };

  const recurse = (index: number, hoursUsed: number) => {
    if (index >= sortedTypes.length) {
      results.push(buildBlocksFromCounts());
      return;
    }

    for (let c = 0; c <= maxCounts[index]; c++) {
      const nextHours = hoursUsed + c * sortedTypes[index];
      if (nextHours > maxWeeklyHours) break;
      counts[index] = c;
      recurse(index + 1, nextHours);
    }
    counts[index] = 0;
  };

  recurse(0, 0);
  return results;
}

export function runSimulation(
  config: SimulatorConfig,
  historicalAverages: HistoricalAverages,
  options?: { maxWeeklyHours?: number; maxDailyHours?: number }
): SimulationResults | null {
  const maxWeeklyHours = options?.maxWeeklyHours ?? 40;
  const maxDailyHours = options?.maxDailyHours ?? 8;

  const blocksBeforeGas = Math.max(1, Math.floor(config.blocksBeforeGas));
  const averageGasPrice = Math.max(0, config.averageGasPrice);
  const tankSize = Math.max(0, config.tankSize);

  const eligibleTypes = getEligibleBlockTypes(config, historicalAverages);
  if (eligibleTypes.length === 0) return null;

  const combos = generateCombinationsByCounts(eligibleTypes, maxWeeklyHours).filter((blocks) =>
    isValidDailyDistribution(blocks, maxDailyHours)
  );

  let best: { blocks: number[]; projection: WeeklyProjection } | null = null;

  for (const combo of combos) {
    const totalHours = combo.reduce((sum, hours) => sum + hours, 0);
    if (totalHours <= 0) continue;

    const totalBlocks = combo.length;
    const gasFillupsNeeded = Math.ceil(totalBlocks / blocksBeforeGas);
    const totalGasCost = gasFillupsNeeded * averageGasPrice * tankSize;

    let grossEarnings = 0;
    let valid = true;
    for (const hours of combo) {
      const expected = expectedBlockEarnings(hours, config, historicalAverages);
      if (expected === null) {
        valid = false;
        break;
      }
      grossEarnings += expected;
    }
    if (!valid) continue;

    const netEarnings = grossEarnings - totalGasCost;

    const projection: WeeklyProjection = {
      grossEarnings,
      totalGasCost,
      netEarnings,
      totalHours,
      totalBlocks,
      gasFillupsNeeded,
    };

    if (!best) {
      best = { blocks: combo, projection };
      continue;
    }

    if (projection.netEarnings > best.projection.netEarnings) {
      best = { blocks: combo, projection };
      continue;
    }

    if (projection.netEarnings === best.projection.netEarnings) {
      if (projection.totalHours > best.projection.totalHours) {
        best = { blocks: combo, projection };
        continue;
      }
      if (projection.totalHours === best.projection.totalHours && projection.totalBlocks < best.projection.totalBlocks) {
        best = { blocks: combo, projection };
        continue;
      }
    }
  }

  if (!best) return null;

  const dailyBreakdown = distributeBlocksToDays(best.blocks, maxDailyHours) ?? [];
  const readableCounts = best.blocks.reduce((acc, hours) => {
    const key = toBlockTypeKey(hours);
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<BlockTypeKey, number>>);

  const blocksSummary = (Object.keys(readableCounts) as BlockTypeKey[])
    .sort((a, b) => Number(b) - Number(a))
    .map((k) => `${readableCounts[k]}× ${k}h`)
    .join(' + ');

  const reasoning = `Selected ${blocksSummary} because it maximizes net earnings using your historical averages (or your minimum acceptable rates when you have no history), while staying within ${maxWeeklyHours}h/week and ${maxDailyHours}h/day.`;

  return {
    weeklyProjection: best.projection,
    dailyBreakdown,
    optimalSchedule: {
      blocks: best.blocks,
      reasoning,
    },
  };
}
