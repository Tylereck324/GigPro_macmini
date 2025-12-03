// src/pages/api/expenses/fixed/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { updateFixedExpenseSchema } from '@/types/validation/expense.validation';
import type { FixedExpense, UpdateFixedExpense } from '@/types/expense';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapFixedExpense = (entry: any): FixedExpense => ({
  id: entry.id,
  name: entry.name,
  amount: entry.amount,
  dueDate: entry.due_date,
  isActive: entry.is_active,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid Fixed Expense ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('fixed_expenses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase select error:', error);
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Fixed expense not found' });
          }
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapFixedExpense(data));
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'PUT':
      try {
        const validatedData: UpdateFixedExpense = updateFixedExpenseSchema.parse(req.body);

        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.name !== undefined) updates.name = validatedData.name;
        if (validatedData.amount !== undefined) updates.amount = validatedData.amount;
        if (validatedData.dueDate !== undefined) updates.due_date = validatedData.dueDate;
        if (validatedData.isActive !== undefined) updates.is_active = validatedData.isActive;

        const { data, error } = await supabase
          .from('fixed_expenses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'Fixed expense not found or no changes made' });
        }

        return res.status(200).json(mapFixedExpense(data));
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
          .from('fixed_expenses')
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
