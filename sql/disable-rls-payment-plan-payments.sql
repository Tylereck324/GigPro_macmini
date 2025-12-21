-- Disable RLS on payment_plan_payments for single-user mode
-- Run this in the Supabase SQL Editor if you see:
-- "new row violates row-level security policy for table \"payment_plan_payments\""
ALTER TABLE payment_plan_payments DISABLE ROW LEVEL SECURITY;
