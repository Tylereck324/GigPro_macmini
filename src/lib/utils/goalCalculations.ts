import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { IncomeEntry } from '@/types/income';
import type { Goal, GoalProgress } from '@/types/goal';

/**
 * Calculate total income for a date range
 */
export function calculateIncomeForRange(
  incomeEntries: IncomeEntry[],
  startDate: string,
  endDate: string
): number {
  let total = 0;
  for (const entry of incomeEntries) {
    if (entry.date >= startDate && entry.date <= endDate) {
      total += entry.amount;
    }
  }
  return total;
}

/**
 * Calculate weekly income total
 * Week starts on Sunday (weekStartsOn: 0)
 */
export function calculateWeeklyIncome(
  incomeEntries: IncomeEntry[],
  date: Date
): number {
  const weekStart = format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  return calculateIncomeForRange(incomeEntries, weekStart, weekEnd);
}

/**
 * Calculate monthly income total
 */
export function calculateMonthlyIncome(
  incomeEntries: IncomeEntry[],
  date: Date
): number {
  const monthStart = format(startOfMonth(date), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd');
  return calculateIncomeForRange(incomeEntries, monthStart, monthEnd);
}

/**
 * Calculate goal progress with computed values
 */
export function calculateGoalProgress(
  goal: Goal,
  incomeEntries: IncomeEntry[]
): GoalProgress {
  const currentAmount = calculateIncomeForRange(
    incomeEntries,
    goal.startDate,
    goal.endDate
  );

  const percentComplete =
    goal.targetAmount > 0
      ? Math.min((currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  const remainingAmount = Math.max(goal.targetAmount - currentAmount, 0);
  const isComplete = currentAmount >= goal.targetAmount;

  return {
    goal,
    currentAmount,
    percentComplete,
    remainingAmount,
    isComplete,
  };
}

/**
 * Calculate prioritized income allocation for monthly goals
 * 
 * ALLOCATION LOGIC:
 * - Each goal's income is calculated from its own date range
 * - For goals with overlapping date ranges, income is allocated to highest priority first
 * - Lower priority goals get the remaining income after higher priority goals are satisfied
 * 
 * @param goals - All goals to calculate progress for
 * @param incomeEntries - All income entries to allocate
 * @returns Array of goal progress with allocated amounts
 */
export function calculatePrioritizedGoalProgress(
  goals: Goal[],
  incomeEntries: IncomeEntry[]
): GoalProgress[] {
  // Filter only active monthly goals and sort by priority (1 = highest)
  const monthlyGoals = goals
    .filter((goal) => goal.period === 'monthly' && goal.isActive)
    .sort((a, b) => a.priority - b.priority);

  if (monthlyGoals.length === 0) {
    return [];
  }

  // Group goals by date range to handle prioritized allocation within each range
  // For now, we'll calculate each goal's income independently then apply allocation
  const progressResults: GoalProgress[] = [];

  // Track already allocated income per date range to avoid double-counting
  const allocatedByRange = new Map<string, number>();

  for (const goal of monthlyGoals) {
    const rangeKey = `${goal.startDate}-${goal.endDate}`;

    // Calculate total income for this goal's specific date range
    const totalIncomeForRange = calculateIncomeForRange(
      incomeEntries,
      goal.startDate,
      goal.endDate
    );

    // Get how much has already been allocated from this date range
    const alreadyAllocated = allocatedByRange.get(rangeKey) || 0;
    const availableIncome = Math.max(totalIncomeForRange - alreadyAllocated, 0);

    // Allocate to this goal
    let allocatedAmount: number;
    if (availableIncome >= goal.targetAmount) {
      allocatedAmount = goal.targetAmount;
    } else {
      allocatedAmount = availableIncome;
    }

    // Track allocation for this range
    allocatedByRange.set(rangeKey, alreadyAllocated + allocatedAmount);

    const percentComplete =
      goal.targetAmount > 0
        ? Math.min((allocatedAmount / goal.targetAmount) * 100, 100)
        : 0;

    const remainingAmount = Math.max(goal.targetAmount - allocatedAmount, 0);
    const isComplete = allocatedAmount >= goal.targetAmount;

    progressResults.push({
      goal,
      currentAmount: allocatedAmount,
      percentComplete,
      remainingAmount,
      isComplete,
    });
  }

  return progressResults;
}

/**
 * Get current week start and end dates
 * Week starts on Sunday
 */
export function getCurrentWeekRange(date: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
  };
}

/**
 * Get current month start and end dates
 */
export function getCurrentMonthRange(date: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}
