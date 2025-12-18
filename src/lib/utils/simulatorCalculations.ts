import type {
  BlockLength,
  SimulatorConfig,
  HistoricalAverages,
  ScheduleBlock,
  DailySchedule,
  WeeklyProjection,
  BlockCombination,
  SimulationResults,
} from '@/types/simulator';
import type { IncomeEntry } from '@/types/income';
import { BLOCK_LENGTHS, DAY_NAMES, MAX_WEEKLY_MINUTES, MAX_DAILY_MINUTES } from '@/lib/constants/simulator';

/**
 * Calculate historical averages from existing income data
 * CRITICAL: Block lengths are stored in MINUTES (180, 210, 240, 270)
 */
export function calculateHistoricalAverages(
  incomeEntries: IncomeEntry[]
): HistoricalAverages {
  const aggregates: Record<BlockLength, { total: number; count: number }> = {
    180: { total: 0, count: 0 },
    210: { total: 0, count: 0 },
    240: { total: 0, count: 0 },
    270: { total: 0, count: 0 },
  };

  // Filter Amazon Flex entries only
  const amazonFlexEntries = incomeEntries.filter(
    (entry) => entry.platform === 'AmazonFlex' && entry.blockLength
  );

  // Aggregate by block length
  amazonFlexEntries.forEach((entry) => {
    const blockLength = entry.blockLength as BlockLength;
    if (blockLength && BLOCK_LENGTHS.includes(blockLength)) {
      const amount = typeof entry.amount === 'number' && !isNaN(entry.amount) && isFinite(entry.amount)
        ? entry.amount
        : 0;
      aggregates[blockLength].total += amount;
      aggregates[blockLength].count += 1;
    }
  });

  // Calculate averages
  const result: HistoricalAverages = {
    180: { avgRate: 0, avgPerHour: 0, count: 0 },
    210: { avgRate: 0, avgPerHour: 0, count: 0 },
    240: { avgRate: 0, avgPerHour: 0, count: 0 },
    270: { avgRate: 0, avgPerHour: 0, count: 0 },
  };

  BLOCK_LENGTHS.forEach((blockLength) => {
    const { total, count } = aggregates[blockLength];
    if (count > 0) {
      const avgRate = total / count;
      const hours = blockLength / 60;
      result[blockLength] = {
        avgRate,
        avgPerHour: avgRate / hours,
        count,
      };
    }
  });

  return result;
}

/**
 * Generate valid blocks based on acceptable rates
 * Historical data is shown for reference only
 */
export function generateValidBlocks(
  historicalAverages: HistoricalAverages,
  config: SimulatorConfig
): ScheduleBlock[] {
  const validBlocks: ScheduleBlock[] = [];

  BLOCK_LENGTHS.forEach((blockLength) => {
    const acceptableRate = config.acceptableRates[blockLength];

    // Always use acceptable rate if set (historical data is reference only)
    if (acceptableRate > 0) {
      validBlocks.push({
        blockLength,
        estimatedEarnings: acceptableRate,
        source: 'acceptable',
      });
    }
  });

  return validBlocks;
}

/**
 * Generate all valid weekly block combinations
 * Uses greedy algorithm to find combinations that fit within weekly limit
 */
export function generateWeeklyCombinations(
  validBlocks: ScheduleBlock[]
): ScheduleBlock[][] {
  if (validBlocks.length === 0) return [];

  // Sort blocks by $/hour descending for greedy approach
  const sortedBlocks = [...validBlocks].sort((a, b) => {
    const aRate = a.estimatedEarnings / (a.blockLength / 60);
    const bRate = b.estimatedEarnings / (b.blockLength / 60);
    return bRate - aRate;
  });

  const combinations: ScheduleBlock[][] = [];
  const maxCombinations = 100; // Limit to prevent infinite loops

  // Greedy approach: start with highest $/hr blocks
  for (let i = 0; i < sortedBlocks.length && combinations.length < maxCombinations; i++) {
    const combination: ScheduleBlock[] = [];
    let totalMinutes = 0;

    // Try to fill the week starting with this block type
    for (const block of sortedBlocks) {
      while (totalMinutes + block.blockLength <= MAX_WEEKLY_MINUTES) {
        combination.push({ ...block });
        totalMinutes += block.blockLength;
      }
    }

    if (combination.length > 0) {
      combinations.push(combination);
    }
  }

  return combinations;
}

