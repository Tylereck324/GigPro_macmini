// src/pages/api/dailyData.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createDailyDataSchema, updateDailyDataSchema } from '@/types/validation/dailyData.validation';
import type { CreateDailyData, DailyData, UpdateDailyData } from '@/types/dailyData';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapDailyData = (entry: any): DailyData => ({
  id: entry.id,
  date: entry.date,
  mileage: entry.mileage,
  gasExpense: entry.gas_expense,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  if (req.method === 'POST') {
    try {
      const validatedData: CreateDailyData = createDailyDataSchema.parse(req.body);

      const { data, error } = await supabase
        .from('daily_data')
        .insert({
          date: validatedData.date,
          mileage: validatedData.mileage,
          gas_expense: validatedData.gasExpense,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(mapDailyData(data[0]));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { date } = req.query;

      let query = supabase.from('daily_data').select('*');

      if (date && typeof date === 'string') {
        query = query.eq('date', date);
        const { data, error } = await query.single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Daily data not found' });
          }
          console.error('Supabase select error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapDailyData(data));
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data.map(mapDailyData));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    // Upsert by date
    try {
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      const validatedData: UpdateDailyData = updateDailyDataSchema.parse(req.body);

      // Check if record exists
      const { data: existing } = await supabase
        .from('daily_data')
        .select('id')
        .eq('date', date)
        .single();

      if (existing) {
        // Update existing
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.mileage !== undefined) updates.mileage = validatedData.mileage;
        if (validatedData.gasExpense !== undefined) updates.gas_expense = validatedData.gasExpense;

        const { data, error } = await supabase
          .from('daily_data')
          .update(updates)
          .eq('date', date)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapDailyData(data));
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('daily_data')
          .insert({
            date,
            mileage: validatedData.mileage ?? null,
            gas_expense: validatedData.gasExpense ?? null,
          })
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(mapDailyData(data[0]));
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
