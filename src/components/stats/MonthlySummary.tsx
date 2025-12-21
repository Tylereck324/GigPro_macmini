'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '@/components/ui';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import { GoalProgressBar } from '@/components/goals/GoalProgressBar';
import { calculatePrioritizedGoalProgress } from '@/lib/utils/goalCalculations';

interface MonthlySummaryProps {
  currentDate: Date;
  isLoading?: boolean;
}

export function MonthlySummary({ currentDate, isLoading = false }: MonthlySummaryProps) {
  // Optimized selectors with shallow comparison - only re-render when data actually changes
  const { incomeEntries, fixedExpenses, paymentPlans, paymentPlanPayments, goals, dailyData } = useStore(
    useShallow((state) => ({
      incomeEntries: state.incomeEntries,
      fixedExpenses: state.fixedExpenses,
      paymentPlans: state.paymentPlans,
      paymentPlanPayments: state.paymentPlanPayments,
      goals: state.goals,
      dailyData: state.dailyData,
    }))
  );

  // Calculate monthly totals - optimized to reduce loops
  const monthlyTotals = useMemo(() => {
    const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    const currentMonthKey = format(currentDate, 'yyyy-MM');

    // Single pass: income + daily data (mileage)
    let totalIncome = 0;
    let totalMiles = 0;

    for (const entry of incomeEntries) {
      if (entry.date >= monthStart && entry.date <= monthEnd) {
        totalIncome += entry.amount;
      }
    }

    // Combine dailyData iteration (mileage + gas calculation)
    let totalGasExpenses = 0;
    for (const dateKey in dailyData) {
      if (dateKey >= monthStart && dateKey <= monthEnd) {
        totalMiles += dailyData[dateKey].mileage || 0;
        totalGasExpenses += dailyData[dateKey].gasExpense || 0;
      }
    }

    // Single pass: active fixed expenses
    let totalBills = 0;
    for (const expense of fixedExpenses) {
      if (expense.isActive) totalBills += expense.amount;
    }

    // Single pass: identify paid plans for this month
    const paidPlanIdsThisMonth = new Set<string>();
    for (const payment of paymentPlanPayments) {
      if (payment.isPaid && payment.month === currentMonthKey) {
        paidPlanIdsThisMonth.add(payment.paymentPlanId);
      }
    }

    // Single pass: calculate payment plans minimum due
    let paymentPlansMinimumDue = 0;
    for (const plan of paymentPlans) {
      if (!plan.isComplete && !paidPlanIdsThisMonth.has(plan.id)) {
        paymentPlansMinimumDue += plan.minimumMonthlyPayment ?? plan.paymentAmount;
      }
    }

    // Calculate net (income - bills - payment plans due - gas)
    const net = totalIncome - totalBills - paymentPlansMinimumDue - totalGasExpenses;

    return {
      totalIncome,
      totalBills,
      paymentPlansMinimumDue,
      totalGasExpenses,
      net,
      totalMiles,
    };
  }, [currentDate, incomeEntries, fixedExpenses, paymentPlans, paymentPlanPayments, dailyData]);

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

  if (isLoading) {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">{monthName} Summary</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-surface/50 rounded-lg animate-pulse">
              <div className="h-4 w-24 bg-border rounded mb-2"></div>
              <div className="h-8 w-32 bg-border rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

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

        {/* Payment Plans Due */}
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Payment Plans Due</div>
          <div className="text-2xl font-bold text-warning">
            {formatCurrency(monthlyTotals.paymentPlansMinimumDue)}
          </div>
        </div>

        {/* Gas Expenses */}
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Gas Expenses</div>
          <div className="text-2xl font-bold text-danger">
            {formatCurrency(monthlyTotals.totalGasExpenses)}
          </div>
        </div>

        {/* Total Monthly Expenses */}
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <div className="text-sm text-textSecondary mb-1">Total Monthly Expenses</div>
          <div className="text-2xl font-bold text-danger">
            {formatCurrency(monthlyTotals.totalBills + monthlyTotals.paymentPlansMinimumDue + monthlyTotals.totalGasExpenses)}
          </div>
          <div className="text-xs text-textSecondary mt-2">
            Fixed: {formatCurrency(monthlyTotals.totalBills)} • Plans: {formatCurrency(monthlyTotals.paymentPlansMinimumDue)} • Gas: {formatCurrency(monthlyTotals.totalGasExpenses)}
          </div>
        </div>

        {/* Net */}
        <div
          className={`p-4 rounded-lg border ${monthlyTotals.net >= 0
            ? 'bg-primary/10 border-primary/20'
            : 'bg-danger/10 border-danger/20'
            }`}
        >
          <div className="text-sm text-textSecondary mb-1">Net (After All Expenses)</div>
          <div
            className={`text-2xl font-bold ${monthlyTotals.net >= 0 ? 'text-primary' : 'text-danger'
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
