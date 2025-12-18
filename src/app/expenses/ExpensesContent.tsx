'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { FixedExpenseForm } from '@/components/expenses/FixedExpenseForm';
import { VariableExpenseForm } from '@/components/expenses/VariableExpenseForm';
import { PaymentPlanForm } from '@/components/expenses/PaymentPlanForm';
import { MonthlyExpenseList } from '@/components/expenses/MonthlyExpenseList';
import { useExpenseStore } from '@/store';
import { getCurrentMonthKey } from '@/lib/utils/dateHelpers';
import type { FixedExpense, VariableExpense, PaymentPlan, CreateFixedExpense, CreateVariableExpense, CreatePaymentPlan } from '@/types/expense';

type FormType = 'fixed' | 'variable' | 'payment' | null;

export function ExpensesContent() {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey());
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);
  const [editingVariable, setEditingVariable] = useState<VariableExpense | null>(null);
  const [editingPaymentPlan, setEditingPaymentPlan] = useState<PaymentPlan | null>(null);

  const {
    fixedExpenses,
    variableExpenses,
    paymentPlans,
    loadFixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    loadVariableExpenses,
    addVariableExpense,
    updateVariableExpense,
    deleteVariableExpense,
    loadPaymentPlans,
    addPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
  } = useExpenseStore();

  // Load data on mount
  useEffect(() => {
    loadFixedExpenses();
    loadVariableExpenses();
    loadPaymentPlans();
  }, [loadFixedExpenses, loadVariableExpenses, loadPaymentPlans]);

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
      console.error('Failed to save fixed expense:', error);
      // Error toast already shown by store or form component
    }
  };

  const handleSaveVariable = async (data: CreateVariableExpense) => {
    try {
      if (editingVariable) {
        await updateVariableExpense(editingVariable.id, data);
        toast.success('Variable expense updated!');
        setEditingVariable(null);
        setActiveForm(null);
      } else {
        await addVariableExpense(data);
        toast.success('Variable expense added!');
        // Don't close form - allow adding multiple expenses
      }
    } catch (error) {
      console.error('Failed to save variable expense:', error);
      // Error toast already shown by store or form component
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
      console.error('Failed to save payment plan:', error);
      // Error toast already shown by store or form component
    }
  };

  const handleCancelForm = () => {
    setActiveForm(null);
    setEditingFixed(null);
    setEditingVariable(null);
    setEditingPaymentPlan(null);
  };

  const handleEditFixed = (expense: FixedExpense) => {
    setEditingFixed(expense);
    setActiveForm('fixed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditVariable = (expense: VariableExpense) => {
    setEditingVariable(expense);
    setActiveForm('variable');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditPaymentPlan = (plan: PaymentPlan) => {
    setEditingPaymentPlan(plan);
    setActiveForm('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFixed = async (id: string) => {
    await deleteFixedExpense(id);
    toast.success('Fixed expense deleted');
  };

  const handleDeleteVariable = async (id: string) => {
    await deleteVariableExpense(id);
    toast.success('Variable expense deleted');
  };

  const handleDeletePaymentPlan = async (id: string) => {
    await deletePaymentPlan(id);
    toast.success('Payment plan deleted');
  };

  const handleToggleFixedActive = async (id: string, isActive: boolean) => {
    await updateFixedExpense(id, { isActive });
    toast.success(isActive ? 'Expense activated' : 'Expense deactivated');
  };

  const handleToggleVariablePaid = async (id: string, isPaid: boolean) => {
    await updateVariableExpense(id, {
      isPaid,
      paidDate: isPaid ? new Date().toISOString() : null,
    });
    toast.success(isPaid ? 'Marked as paid' : 'Marked as unpaid');
  };

  const handleTogglePaymentComplete = async (id: string, isComplete: boolean) => {
    await updatePaymentPlan(id, { isComplete });
    toast.success(isComplete ? 'Payment plan completed!' : 'Payment plan reopened');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Monthly Expenses</h1>
        <p className="text-textSecondary">
          Track your fixed expenses, variable costs, and payment plans
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
              <Button variant="secondary" onClick={() => setActiveForm('variable')}>
                + Add Variable Expense
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

          {activeForm === 'variable' && (
            <VariableExpenseForm
              key={editingVariable ? editingVariable.id : 'new-variable'}
              initialData={editingVariable ?? undefined}
              onSave={handleSaveVariable}
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
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="mt-8">
        <MonthlyExpenseList
          fixedExpenses={fixedExpenses}
          variableExpenses={variableExpenses}
          paymentPlans={paymentPlans}
          currentMonth={currentMonth}
          onEditFixed={handleEditFixed}
          onDeleteFixed={handleDeleteFixed}
          onToggleFixedActive={handleToggleFixedActive}
          onEditVariable={handleEditVariable}
          onDeleteVariable={handleDeleteVariable}
          onToggleVariablePaid={handleToggleVariablePaid}
          onEditPaymentPlan={handleEditPaymentPlan}
          onDeletePaymentPlan={handleDeletePaymentPlan}
          onTogglePaymentComplete={handleTogglePaymentComplete}
        />
      </div>
    </div>
  );
}
