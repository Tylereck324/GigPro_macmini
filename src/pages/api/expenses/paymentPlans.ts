// src/pages/api/expenses/paymentPlans.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createPaymentPlanSchema } from '@/types/validation/expense.validation';
import type { CreatePaymentPlan, PaymentPlan } from '@/types/expense';
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

  if (req.method === 'POST') {
    try {
      const validatedData: CreatePaymentPlan = createPaymentPlanSchema.parse(req.body);

      const { data, error } = await supabase
        .from('payment_plans')
        .insert({
          name: validatedData.name,
          provider: validatedData.provider,
          initial_cost: validatedData.initialCost,
          total_payments: validatedData.totalPayments,
          current_payment: validatedData.currentPayment,
          payment_amount: validatedData.paymentAmount,
          minimum_monthly_payment: validatedData.minimumMonthlyPayment,
          start_date: validatedData.startDate,
          frequency: validatedData.frequency,
          end_date: validatedData.endDate,
          minimum_payment: validatedData.minimumPayment,
          is_complete: validatedData.isComplete,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(mapPaymentPlan(data[0]));
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
        .from('payment_plans')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data.map(mapPaymentPlan));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
