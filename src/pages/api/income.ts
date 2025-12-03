// src/pages/api/income.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createIncomeEntrySchema } from '@/types/validation/income.validation';
import type { CreateIncomeEntry, IncomeEntry } from '@/types/income';
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

  if (req.method === 'POST') {
    try {
      const validatedData: CreateIncomeEntry = createIncomeEntrySchema.parse(req.body);

      const { data, error } = await supabase
        .from('income_entries')
        .insert({
          date: validatedData.date,
          platform: validatedData.platform,
          custom_platform_name: validatedData.customPlatformName,
          block_start_time: validatedData.blockStartTime,
          block_end_time: validatedData.blockEndTime,
          block_length: validatedData.blockLength,
          amount: validatedData.amount,
          notes: validatedData.notes,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Map the single returned entry
      return res.status(201).json(mapIncomeEntry(data[0]));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      // RLS will automatically filter by user_id
      const { data, error } = await supabase
        .from('income_entries')
        .select('*');

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Map all returned entries
      return res.status(200).json(data.map(mapIncomeEntry));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}