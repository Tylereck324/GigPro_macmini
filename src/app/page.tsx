'use client';

import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';
import { MonthlySummary } from '@/components/stats/MonthlySummary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { useStore } from '@/store';

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Centralized data loading with shallow comparison - stable references
  const {
    loadIncomeEntries,
    loadDailyData,
    loadFixedExpenses,
    loadPaymentPlans,
    loadPaymentPlanPayments,
    loadGoals,
  } = useStore(
    useShallow((state) => ({
      loadIncomeEntries: state.loadIncomeEntries,
      loadDailyData: state.loadDailyData,
      loadFixedExpenses: state.loadFixedExpenses,
      loadPaymentPlans: state.loadPaymentPlans,
      loadPaymentPlanPayments: state.loadPaymentPlanPayments,
      loadGoals: state.loadGoals,
    }))
  );

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      await Promise.all([
        loadIncomeEntries(),
        loadDailyData(),
        loadFixedExpenses(),
        loadPaymentPlans(),
        loadPaymentPlanPayments(),
        loadGoals(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    loadIncomeEntries,
    loadDailyData,
    loadFixedExpenses,
    loadPaymentPlans,
    loadPaymentPlanPayments,
    loadGoals,
  ]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Calendar - takes 3 columns */}
        <div className="lg:col-span-3">
          <ErrorBoundary>
            <MonthlyCalendar onDateChange={setCurrentDate} isLoading={isLoading} />
          </ErrorBoundary>
        </div>

        {/* Monthly Summary - takes 1 column */}
        <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <ErrorBoundary>
            <MonthlySummary currentDate={currentDate} isLoading={isLoading} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
