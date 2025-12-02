'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getMonthYearLabel } from '@/lib/utils/dateHelpers';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-text">
        {getMonthYearLabel(currentDate)}
      </h2>
      <div className="flex gap-2">
        <button
          onClick={onPreviousMonth}
          className="p-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5 text-text" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5 text-text" />
        </button>
      </div>
    </div>
  );
}
