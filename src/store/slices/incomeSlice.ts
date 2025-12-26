import { StateCreator } from 'zustand';
import type { IncomeEntry, CreateIncomeEntry, UpdateIncomeEntry } from '@/types/income';
import { incomeApi, type GetIncomeEntriesOptions } from '@/lib/api/income'; // Import the new API helper
import { createIncomeEntrySchema, updateIncomeEntrySchema } from '@/types/validation';
import { calculateAmazonFlexHours } from '@/lib/utils/amazonFlexHours';
import {
  AMAZON_FLEX_DAILY_LIMIT_HOURS,
  AMAZON_FLEX_WEEKLY_LIMIT_HOURS,
  DEFAULT_TIME_ZONE,
} from '@/lib/constants/amazonFlex';

/**
 * Extract month key (YYYY-MM) from a date string (YYYY-MM-DD)
 */
function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * Group income entries by month key
 */
function groupEntriesByMonth(entries: IncomeEntry[]): Record<string, IncomeEntry[]> {
  const result: Record<string, IncomeEntry[]> = {};
  for (const entry of entries) {
    const monthKey = getMonthKey(entry.date);
    if (!result[monthKey]) {
      result[monthKey] = [];
    }
    result[monthKey].push(entry);
  }
  return result;
}

/**
 * Helper to update incomeByMonth when an entry changes
 */
const updateByMonthForEntry = (
  state: { incomeByMonth: Record<string, IncomeEntry[]> },
  oldEntry: IncomeEntry | undefined,
  newEntry: IncomeEntry
): Record<string, IncomeEntry[]> => {
  const result = { ...state.incomeByMonth };
  const oldMonthKey = oldEntry ? getMonthKey(oldEntry.date) : null;
  const newMonthKey = getMonthKey(newEntry.date);

  // Remove from old month if it changed
  if (oldMonthKey && oldMonthKey !== newMonthKey) {
    result[oldMonthKey] = (result[oldMonthKey] || []).filter((e) => e.id !== newEntry.id);
  }

  // Update in new month
  const monthEntries = result[newMonthKey] || [];
  const existingIndex = monthEntries.findIndex((e) => e.id === newEntry.id);
  if (existingIndex >= 0) {
    result[newMonthKey] = [
      ...monthEntries.slice(0, existingIndex),
      newEntry,
      ...monthEntries.slice(existingIndex + 1),
    ];
  } else {
    result[newMonthKey] = [...monthEntries, newEntry];
  }

  return result;
};

/**
 * Cross-slice dependency: IncomeSlice needs Amazon Flex capacity settings from ThemeSlice.
 * This interface defines the expected shape for runtime access.
 */
interface AmazonFlexSettings {
  amazonFlexDailyCapacity?: number;
  amazonFlexWeeklyCapacity?: number;
}

export interface IncomeSlice {
  // Existing flat array (kept for backwards compatibility during migration)
  incomeEntries: IncomeEntry[];

  // NEW: Partitioned by month key "YYYY-MM"
  incomeByMonth: Record<string, IncomeEntry[]>;

  // NEW: Per-month loading states
  incomeLoadingByMonth: Record<string, boolean>;

  // Existing (kept for backwards compatibility)
  incomeLoading: boolean;
  incomeError: string | null;

  // Actions (unchanged signatures)
  loadIncomeEntries: (options?: GetIncomeEntriesOptions) => Promise<void>;
  addIncomeEntry: (entry: CreateIncomeEntry) => Promise<IncomeEntry>;
  updateIncomeEntry: (id: string, updates: UpdateIncomeEntry) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;
  getIncomeByDate: (date: string) => IncomeEntry[];
}

/**
 * Validate Amazon Flex hours limits
 * Throws an error if adding this entry would exceed daily or weekly limits
 *
 * @param entry - The income entry to validate
 * @param allEntries - All income entries including the one being added/updated
 * @param dailyCapacity - Daily capacity in minutes
 * @param weeklyCapacity - Weekly capacity in minutes
 */
