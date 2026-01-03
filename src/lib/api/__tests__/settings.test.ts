import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsApi } from '../settings';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('settingsApi.getSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates default settings when missing', async () => {
    const selectMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'settings',
        theme: 'light',
        last_export_date: null,
        last_import_date: null,
        amazon_flex_daily_capacity: 480,
        amazon_flex_weekly_capacity: 2400,
        updated_at: '2025-12-01T00:00:00Z',
      },
      error: null,
    });

    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        maybeSingle: insertMaybeSingle,
      })),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table !== 'app_settings') throw new Error(`Unexpected table: ${table}`);

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: selectMaybeSingle,
          })),
        })),
        insert,
      } as any;
    });

    const settings = await settingsApi.getSettings();

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'settings',
        theme: 'light',
        amazon_flex_daily_capacity: 480,
        amazon_flex_weekly_capacity: 2400,
      })
    );

    expect(settings).toMatchObject({
      id: 'settings',
      theme: 'light',
      lastExportDate: null,
      lastImportDate: null,
      amazonFlexDailyCapacity: 480,
      amazonFlexWeeklyCapacity: 2400,
    });
  });
});

