import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportData, importData } from '../exportImport';
import { supabase } from '@/lib/supabase';
import { saveAs } from 'file-saver';

// Mock dependencies
vi.mock('@/lib/supabase');
vi.mock('file-saver');

describe('exportImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportData', () => {
    it('should export all data to JSON file', async () => {
      const mockIncomeData = [
        {
          id: '1',
          date: '2025-12-01',
          platform: 'amazon_flex',
          custom_platform_name: null,
          block_start_time: '2025-12-01T10:00:00Z',
          block_end_time: '2025-12-01T14:00:00Z',
          block_length: 240,
          amount: 100,
          notes: '',
          created_at: '2025-12-01T00:00:00Z',
          updated_at: '2025-12-01T00:00:00Z',
        },
      ];

      const mockSettings = {
        id: 'settings',
        theme: 'light',
        last_export_date: null,
        last_import_date: null,
        amazon_flex_daily_capacity: 480,
        amazon_flex_weekly_capacity: 2400,
        updated_at: '2025-12-01T00:00:00Z',
      };

      // Mock Supabase responses
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'income_entries') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockIncomeData, error: null }),
          } as any;
        }
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      });

      await exportData();

      // Verify saveAs was called
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/gigpro-backup-\d{4}-\d{2}-\d{2}\.json/)
      );

      // Verify export date was updated
      expect(supabase.from).toHaveBeenCalledWith('app_settings');
    });

    it('should handle export errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      await expect(exportData()).rejects.toThrow('Failed to export data');
    });
  });

  describe('importData - CRITICAL ERROR HANDLING TEST', () => {
    it('should import valid data successfully', async () => {
      const mockFile = new File(
        [
          JSON.stringify({
            version: '1.0',
            exportDate: '2025-12-01T00:00:00Z',
            data: {
              incomeEntries: [
                {
                  id: '1',
                  date: '2025-12-01',
                  platform: 'amazon_flex',
                  amount: 100,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
              ],
              dailyData: [],
              fixedExpenses: [],
              variableExpenses: [],
              paymentPlans: [],
              paymentPlanPayments: [],
              settings: {
                id: 'settings',
                theme: 'light',
                lastExportDate: null,
                lastImportDate: null,
                amazonFlexDailyCapacity: 480,
                amazonFlexWeeklyCapacity: 2400,
                updatedAt: Date.now(),
              },
            },
          }),
        ],
        'backup.json',
        { type: 'application/json' }
      );

      // Mock delete operations
      const deleteMock = vi.fn().mockReturnValue({
        neq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock insert operations
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      // Mock update operations
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => ({
        delete: deleteMock,
        insert: insertMock,
        update: updateMock,
      } as any));

      await importData(mockFile);

      expect(deleteMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should reject unsupported export version', async () => {
      const mockFile = new File(
        [JSON.stringify({ version: '2.0', data: {} })],
        'backup.json',
        { type: 'application/json' }
      );

      await expect(importData(mockFile)).rejects.toThrow(
        'Unsupported export version: 2.0'
      );
    });

    it('should reject invalid file format', async () => {
      const mockFile = new File(
        [JSON.stringify({ version: '1.0' })],
        'backup.json',
        { type: 'application/json' }
      );

      await expect(importData(mockFile)).rejects.toThrow(
        'Invalid export file format'
      );
    });

    it('should handle partial import failures (CRITICAL BUG FIX TEST)', async () => {
      const mockFile = new File(
        [
          JSON.stringify({
            version: '1.0',
            exportDate: '2025-12-01T00:00:00Z',
            data: {
              incomeEntries: [{ id: '1', date: '2025-12-01', amount: 100 }],
              dailyData: [],
              fixedExpenses: [],
              variableExpenses: [],
              paymentPlans: [],
              paymentPlanPayments: [],
              settings: null,
            },
          }),
        ],
        'backup.json',
        { type: 'application/json' }
      );

      // Mock delete to succeed
      const deleteMock = vi.fn().mockReturnValue({
        neq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock insert to fail for income_entries
      const insertMock = vi.fn().mockResolvedValue({
        error: { message: 'Constraint violation' },
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        delete: deleteMock,
        insert: insertMock,
      } as any));

      // Should throw error and not continue importing other tables
      await expect(importData(mockFile)).rejects.toThrow(
        'Failed to import income entries: Constraint violation'
      );
    });

    it('should handle empty data arrays', async () => {
      const mockFile = new File(
        [
          JSON.stringify({
            version: '1.0',
            exportDate: '2025-12-01T00:00:00Z',
            data: {
              incomeEntries: [],
              dailyData: [],
              fixedExpenses: [],
              variableExpenses: [],
              paymentPlans: [],
              paymentPlanPayments: [],
              settings: null,
            },
          }),
        ],
        'backup.json',
        { type: 'application/json' }
      );

      const deleteMock = vi.fn().mockReturnValue({
        neq: vi.fn().mockResolvedValue({ error: null }),
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        delete: deleteMock,
        update: updateMock,
      } as any));

      // Should not throw with empty arrays
      await expect(importData(mockFile)).resolves.not.toThrow();
    });
  });
});
