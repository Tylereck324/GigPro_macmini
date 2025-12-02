'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '../ui';
import type { CreateFixedExpense, FixedExpense } from '@/types/expense';

interface FixedExpenseFormProps {
  initialData?: FixedExpense;
  onSave: (data: CreateFixedExpense) => Promise<void>;
  onCancel?: () => void;
}

export function FixedExpenseForm({ initialData, onSave, onCancel }: FixedExpenseFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !amount || !dueDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const dueDateNum = parseInt(dueDate, 10);
    if (dueDateNum < 1 || dueDateNum > 31) {
      toast.error('Due date must be between 1 and 31');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        amount: parseFloat(amount),
        dueDate: dueDateNum,
        isActive: true,
      });

      // Always reset form after save
      setName('');
      setAmount('');
      setDueDate('');
    } catch (error) {
      console.error('Failed to save fixed expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save fixed expense';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-text">
          {initialData ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
        </h3>
        <p className="text-sm text-textSecondary">
          Fixed expenses are bills that stay the same every month (rent, insurance, etc.)
        </p>

        <Input
          type="text"
          label="Expense Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rent, Car Insurance, etc."
          required
          fullWidth
        />

        <Input
          type="number"
          label="Monthly Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1200.00"
          min="0.01"
          step="0.01"
          required
          fullWidth
        />

        <Input
          type="number"
          label="Due Date (Day of Month)"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="1-31"
          min="1"
          max="31"
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
