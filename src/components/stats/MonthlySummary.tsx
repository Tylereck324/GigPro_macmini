'use client';

import { useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '@/components/ui';
import { useIncomeStore, useExpenseStore, useGoalStore, useDailyDataStore } from '@/store';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import { GoalProgressBar } from '@/components/goals/GoalProgressBar';
import { calculatePrioritizedGoalProgress } from '@/lib/utils/goalCalculations';

interface MonthlySummaryProps {
  currentDate: Date;
}

export function MonthlySummary({ currentDate }: MonthlySummaryProps) {
  const { incomeEntries, loadIncomeEntries } = useIncomeStore();
  const { fixedExpenses, variableExpenses, loadFixedExpenses, loadVariableExpenses } = useExpenseStore();
  const { goals, loadGoals } = useGoalStore();
  const { dailyData, loadDailyData } = useDailyDataStore();

  // Load data on mount
  useEffect(() => {
    loadIncomeEntries();
    loadFixedExpenses();
    loadVariableExpenses();
    loadGoals();
    loadDailyData();
  }, [loadIncomeEntries, loadFixedExpenses, loadVariableExpenses, loadGoals, loadDailyData]);

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    // Calculate total income for the month
    const totalIncome = incomeEntries
      .filter((entry) => entry.date >= monthStart && entry.date <= monthEnd)
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Calculate total fixed expenses (bills)
    const totalBills = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate total variable expenses for the month
    const currentMonth = format(currentDate, 'yyyy-MM');
    const totalVariableExpenses = variableExpenses
      .filter((expense) => expense.month === currentMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate net (income - bills - variable expenses)
    const net = totalIncome - totalBills - totalVariableExpenses;

    // Calculate total miles for the month
    const totalMiles = Object.values(dailyData)
      .filter((data) => data.date >= monthStart && data.date <= monthEnd)
      .reduce((sum, data) => sum + (data.mileage || 0), 0);

    return {
      totalIncome,
      totalBills,
      totalVariableExpenses,
      net,
      totalMiles,
    };
  }, [currentDate, incomeEntries, fixedExpenses, variableExpenses, dailyData]);

  // Get current monthly goals with prioritized allocation
  const currentMonthGoalProgress = useMemo(() => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const prioritizedGoals = calculatePrioritizedGoalProgress(goals, incomeEntries);

    // Get the highest priority goal for current month
    return prioritizedGoals.find(
      (gp) =>
        gp.goal.startDate <= dateStr &&
        gp.goal.endDate >= dateStr &&
        gp.goal.isActive
    );
  }, [currentDate, goals, incomeEntries]);

  const monthName = format(currentDate, 'MMMM yyyy');

  return (
    <Card>
      <h2 className="text-xl font-semibold text-text mb-4">{monthName} Summary</h2>

      <div className="space-y-4">
        {/* Total Income */}
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Total Income</div>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(monthlyTotals.totalIncome)}
          </div>
        </div>

        {/* Total Bills */}
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Fixed Expenses (Bills)</div>
          <div className="text-2xl font-bold text-danger">
            {formatCurrency(monthlyTotals.totalBills)}
          </div>
        </div>

        {/* Variable Expenses */}
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Variable Expenses</div>
          <div className="text-2xl font-bold text-warning">
            {formatCurrency(monthlyTotals.totalVariableExpenses)}
          </div>
        </div>

        {/* Net */}
        <div
          className={`p-4 rounded-lg border ${
            monthlyTotals.net >= 0
              ? 'bg-primary/10 border-primary/20'
              : 'bg-danger/10 border-danger/20'
          }`}
        >
          <div className="text-sm text-textSecondary mb-1">Net (After All Expenses)</div>
          <div
            className={`text-2xl font-bold ${
              monthlyTotals.net >= 0 ? 'text-primary' : 'text-danger'
            }`}
          >
            {formatCurrency(monthlyTotals.net)}
          </div>
        </div>

        {/* Miles Driven */}
        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Miles Driven</div>
          <div className="text-2xl font-bold text-secondary">
            {new Intl.NumberFormat('en-US').format(monthlyTotals.totalMiles)} mi
          </div>
        </div>

        {/* Monthly Goal Progress */}
        {currentMonthGoalProgress && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-sm text-textSecondary mb-1">
              Monthly Goal: {currentMonthGoalProgress.goal.name}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(currentMonthGoalProgress.currentAmount)}
              </span>
              <span className="text-sm text-textSecondary">
                / {formatCurrency(currentMonthGoalProgress.goal.targetAmount)}
              </span>
            </div>
            <GoalProgressBar
              current={currentMonthGoalProgress.currentAmount}
              target={currentMonthGoalProgress.goal.targetAmount}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
