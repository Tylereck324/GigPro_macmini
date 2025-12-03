// src/pages/api/income/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { updateIncomeEntrySchema } from '@/types/validation/income.validation';
import type { IncomeEntry, UpdateIncomeEntry } from '@/types/income';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapIncomeEntry = (entry: any): IncomeEntry => ({
  id: entry.id,
  date: entry.date,
  platform: entry.platform,
  customPlatformName: entry.custom_platform_name,
  blockStartTime: entry.block_start_time,
  blockEndTime: entry.block_end_time,
  blockLength: entry.block_length,
  amount: entry.amount,
  notes: entry.notes,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid Income Entry ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('income_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase select error:', error);
          if (error.code === 'PGRST116') { // No rows found
            return res.status(404).json({ error: 'Income entry not found' });
          }
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapIncomeEntry(data)); // Use helper
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'PUT':
      try {
        // Validate the request body
        const validatedData: UpdateIncomeEntry = updateIncomeEntrySchema.parse(req.body);

        // Map camelCase to snake_case for Supabase
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.date !== undefined) updates.date = validatedData.date;
        if (validatedData.platform !== undefined) updates.platform = validatedData.platform;
        if (validatedData.customPlatformName !== undefined) updates.custom_platform_name = validatedData.customPlatformName;
        if (validatedData.blockStartTime !== undefined) updates.block_start_time = validatedData.blockStartTime;
        if (validatedData.blockEndTime !== undefined) updates.block_end_time = validatedData.blockEndTime;
        if (validatedData.blockLength !== undefined) updates.block_length = validatedData.blockLength;
        if (validatedData.amount !== undefined) updates.amount = validatedData.amount;
        if (validatedData.notes !== undefined) updates.notes = validatedData.notes;

        const { data, error } = await supabase
          .from('income_entries')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'Income entry not found or no changes made' });
        }

        return res.status(200).json(mapIncomeEntry(data)); // Use helper
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'DELETE':
      try {
        const { error } = await supabase
          .from('income_entries')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase delete error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(204).end(); // No content for successful delete
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
