// src/pages/api/settings.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { updateAppSettingsSchema } from '@/types/validation/settings.validation';
import type { AppSettings, UpdateAppSettings } from '@/types/settings';
import { getAuthenticatedUser } from '@/lib/api/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  const SETTINGS_ID = 'settings'; // Use fixed ID for single-user mode

  switch (req.method) {
    case 'GET':
      try {
        let { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', SETTINGS_ID)
          .single();

        if (error) {
          console.error('Supabase select error:', error);
          if (error.code === 'PGRST116') { // No rows found
            // Auto-create default settings
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
              return res.status(500).json({ error: `Failed to create default settings: ${insertError.message}` });
            }

            if (!newData) {
               return res.status(500).json({ error: 'Failed to create default settings: No data returned. Check Database RLS policies.' });
            }
            
            // Use the newly created data
            data = newData;
          } else {
            return res.status(500).json({ error: error.message });
          }
        } else {
            // data is already populated from the select
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

        return res.status(200).json(appSettings);
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'PUT':
      try {
        const validatedData: UpdateAppSettings = updateAppSettingsSchema.parse(req.body);

        // Map camelCase to snake_case
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Explicitly map fields that can be updated
        if (validatedData.theme !== undefined) updates.theme = validatedData.theme;
        if (validatedData.lastExportDate !== undefined) updates.last_export_date = validatedData.lastExportDate ? new Date(validatedData.lastExportDate).toISOString() : null;
        if (validatedData.lastImportDate !== undefined) updates.last_import_date = validatedData.lastImportDate ? new Date(validatedData.lastImportDate).toISOString() : null;
        if (validatedData.amazonFlexDailyCapacity !== undefined) updates.amazon_flex_daily_capacity = validatedData.amazonFlexDailyCapacity;
        if (validatedData.amazonFlexWeeklyCapacity !== undefined) updates.amazon_flex_weekly_capacity = validatedData.amazonFlexWeeklyCapacity;


        const { data, error } = await supabase
          .from('app_settings')
          .update(updates)
          .eq('id', SETTINGS_ID)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'App settings not found or no changes made' });
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

        return res.status(200).json(updatedSettings);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