function validateAmazonFlexLimits(
  entry: CreateIncomeEntry | UpdateIncomeEntry,
  allEntries: IncomeEntry[],
  dailyCapacity: number,
  weeklyCapacity: number
): void {
  // Only validate Amazon Flex entries with block length
  if (entry.platform !== 'AmazonFlex' || !entry.blockLength || !entry.date) {
    return;
  }

  // Calculate hours with correct parameter order:
  // (allIncomeEntries, targetDateKey, dailyLimitHours, weeklyLimitHours, timeZone)
  const dailyLimitHours = dailyCapacity / 60;
  const weeklyLimitHours = weeklyCapacity / 60;

  const hoursData = calculateAmazonFlexHours(
    allEntries,
    entry.date,
    dailyLimitHours,
    weeklyLimitHours,
    DEFAULT_TIME_ZONE
  );

  // Check daily limit
  if (hoursData.dailyHoursUsed > dailyLimitHours) {
    throw new Error(
      `This entry would exceed the daily limit of ${dailyLimitHours}h. ` +
        `Total hours for ${entry.date}: ${hoursData.dailyHoursUsed.toFixed(1)}h`
    );
  }

  // Check weekly limit (rolling 7 days)
  if (hoursData.weeklyHoursUsed > weeklyLimitHours) {
    throw new Error(
      `This entry would exceed the rolling 7-day limit of ${weeklyLimitHours}h. ` +
        `Total hours for 7-day window: ${hoursData.weeklyHoursUsed.toFixed(1)}h`
    );
  }
}

