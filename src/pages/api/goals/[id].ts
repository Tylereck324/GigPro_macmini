// src/pages/api/goals/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { updateGoalSchema } from '@/types/validation/goal.validation';
import type { Goal, UpdateGoal } from '@/types/goal';
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

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid Goal ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase select error:', error);
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Goal not found' });
          }
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapGoal(data));
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'PUT':
      try {
        const validatedData: UpdateGoal = updateGoalSchema.parse(req.body);

        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.name !== undefined) updates.name = validatedData.name;
        if (validatedData.period !== undefined) updates.period = validatedData.period;
        if (validatedData.targetAmount !== undefined) updates.target_amount = validatedData.targetAmount;
        if (validatedData.startDate !== undefined) updates.start_date = validatedData.startDate;
        if (validatedData.endDate !== undefined) updates.end_date = validatedData.endDate;
        if (validatedData.isActive !== undefined) updates.is_active = validatedData.isActive;
        if (validatedData.priority !== undefined) updates.priority = validatedData.priority;

        const { data, error } = await supabase
          .from('goals')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'Goal not found or no changes made' });
        }

        return res.status(200).json(mapGoal(data));
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
          .from('goals')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase delete error:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(204).end();
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
