'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { IncomeEntryForm } from '@/components/income/IncomeEntry';
import { IncomeList } from '@/components/income/IncomeList';
import { CloneIncomeModal } from '@/components/income/CloneIncomeModal';
import { AmazonFlexHoursTracker } from '@/components/income/AmazonFlexHoursTracker';
import { DailyExpenses } from '@/components/expenses/DailyExpenses';
import { DailyProfitCard } from '@/components/stats/DailyProfitCard';
import { IncomeSummary } from '@/components/stats/IncomeSummary';
import { useIncomeForDate, useIncomeForMonth, useIncomeActions, useDailyDataStore, useStore } from '@/store';
import { calculateDailyProfit } from '@/lib/utils/profitCalculations';
import { buildClonePayloads, findMostRecentSourceDate } from '@/lib/utils/incomeClone';
import { logError } from '@/lib/utils/logger';
import type { IncomeEntry, CreateIncomeEntry } from '@/types/income';

/**
 * Number of days to load for the rolling week view.
 * Required for AmazonFlexHoursTracker which shows a 7-day rolling window.
 */
const ROLLING_WEEK_DAYS = 7;

interface DayContentProps {
  date: string; // YYYY-MM-DD
}

type CloneMode = 'append' | 'replace';

interface CloneSelection {
  sourceDate: string;
  selected: IncomeEntry[];
}

interface CloneUndoPayload {
  createdIds: string[];
  replacedEntries: IncomeEntry[];
  mode: CloneMode;
}

