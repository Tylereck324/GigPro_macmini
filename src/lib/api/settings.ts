// src/lib/api/settings.ts
import type { AppSettings, UpdateAppSettings } from '@/types/settings';
import { supabase } from '../supabase'; // Use global supabase client

export const settingsApi = {
  async getSettings(): Promise<AppSettings> {
    const SETTINGS_ID = 'settings';
    
    // Try to find settings by the fixed ID
    let { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    // `maybeSingle()` can return `{ data: null, error: null }` when the row doesn't exist,
    // so treat missing data the same as "no rows found" and create defaults.
    if (error || !data) {
      if (error) {
        console.error('Supabase select error:', error);
        // If it's not the "no rows found" case, surface the real error.
        if (error.code !== 'PGRST116') {
          throw new Error(error.message);
        }
      }

      const { data: newData, error: insertError } = await supabase
        .from('app_settings')
        .insert({
          id: SETTINGS_ID,
          theme: 'light',
          amazon_flex_daily_capacity: 480,
          amazon_flex_weekly_capacity: 2400
        })
        .select()
        .maybeSingle();
      
      if (insertError) {
        console.error('Failed to create default settings:', insertError);
        throw new Error(`Failed to create default settings: ${insertError.message}`);
      }
      if (!newData) {
         throw new Error('Failed to create default settings: No data returned.');
      }
      data = newData;
    }

    // Map snake_case to camelCase
    const appSettings: AppSettings = {
      id: data.id,
      theme: data.theme,
      lastExportDate: data.last_export_date ? new Date(data.last_export_date).getTime() : null,
      lastImportDate: data.last_import_date ? new Date(data.last_import_date).getTime() : null,
      amazonFlexDailyCapacity: data.amazon_flex_daily_capacity,
      amazonFlexWeeklyCapacity: data.amazon_flex_weekly_capacity,
      updatedAt: new Date(data.updated_at).getTime(),
    };
    return appSettings;
  },

  async updateSettings(updates: UpdateAppSettings): Promise<AppSettings> {
    const SETTINGS_ID = 'settings';

    // Map camelCase to snake_case
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.lastExportDate !== undefined) dbUpdates.last_export_date = updates.lastExportDate ? new Date(updates.lastExportDate).toISOString() : null;
    if (updates.lastImportDate !== undefined) dbUpdates.last_import_date = updates.lastImportDate ? new Date(updates.lastImportDate).toISOString() : null;
    if (updates.amazonFlexDailyCapacity !== undefined) dbUpdates.amazon_flex_daily_capacity = updates.amazonFlexDailyCapacity;
    if (updates.amazonFlexWeeklyCapacity !== undefined) dbUpdates.amazon_flex_weekly_capacity = updates.amazonFlexWeeklyCapacity;

    const { data, error } = await supabase
      .from('app_settings')
      .update(dbUpdates)
      .eq('id', SETTINGS_ID)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('App settings not found for update.');
    }

    // Map snake_case to camelCase for response
    const updatedSettings: AppSettings = {
        id: data.id,
        theme: data.theme,
        lastExportDate: data.last_export_date ? new Date(data.last_export_date).getTime() : null,
        lastImportDate: data.last_import_date ? new Date(data.last_import_date).getTime() : null,
        amazonFlexDailyCapacity: data.amazon_flex_daily_capacity,
        amazonFlexWeeklyCapacity: data.amazon_flex_weekly_capacity,
        updatedAt: new Date(data.updated_at).getTime(),
    };
    return updatedSettings;
  },
};
