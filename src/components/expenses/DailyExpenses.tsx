'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, Input, Button } from '../ui';
import type { DailyData } from '@/types/dailyData';

interface DailyExpensesProps {
  date: string;
  initialData?: DailyData;
  onSave: (data: { mileage: number | null; gasExpense: number | null }) => Promise<void>;
}

export function DailyExpenses({ date, initialData, onSave }: DailyExpensesProps) {
  const [mileage, setMileage] = useState(initialData?.mileage?.toString() ?? '');
  const [gasExpense, setGasExpense] = useState(initialData?.gasExpense?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setMileage(initialData?.mileage?.toString() ?? '');
    setGasExpense(initialData?.gasExpense?.toString() ?? '');
    setHasChanges(false);
  }, [initialData]);

  const handleChange = () => {
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await onSave({
        mileage: mileage ? parseFloat(mileage) : null,
        gasExpense: gasExpense ? parseFloat(gasExpense) : null,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save daily expenses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save daily expenses';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-text">Daily Expenses</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Mileage (miles)"
            value={mileage}
            onChange={(e) => {
              setMileage(e.target.value);
              handleChange();
            }}
            placeholder="100"
            min="0"
            step="0.1"
            fullWidth
          />

          <Input
            type="number"
            label="Gas Expense"
            value={gasExpense}
            onChange={(e) => {
              setGasExpense(e.target.value);
              handleChange();
            }}
            placeholder="30.00"
            min="0"
            step="0.01"
            fullWidth
          />
        </div>

        {hasChanges && (
          <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Saving...' : 'Save Expenses'}
          </Button>
        )}
      </form>
    </Card>
  );
}
