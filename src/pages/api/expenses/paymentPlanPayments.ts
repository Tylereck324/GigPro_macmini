// src/pages/api/expenses/paymentPlanPayments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createPaymentPlanPaymentSchema } from '@/types/validation/expense.validation';
import type { CreatePaymentPlanPayment, PaymentPlanPayment } from '@/types/expense';
import { getAuthenticatedUser } from '@/lib/api/auth';

// Helper function to map snake_case to camelCase
const mapPaymentPlanPayment = (entry: any): PaymentPlanPayment => ({
  id: entry.id,
  paymentPlanId: entry.payment_plan_id,
  paymentNumber: entry.payment_number,
  dueDate: entry.due_date,
  isPaid: entry.is_paid,
  paidDate: entry.paid_date,
  month: entry.month,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user for all requests
  const user = await getAuthenticatedUser(req, res);
  if (!user) return; // Response already sent by getAuthenticatedUser

  if (req.method === 'POST') {
    try {
      const validatedData: CreatePaymentPlanPayment = createPaymentPlanPaymentSchema.parse(req.body);

      const { data, error } = await supabase
        .from('payment_plan_payments')
        .insert({
          user_id: user.id,
          payment_plan_id: validatedData.paymentPlanId,
          payment_number: validatedData.paymentNumber,
          due_date: validatedData.dueDate,
          is_paid: validatedData.isPaid,
          paid_date: validatedData.paidDate,
          month: validatedData.month,
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(mapPaymentPlanPayment(data[0]));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { paymentPlanId, month } = req.query;

      let query = supabase.from('payment_plan_payments').select('*');

      if (paymentPlanId && typeof paymentPlanId === 'string') {
        query = query.eq('payment_plan_id', paymentPlanId);
      }

      if (month && typeof month === 'string') {
        query = query.eq('month', month);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data.map(mapPaymentPlanPayment));
    } catch (error: any) {
      console.error('API error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
