'use client';

import { Card, Button, ConfirmDialog } from '@/components/ui';
import { GoalProgressBar } from './GoalProgressBar';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import type { Goal } from '@/types/goal';
import type { GoalProgress } from '@/types/goal';

interface GoalListProps {
  goals: GoalProgress[];
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function GoalList({
  goals,
  onEdit,
  onDelete,
  onToggleActive,
}: GoalListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (goals.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-textSecondary">
          No goals yet. Add your first goal to start tracking!
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {goals.map(({ goal, currentAmount, isComplete }) => (
          <Card key={goal.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-text">
                    {goal.name}
                  </h3>
                  {isComplete && (
                    <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                      Complete
                    </span>
                  )}
                  {!goal.isActive && (
                    <span className="text-xs bg-textSecondary/20 text-textSecondary px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-textSecondary">
                  <span className="capitalize">{goal.period}</span> •{' '}
                  {format(parseISO(goal.startDate), 'MMM d')} -{' '}
                  {format(parseISO(goal.endDate), 'MMM d, yyyy')}
                  {goal.period === 'monthly' && (
                    <span> • Priority {goal.priority}</span>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(goal)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant={goal.isActive ? 'ghost' : 'success'}
                  onClick={() => onToggleActive(goal.id, !goal.isActive)}
                >
                  {goal.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteId(goal.id)}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-text">
                  {formatCurrency(currentAmount)}
                </span>
                <span className="text-sm text-textSecondary">
                  / {formatCurrency(goal.targetAmount)}
                </span>
              </div>
            </div>

            <GoalProgressBar
              current={currentAmount}
              target={goal.targetAmount}
              showLabel
            />
          </Card>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
