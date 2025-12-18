import { StateCreator } from 'zustand';
import type { IncomeEntry, CreateIncomeEntry, UpdateIncomeEntry } from '@/types/income';
import { incomeApi } from '@/lib/api/income'; // Import the new API helper
import { createIncomeEntrySchema, updateIncomeEntrySchema } from '@/types/validation';

export interface IncomeSlice {
  incomeEntries: IncomeEntry[];
  incomeLoading: boolean;
  incomeError: string | null;

  // Actions
  loadIncomeEntries: () => Promise<void>;
  addIncomeEntry: (entry: CreateIncomeEntry) => Promise<IncomeEntry>;
  updateIncomeEntry: (id: string, updates: UpdateIncomeEntry) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;
  clearIncomeError: () => void;
}

export const createIncomeSlice: StateCreator<IncomeSlice> = (set, get) => ({
  incomeEntries: [],
  incomeLoading: false,
  incomeError: null,

  loadIncomeEntries: async () => {
    set({ incomeLoading: true, incomeError: null });
    try {
      const entries = await incomeApi.getIncomeEntries(); // Use API helper
      set({ incomeEntries: entries, incomeLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load income entries';
      console.error('Failed to load income entries:', error);
      set({ incomeLoading: false, incomeError: errorMessage });
      throw error;
    }
  },

  addIncomeEntry: async (entry: CreateIncomeEntry) => {
    set({ incomeError: null });
    try {
      // Validate input - client-side validation before API call
      const validatedEntry = createIncomeEntrySchema.parse(entry);

      // Perform actual creation via API
      const newEntry = await incomeApi.createIncomeEntry(validatedEntry); // Use API helper

      // Update state with new entry
      set((state) => ({
        incomeEntries: [...state.incomeEntries, newEntry],
      }));

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

      // Optimistic update
      set((state) => ({
        incomeEntries: state.incomeEntries.map((entry) =>
          entry.id === id ? { ...entry, ...validatedUpdates, updatedAt: Date.now() } : entry
        ),
      }));

      // Perform actual update via API and get server response
      const updatedEntry = await incomeApi.updateIncomeEntry(id, validatedUpdates);

      // Update with server data (in case server modified anything)
      set((state) => ({
        incomeEntries: state.incomeEntries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update income entry';
      set({ incomeError: errorMessage });
      // Rollback using original captured before update
      if (original) {
        set((state) => ({
          incomeEntries: state.incomeEntries.map((entry) =>
            entry.id === id ? original : entry
          ),
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
      set((state) => ({
        incomeEntries: state.incomeEntries.filter((entry) => entry.id !== id),
      }));

      // Perform actual delete via API
      await incomeApi.deleteIncomeEntry(id); // Use API helper
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete income entry';
      set({ incomeError: errorMessage });

      // Rollback using stored original
      if (original) {
        set((state) => ({
          incomeEntries: [...state.incomeEntries, original],
        }));
      }

      console.error('Failed to delete income entry:', error);
      throw error;
    }
  },

  clearIncomeError: () => {
    set({ incomeError: null });
  },
});
