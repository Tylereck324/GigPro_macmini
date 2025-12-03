// src/pages/api/expenses/variable.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createVariableExpenseSchema } from '@/types/validation/expense.validation';
import type { CreateVariableExpense, VariableExpense } from '@/types/expense';
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

  if (req.method === 'POST') {
    try {
      const validatedData: CreateVariableExpense = createVariableExpenseSchema.parse(req.body);

      const { data, error } = await supabase
        .from('variable_expenses')
        .insert({
          name: validatedData.name,
          amount: validatedData.amount,
          category: validatedData.category,
          month: validatedData.month,
          is_paid: validatedData.isPaid,
          paid_date: validatedData.paidDate,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(mapVariableExpense(data[0]));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { month } = req.query;

      let query = supabase.from('variable_expenses').select('*');

      if (month && typeof month === 'string') {
        query = query.eq('month', month);
      }

      const { data, error } = await query.order('month', { ascending: false });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data.map(mapVariableExpense));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
