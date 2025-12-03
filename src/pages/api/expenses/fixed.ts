// src/pages/api/expenses/fixed.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createFixedExpenseSchema } from '@/types/validation/expense.validation';
import type { CreateFixedExpense, FixedExpense } from '@/types/expense';
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

  if (req.method === 'POST') {
    try {
      const validatedData: CreateFixedExpense = createFixedExpenseSchema.parse(req.body);

      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert({
          user_id: user.id,
          name: validatedData.name,
          amount: validatedData.amount,
          due_date: validatedData.dueDate,
          is_active: validatedData.isActive,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(mapFixedExpense(data[0]));
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
        .from('fixed_expenses')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data.map(mapFixedExpense));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
