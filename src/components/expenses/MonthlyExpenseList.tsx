'use client';

import { useMemo, useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Card, ConfirmDialog } from '../ui';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import clsx from 'clsx';
import type { FixedExpense, VariableExpense, PaymentPlan } from '@/types/expense';
import { List } from 'react-window';

interface MonthlyExpenseListProps {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  paymentPlans: PaymentPlan[];
  currentMonth: string; // YYYY-MM
  onEditFixed: (expense: FixedExpense) => void;
  onDeleteFixed: (id: string) => void;
  onToggleFixedActive: (id: string, isActive: boolean) => void;
  onEditVariable: (expense: VariableExpense) => void;
  onDeleteVariable: (id: string) => void;
  onToggleVariablePaid: (id: string, isPaid: boolean) => void;
  onEditPaymentPlan: (plan: PaymentPlan) => void;
  onDeletePaymentPlan: (id: string) => void;
  onTogglePaymentComplete: (id: string, isComplete: boolean) => void;
}

export function MonthlyExpenseList({
  fixedExpenses,
  variableExpenses,
  paymentPlans,
  currentMonth,
  onEditFixed,
  onDeleteFixed,
  onToggleFixedActive,
  onEditVariable,
  onDeleteVariable,
  onToggleVariablePaid,
  onEditPaymentPlan,
  onDeletePaymentPlan,
  onTogglePaymentComplete,
}: MonthlyExpenseListProps) {
  // Sort fixed expenses by due date
  const sortedFixedExpenses = useMemo(
    () => [...fixedExpenses].sort((a, b) => a.dueDate - b.dueDate),
    [fixedExpenses]
  );

  // Filter variable expenses for current month
  const monthVariableExpenses = useMemo(
    () => variableExpenses.filter((e) => e.month === currentMonth),
    [variableExpenses, currentMonth]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const fixedTotal = fixedExpenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + e.amount, 0);

    const variableTotal = monthVariableExpenses.reduce((sum, e) => sum + e.amount, 0);
    const variablePaid = monthVariableExpenses
      .filter((e) => e.isPaid)
      .reduce((sum, e) => sum + e.amount, 0);
    const variableUnpaid = variableTotal - variablePaid;

    // Calculate payment plan totals
    const activePlans = paymentPlans.filter((p) => !p.isComplete);

    // Sum of minimum monthly payments for monthly obligations
    const paymentPlansMinimumDue = activePlans.reduce((sum, p) => {
      const monthlyAmount = p.minimumMonthlyPayment ?? p.paymentAmount;
      return sum + monthlyAmount;
    }, 0);

    // Total remaining amount across all payment plans
    const paymentPlansTotal = activePlans.reduce((sum, p) => {
      const remaining = p.totalPayments - p.currentPayment + 1;
      return sum + remaining * p.paymentAmount;
    }, 0);

    const grandTotal = fixedTotal + variableUnpaid + paymentPlansMinimumDue;

    return {
      fixedTotal,
      variableTotal,
      variablePaid,
      variableUnpaid,
      paymentPlansMinimumDue,
      paymentPlansTotal,
      grandTotal,
    };
  }, [fixedExpenses, monthVariableExpenses, paymentPlans]);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string | null;
    type: 'fixed' | 'variable' | 'payment' | null;
  }>({
    isOpen: false,
    id: null,
    type: null,
  });

  const handleDeleteFixed = (id: string) => {
    setConfirmDelete({ isOpen: true, id, type: 'fixed' });
  };

  const handleDeleteVariable = (id: string) => {
    setConfirmDelete({ isOpen: true, id, type: 'variable' });
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
      case 'variable':
        onDeleteVariable(confirmDelete.id);
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
      case 'variable':
        return {
          title: 'Delete Variable Expense',
          message: 'Are you sure you want to delete this variable expense? This action cannot be undone.',
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

  // Render functions for virtualization
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

  const renderVariableExpense = (expense: VariableExpense) => (
    <div
      key={expense.id}
      className={clsx(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        expense.isPaid
          ? 'bg-surface border-border opacity-60'
          : 'bg-background border-border'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleVariablePaid(expense.id, !expense.isPaid)}
            className={clsx(
              'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
              expense.isPaid
                ? 'border-success bg-success'
                : 'border-border bg-background'
            )}
            aria-label={expense.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
            aria-checked={expense.isPaid}
            role="checkbox"
          >
            {expense.isPaid && <CheckIcon className="h-4 w-4 text-white" />}
          </button>
          <div>
            <div className={clsx('font-medium', expense.isPaid ? 'text-textSecondary line-through' : 'text-text')}>
              {expense.name}
            </div>
            <div className="text-sm text-textSecondary capitalize">{expense.category}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-text">
          {formatCurrency(expense.amount)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onEditVariable(expense)}
            className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Edit variable expense"
          >
            <PencilIcon className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => handleDeleteVariable(expense.id)}
            className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Delete variable expense"
          >
            <TrashIcon className="h-5 w-5 text-danger" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentPlan = (plan: PaymentPlan) => {
    const remaining = plan.totalPayments - plan.currentPayment + 1;
    const remainingAmount = remaining * plan.paymentAmount;

    return (
      <div
        key={plan.id}
        className={clsx(
          'flex items-center justify-between p-3 rounded-lg border transition-colors',
          plan.isComplete
            ? 'bg-surface border-border opacity-60'
            : 'bg-background border-border'
        )}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTogglePaymentComplete(plan.id, !plan.isComplete)}
              className={clsx(
                'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
                plan.isComplete
                  ? 'border-success bg-success'
                  : 'border-border bg-background'
              )}
              aria-label={plan.isComplete ? 'Mark payment as incomplete' : 'Mark payment as complete'}
              aria-checked={plan.isComplete}
              role="checkbox"
            >
              {plan.isComplete && <CheckIcon className="h-4 w-4 text-white" />}
            </button>
            <div>
              <div className={clsx('font-medium', plan.isComplete ? 'text-textSecondary line-through' : 'text-text')}>
                {plan.name}
              </div>
              <div className="text-sm text-textSecondary">
                {plan.provider} • Payment {plan.currentPayment} of {plan.totalPayments} • {remaining} remaining
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            {plan.minimumMonthlyPayment ? (
              <>
                <div className="text-sm text-textSecondary">
                  Min: {formatCurrency(plan.minimumMonthlyPayment)}/mo
                </div>
                <div className="text-lg font-semibold text-text">
                  {formatCurrency(plan.paymentAmount)}
                </div>
              </>
            ) : (
              <div className="text-lg font-semibold text-text">
                {formatCurrency(plan.paymentAmount)}
              </div>
            )}
            {!plan.isComplete && (
              <div className="text-sm text-warning">
                {formatCurrency(remainingAmount)} left
              </div>
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

  const shouldVirtualizeFixed = sortedFixedExpenses.length > 10;
  const shouldVirtualizeVariable = monthVariableExpenses.length > 10;
  const shouldVirtualizePayments = paymentPlans.length > 10;

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
            <span className="text-textSecondary">Variable (Unpaid):</span>
            <span className="font-semibold text-text">{formatCurrency(totals.variableUnpaid)}</span>
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
        ) : shouldVirtualizeFixed ? (
          <List
            defaultHeight={Math.min(sortedFixedExpenses.length * 90, 600)}
            rowCount={sortedFixedExpenses.length}
            rowHeight={90}
            rowProps={{}}
            rowComponent={({ index, style }) => (
              <div style={style} className="pb-2">
                {renderFixedExpense(sortedFixedExpenses[index])}
              </div>
            )}
          />
        ) : (
          <div className="space-y-2">
            {sortedFixedExpenses.map((expense) => renderFixedExpense(expense))}
          </div>
        )}
      </Card>

      {/* Variable Expenses */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Variable Expenses ({currentMonth})</h3>
        {monthVariableExpenses.length === 0 ? (
          <p className="text-textSecondary text-center py-4">No variable expenses for this month</p>
        ) : shouldVirtualizeVariable ? (
          <List
            defaultHeight={Math.min(monthVariableExpenses.length * 90, 600)}
            rowCount={monthVariableExpenses.length}
            rowHeight={90}
            rowProps={{}}
            rowComponent={({ index, style }) => (
              <div style={style} className="pb-2">
                {renderVariableExpense(monthVariableExpenses[index])}
              </div>
            )}
          />
        ) : (
          <div className="space-y-2">
            {monthVariableExpenses.map((expense) => renderVariableExpense(expense))}
          </div>
        )}
      </Card>

      {/* Payment Plans */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Payment Plans</h3>
        {paymentPlans.length === 0 ? (
          <p className="text-textSecondary text-center py-4">No payment plans added yet</p>
        ) : shouldVirtualizePayments ? (
          <List
            defaultHeight={Math.min(paymentPlans.length * 100, 600)}
            rowCount={paymentPlans.length}
            rowHeight={100}
            rowProps={{}}
            rowComponent={({ index, style }) => (
              <div style={style} className="pb-2">
                {renderPaymentPlan(paymentPlans[index])}
              </div>
            )}
          />
        ) : (
          <div className="space-y-2">
            {paymentPlans.map((plan) => renderPaymentPlan(plan))}
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
