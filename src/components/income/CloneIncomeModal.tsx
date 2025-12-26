'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, startOfMonth, subDays } from 'date-fns';
import type { IncomeEntry } from '@/types/income';
import { Button, Input } from '@/components/ui';
import { findMostRecentSourceDate } from '@/lib/utils/incomeClone';
import { formatCurrency } from '@/lib/utils/profitCalculations';

interface CloneIncomeModalProps {
  isOpen: boolean;
  targetDate: string;
  monthEntries: IncomeEntry[];
  onCancel: () => void;
  onConfirm: (payload: { sourceDate: string; selected: IncomeEntry[] }) => void;
}

export function CloneIncomeModal({
  isOpen,
  targetDate,
  monthEntries,
  onCancel,
  onConfirm,
}: CloneIncomeModalProps) {
  const defaultSourceDate = useMemo(
    () => findMostRecentSourceDate(monthEntries, targetDate),
    [monthEntries, targetDate]
  );

  const [sourceDate, setSourceDate] = useState(defaultSourceDate ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setSourceDate(defaultSourceDate ?? '');
  }, [defaultSourceDate, isOpen]);

  const sourceEntries = useMemo(
    () => monthEntries.filter((entry) => entry.date === sourceDate),
    [monthEntries, sourceDate]
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(new Set(sourceEntries.map((entry) => entry.id)));
  }, [isOpen, sourceEntries]);

  const selectedEntries = sourceEntries.filter((entry) => selectedIds.has(entry.id));
  const total = selectedEntries.reduce((sum, entry) => sum + entry.amount, 0);

  if (!isOpen) return null;

  const minDate = format(startOfMonth(parseISO(targetDate)), 'yyyy-MM-dd');
  const maxDate = format(subDays(parseISO(targetDate), 1), 'yyyy-MM-dd');

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="presentation">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clone-income-modal-title"
        className="relative z-10 w-full max-w-xl mx-4 bg-surface rounded-2xl shadow-2xl border-2 border-border p-6 animate-scale-in"
      >
        <h2 id="clone-income-modal-title" className="text-xl font-bold text-text mb-4">
          Clone income entries
        </h2>

        <Input
          type="date"
          label="Source date"
          value={sourceDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => setSourceDate(e.target.value)}
          fullWidth
        />

        <div className="mt-4 text-sm text-textSecondary">
          <span className="font-semibold text-text">Selected: {selectedEntries.length}</span>
          <span className="ml-3">Total: {formatCurrency(total)}</span>
        </div>

        <div className="mt-4 space-y-2 max-h-64 overflow-auto border border-border rounded-xl p-3">
          {sourceEntries.length === 0 ? (
            <p className="text-sm text-textSecondary">No entries for this date.</p>
          ) : (
            sourceEntries.map((entry) => (
              <label key={entry.id} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => handleToggle(entry.id)}
                />
                <span>{entry.platform}</span>
                <span className="ml-auto">{formatCurrency(entry.amount)}</span>
              </label>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm({ sourceDate, selected: selectedEntries })}
            disabled={selectedEntries.length === 0 || !sourceDate}
          >
            Clone {selectedEntries.length} entries
          </Button>
        </div>
      </div>
    </div>
  );
}
