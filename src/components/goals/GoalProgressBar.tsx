'use client';

import clsx from 'clsx';

interface GoalProgressBarProps {
  current: number;
  target: number;
  className?: string;
  showLabel?: boolean;
}

export function GoalProgressBar({
  current,
  target,
  className,
  showLabel = false,
}: GoalProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  // Color logic: green if ≥75%, blue if ≥50%, orange if ≥25%, red if <25%
  const getColor = () => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-primary';
    if (percentage >= 25) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-textSecondary">Progress</span>
          <span className="text-sm font-medium text-text">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}

      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={clsx('h-full transition-all duration-300', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
