// src/pages/api/expenses/paymentPlans/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { updatePaymentPlanSchema } from '@/types/validation/expense.validation';
import type { PaymentPlan, UpdatePaymentPlan } from '@/types/expense';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapPaymentPlan = (entry: any): PaymentPlan => ({
  id: entry.id,
  name: entry.name,
  provider: entry.provider,
  initialCost: entry.initial_cost,
  totalPayments: entry.total_payments,
  currentPayment: entry.current_payment,
  paymentAmount: entry.payment_amount,
  minimumMonthlyPayment: entry.minimum_monthly_payment,
  startDate: entry.start_date,
  frequency: entry.frequency,
  endDate: entry.end_date,
  minimumPayment: entry.minimum_payment,
  isComplete: entry.is_complete,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid Payment Plan ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('payment_plans')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase select error:', error);
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Payment plan not found' });
          }
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(mapPaymentPlan(data));
      } catch (error: any) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
      }

    case 'PUT':
      try {
        const validatedData: UpdatePaymentPlan = updatePaymentPlanSchema.parse(req.body);

        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.name !== undefined) updates.name = validatedData.name;
        if (validatedData.provider !== undefined) updates.provider = validatedData.provider;
        if (validatedData.initialCost !== undefined) updates.initial_cost = validatedData.initialCost;
        if (validatedData.totalPayments !== undefined) updates.total_payments = validatedData.totalPayments;
        if (validatedData.currentPayment !== undefined) updates.current_payment = validatedData.currentPayment;
        if (validatedData.paymentAmount !== undefined) updates.payment_amount = validatedData.paymentAmount;
        if (validatedData.minimumMonthlyPayment !== undefined) updates.minimum_monthly_payment = validatedData.minimumMonthlyPayment;
        if (validatedData.startDate !== undefined) updates.start_date = validatedData.startDate;
        if (validatedData.frequency !== undefined) updates.frequency = validatedData.frequency;
        if (validatedData.endDate !== undefined) updates.end_date = validatedData.endDate;
        if (validatedData.minimumPayment !== undefined) updates.minimum_payment = validatedData.minimumPayment;
        if (validatedData.isComplete !== undefined) updates.is_complete = validatedData.isComplete;

        const { data, error } = await supabase
          .from('payment_plans')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'Payment plan not found or no changes made' });
        }

        return res.status(200).json(mapPaymentPlan(data));
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
          .from('payment_plans')
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
