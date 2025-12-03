import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createIncomeSlice, IncomeSlice } from '../incomeSlice';
import { incomeApi } from '@/lib/api/income';
import { createMockIncomeEntry } from '@/test/utils';

// Mock the API
vi.mock('@/lib/api/income');

describe('incomeSlice', () => {
  let useStore: ReturnType<typeof create<IncomeSlice>>;

  beforeEach(() => {
    vi.clearAllMocks();
    useStore = create<IncomeSlice>()(createIncomeSlice);
  });

  describe('loadIncomeEntries', () => {
    it('should load income entries successfully', async () => {
      const mockEntries = [createMockIncomeEntry()];
      vi.mocked(incomeApi.getIncomeEntries).mockResolvedValue(mockEntries);

      await useStore.getState().loadIncomeEntries();

      expect(useStore.getState().incomeEntries).toEqual(mockEntries);
      expect(useStore.getState().incomeLoading).toBe(false);
      expect(useStore.getState().incomeError).toBe(null);
    });

    it('should handle loading errors', async () => {
      vi.mocked(incomeApi.getIncomeEntries).mockRejectedValue(
        new Error('Failed to fetch')
      );

      await expect(
        useStore.getState().loadIncomeEntries()
      ).rejects.toThrow('Failed to fetch');

      expect(useStore.getState().incomeLoading).toBe(false);
      expect(useStore.getState().incomeError).toBe('Failed to fetch');
    });
  });

  describe('addIncomeEntry', () => {
    it('should add a new income entry', async () => {
      const newEntry = createMockIncomeEntry({ id: 'new-entry' });
      vi.mocked(incomeApi.createIncomeEntry).mockResolvedValue(newEntry);

      const result = await useStore.getState().addIncomeEntry({
        date: '2025-12-01',
        platform: 'amazon_flex',
        amount: 100,
      });

      expect(result).toEqual(newEntry);
      expect(useStore.getState().incomeEntries).toContain(newEntry);
      expect(useStore.getState().incomeError).toBe(null);
    });

    it('should handle validation errors', async () => {
      const invalidEntry = {
        date: 'invalid',
        platform: 'amazon_flex',
        amount: -100, // Invalid: negative
      } as any;

      await expect(
        useStore.getState().addIncomeEntry(invalidEntry)
      ).rejects.toThrow();

      expect(useStore.getState().incomeError).toBeTruthy();
    });
  });

  describe('updateIncomeEntry - CRITICAL ROLLBACK TEST', () => {
    it('should perform optimistic update and use server response', async () => {
      const original = createMockIncomeEntry({ id: '1', amount: 100 });
      const serverResponse = createMockIncomeEntry({ id: '1', amount: 150, notes: 'Updated by server' });

      // Set up initial state
      useStore.setState({ incomeEntries: [original] });

      vi.mocked(incomeApi.updateIncomeEntry).mockResolvedValue(serverResponse);

      await useStore.getState().updateIncomeEntry('1', { amount: 150 });

      // Should use server response, not optimistic update
      expect(useStore.getState().incomeEntries[0]).toEqual(serverResponse);
      expect(useStore.getState().incomeEntries[0].notes).toBe('Updated by server');
    });

    it('should rollback on API error (CRITICAL BUG FIX TEST)', async () => {
      const original = createMockIncomeEntry({ id: '1', amount: 100 });

      // Set up initial state
      useStore.setState({ incomeEntries: [original] });

      // Mock API to fail
      vi.mocked(incomeApi.updateIncomeEntry).mockRejectedValue(
        new Error('Network error')
      );

      // Attempt update
      await expect(
        useStore.getState().updateIncomeEntry('1', { amount: 200 })
      ).rejects.toThrow('Network error');

      // CRITICAL: Should rollback to original, not modified state
      expect(useStore.getState().incomeEntries[0].amount).toBe(100);
      expect(useStore.getState().incomeError).toBe('Network error');
    });

    it('should capture original BEFORE optimistic update', async () => {
      const original = createMockIncomeEntry({ id: '1', amount: 100, notes: 'Original' });

      useStore.setState({ incomeEntries: [original] });

      // Mock slow API call that fails
      vi.mocked(incomeApi.updateIncomeEntry).mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Failed')), 100);
        })
      );

      await expect(
        useStore.getState().updateIncomeEntry('1', { amount: 200, notes: 'Modified' })
      ).rejects.toThrow();

      // Should rollback to ORIGINAL state, not the optimistic update
      const entry = useStore.getState().incomeEntries[0];
      expect(entry.amount).toBe(100);
      expect(entry.notes).toBe('Original');
    });
  });

  describe('deleteIncomeEntry', () => {
    it('should delete an income entry', async () => {
      const entry1 = createMockIncomeEntry({ id: '1' });
      const entry2 = createMockIncomeEntry({ id: '2' });

      useStore.setState({ incomeEntries: [entry1, entry2] });

      vi.mocked(incomeApi.deleteIncomeEntry).mockResolvedValue();

      await useStore.getState().deleteIncomeEntry('1');

      expect(useStore.getState().incomeEntries).toEqual([entry2]);
      expect(useStore.getState().incomeError).toBe(null);
    });

    it('should handle delete errors', async () => {
      const entry = createMockIncomeEntry({ id: '1' });
      useStore.setState({ incomeEntries: [entry] });

      vi.mocked(incomeApi.deleteIncomeEntry).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(
        useStore.getState().deleteIncomeEntry('1')
      ).rejects.toThrow('Delete failed');

      expect(useStore.getState().incomeError).toBe('Delete failed');
    });
  });

  describe('getIncomeByDate', () => {
    it('should filter entries by date', () => {
      const entry1 = createMockIncomeEntry({ id: '1', date: '2025-12-01' });
      const entry2 = createMockIncomeEntry({ id: '2', date: '2025-12-02' });

      useStore.setState({ incomeEntries: [entry1, entry2] });

      const result = useStore.getState().getIncomeByDate('2025-12-01');

      expect(result).toEqual([entry1]);
    });
  });
});
