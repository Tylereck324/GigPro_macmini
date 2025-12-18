'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getMonthYearLabel } from '@/lib/utils/dateHelpers';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth }: CalendarHeaderProps) {
  const monthYear = getMonthYearLabel(currentDate);

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-text" aria-live="polite" aria-atomic="true">
        {monthYear}
      </h2>
      <nav className="flex gap-2" aria-label="Calendar navigation">
        <button
          onClick={onPreviousMonth}
          className="p-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors"
          aria-label={`Go to previous month`}
          type="button"
        >
          <ChevronLeftIcon className="h-5 w-5 text-text" aria-hidden="true" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors"
          aria-label={`Go to next month`}
          type="button"
        >
          <ChevronRightIcon className="h-5 w-5 text-text" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