export const createIncomeSlice: StateCreator<IncomeSlice> = (set, get) => ({
  incomeEntries: [],
  incomeByMonth: {},           // NEW
  incomeLoadingByMonth: {},    // NEW
  incomeLoading: false,
  incomeError: null,

  loadIncomeEntries: async (options?: GetIncomeEntriesOptions) => {
    // Determine which month we're loading (if date range specified)
    const monthKey = options?.dateRange?.start
      ? getMonthKey(options.dateRange.start)
      : null;

    // Set loading state
    if (monthKey) {
      set((state) => ({
        incomeLoadingByMonth: { ...state.incomeLoadingByMonth, [monthKey]: true },
      }));
    }
    set({ incomeLoading: true, incomeError: null });

    try {
      const newEntries = await incomeApi.getIncomeEntries(options);

      // Group new entries by month
      const newEntriesByMonth = groupEntriesByMonth(newEntries);

      set((state) => {
        // Merge with existing entries (flat array - backwards compat)
        const existingIds = new Set(newEntries.map((e) => e.id));
        const existingToKeep = state.incomeEntries.filter((e) => !existingIds.has(e.id));

        // Merge incomeByMonth - replace months that were loaded
        const updatedByMonth = { ...state.incomeByMonth };
        for (const [month, entries] of Object.entries(newEntriesByMonth)) {
          // If loading a specific month, replace it entirely
          // If loading all, merge by replacing existing entries
          if (monthKey && month === monthKey) {
            updatedByMonth[month] = entries;
          } else {
            // Merge: keep entries not in new batch, add new entries
            const existingMonthEntries = state.incomeByMonth[month] || [];
            const filteredExisting = existingMonthEntries.filter(
              (e) => !existingIds.has(e.id)
            );
            updatedByMonth[month] = [...filteredExisting, ...entries];
          }
        }

        return {
          incomeEntries: [...existingToKeep, ...newEntries],
          incomeByMonth: updatedByMonth,
          incomeLoading: false,
          incomeLoadingByMonth: monthKey
            ? { ...state.incomeLoadingByMonth, [monthKey]: false }
            : state.incomeLoadingByMonth,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load income entries';
      console.error('Failed to load income entries:', error);
      set((state) => ({
        incomeLoading: false,
        incomeError: errorMessage,
        incomeLoadingByMonth: monthKey
          ? { ...state.incomeLoadingByMonth, [monthKey]: false }
          : state.incomeLoadingByMonth,
      }));
      throw error;
    }
  },

  addIncomeEntry: async (entry: CreateIncomeEntry) => {
    set({ incomeError: null });
    try {
      // Validate input - client-side validation before API call
      const validatedEntry = createIncomeEntrySchema.parse(entry);

      // Get settings from combined store (themeSlice has Amazon Flex capacity settings)
      const store = get() as unknown as AmazonFlexSettings;
      const dailyCapacity =
        typeof store.amazonFlexDailyCapacity === 'number'
          ? store.amazonFlexDailyCapacity
          : AMAZON_FLEX_DAILY_LIMIT_HOURS * 60;
      const weeklyCapacity =
        typeof store.amazonFlexWeeklyCapacity === 'number'
          ? store.amazonFlexWeeklyCapacity
          : AMAZON_FLEX_WEEKLY_LIMIT_HOURS * 60;

      // Simulate the entry being added to validate limits
      const tempEntry: IncomeEntry = {
        ...validatedEntry,
        id: 'temp-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const entriesWithNew = [...get().incomeEntries, tempEntry];

      // Validate Amazon Flex hours limits
      validateAmazonFlexLimits(validatedEntry, entriesWithNew, dailyCapacity, weeklyCapacity);

      // Perform actual creation via API
      const newEntry = await incomeApi.createIncomeEntry(validatedEntry); // Use API helper

      // Update state with new entry
      set((state) => {
        const monthKey = getMonthKey(newEntry.date);
        const existingMonthEntries = state.incomeByMonth[monthKey] || [];

        return {
          incomeEntries: [...state.incomeEntries, newEntry],
          incomeByMonth: {
            ...state.incomeByMonth,
            [monthKey]: [...existingMonthEntries, newEntry],
          },
        };
      });

      return newEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add income entry';
      set({ incomeError: errorMessage });
      throw error;
    }
  },

  updateIncomeEntry: async (id: string, updates: UpdateIncomeEntry) => {
    set({ incomeError: null });
    // Capture original BEFORE optimistic update
    const original = get().incomeEntries.find((entry) => entry.id === id);

    try {
      // Validate input - client-side validation before API call
      const validatedUpdates = updateIncomeEntrySchema.parse(updates);

      // Get settings from combined store (themeSlice has Amazon Flex capacity settings)
      const store = get() as unknown as AmazonFlexSettings;
      const dailyCapacity =
        typeof store.amazonFlexDailyCapacity === 'number'
          ? store.amazonFlexDailyCapacity
          : AMAZON_FLEX_DAILY_LIMIT_HOURS * 60;
      const weeklyCapacity =
        typeof store.amazonFlexWeeklyCapacity === 'number'
          ? store.amazonFlexWeeklyCapacity
          : AMAZON_FLEX_WEEKLY_LIMIT_HOURS * 60;

      // Simulate the update to validate limits
      const entriesWithUpdate = get().incomeEntries.map((entry) =>
        entry.id === id ? { ...entry, ...validatedUpdates } : entry
      );

      // Validate Amazon Flex hours limits
      validateAmazonFlexLimits(validatedUpdates, entriesWithUpdate, dailyCapacity, weeklyCapacity);

      // Optimistic update
      const optimisticEntry = { ...original, ...validatedUpdates, updatedAt: Date.now() } as IncomeEntry;
      set((state) => ({
        incomeEntries: state.incomeEntries.map((entry) =>
          entry.id === id ? optimisticEntry : entry
        ),
        incomeByMonth: updateByMonthForEntry(state, original, optimisticEntry),
      }));

      // Perform actual update via API and get server response
      const updatedEntry = await incomeApi.updateIncomeEntry(id, validatedUpdates);

      // Update with server data (in case server modified anything)
      set((state) => ({
        incomeEntries: state.incomeEntries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
        incomeByMonth: updateByMonthForEntry(state, original, updatedEntry),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update income entry';
      set({ incomeError: errorMessage });
      // Rollback using original captured before update
      if (original) {
        // Get the optimistic entry from current state to pass to updateByMonthForEntry
        const currentEntry = get().incomeEntries.find((entry) => entry.id === id);
        set((state) => ({
          incomeEntries: state.incomeEntries.map((entry) =>
            entry.id === id ? original : entry
          ),
          incomeByMonth: updateByMonthForEntry(state, currentEntry, original),
        }));
      }
      console.error('Failed to update income entry:', error);
      throw error;
    }
  },

  deleteIncomeEntry: async (id: string) => {
    set({ incomeError: null });
    // Capture original BEFORE optimistic delete
    const original = get().incomeEntries.find((entry) => entry.id === id);

    try {
      // Optimistic delete
      set((state) => {
        const monthKey = original ? getMonthKey(original.date) : null;
        return {
          incomeEntries: state.incomeEntries.filter((entry) => entry.id !== id),
          incomeByMonth: monthKey
            ? {
                ...state.incomeByMonth,
                [monthKey]: (state.incomeByMonth[monthKey] || []).filter((e) => e.id !== id),
              }
            : state.incomeByMonth,
        };
      });

      // Perform actual delete via API
      await incomeApi.deleteIncomeEntry(id); // Use API helper
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete income entry';
      set({ incomeError: errorMessage });
      // Rollback with original captured data
      if (original) {
        set((state) => {
          const monthKey = getMonthKey(original.date);
          return {
            incomeEntries: [...state.incomeEntries, original],
            incomeByMonth: {
              ...state.incomeByMonth,
              [monthKey]: [...(state.incomeByMonth[monthKey] || []), original],
            },
          };
        });
      }
      console.error('Failed to delete income entry:', error);
      throw error;
    }
  },

  getIncomeByDate: (date: string) => {
    return get().incomeEntries.filter((entry) => entry.date === date);
  },

});
