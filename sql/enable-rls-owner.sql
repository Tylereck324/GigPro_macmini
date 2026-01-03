-- ============================================================================
-- MIGRATION: Owner-only RLS (single-user, auth required)
-- ============================================================================
-- This script enables Row Level Security on all application tables and allows
-- access ONLY to a single configured "owner" user.
--
-- Required app-side behavior:
-- - Create an owner Supabase Auth user (email/password) via service role.
-- - Upsert `public.app_owner` with `id = true` and `owner_user_id = <owner uuid>`.
--
-- Notes:
-- - `public.app_owner` is intentionally NOT readable/writable by clients.
-- - `public.is_app_owner()` is SECURITY DEFINER so it can read `app_owner`
--   even though clients cannot.

-- ----------------------------------------------------------------------------
-- 0) Owner singleton table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_owner (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_owner_singleton'
  ) THEN
    ALTER TABLE public.app_owner
      ADD CONSTRAINT app_owner_singleton CHECK (id IS TRUE);
  END IF;
END $$;

ALTER TABLE public.app_owner ENABLE ROW LEVEL SECURITY;

-- No RLS policies for app_owner (clients should not read/write it).
REVOKE ALL ON TABLE public.app_owner FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1) Helper: is the current user the configured owner?
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_app_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.uid() = (SELECT owner_user_id FROM public.app_owner WHERE id IS TRUE LIMIT 1),
    FALSE
  );
$$;

-- ----------------------------------------------------------------------------
-- 2) Enable RLS on application tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3) Owner-only policies
-- ----------------------------------------------------------------------------

-- Income Entries
DROP POLICY IF EXISTS "Owner full access" ON public.income_entries;
CREATE POLICY "Owner full access" ON public.income_entries
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- Daily Data
DROP POLICY IF EXISTS "Owner full access" ON public.daily_data;
CREATE POLICY "Owner full access" ON public.daily_data
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- Goals
DROP POLICY IF EXISTS "Owner full access" ON public.goals;
CREATE POLICY "Owner full access" ON public.goals
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- Fixed Expenses
DROP POLICY IF EXISTS "Owner full access" ON public.fixed_expenses;
CREATE POLICY "Owner full access" ON public.fixed_expenses
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- Variable Expenses
DROP POLICY IF EXISTS "Owner full access" ON public.variable_expenses;
CREATE POLICY "Owner full access" ON public.variable_expenses
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- Payment Plans
DROP POLICY IF EXISTS "Owner full access" ON public.payment_plans;
CREATE POLICY "Owner full access" ON public.payment_plans
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- Payment Plan Payments
DROP POLICY IF EXISTS "Owner full access" ON public.payment_plan_payments;
CREATE POLICY "Owner full access" ON public.payment_plan_payments
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

-- App Settings
DROP POLICY IF EXISTS "Owner full access" ON public.app_settings;
CREATE POLICY "Owner full access" ON public.app_settings
  FOR ALL
  USING (public.is_app_owner())
  WITH CHECK (public.is_app_owner());

