'use client';

import { Card, Button } from '@/components/ui';
import { GoalProgressBar } from './GoalProgressBar';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { Goal, GoalProgress } from '@/types/goal';

interface GoalProgressCardProps {
  progress: GoalProgress;
  periodLabel: string;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

export function GoalProgressCard({
  progress,
  periodLabel,
  onEdit,
  onDelete,
  onToggleActive,
}: GoalProgressCardProps) {
  const { goal, currentAmount, remainingAmount, isComplete } = progress;

  return (
    <Card className="p-4 bg-primary/10 border border-primary/20">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-sm text-textSecondary">{periodLabel}</div>
          <div className="text-lg font-semibold text-text mt-1">{goal.name}</div>
          {goal.period === 'monthly' && (
            <div className="text-xs text-textSecondary mt-1">
              Priority: {goal.priority}
            </div>
          )}
        </div>
        {onEdit && onDelete && onToggleActive && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onEdit(goal)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant={goal.isActive ? 'ghost' : 'success'}
              onClick={() => onToggleActive(goal.id, !goal.isActive)}
            >
              {goal.isActive ? 'Pause' : 'Resume'}
            </Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(goal.id)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-text">
          {formatCurrency(currentAmount)}
        </span>
        <span className="text-sm text-textSecondary">
          / {formatCurrency(goal.targetAmount)}
        </span>
      </div>

      {isComplete ? (
        <div className="text-sm font-medium text-success mb-3">
          Goal completed!
        </div>
      ) : (
        <div className="text-sm text-textSecondary mb-3">
          {formatCurrency(remainingAmount)} remaining
        </div>
      )}

      <GoalProgressBar current={currentAmount} target={goal.targetAmount} />
    </Card>
  );
}
