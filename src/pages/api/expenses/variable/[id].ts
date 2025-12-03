// src/pages/api/expenses/variable/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { updateVariableExpenseSchema } from '@/types/validation/expense.validation';
import type { VariableExpense, UpdateVariableExpense } from '@/types/expense';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapVariableExpense = (entry: any): VariableExpense => ({
  id: entry.id,
  name: entry.name,
  amount: entry.amount,
  category: entry.category,
  month: entry.month,
  isPaid: entry.is_paid,
  paidDate: entry.paid_date,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid Variable Expense ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('variable_expenses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase select error:', error);
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Variable expense not found' });
          }
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapVariableExpense(data));
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'PUT':
      try {
        const validatedData: UpdateVariableExpense = updateVariableExpenseSchema.parse(req.body);

        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.name !== undefined) updates.name = validatedData.name;
        if (validatedData.amount !== undefined) updates.amount = validatedData.amount;
        if (validatedData.category !== undefined) updates.category = validatedData.category;
        if (validatedData.month !== undefined) updates.month = validatedData.month;
        if (validatedData.isPaid !== undefined) updates.is_paid = validatedData.isPaid;
        if (validatedData.paidDate !== undefined) updates.paid_date = validatedData.paidDate;

        const { data, error } = await supabase
          .from('variable_expenses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'Variable expense not found or no changes made' });
        }

        return res.status(200).json(mapVariableExpense(data));
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
          .from('variable_expenses')
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
