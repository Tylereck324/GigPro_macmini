'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { FixedExpenseForm } from '@/components/expenses/FixedExpenseForm';
import { PaymentPlanForm } from '@/components/expenses/PaymentPlanForm';
import { MonthlyExpenseList } from '@/components/expenses/MonthlyExpenseList';
import { useExpenseStore } from '@/store';
import { getCurrentMonthKey } from '@/lib/utils/dateHelpers';
import type {
  FixedExpense,
  PaymentPlan,
  PaymentPlanPayment,
  CreateFixedExpense,
  CreatePaymentPlan,
} from '@/types/expense';

type FormType = 'fixed' | 'payment' | null;

export function ExpensesContent() {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey());
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);
  const [editingPaymentPlan, setEditingPaymentPlan] = useState<PaymentPlan | null>(null);
  const [localPaymentPlanPayments, setLocalPaymentPlanPayments] = useState<PaymentPlanPayment[]>([]);
  const [isSyncingLocalPayments, setIsSyncingLocalPayments] = useState(false);

  const {
    fixedExpenses,
    paymentPlans,
    paymentPlanPayments,
    loadFixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    loadPaymentPlans,
    loadPaymentPlanPayments,
    addPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
    addPaymentPlanPayment,
    updatePaymentPlanPayment,
  } = useExpenseStore();

  // Load data on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        await Promise.all([
          loadFixedExpenses(),
          loadPaymentPlans(),
          loadPaymentPlanPayments(),
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load expenses data';
        toast.error(message);
        if (typeof message === 'string' && message.toLowerCase().includes('row-level security')) {
          toast.error(
            'Supabase RLS is blocking access. For single-user mode, run sql/disable-all-rls.sql in Supabase.',
            { duration: 8000 }
          );
        }
      }
    };
    void loadAll();
  }, [loadFixedExpenses, loadPaymentPlans, loadPaymentPlanPayments]);

  // Load local fallback payment flags on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('paymentPlanPaymentsLocal');
      if (stored) {
        const parsed = JSON.parse(stored) as PaymentPlanPayment[];
        setLocalPaymentPlanPayments(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Keep local storage in sync when local payment entries change
  useEffect(() => {
    try {
      window.localStorage.setItem('paymentPlanPaymentsLocal', JSON.stringify(localPaymentPlanPayments));
    } catch {
      // ignore storage errors
    }
  }, [localPaymentPlanPayments]);

  const handleSaveFixed = async (data: CreateFixedExpense) => {
    try {
      if (editingFixed) {
        await updateFixedExpense(editingFixed.id, data);
        toast.success('Fixed expense updated!');
        setEditingFixed(null);
        setActiveForm(null);
      } else {
        await addFixedExpense(data);
        toast.success('Fixed expense added!');
        // Don't close form - allow adding multiple expenses
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSavePaymentPlan = async (data: CreatePaymentPlan) => {
    try {
      if (editingPaymentPlan) {
        await updatePaymentPlan(editingPaymentPlan.id, data);
        toast.success('Payment plan updated!');
        setEditingPaymentPlan(null);
        setActiveForm(null);
      } else {
        await addPaymentPlan(data);
        toast.success('Payment plan added!');
        // Don't close form - allow adding multiple payment plans
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCancelForm = () => {
    setActiveForm(null);
    setEditingFixed(null);
    setEditingPaymentPlan(null);
  };

  const handleEditFixed = (expense: FixedExpense) => {
    setEditingFixed(expense);
    setActiveForm('fixed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditPaymentPlan = (plan: PaymentPlan) => {
    setEditingPaymentPlan(plan);
    setActiveForm('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFixed = async (id: string) => {
    try {
      await deleteFixedExpense(id);
      toast.success('Fixed expense deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete fixed expense';
      toast.error(message);
    }
  };

  const handleDeletePaymentPlan = async (id: string) => {
    try {
      await deletePaymentPlan(id);
      toast.success('Payment plan deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete payment plan';
      toast.error(message);
    }
  };

  const handleToggleFixedActive = async (id: string, isActive: boolean) => {
    try {
      await updateFixedExpense(id, { isActive });
      toast.success(isActive ? 'Expense activated' : 'Expense deactivated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update fixed expense';
      toast.error(message);
    }
  };

  const handleTogglePaymentMonthly = async (plan: PaymentPlan, month: string, isPaid: boolean) => {
    const getDueDateForMonth = (monthKey: string, dueDay?: number) => {
      const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
      if (!match) return `${monthKey}-01`;
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return `${monthKey}-01`;
      }
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const requestedDay = typeof dueDay === 'number' && Number.isFinite(dueDay) ? dueDay : 1;
      const day = Math.min(Math.max(requestedDay, 1), daysInMonth);
      return `${monthKey}-${String(day).padStart(2, '0')}`;
    };

    // Find existing payment record for this month
    const existingRemote = paymentPlanPayments.find(
      (p) => p.paymentPlanId === plan.id && p.month === month
    );
    const existingLocal = localPaymentPlanPayments.find(
      (p) => p.paymentPlanId === plan.id && p.month === month
    );

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const paymentsMade = combinedPaymentPlanPayments.filter(
      (p) => p.paymentPlanId === plan.id && p.isPaid
    ).length;
    const paymentNumber =
      existingRemote?.paymentNumber ??
      existingLocal?.paymentNumber ??
      Math.min(paymentsMade + 1, plan.totalPayments);
    const dueDate = getDueDateForMonth(month, plan.dueDay);
    const payload = {
      paymentPlanId: plan.id,
      paymentNumber,
      dueDate,
      isPaid,
      paidDate: isPaid ? today : null,
      month,
    };

    try {
      if (existingRemote) {
        await updatePaymentPlanPayment(existingRemote.id, payload);
      } else {
        await addPaymentPlanPayment(payload);
      }
      // Clean up any local fallback entry for this plan/month
      setLocalPaymentPlanPayments((prev) =>
        prev.filter((p) => !(p.paymentPlanId === plan.id && p.month === month && p.id.startsWith('local-')))
      );
      toast.success(isPaid ? 'Marked payment as paid for this month' : 'Marked payment as unpaid');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payment';
      if (typeof message === 'string' && message.toLowerCase().includes('row-level security')) {
        toast.error(
          'Supabase blocked saving this payment (RLS). It was saved locally for now. To persist, disable RLS for payment_plan_payments (see sql/disable-rls-payment-plan-payments.sql or sql/disable-all-rls.sql).',
          { duration: 8000 }
        );
      }
      // Fallback to local-only tracking when Supabase RLS blocks writes
      const localEntry: PaymentPlanPayment = {
        id: `local-${plan.id}-${month}`,
        paymentPlanId: plan.id,
        paymentNumber,
        dueDate,
        isPaid,
        paidDate: isPaid ? today : null,
        month,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setLocalPaymentPlanPayments((prev) => {
        const filtered = prev.filter((p) => !(p.paymentPlanId === plan.id && p.month === month));
        return [...filtered, localEntry];
      });
      toast.success(
        isPaid
          ? 'Marked payment as paid for this month (saved locally)'
          : 'Marked payment as unpaid (saved locally)'
      );
      console.warn('Falling back to local payment record due to Supabase error:', message);
    }
  };

  const combinedPaymentPlanPayments = useMemo(() => {
    const map = new Map<string, PaymentPlanPayment>();
    for (const p of localPaymentPlanPayments) {
      const key = `${p.paymentPlanId}-${p.month}`;
      map.set(key, p);
    }
    for (const p of paymentPlanPayments) {
      const key = `${p.paymentPlanId}-${p.month}`;
      // Prefer Supabase records over local fallbacks
      map.set(key, p);
    }
    return Array.from(map.values());
  }, [paymentPlanPayments, localPaymentPlanPayments]);

  const syncLocalPaymentPlanPayments = async () => {
    if (localPaymentPlanPayments.length === 0) return;
    setIsSyncingLocalPayments(true);

    const remainingLocals: PaymentPlanPayment[] = [];
    let syncedCount = 0;

    const remoteByPlanMonth = new Map<string, PaymentPlanPayment>();
    for (const remote of paymentPlanPayments) {
      remoteByPlanMonth.set(`${remote.paymentPlanId}-${remote.month}`, remote);
    }

    for (const localPayment of localPaymentPlanPayments) {
      try {
        const remote = remoteByPlanMonth.get(`${localPayment.paymentPlanId}-${localPayment.month}`);

        const payload = {
          paymentPlanId: localPayment.paymentPlanId,
          paymentNumber: localPayment.paymentNumber,
          dueDate: localPayment.dueDate,
          isPaid: localPayment.isPaid,
          paidDate: localPayment.paidDate,
          month: localPayment.month,
        };

        if (remote) {
          await updatePaymentPlanPayment(remote.id, payload);
        } else {
          await addPaymentPlanPayment(payload);
        }

        syncedCount += 1;
      } catch (error) {
        remainingLocals.push(localPayment);
      }
    }

    setLocalPaymentPlanPayments(remainingLocals);
    setIsSyncingLocalPayments(false);

    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} local payment mark${syncedCount === 1 ? '' : 's'}`);
    }
    if (remainingLocals.length > 0) {
      toast.error(
        `Couldn't sync ${remainingLocals.length} payment mark${remainingLocals.length === 1 ? '' : 's'} (likely RLS).`,
        { duration: 6000 }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Monthly Expenses</h1>
        <p className="text-textSecondary">
          Track your fixed expenses and payment plans
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Back Button - shown when form is active */}
          {activeForm && (
            <Button variant="outline" onClick={handleCancelForm}>
              ← Back to Expenses
            </Button>
          )}

          {/* Action Buttons */}
          {!activeForm && (
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setActiveForm('fixed')}>
                + Add Fixed Expense
              </Button>
              <Button variant="success" onClick={() => setActiveForm('payment')}>
                + Add Payment Plan
              </Button>
            </div>
          )}

          {/* Forms */}
          {activeForm === 'fixed' && (
            <FixedExpenseForm
              key={editingFixed ? editingFixed.id : 'new-fixed'}
              initialData={editingFixed ?? undefined}
              onSave={handleSaveFixed}
              onCancel={handleCancelForm}
            />
          )}

          {activeForm === 'payment' && (
            <PaymentPlanForm
              key={editingPaymentPlan ? editingPaymentPlan.id : 'new-payment'}
              initialData={editingPaymentPlan ?? undefined}
              onSave={handleSavePaymentPlan}
              onCancel={handleCancelForm}
            />
          )}
        </div>

        {/* Right Column - Month Selector */}
        <div>
          <div className="sticky top-8">
            <Input
              type="month"
              label="View Month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              fullWidth
            />

            {localPaymentPlanPayments.length > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-warning/30 bg-warning/10 space-y-2">
                <div className="text-sm font-semibold text-text">
                  Local payment marks: {localPaymentPlanPayments.length}
                </div>
                <div className="text-xs text-textSecondary">
                  These were saved in this browser because Supabase rejected writes (RLS). Disable RLS to persist them.
                </div>
                <Button
                  variant="outline"
                  onClick={() => void syncLocalPaymentPlanPayments()}
                  disabled={isSyncingLocalPayments}
                  fullWidth
                >
                  {isSyncingLocalPayments ? 'Syncing…' : 'Try Sync Now'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="mt-8">
        <MonthlyExpenseList
          fixedExpenses={fixedExpenses}
          paymentPlans={paymentPlans}
          currentMonth={currentMonth}
          paymentPlanPayments={combinedPaymentPlanPayments}
          onEditFixed={handleEditFixed}
          onDeleteFixed={handleDeleteFixed}
          onToggleFixedActive={handleToggleFixedActive}
          onEditPaymentPlan={handleEditPaymentPlan}
          onDeletePaymentPlan={handleDeletePaymentPlan}
          onTogglePaymentPaid={handleTogglePaymentMonthly}
        />
      </div>
    </div>
  );
}
