import { StateCreator } from 'zustand';
import type { IncomeEntry, CreateIncomeEntry, UpdateIncomeEntry } from '@/types/income';
import { incomeRepository } from '@/lib/db';
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
  getIncomeByDate: (date: string) => IncomeEntry[];
  clearIncomeError: () => void;
}

export const createIncomeSlice: StateCreator<IncomeSlice> = (set, get) => ({
  incomeEntries: [],
  incomeLoading: false,
  incomeError: null,

  loadIncomeEntries: async () => {
    set({ incomeLoading: true, incomeError: null });
    try {
      const entries = await incomeRepository.getAll();
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
      // Validate input
      const validatedEntry = createIncomeEntrySchema.parse(entry);

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry = {
        ...validatedEntry,
        id: tempId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as IncomeEntry;

      set((state) => ({
        incomeEntries: [...state.incomeEntries, optimisticEntry],
      }));

      // Perform actual creation
      const newEntry = await incomeRepository.create(validatedEntry);

      // Replace optimistic entry with real one
      set((state) => ({
        incomeEntries: state.incomeEntries.map((e) =>
          e.id === tempId ? newEntry : e
        ),
      }));

      return newEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add income entry';
      set({ incomeError: errorMessage });
      // Rollback optimistic update
      set((state) => ({
        incomeEntries: state.incomeEntries.filter((e) => !e.id.startsWith('temp-')),
      }));
      throw error;
    }
  },

  updateIncomeEntry: async (id: string, updates: UpdateIncomeEntry) => {
    set({ incomeError: null });
    try {
      // Validate input
      const validatedUpdates = updateIncomeEntrySchema.parse(updates);

      // Store original for rollback
      const original = get().incomeEntries.find((e) => e.id === id);

      // Optimistic update
      set((state) => ({
        incomeEntries: state.incomeEntries.map((entry) =>
          entry.id === id ? { ...entry, ...validatedUpdates, updatedAt: Date.now() } : entry
        ),
      }));

      // Perform actual update
      await incomeRepository.update(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update income entry';
      set({ incomeError: errorMessage });
      // Rollback on error
      const original = get().incomeEntries.find((e) => e.id === id);
      if (original) {
        set((state) => ({
          incomeEntries: state.incomeEntries.map((e) => (e.id === id ? original : e)),
        }));
      }
      throw error;
    }
  },

  deleteIncomeEntry: async (id: string) => {
    set({ incomeError: null });
    try {
      // Store original for rollback
      const original = get().incomeEntries.find((e) => e.id === id);

      // Optimistic delete
      set((state) => ({
        incomeEntries: state.incomeEntries.filter((entry) => entry.id !== id),
      }));

      // Perform actual delete
      await incomeRepository.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete income entry';
      set({ incomeError: errorMessage });
      // Rollback on error
      const original = get().incomeEntries.find((e) => e.id === id);
      if (original) {
        set((state) => ({
          incomeEntries: [...state.incomeEntries, original],
        }));
      }
      throw error;
    }
  },

  getIncomeByDate: (date: string) => {
    return get().incomeEntries.filter((entry) => entry.date === date);
  },

  clearIncomeError: () => {
    set({ incomeError: null });
  },
});