/**
 * Distribute blocks across 7 days respecting daily 8-hour limit
 * Uses greedy bin-packing algorithm
 */
export function distributeBlocksToDays(
  blocks: ScheduleBlock[]
): DailySchedule[] {
  const schedule: DailySchedule[] = DAY_NAMES.map((dayName, index) => ({
    dayIndex: index,
    dayName,
    blocks: [],
    totalHours: 0,
    totalMinutes: 0,
    remainingHours: 8,
  }));

  // Sort blocks descending to place larger blocks first
  const sortedBlocks = [...blocks].sort((a, b) => b.blockLength - a.blockLength);

  // Greedy bin-packing: fit each block into first available day
  for (const block of sortedBlocks) {
    const availableDay = schedule.find(
      (day) => day.totalMinutes + block.blockLength <= MAX_DAILY_MINUTES
    );

    if (availableDay) {
      availableDay.blocks.push(block);
      availableDay.totalMinutes += block.blockLength;
      availableDay.totalHours = availableDay.totalMinutes / 60;
      availableDay.remainingHours = 8 - availableDay.totalHours;
    }
  }

  return schedule;
}

/**
 * Check if a combination can be distributed across 7 days
 * without violating the 8-hour daily limit
 */
export function isValidDailyDistribution(blocks: ScheduleBlock[]): boolean {
  const schedule = distributeBlocksToDays(blocks);
  const totalScheduledMinutes = schedule.reduce(
    (sum, day) => sum + day.totalMinutes,
    0
  );
  const totalBlockMinutes = blocks.reduce(
    (sum, block) => sum + block.blockLength,
    0
  );

  // Valid if all blocks were successfully scheduled
  return totalScheduledMinutes === totalBlockMinutes;
}

/**
 * Calculate gas cost for a given number of blocks
 */
export function calculateGasCost(
  totalBlocks: number,
  config: SimulatorConfig
): { cost: number; fillups: number } {
  const fillups = Math.ceil(totalBlocks / config.blocksBeforeGas);
  const cost = fillups * config.gasPrice * config.tankSize;

  return {
    cost: isFinite(cost) ? cost : 0,
    fillups: isFinite(fillups) ? fillups : 0,
  };
}

/**
 * Calculate weekly projection from a combination
 */
export function calculateWeeklyProjection(
  combination: ScheduleBlock[],
  config: SimulatorConfig
): WeeklyProjection {
  const totalBlocks = combination.length;
  const grossEarnings = combination.reduce(
    (sum, block) => sum + block.estimatedEarnings,
    0
  );
  const { cost: totalGasCost, fillups: gasFillupsNeeded } = calculateGasCost(
    totalBlocks,
    config
  );
  const netEarnings = grossEarnings - totalGasCost;
  const totalMinutes = combination.reduce(
    (sum, block) => sum + block.blockLength,
    0
  );
  const totalHours = totalMinutes / 60;

  return {
    grossEarnings: isFinite(grossEarnings) ? grossEarnings : 0,
    totalGasCost: isFinite(totalGasCost) ? totalGasCost : 0,
    netEarnings: isFinite(netEarnings) ? netEarnings : 0,
    totalHours: isFinite(totalHours) ? totalHours : 0,
    totalBlocks,
    gasFillupsNeeded,
  };
}

/**
 * Generate reasoning for why a combination is optimal
 */
