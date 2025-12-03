-- GigPro Supabase Database Schema
-- Complete schema for all application tables
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. INCOME ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  custom_platform_name TEXT,
  block_start_time TIMESTAMPTZ,
  block_end_time TIMESTAMPTZ,
  block_length INTEGER, -- minutes
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for income_entries
CREATE INDEX IF NOT EXISTS idx_income_entries_date ON income_entries(date);
CREATE INDEX IF NOT EXISTS idx_income_entries_platform ON income_entries(platform);
CREATE INDEX IF NOT EXISTS idx_income_entries_created_at ON income_entries(created_at);

-- ============================================================================
-- 2. APP SETTINGS TABLE (Singleton)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  last_export_date TIMESTAMPTZ,
  last_import_date TIMESTAMPTZ,
  amazon_flex_daily_capacity INTEGER NOT NULL DEFAULT 480, -- 8 hours in minutes
  amazon_flex_weekly_capacity INTEGER NOT NULL DEFAULT 2400, -- 40 hours in minutes
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert default settings row
INSERT INTO app_settings (id, theme, amazon_flex_daily_capacity, amazon_flex_weekly_capacity)
VALUES ('settings', 'light', 480, 2400)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  target_amount DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_period ON goals(period);
CREATE INDEX IF NOT EXISTS idx_goals_start_date ON goals(start_date);
CREATE INDEX IF NOT EXISTS idx_goals_is_active ON goals(is_active);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);

-- ============================================================================
-- 4. DAILY DATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  mileage DECIMAL(10, 2),
  gas_expense DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique index for date
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_data_date ON daily_data(date);

-- ============================================================================
-- 5. FIXED EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fixed_expenses
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_is_active ON fixed_expenses(is_active);

-- ============================================================================
-- 6. VARIABLE EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS variable_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM format
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for variable_expenses
CREATE INDEX IF NOT EXISTS idx_variable_expenses_month ON variable_expenses(month);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_is_paid ON variable_expenses(is_paid);

-- ============================================================================
-- 7. PAYMENT PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  initial_cost DECIMAL(10, 2) NOT NULL,
  total_payments INTEGER NOT NULL,
  current_payment INTEGER NOT NULL DEFAULT 1,
  payment_amount DECIMAL(10, 2) NOT NULL,
  minimum_monthly_payment DECIMAL(10, 2),
  start_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  end_date DATE,
  minimum_payment DECIMAL(10, 2),
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for payment_plans
CREATE INDEX IF NOT EXISTS idx_payment_plans_is_complete ON payment_plans(is_complete);

-- ============================================================================
-- 8. PAYMENT PLAN PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_plan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  month TEXT NOT NULL, -- YYYY-MM format
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for payment_plan_payments
CREATE INDEX IF NOT EXISTS idx_payment_plan_payments_plan_id ON payment_plan_payments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_payments_month ON payment_plan_payments(month);
CREATE INDEX IF NOT EXISTS idx_payment_plan_payments_is_paid ON payment_plan_payments(is_paid);

-- ============================================================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_income_entries_updated_at ON income_entries;
CREATE TRIGGER update_income_entries_updated_at
  BEFORE UPDATE ON income_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_data_updated_at ON daily_data;
CREATE TRIGGER update_daily_data_updated_at
  BEFORE UPDATE ON daily_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixed_expenses_updated_at ON fixed_expenses;
CREATE TRIGGER update_fixed_expenses_updated_at
  BEFORE UPDATE ON fixed_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_variable_expenses_updated_at ON variable_expenses;
CREATE TRIGGER update_variable_expenses_updated_at
  BEFORE UPDATE ON variable_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_plans_updated_at ON payment_plans;
CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_plan_payments_updated_at ON payment_plan_payments;
CREATE TRIGGER update_payment_plan_payments_updated_at
  BEFORE UPDATE ON payment_plan_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Disable for now (single user app)
-- ============================================================================
-- If you plan to add authentication later, uncomment these:
-- ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_plan_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. All IDs use UUID (gen_random_uuid()) instead of nanoid
-- 2. Timestamps are stored as TIMESTAMPTZ (timestamp with timezone)
-- 3. All numeric amounts use DECIMAL(10, 2) for precision
-- 4. Auto-update triggers handle updated_at fields
-- 5. Foreign key constraint on payment_plan_payments.payment_plan_id with CASCADE delete
-- 6. RLS is disabled by default (single-user app)
