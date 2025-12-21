-- ============================================================================
-- MIGRATION: Add user_id and Enable RLS
-- ============================================================================

-- 0. Fix App Settings Schema (Allow Multiple Users)
-- The original schema forced a singleton with ID='settings'. We must fix this.
-- WARNING: This will delete existing settings if they conflict. 
-- Since we are migrating to multi-user, we assume we can start fresh or migrate carefully.
-- Here we just drop the constraint and allow UUIDs.

-- Drop the old primary key constraint (name might vary, so we drop the column default)
ALTER TABLE app_settings ALTER COLUMN id DROP DEFAULT;

-- If there is existing data with 'settings', we might want to keep it or clear it.
-- For a clean migration to RLS, let's clear it to avoid type casting issues if we change ID to UUID.
TRUNCATE TABLE app_settings;

-- Change ID to UUID
ALTER TABLE app_settings DROP COLUMN id;
ALTER TABLE app_settings ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE app_settings ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- 1. Add user_id column to all tables
ALTER TABLE income_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_data ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE payment_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE payment_plan_payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable RLS on all tables
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_payments ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Generic policy generator would be nice, but we'll do it explicitly for safety

-- Income Entries
CREATE POLICY "Users can view their own income entries" ON income_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own income entries" ON income_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own income entries" ON income_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own income entries" ON income_entries
  FOR DELETE USING (auth.uid() = user_id);

-- App Settings
CREATE POLICY "Users can view their own settings" ON app_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON app_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Goals
CREATE POLICY "Users can manage their own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- Daily Data
CREATE POLICY "Users can manage their own daily data" ON daily_data
  FOR ALL USING (auth.uid() = user_id);

-- Fixed Expenses
CREATE POLICY "Users can manage their own fixed expenses" ON fixed_expenses
  FOR ALL USING (auth.uid() = user_id);

-- Payment Plans
CREATE POLICY "Users can manage their own payment plans" ON payment_plans
  FOR ALL USING (auth.uid() = user_id);

-- Payment Plan Payments
CREATE POLICY "Users can manage their own payment plan payments" ON payment_plan_payments
  FOR ALL USING (auth.uid() = user_id);
