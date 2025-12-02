'use client';

import { useState } from 'react';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';
import { MonthlySummary } from '@/components/stats/MonthlySummary';

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Calendar - takes 3 columns */}
        <div className="lg:col-span-3 animate-slide-in">
          <MonthlyCalendar onDateChange={setCurrentDate} />
        </div>

        {/* Monthly Summary - takes 1 column */}
        <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <MonthlySummary currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
}
