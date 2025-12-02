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
  return incomeEntries
    .filter((entry) => entry.date >= startDate && entry.date <= endDate)
    .reduce((sum, entry) => sum + entry.amount, 0);
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
 * Income is allocated to highest priority goals first until they're complete
 */
export function calculatePrioritizedGoalProgress(
  goals: Goal[],
  incomeEntries: IncomeEntry[]
): GoalProgress[] {
  // Filter only active monthly goals and sort by priority (1 = highest)
  const monthlyGoals = goals
    .filter((goal) => goal.period === 'monthly' && goal.isActive)
    .sort((a, b) => a.priority - b.priority);

  // Calculate total income for each goal's period
  const totalIncomeByGoal = new Map<string, number>();

  monthlyGoals.forEach((goal) => {
    const income = calculateIncomeForRange(
      incomeEntries,
      goal.startDate,
      goal.endDate
    );
    totalIncomeByGoal.set(goal.id, income);
  });

  // Allocate income to goals by priority
  const progressResults: GoalProgress[] = [];
  let remainingIncome = 0;

  // Get the highest priority goal's income amount to work with
  if (monthlyGoals.length > 0) {
    const firstGoal = monthlyGoals[0];
    remainingIncome = totalIncomeByGoal.get(firstGoal.id) || 0;
  }

  for (const goal of monthlyGoals) {
    let allocatedAmount = 0;

    if (remainingIncome >= goal.targetAmount) {
      // This goal can be fully funded
      allocatedAmount = goal.targetAmount;
      remainingIncome -= goal.targetAmount;
    } else {
      // Allocate whatever income is left
      allocatedAmount = remainingIncome;
      remainingIncome = 0;
    }

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
