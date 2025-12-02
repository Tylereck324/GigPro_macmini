'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Select, Card } from '../ui';
import { TimeCalculator } from './TimeCalculator';
import { GIG_PLATFORMS } from '@/lib/constants/gigPlatforms';
import type { CreateIncomeEntry, IncomeEntry } from '@/types/income';
import type { TimeData } from '@/lib/utils/timeCalculations';
import type { GigPlatform } from '@/types/common';

interface IncomeEntryProps {
  date: string; // YYYY-MM-DD
  initialData?: IncomeEntry;
  onSave: (data: CreateIncomeEntry) => Promise<void>;
  onCancel: () => void;
}

export function IncomeEntryForm({ date, initialData, onSave, onCancel }: IncomeEntryProps) {
  const [platform, setPlatform] = useState<GigPlatform>(initialData?.platform ?? 'AmazonFlex');
  const [customPlatformName, setCustomPlatformName] = useState(initialData?.customPlatformName ?? '');
  const [timeData, setTimeData] = useState<TimeData>({
    blockStartTime: initialData?.blockStartTime ?? null,
    blockEndTime: initialData?.blockEndTime ?? null,
    blockLength: initialData?.blockLength ?? null,
  });
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (platform === 'Other' && !customPlatformName.trim()) {
      toast.error('Please enter a custom platform name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        date,
        platform,
        customPlatformName: platform === 'Other' ? customPlatformName.trim() : undefined,
        blockStartTime: timeData.blockStartTime,
        blockEndTime: timeData.blockEndTime,
        blockLength: timeData.blockLength,
        amount: parseFloat(amount),
        notes,
      });

      // Reset form if this is a new entry
      if (!initialData) {
        setPlatform('AmazonFlex');
        setCustomPlatformName('');
        setTimeData({ blockStartTime: null, blockEndTime: null, blockLength: null });
        setAmount('');
        setNotes('');
      }
    } catch (error) {
      console.error('Failed to save income entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save income entry';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-semibold text-text">
          {initialData ? 'Edit Income Entry' : 'Add Income Entry'}
        </h3>

        {/* Platform Selector */}
        <Select
          label="Gig Platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as GigPlatform)}
          options={GIG_PLATFORMS}
          required
          fullWidth
        />

        {/* Custom Platform Name - shown when "Other" is selected */}
        {platform === 'Other' && (
          <Input
            type="text"
            label="Platform Name"
            value={customPlatformName}
            onChange={(e) => setCustomPlatformName(e.target.value)}
            placeholder="Enter platform name (e.g., Uber Eats, Instacart)"
            required
            fullWidth
          />
        )}

        {/* Time Calculator */}
        <TimeCalculator date={date} value={timeData} onChange={setTimeData} />

        {/* Amount */}
        <Input
          type="number"
          label="Amount Earned"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="150.00"
          min="0.01"
          step="0.01"
          required
          fullWidth
        />

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-text block mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this block..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-textSecondary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Saving...' : initialData ? 'Update Entry' : 'Add Entry'}
          </Button>
          {initialData && (
            <Button type="button" variant="outline" onClick={onCancel} fullWidth>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
