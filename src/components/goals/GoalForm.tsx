'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';
import { getCurrentWeekRange, getCurrentMonthRange } from '@/lib/utils/goalCalculations';
import type { CreateGoal, Goal, GoalPeriod } from '@/types/goal';

interface GoalFormProps {
  initialData?: Goal;
  onSave: (data: CreateGoal) => Promise<void>;
  onCancel?: () => void;
}

export function GoalForm({ initialData, onSave, onCancel }: GoalFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [period, setPeriod] = useState<GoalPeriod>(initialData?.period ?? 'monthly');
  const [targetAmount, setTargetAmount] = useState(
    initialData?.targetAmount?.toString() ?? ''
  );
  const [priority, setPriority] = useState(initialData?.priority?.toString() ?? '1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a goal name');
      return;
    }

    if (!targetAmount) {
      toast.error('Please enter a target amount');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (amount <= 0) {
      toast.error('Target amount must be greater than 0');
      return;
    }

    const priorityNum = parseInt(priority);
    if (priorityNum < 1) {
      toast.error('Priority must be at least 1');
      return;
    }

    // Calculate date range based on period
    // When editing, preserve existing dates. When creating new, use current period dates.
    const range =
      initialData
        ? { startDate: initialData.startDate, endDate: initialData.endDate }
        : period === 'weekly'
        ? getCurrentWeekRange()
        : getCurrentMonthRange();

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        period,
        targetAmount: amount,
        priority: priorityNum,
        startDate: range.startDate,
        endDate: range.endDate,
        isActive: initialData?.isActive ?? true,
      });

      // Reset form only if adding new goal (not editing)
      if (!initialData) {
        setName('');
        setTargetAmount('');
        setPriority('1');
        setPeriod('monthly');
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save goal';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-text">
          {initialData ? 'Edit Goal' : 'Add New Goal'}
        </h3>
        <p className="text-sm text-textSecondary">
          Set income goals to track your progress weekly or monthly
        </p>

        <Input
          type="text"
          label="Goal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Emergency Fund, Vacation, Savings"
          required
          fullWidth
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text">
            Goal Period
            <span className="text-danger ml-1">*</span>
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-surface text-text focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:ring-offset-2 transition-all duration-200 ease-out shadow-sm hover:shadow-md appearance-none cursor-pointer pr-10"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <Input
          type="number"
          label="Target Amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="1000.00"
          min="0.01"
          step="0.01"
          required
          fullWidth
        />

        {period === 'monthly' && (
          <Input
            type="number"
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="1"
            min="1"
            step="1"
            required
            fullWidth
          />
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            fullWidth
            isLoading={isSubmitting}
          >
            {initialData ? 'Update Goal' : 'Add Goal'}
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
