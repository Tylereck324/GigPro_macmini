/**
 * IncomeList Component
 *
 * Displays income entries grouped by platform with edit/delete actions
 * Features:
 * - Platform-based grouping
 * - Color-coded platform badges
 * - Platform-specific labels (e.g., "Amazon Flex" instead of "AmazonFlex")
 * - Custom platform name support
 * - Inline edit and delete actions
 */

'use client';

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, Button, ConfirmDialog } from '../ui';
import { formatDuration } from '@/lib/utils/timeCalculations';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { IncomeEntry } from '@/types/income';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { List } from 'react-window';

// ============================================================================
// Types
// ============================================================================

interface IncomeListProps {
  /** Income entries to display */
  entries: IncomeEntry[];
  /** Callback when edit button is clicked */
  onEdit: (entry: IncomeEntry) => void;
  /** Callback when delete button is clicked */
  onDelete: (id: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get platform-specific color class
 */
function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'AmazonFlex':
      return 'text-amazonFlex';
    case 'DoorDash':
      return 'text-doorDash';
    case 'WalmartSpark':
      return 'text-walmartSpark';
    default:
      return 'text-primary';
  }
}

/**
 * Get display label for platform
 * Converts technical names to user-friendly labels
 */
function getPlatformLabel(entry: IncomeEntry): string {
  if (entry.platform === 'Other' && entry.customPlatformName) {
    return entry.customPlatformName;
  }

  switch (entry.platform) {
    case 'AmazonFlex':
      return 'Amazon Flex';
    case 'DoorDash':
      return 'DoorDash';
    case 'WalmartSpark':
      return 'Walmart Spark';
    case 'Other':
      return 'Other';
    default:
      return entry.platform;
  }
}

/**
 * Format ISO datetime string to readable time
 * @example "2024-01-01T14:30:00" => "2:30 PM"
 */
function formatTime(isoString: string | null): string {
  if (!isoString) return 'N/A';
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return 'N/A';
  }
}

/**
 * Group entries by platform (or custom platform name for "Other")
 */
function groupEntriesByPlatform(entries: IncomeEntry[]): Record<string, IncomeEntry[]> {
  return entries.reduce((acc, entry) => {
    const key = entry.platform === 'Other' && entry.customPlatformName
      ? `Other:${entry.customPlatformName}`
      : entry.platform;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, IncomeEntry[]>);
}

// ============================================================================
// Component
// ============================================================================

export function IncomeList({ entries, onEdit, onDelete }: IncomeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle delete action with confirmation
   */
  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;

    setConfirmDelete({ isOpen: false, id: null });
    setDeletingId(confirmDelete.id);
    try {
      await onDelete(confirmDelete.id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, id: null });
  };

  // ============================================================================
  // Memoized Data - Must be before early return
  // ============================================================================

  const byPlatform = useMemo(() => groupEntriesByPlatform(entries), [entries]);

  // ============================================================================
  // Empty State
  // ============================================================================

  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-textSecondary text-center py-8">
          No income entries for this day. Add one above to get started!
        </p>
      </Card>
    );
  }

  // ============================================================================
  // Render Item Component
  // ============================================================================

  const renderEntry = (entry: IncomeEntry) => (
    <div
      key={entry.id}
      className="p-4 hover:bg-surfaceHover transition-colors border-b border-border last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Entry Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-text">
              {formatCurrency(entry.amount)}
            </span>
            {entry.blockLength && (
              <span className="text-sm text-textSecondary">
                {formatDuration(entry.blockLength)}
              </span>
            )}
          </div>

          {(entry.blockStartTime || entry.blockEndTime) && (
            <div className="text-sm text-textSecondary">
              {formatTime(entry.blockStartTime)} - {formatTime(entry.blockEndTime)}
            </div>
          )}

          {entry.notes && (
            <p className="text-sm text-textSecondary italic">
              {entry.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 rounded-lg hover:bg-surface transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Edit entry"
          >
            <PencilIcon className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => handleDelete(entry.id)}
            disabled={deletingId === entry.id}
            className="p-2 rounded-lg hover:bg-surface transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
            aria-label="Delete entry"
          >
            <TrashIcon className="h-5 w-5 text-danger" />
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text">Income Entries</h3>

      {Object.entries(byPlatform).map(([groupKey, platformEntries]) => {
        const total = platformEntries.reduce((sum, e) => sum + e.amount, 0);
        const firstEntry = platformEntries[0];
        const platform = firstEntry.platform;
        const shouldVirtualize = platformEntries.length > 10;

        return (
          <Card key={groupKey} padding="none">
            {/* Platform Header */}
            <div className="p-4 border-b border-border bg-surface">
              <div className="flex items-center justify-between">
                <h4 className={clsx('text-md font-semibold', getPlatformColor(platform))}>
                  {getPlatformLabel(firstEntry)}
                </h4>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Entry List - Virtualized for >10 items */}
            {shouldVirtualize ? (
              <List
                defaultHeight={Math.min(platformEntries.length * 120, 600)}
                rowCount={platformEntries.length}
                rowHeight={120}
                rowProps={{}}
                rowComponent={({ index, style }) => (
                  <div style={style}>
                    {renderEntry(platformEntries[index])}
                  </div>
                )}
              />
            ) : (
              <div>
                {platformEntries.map((entry) => renderEntry(entry))}
              </div>
            )}
          </Card>
        );
      })}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Income Entry"
        message="Are you sure you want to delete this income entry? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