export function generateReasoning(
  combination: ScheduleBlock[],
  projection: WeeklyProjection,
  historicalAverages: HistoricalAverages
): string {
  if (combination.length === 0) {
    return 'No valid blocks found. Try lowering your acceptable rates.';
  }

  // Count blocks by type
  const blockCounts: Record<BlockLength, number> = {
    180: 0,
    210: 0,
    240: 0,
    270: 0,
  };

  combination.forEach((block) => {
    blockCounts[block.blockLength] += 1;
  });

  // Build description
  const parts: string[] = [];
  BLOCK_LENGTHS.forEach((length) => {
    const count = blockCounts[length];
    if (count > 0) {
      const hours = length / 60;
      parts.push(`${count}× ${hours}hr block${count > 1 ? 's' : ''}`);
    }
  });

  const blocksDescription = parts.join(' + ');
  const avgPerHour = projection.totalHours > 0
    ? projection.netEarnings / projection.totalHours
    : 0;

  return `${blocksDescription} = ${projection.totalHours} hours. Maximizes $/hour ($${avgPerHour.toFixed(2)}/hr net) while staying under the 40-hour weekly limit and 8-hour daily limit.`;
}

/**
 * Main simulation function - finds optimal block combination
 */
export function runSimulation(
  incomeEntries: IncomeEntry[],
  config: SimulatorConfig
): SimulationResults {
  // Calculate historical averages
  const historicalAverages = calculateHistoricalAverages(incomeEntries);

  // Generate valid blocks
  const validBlocks = generateValidBlocks(historicalAverages, config);

  if (validBlocks.length === 0) {
    return {
      config,
      historicalAverages,
      optimalCombination: null,
      weeklyProjection: {
        grossEarnings: 0,
        totalGasCost: 0,
        netEarnings: 0,
        totalHours: 0,
        totalBlocks: 0,
        gasFillupsNeeded: 0,
      },
      dailySchedule: DAY_NAMES.map((dayName, index) => ({
        dayIndex: index,
        dayName,
        blocks: [],
        totalHours: 0,
        totalMinutes: 0,
        remainingHours: 8,
      })),
      reasoning: 'No valid blocks found. Try lowering your acceptable rates.',
    };
  }

  // Generate weekly combinations
  const combinations = generateWeeklyCombinations(validBlocks);

  // Find optimal combination (highest net earnings with valid daily distribution)
  let optimalCombination: BlockCombination | null = null;
  let maxNetEarnings = 0;

  for (const combination of combinations) {
    // Check if this combination can be distributed across days
    if (!isValidDailyDistribution(combination)) continue;

    const projection = calculateWeeklyProjection(combination, config);

    if (projection.netEarnings > maxNetEarnings) {
      maxNetEarnings = projection.netEarnings;
      const dailySchedule = distributeBlocksToDays(combination);
      const reasoning = generateReasoning(combination, projection, historicalAverages);

      optimalCombination = {
        blocks: combination,
        weeklyProjection: projection,
        dailySchedule,
        reasoning,
      };
    }
  }

  // Return results
  if (optimalCombination) {
    return {
      config,
      historicalAverages,
      optimalCombination,
      weeklyProjection: optimalCombination.weeklyProjection,
      dailySchedule: optimalCombination.dailySchedule,
      reasoning: optimalCombination.reasoning,
    };
  }

  // Fallback if no valid combinations found
  return {
    config,
    historicalAverages,
    optimalCombination: null,
    weeklyProjection: {
      grossEarnings: 0,
      totalGasCost: 0,
      netEarnings: 0,
      totalHours: 0,
      totalBlocks: 0,
      gasFillupsNeeded: 0,
    },
    dailySchedule: DAY_NAMES.map((dayName, index) => ({
      dayIndex: index,
      dayName,
      blocks: [],
      totalHours: 0,
      totalMinutes: 0,
      remainingHours: 8,
    })),
    reasoning: 'Could not find a valid combination within the 8-hour daily limit.',
  };
}
