'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Select, Card } from '../ui';
import { getCurrentMonthKey } from '@/lib/utils/dateHelpers';
import type { CreateVariableExpense, VariableExpense } from '@/types/expense';
import type { ExpenseCategory } from '@/types/common';

const EXPENSE_CATEGORIES = [
  { value: 'grocery' as ExpenseCategory, label: 'Groceries' },
  { value: 'utility' as ExpenseCategory, label: 'Utilities' },
  { value: 'other' as ExpenseCategory, label: 'Other' },
];

interface VariableExpenseFormProps {
  initialData?: VariableExpense;
  onSave: (data: CreateVariableExpense) => Promise<void>;
  onCancel?: () => void;
}

export function VariableExpenseForm({ initialData, onSave, onCancel }: VariableExpenseFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category ?? 'other');
  const [month, setMonth] = useState(initialData?.month ?? getCurrentMonthKey());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        amount: parseFloat(amount),
        category,
        month,
        isPaid: false,
        paidDate: null,
      });

      // Always reset form after save
      setName('');
      setAmount('');
      setCategory('other');
    } catch (error) {
      console.error('Failed to save variable expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save variable expense';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-text">
          {initialData ? 'Edit Variable Expense' : 'Add Variable Expense'}
        </h3>
        <p className="text-sm text-textSecondary">
          Variable expenses change month to month (groceries, utilities, one-time purchases)
        </p>

        <Input
          type="text"
          label="Expense Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Groceries, Electric Bill, etc."
          required
          fullWidth
        />

        <Input
          type="number"
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="150.00"
          min="0.01"
          step="0.01"
          required
          fullWidth
        />

        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          options={EXPENSE_CATEGORIES}
          required
          fullWidth
        />

        <Input
          type="month"
          label="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
          fullWidth
        />

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} fullWidth>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
