import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportData, importData } from '../exportImport';
import { supabase } from '@/lib/supabase';
import { saveAs } from 'file-saver';

// Mock dependencies at the top level
vi.mock('@/lib/supabase');
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Helper to create a mock File object
const createMockFile = (content: string, filename = 'mock.json', type = 'application/json') => {
  return {
    name: filename,
    type,
    text: vi.fn(() => Promise.resolve(content)),
    size: content.length,
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    slice: vi.fn(),
    stream: vi.fn(),
  } as unknown as File;
};

describe('exportImport', () => {
  // Define mock functions for supabase operations
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockUpsert: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockNeq: ReturnType<typeof vi.fn>;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockUpdateEq: ReturnType<typeof vi.fn>; // For update().eq() chain
  let mockDeleteNeqDelete: ReturnType<typeof vi.fn>; // For delete().neq().delete() chain

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset and define all mocks
    mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    mockEq = vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })), // Used by getDataStats and select().eq()
      maybeSingle: mockMaybeSingle, // For select().eq().maybeSingle()
      single: mockSingle, // For select().eq().single()
    }));

    mockDeleteNeqDelete = vi.fn().mockResolvedValue({ error: null });
    mockNeq = vi.fn(() => ({
      delete: mockDeleteNeqDelete, // delete().neq().delete()
    }));

    mockSelect = vi.fn(() => ({
      data: [], // Default data for select('*')
      error: null,
      maybeSingle: mockMaybeSingle, // Used by exportData settings fetch
      eq: mockEq, // For select().eq()
      order: vi.fn(() => ({ data: [], error: null })), // Used by incomeApi.getIncomeEntries
      single: mockSingle, // Used by incomeApi, etc.
      neq: mockNeq, // Used by importData clear
    }));

    mockInsert = vi.fn().mockResolvedValue({ data: [], error: null });
    mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null }); // For update().eq()
    mockUpdate = vi.fn(() => ({ eq: mockUpdateEq })); // For update()
    mockDelete = vi.fn(() => ({ neq: mockNeq })); // For delete().neq()
    mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      // Basic mock that returns an object with methods that can be chained
      return {
        select: vi.fn(() => ({
          data: [], // Default data for select('*')
          error: null,
          maybeSingle: mockMaybeSingle,
          eq: mockEq,
          order: vi.fn(() => ({ data: [], error: null }))
        })),
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        upsert: mockUpsert,
        eq: mockEq,
        neq: mockNeq,
      } as any;
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
    vi.mocked(saveAs).mockImplementation(() => {});
  });

  describe('exportData', () => {
    it('should export all data to JSON file', async () => {
      const mockIncomeData = [
        {
          id: '1',
          date: '2025-12-01',
          platform: 'AmazonFlex',
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

      // Specific mocks for this test
      vi.mocked(supabase.from).mockImplementation((table) => {
        const baseMock = {
          select: vi.fn(() => ({
            data: [], error: null, maybeSingle: mockMaybeSingle, eq: mockEq, order: vi.fn(() => ({ data: [], error: null }))
          })),
          update: mockUpdate,
          insert: mockInsert,
          delete: mockDelete,
          upsert: mockUpsert,
          eq: mockEq,
          neq: mockNeq,
        };

        if (table === 'income_entries') {
          baseMock.select = vi.fn().mockResolvedValue({ data: mockIncomeData, error: null });
        }
        if (table === 'app_settings') {
          baseMock.select = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: mockSettings, error: null }) }),
          });
        }
        return baseMock as any;
      });
      
      await exportData();

      // Verify saveAs was called
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/gigpro-backup-\d{4}-\d{2}-\d{2}\.json/)
      );

      // Verify export date was updated
      expect(supabase.from).toHaveBeenCalledWith('app_settings');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'settings');
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
      const mockFile = createMockFile(
        JSON.stringify({
            version: '1.0',
            exportDate: '2025-12-01T00:00:00Z',
            data: {
              incomeEntries: [
                {
                  id: '1',
                  date: '2025-12-01',
                  platform: 'AmazonFlex',
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
      );

      // Reset mock implementations for this test
      vi.clearAllMocks(); // Clear mocks defined in beforeEach for this specific test
      vi.mocked(saveAs).mockImplementation(() => {}); // Re-mock saveAs


      // Expose the mocked functions for assertions
      const neqDeleteMock = vi.fn().mockResolvedValue({ error: null });
      const insertCalledMock = vi.fn().mockResolvedValue({ error: null });
      const updateEqCalledMock = vi.fn().mockResolvedValue({ error: null });
      const upsertCalledMock = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockResponse = { data: null, error: null };

        const mockEqChain = {
          select: vi.fn().mockResolvedValue(mockResponse),
          single: vi.fn().mockResolvedValue(mockResponse),
          maybeSingle: vi.fn().mockResolvedValue(mockResponse),
        };

        const mockDeleteResult = {
          neq: vi.fn(() => ({ delete: neqDeleteMock })),
        };

        return {
          select: vi.fn().mockResolvedValue(mockResponse),
          insert: insertCalledMock,
          update: vi.fn(() => ({ eq: updateEqCalledMock })),
          upsert: upsertCalledMock,
          delete: vi.fn(() => mockDeleteResult),
          eq: vi.fn(() => mockEqChain),
        } as any;
      });

      await importData(mockFile);

      // Asserts are now against the specific vi.fn()s that are actually called
      expect(neqDeleteMock).toHaveBeenCalledTimes(6); // Called for each delete clear
      expect(insertCalledMock).toHaveBeenCalled();
      expect(updateEqCalledMock).toHaveBeenCalledWith('id', 'settings');
      expect(upsertCalledMock).toHaveBeenCalled();
    });

    it('should reject unsupported export version', async () => {
      const mockFile = createMockFile(JSON.stringify({ version: '2.0', data: {} }));
      await expect(importData(mockFile)).rejects.toThrow(
        'Unsupported export version: 2.0'
      );
    });

    it('should reject invalid file format', async () => {
      const mockFile = createMockFile(JSON.stringify({ version: '1.0' }));
      await expect(importData(mockFile)).rejects.toThrow(
        'Invalid export file format'
      );
    });

    it('should handle partial import failures (CRITICAL BUG FIX TEST)', async () => {
      const mockFile = createMockFile(
        JSON.stringify({
            version: '1.0',
            exportDate: '2025-12-01T00:00:00Z',
            data: {
              incomeEntries: [{ id: '1', date: '2025-12-01', amount: 100, createdAt: Date.now(), updatedAt: Date.now() }],
              dailyData: [],
              fixedExpenses: [],
              variableExpenses: [],
              paymentPlans: [],
              paymentPlanPayments: [],
              settings: null,
            },
          }),
      );

      // Mock delete to succeed
      const neqDeleteMock = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteResult = { neq: vi.fn(() => ({ delete: neqDeleteMock })) };

      // Mock insert to fail for income_entries
      const insertCalledMock = vi.fn().mockResolvedValue({
        error: { message: 'Constraint violation' },
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        delete: vi.fn(() => mockDeleteResult),
        insert: insertCalledMock,
      } as any));

      // Should throw error and not continue importing other tables
      await expect(importData(mockFile)).rejects.toThrow(
        'Failed to import income entries: Constraint violation'
      );
    });

    it('should handle empty data arrays', async () => {
      const mockFile = createMockFile(
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
      );

      const neqDeleteMock = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteResult = { neq: vi.fn(() => ({ delete: neqDeleteMock })) };

      const updateEqCalledMock = vi.fn().mockResolvedValue({ error: null });
      const updateCalledMock = vi.fn(() => ({ eq: updateEqCalledMock }));

      vi.mocked(supabase.from).mockImplementation(() => ({
        delete: vi.fn(() => mockDeleteResult),
        update: updateCalledMock,
        upsert: vi.fn().mockResolvedValue({ error: null }), // Needed for settings upsert
      } as any));

      // Should not throw with empty arrays
      await expect(importData(mockFile)).resolves.not.toThrow();
    });
  });
});