export function DayContent({ date }: DayContentProps) {
  const router = useRouter();
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isClonePending, setIsClonePending] = useState(false);
  const [cloneSelection, setCloneSelection] = useState<CloneSelection | null>(null);

  // Data subscription - only this date's entries
  const incomeEntries = useIncomeForDate(date);

  // Actions only - no data subscription
  const { loadIncomeEntries, addIncomeEntry, updateIncomeEntry, deleteIncomeEntry } = useIncomeActions();

  // Loading state for this month
  const monthKey = date.slice(0, 7);
  const monthEntries = useIncomeForMonth(monthKey);
  const incomeLoading = useStore((state) => state.incomeLoadingByMonth[monthKey] ?? false);
  const incomeError = useStore((state) => state.incomeError);

  const { dailyData, loadDailyData, updateDailyData } = useDailyDataStore();

  // Load data for rolling week window (required for AmazonFlexHoursTracker)
  useEffect(() => {
    const targetDate = parseISO(date);
    const rangeStart = format(subDays(targetDate, ROLLING_WEEK_DAYS - 1), 'yyyy-MM-dd');
    const rangeEnd = format(targetDate, 'yyyy-MM-dd');

    void loadIncomeEntries({ dateRange: { start: rangeStart, end: rangeEnd } }).catch(() => {});
    void loadDailyData({ dateRange: { start: rangeStart, end: rangeEnd } }).catch(() => {});
  }, [date, loadIncomeEntries, loadDailyData]);

  useEffect(() => {
    if (!isClonePending) return;

    const sourceDate = findMostRecentSourceDate(monthEntries, date);
    if (!sourceDate) {
      setEditingEntry(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const platformSelect = document.querySelector('select');
      if (platformSelect instanceof HTMLSelectElement) {
        platformSelect.focus();
      }
      toast('No prior income entries to clone. Add one above to get started!');
      setIsClonePending(false);
      return;
    }

    setIsCloneModalOpen(true);
    setIsClonePending(false);
  }, [date, isClonePending, monthEntries]);

  // Get daily data for this day
  const dayData = useMemo(() => {
    return dailyData[date];
  }, [date, dailyData]);

  // Calculate profit
  const profit = useMemo(
    () => calculateDailyProfit(date, incomeEntries, dayData, incomeEntries),
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
    try {
      await deleteIncomeEntry(id);
      toast.success('Income entry deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete income entry';
      toast.error(message);
    }
  };

  const toCreateEntry = (entry: IncomeEntry): CreateIncomeEntry => ({
    date: entry.date,
    platform: entry.platform,
    customPlatformName: entry.customPlatformName,
    blockStartTime: entry.blockStartTime,
    blockEndTime: entry.blockEndTime,
    blockLength: entry.blockLength,
    amount: entry.amount,
    notes: entry.notes,
  });

  const handleUndoClone = async (payload: CloneUndoPayload) => {
    try {
      await Promise.all(payload.createdIds.map((id) => deleteIncomeEntry(id)));

      if (payload.mode === 'replace' && payload.replacedEntries.length > 0) {
        for (const entry of payload.replacedEntries) {
          await addIncomeEntry(toCreateEntry(entry));
        }
      }

      toast.success('Clone undone');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to undo clone';
      toast.error(message);
    }
  };

  const showCloneUndoToast = (payload: CloneUndoPayload) => {
    toast.custom(
      (t) => (
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xl">
          <span className="text-sm text-text">Cloned {payload.createdIds.length} entries</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleUndoClone(payload);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </Button>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const performClone = async (mode: CloneMode, selection: CloneSelection) => {
    const originals = mode === 'replace' ? [...incomeEntries] : [];

    try {
      if (mode === 'replace' && originals.length > 0) {
        await Promise.all(originals.map((entry) => deleteIncomeEntry(entry.id)));
      }

      const payloads = buildClonePayloads(selection.selected, selection.sourceDate, date);
      const createdEntries = await Promise.all(payloads.map((payload) => addIncomeEntry(payload)));

      showCloneUndoToast({
        createdIds: createdEntries.map((entry) => entry.id),
        replacedEntries: originals,
        mode,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clone income entries';
      toast.error(message);
    }
  };

  const handleCloneFromLast = async () => {
    const targetDate = parseISO(date);
    const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd');

    try {
      await loadIncomeEntries({ dateRange: { start: monthStart, end: monthEnd } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load income entries';
      toast.error(message);
    } finally {
      setIsClonePending(true);
    }
  };

  const handleCloneConfirm = (payload: CloneSelection) => {
    setIsCloneModalOpen(false);

    if (payload.selected.length === 0) {
      return;
    }

    if (incomeEntries.length > 0) {
      setCloneSelection(payload);
      return;
    }

    void performClone('append', payload);
  };

  const handleCloneAppend = () => {
    if (!cloneSelection) return;
    const selection = cloneSelection;
    setCloneSelection(null);
    void performClone('append', selection);
  };

  const handleCloneReplace = () => {
    if (!cloneSelection) return;
    const selection = cloneSelection;
    setCloneSelection(null);
    void performClone('replace', selection);
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
          <IncomeList
            entries={incomeEntries}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
            onClone={handleCloneFromLast}
          />

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
          {incomeEntries.length > 0 && <IncomeSummary entries={incomeEntries} />}

          {/* Amazon Flex Hours Tracker */}
          {hasAmazonFlexEntries && (
            <AmazonFlexHoursTracker date={date} allIncomeEntries={incomeEntries} />
          )}
        </div>
      </div>

      <CloneIncomeModal
        isOpen={isCloneModalOpen}
        targetDate={date}
        monthEntries={monthEntries}
        onCancel={() => setIsCloneModalOpen(false)}
        onConfirm={handleCloneConfirm}
      />

      {cloneSelection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" role="presentation">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setCloneSelection(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg mx-4 bg-surface rounded-2xl shadow-2xl border-2 border-border p-6 animate-scale-in"
          >
            <h2 className="text-xl font-bold text-text mb-3">Existing income entries</h2>
            <p className="text-base text-textSecondary mb-6">
              This day already has income entries. Append the cloned entries or replace the existing ones?
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="ghost" onClick={() => setCloneSelection(null)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleCloneReplace}>
                Replace
              </Button>
              <Button variant="primary" onClick={handleCloneAppend}>
                Append
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
