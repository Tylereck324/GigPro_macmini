'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { IncomeEntryForm } from '@/components/income/IncomeEntry';
import { IncomeList } from '@/components/income/IncomeList';
import { AmazonFlexHoursTracker } from '@/components/income/AmazonFlexHoursTracker';
import { DailyExpenses } from '@/components/expenses/DailyExpenses';
import { DailyProfitCard } from '@/components/stats/DailyProfitCard';
import { IncomeSummary } from '@/components/stats/IncomeSummary';
import { useIncomeStore, useDailyDataStore } from '@/store';
import { calculateDailyProfit } from '@/lib/utils/profitCalculations';
import { logError } from '@/lib/utils/logger';
import type { IncomeEntry, CreateIncomeEntry } from '@/types/income';

interface DayContentProps {
  date: string; // YYYY-MM-DD
}

export function DayContent({ date }: DayContentProps) {
  const router = useRouter();
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);

  const {
    incomeEntries,
    loadIncomeEntries,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    getIncomeByDate,
  } = useIncomeStore();

  const { dailyData, loadDailyData, updateDailyData, getDailyData } = useDailyDataStore();

  // Load data on mount
  useEffect(() => {
    loadIncomeEntries();
    loadDailyData();
  }, [loadIncomeEntries, loadDailyData]);

  // Get entries for this day
  const dayEntries = useMemo(() => {
    return incomeEntries.filter(entry => entry.date === date);
  }, [date, incomeEntries]);

  // Get daily data for this day
  const dayData = useMemo(() => {
    return dailyData[date];
  }, [date, dailyData]);

  // Calculate profit
  const profit = useMemo(
    () => calculateDailyProfit(date, incomeEntries, dayData),
    [date, incomeEntries, dayData]
  );

  // Check if there are Amazon Flex entries (to show hours tracker)
  const hasAmazonFlexEntries = useMemo(
    () => incomeEntries.some((e) => e.platform === 'AmazonFlex'),
    [incomeEntries]
  );

  const handleSaveIncome = async (data: CreateIncomeEntry) => {
    try {
      if (editingEntry) {
        await updateIncomeEntry(editingEntry.id, data);
        toast.success('Income entry updated!');
        setEditingEntry(null);
      } else {
        await addIncomeEntry(data);
        toast.success('Income entry added!');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleEditIncome = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleDeleteIncome = async (id: string) => {
    await deleteIncomeEntry(id);
    toast.success('Income entry deleted');
  };

  const handleSaveExpenses = async (data: { mileage: number | null; gasExpense: number | null }) => {
    await updateDailyData(date, data);
    toast.success('Daily expenses saved!');
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handlePreviousDay = () => {
    try {
      const currentDate = parseISO(date);
      const previousDate = subDays(currentDate, 1);
      const formattedDate = format(previousDate, 'yyyy-MM-dd');
      router.push(`/day/${formattedDate}`);
    } catch (error) {
      logError('Error navigating to previous day', error, { component: 'DayContent', action: 'handlePreviousDay' });
    }
  };

  const handleNextDay = () => {
    try {
      const currentDate = parseISO(date);
      const nextDate = addDays(currentDate, 1);
      const formattedDate = format(nextDate, 'yyyy-MM-dd');
      router.push(`/day/${formattedDate}`);
    } catch (error) {
      logError('Error navigating to next day', error, { component: 'DayContent', action: 'handleNextDay' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-2" />
          Back to Calendar
        </Button>

        {/* Date Header with Navigation Arrows */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousDay}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            Previous Day
          </Button>

          <h1 className="text-2xl md:text-3xl font-bold text-text text-center">
            {formatDate(date)}
          </h1>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="flex items-center"
          >
            Next Day
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Income Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <IncomeEntryForm
            date={date}
            initialData={editingEntry ?? undefined}
            onSave={handleSaveIncome}
            onCancel={handleCancelEdit}
          />

          {/* Income List */}
          {dayEntries.length > 0 && (
            <IncomeList
              entries={dayEntries}
              onEdit={handleEditIncome}
              onDelete={handleDeleteIncome}
            />
          )}

          {/* Daily Expenses */}
          <DailyExpenses
            date={date}
            initialData={dayData}
            onSave={handleSaveExpenses}
          />
        </div>

        {/* Right Column - Stats & Summary */}
        <div className="space-y-6">
          {/* Daily Profit Card */}
          <DailyProfitCard profit={profit} />

          {/* Income Summary */}
          {dayEntries.length > 0 && <IncomeSummary entries={dayEntries} />}

          {/* Amazon Flex Hours Tracker */}
          {hasAmazonFlexEntries && (
            <AmazonFlexHoursTracker date={date} allIncomeEntries={incomeEntries} />
          )}
        </div>
      </div>
    </div>
  );
}
