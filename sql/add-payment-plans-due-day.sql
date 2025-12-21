-- Add optional due day to payment plans (1-31)
-- Run in Supabase SQL Editor
ALTER TABLE payment_plans
  ADD COLUMN IF NOT EXISTS due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31);
