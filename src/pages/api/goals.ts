// src/pages/api/goals.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createGoalSchema } from '@/types/validation/goal.validation';
import type { CreateGoal, Goal } from '@/types/goal';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapGoal = (entry: any): Goal => ({
  id: entry.id,
  name: entry.name,
  period: entry.period,
  targetAmount: entry.target_amount,
  startDate: entry.start_date,
  endDate: entry.end_date,
  isActive: entry.is_active,
  priority: entry.priority,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  if (req.method === 'POST') {
    try {
      const validatedData: CreateGoal = createGoalSchema.parse(req.body);

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: validatedData.name,
          period: validatedData.period,
          target_amount: validatedData.targetAmount,
          start_date: validatedData.startDate,
          end_date: validatedData.endDate,
          is_active: validatedData.isActive,
          priority: validatedData.priority,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(mapGoal(data[0]));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('priority', { ascending: true });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data.map(mapGoal));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
