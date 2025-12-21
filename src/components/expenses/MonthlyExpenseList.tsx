'use client';

import { useMemo, useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Card, ConfirmDialog } from '../ui';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import clsx from 'clsx';
import type { FixedExpense, PaymentPlan, PaymentPlanPayment } from '@/types/expense';

interface MonthlyExpenseListProps {
  fixedExpenses: FixedExpense[];
  paymentPlans: PaymentPlan[];
  paymentPlanPayments: PaymentPlanPayment[];
  currentMonth: string; // YYYY-MM
  onEditFixed: (expense: FixedExpense) => void;
  onDeleteFixed: (id: string) => void;
  onToggleFixedActive: (id: string, isActive: boolean) => void;
  onEditPaymentPlan: (plan: PaymentPlan) => void;
  onDeletePaymentPlan: (id: string) => void;
  onTogglePaymentPaid: (plan: PaymentPlan, month: string, isPaid: boolean) => void;
}

export function MonthlyExpenseList({
  fixedExpenses,
  paymentPlans,
  paymentPlanPayments,
  currentMonth,
  onEditFixed,
  onDeleteFixed,
  onToggleFixedActive,
  onEditPaymentPlan,
  onDeletePaymentPlan,
  onTogglePaymentPaid,
}: MonthlyExpenseListProps) {
  // Sort fixed expenses by due date
  const sortedFixedExpenses = useMemo(
    () => [...fixedExpenses].sort((a, b) => a.dueDate - b.dueDate),
    [fixedExpenses]
  );

  const sortedPaymentPlans = useMemo(() => {
    const dueOrLast = (plan: PaymentPlan) =>
      typeof plan.dueDay === 'number' && Number.isFinite(plan.dueDay) ? plan.dueDay : 99;

    return [...paymentPlans].sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
      const dueDiff = dueOrLast(a) - dueOrLast(b);
      if (dueDiff !== 0) return dueDiff;
      return a.name.localeCompare(b.name);
    });
  }, [paymentPlans]);

  const getPaymentAmount = (plan: PaymentPlan) =>
    plan.minimumMonthlyPayment ?? plan.paymentAmount;

  const paymentStatsByPlanId = useMemo(() => {
    const stats: Record<
      string,
      {
        paymentsMade: number;
        paidThisMonth: boolean;
      }
    > = {};

    for (const payment of paymentPlanPayments) {
      const planId = payment.paymentPlanId;
      if (!stats[planId]) {
        stats[planId] = { paymentsMade: 0, paidThisMonth: false };
      }

      if (payment.isPaid) {
        stats[planId].paymentsMade += 1;
        if (payment.month === currentMonth) {
          stats[planId].paidThisMonth = true;
        }
      }
    }

    return stats;
  }, [paymentPlanPayments, currentMonth]);

  const getRemainingForPlan = (plan: PaymentPlan) => {
    // Use currentPayment from the plan (1-indexed, represents next payment to make)
    // So paymentsMade = currentPayment - 1 (e.g., if currentPayment=2, then 1 payment was made)
    const paymentsMadeFromPlan = Math.max((plan.currentPayment ?? 1) - 1, 0);
    const paymentsMade = Math.min(paymentsMadeFromPlan, plan.totalPayments);
    const remainingPayments = Math.max(plan.totalPayments - paymentsMade, 0);
    const remainingAmount = Math.max(
      plan.initialCost - paymentsMade * getPaymentAmount(plan),
      0
    );
    return { remainingPayments, remainingAmount };
  };

  // Calculate totals
  const totals = useMemo(() => {
    const getPaymentAmountForTotals = (plan: PaymentPlan) =>
      plan.minimumMonthlyPayment ?? plan.paymentAmount;

    const getRemainingForPlanTotals = (plan: PaymentPlan) => {
      // Use currentPayment from the plan (1-indexed, represents next payment to make)
      const paymentsMadeFromPlan = Math.max((plan.currentPayment ?? 1) - 1, 0);
      const paymentsMade = Math.min(paymentsMadeFromPlan, plan.totalPayments);
      const remainingAmount = Math.max(
        plan.initialCost - paymentsMade * getPaymentAmountForTotals(plan),
        0
      );
      return { remainingAmount };
    };

    const fixedTotal = fixedExpenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate payment plan totals
    const activePlans = paymentPlans.filter((p) => !p.isComplete);

    // Sum of minimum monthly payments for monthly obligations
    const paymentPlansMinimumDue = activePlans.reduce((sum, p) => {
      const paidThisMonth = paymentStatsByPlanId[p.id]?.paidThisMonth ?? false;
      if (paidThisMonth) return sum;
      const monthlyAmount = getPaymentAmountForTotals(p);
      return sum + monthlyAmount;
    }, 0);

    // Total remaining amount across all payment plans
    const paymentPlansTotal = activePlans.reduce((sum, p) => {
      const { remainingAmount } = getRemainingForPlanTotals(p);
      return sum + remainingAmount;
    }, 0);

    const grandTotal = fixedTotal + paymentPlansMinimumDue;

    return {
      fixedTotal,
      paymentPlansMinimumDue,
      paymentPlansTotal,
      grandTotal,
    };
  }, [fixedExpenses, paymentPlans, paymentStatsByPlanId]);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string | null;
    type: 'fixed' | 'payment' | null;
  }>({
    isOpen: false,
    id: null,
    type: null,
  });

  const handleDeleteFixed = (id: string) => {
    setConfirmDelete({ isOpen: true, id, type: 'fixed' });
  };

  const handleDeletePaymentPlan = (id: string) => {
    setConfirmDelete({ isOpen: true, id, type: 'payment' });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete.id || !confirmDelete.type) return;

    switch (confirmDelete.type) {
      case 'fixed':
        onDeleteFixed(confirmDelete.id);
        break;
      case 'payment':
        onDeletePaymentPlan(confirmDelete.id);
        break;
    }

    setConfirmDelete({ isOpen: false, id: null, type: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, id: null, type: null });
  };

  const getDeleteMessage = () => {
    switch (confirmDelete.type) {
      case 'fixed':
        return {
          title: 'Delete Fixed Expense',
          message: 'Are you sure you want to delete this fixed expense? This action cannot be undone.',
        };
      case 'payment':
        return {
          title: 'Delete Payment Plan',
          message: 'Are you sure you want to delete this payment plan? This action cannot be undone.',
        };
      default:
        return {
          title: 'Delete',
          message: 'Are you sure you want to delete this item?',
        };
    }
  };

  // Render functions
  const renderFixedExpense = (expense: FixedExpense) => (
    <div
      key={expense.id}
      className={clsx(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        expense.isActive
          ? 'bg-background border-border'
          : 'bg-surface border-border opacity-60'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleFixedActive(expense.id, !expense.isActive)}
            className={clsx(
              'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
              expense.isActive
                ? 'border-success bg-success'
                : 'border-border bg-background'
            )}
            aria-label={expense.isActive ? 'Mark as inactive' : 'Mark as active'}
            aria-checked={expense.isActive}
            role="checkbox"
          >
            {expense.isActive && <CheckIcon className="h-4 w-4 text-white" />}
          </button>
          <div>
            <div className={clsx('font-medium', expense.isActive ? 'text-text' : 'text-textSecondary line-through')}>
              {expense.name}
            </div>
            <div className="text-sm text-textSecondary">Due: Day {expense.dueDate}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-text">
          {formatCurrency(expense.amount)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onEditFixed(expense)}
            className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Edit fixed expense"
          >
            <PencilIcon className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => handleDeleteFixed(expense.id)}
            className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Delete fixed expense"
          >
            <TrashIcon className="h-5 w-5 text-danger" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentPlan = (plan: PaymentPlan) => {
    const { remainingAmount } = getRemainingForPlan(plan);
    const paidThisMonth = paymentStatsByPlanId[plan.id]?.paidThisMonth ?? false;
    const isDimmed = plan.isComplete || paidThisMonth;

    return (
      <div
        key={plan.id}
        className={clsx(
          'flex items-center justify-between p-3 rounded-lg border transition-colors',
          isDimmed ? 'bg-surface border-border opacity-60' : 'bg-background border-border'
        )}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTogglePaymentPaid(plan, currentMonth, !paidThisMonth)}
              className={clsx(
                'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
                paidThisMonth ? 'border-success bg-success' : 'border-border bg-background'
              )}
              aria-label={paidThisMonth ? 'Mark as unpaid' : 'Mark as paid'}
              aria-checked={paidThisMonth}
              role="checkbox"
            >
              {paidThisMonth && <CheckIcon className="h-4 w-4 text-white" />}
            </button>
            <div>
              <div
                className={clsx(
                  'font-medium',
                  isDimmed ? 'text-textSecondary line-through' : 'text-text'
                )}
              >
                {plan.name}
              </div>
              <div className="text-sm text-textSecondary">
                {plan.provider}
                {typeof plan.dueDay === 'number' ? ` • Due: Day ${plan.dueDay}` : ''}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            {plan.minimumMonthlyPayment && (
              <div className="text-sm text-textSecondary">
                Min: {formatCurrency(plan.minimumMonthlyPayment)}/mo
              </div>
            )}
            {!plan.isComplete && (
              <div className="text-lg font-semibold text-warning">
                {formatCurrency(remainingAmount)} left
              </div>
            )}
            {plan.isComplete && (
              <div className="text-sm text-success font-medium">Paid off</div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEditPaymentPlan(plan)}
              className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Edit payment plan"
            >
              <PencilIcon className="h-5 w-5 text-primary" />
            </button>
            <button
              onClick={() => handleDeletePaymentPlan(plan.id)}
              className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Delete payment plan"
            >
              <TrashIcon className="h-5 w-5 text-danger" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Monthly Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-textSecondary">Fixed Expenses:</span>
            <span className="font-semibold text-text">{formatCurrency(totals.fixedTotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-textSecondary">Payment Plans (Minimum Due):</span>
            <span className="font-semibold text-text">{formatCurrency(totals.paymentPlansMinimumDue)}</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="font-semibold text-text">Total Due This Month:</span>
            <span className="text-2xl font-bold text-danger">{formatCurrency(totals.grandTotal)}</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between items-center">
            <span className="text-sm text-textSecondary">Payment Plan Amount Remaining:</span>
            <span className="text-sm font-semibold text-warning">{formatCurrency(totals.paymentPlansTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Fixed Expenses */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Fixed Monthly Expenses</h3>
        {sortedFixedExpenses.length === 0 ? (
          <p className="text-textSecondary text-center py-4">No fixed expenses added yet</p>
        ) : (
          <div className="space-y-2">
            {sortedFixedExpenses.map((expense) => renderFixedExpense(expense))}
          </div>
        )}
      </Card>

      {/* Payment Plans */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Payment Plans</h3>
        {sortedPaymentPlans.length === 0 ? (
          <p className="text-textSecondary text-center py-4">No payment plans added yet</p>
        ) : (
          <div className="space-y-2">
            {sortedPaymentPlans.map((plan) => renderPaymentPlan(plan))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title={getDeleteMessage().title}
        message={getDeleteMessage().message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
