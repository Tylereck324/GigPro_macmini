/**
 * Database row types for Supabase tables
 * These types represent the raw data returned from PostgreSQL with snake_case naming
 * Used for type-safe database operations in API layer
 */

// ============================================================================
// Income Entries Table
// ============================================================================

/**
 * Raw database row for income_entries table
 * Note: DECIMAL columns may be returned as strings by PostgREST
 */
export interface IncomeEntryRow {
  id: string;
  date: string;
  platform: string;
  custom_platform_name: string | null;
  block_start_time: string | null;
  block_end_time: string | null;
  block_length: number | null;
  amount: string | number; // DECIMAL(10,2) - may be string
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Partial update payload for income_entries
 */
export interface IncomeEntryUpdate {
  date?: string;
  platform?: string;
  custom_platform_name?: string | null;
  block_start_time?: string | null;
  block_end_time?: string | null;
  block_length?: number | null;
  amount?: number;
  notes?: string;
}

// ============================================================================
// Daily Data Table
// ============================================================================

/**
 * Raw database row for daily_data table
 */
export interface DailyDataRow {
  id: string;
  date: string;
  mileage: string | number | null; // DECIMAL - may be string
  gas_expense: string | number | null; // DECIMAL - may be string
  created_at: string;
  updated_at: string;
}

/**
 * Partial update payload for daily_data
 */
export interface DailyDataUpdate {
  date?: string;
  mileage?: number | null;
  gas_expense?: number | null;
}

// ============================================================================
// Goals Table
// ============================================================================

/**
 * Raw database row for goals table
 */
export interface GoalRow {
  id: string;
  name: string;
  period: string;
  target_amount: string | number; // DECIMAL - may be string
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Partial update payload for goals
 */
export interface GoalUpdate {
  name?: string;
  period?: string;
  target_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  priority?: number;
}

// ============================================================================
// Fixed Expenses Table
// ============================================================================

/**
 * Raw database row for fixed_expenses table
 */
export interface FixedExpenseRow {
  id: string;
  name: string;
  amount: string | number; // DECIMAL - may be string
  due_date: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Partial update payload for fixed_expenses
 */
export interface FixedExpenseUpdate {
  name?: string;
  amount?: number;
  due_date?: number;
  is_active?: boolean;
}

// ============================================================================
// Payment Plans Table
// ============================================================================

/**
 * Raw database row for payment_plans table
 */
export interface PaymentPlanRow {
  id: string;
  name: string;
  provider: string;
  initial_cost: string | number; // DECIMAL - may be string
  total_payments: number;
  current_payment: number;
  payment_amount: string | number; // DECIMAL - may be string
  minimum_monthly_payment: string | number | null; // DECIMAL - may be string
  due_day: number | null;
  start_date: string;
  frequency: string;
  end_date: string | null;
  minimum_payment: string | number | null; // DECIMAL - may be string
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Partial update payload for payment_plans
 */
export interface PaymentPlanUpdate {
  name?: string;
  provider?: string;
  initial_cost?: number;
  total_payments?: number;
  current_payment?: number;
  payment_amount?: number;
  minimum_monthly_payment?: number | null;
  due_day?: number | null;
  start_date?: string;
  frequency?: string;
  end_date?: string | null;
  minimum_payment?: number | null;
  is_complete?: boolean;
}

// ============================================================================
// Payment Plan Payments Table
// ============================================================================

/**
 * Raw database row for payment_plan_payments table
 */
export interface PaymentPlanPaymentRow {
  id: string;
  payment_plan_id: string;
  payment_number: number;
  due_date: string;
  is_paid: boolean;
  paid_date: string | null;
  month: string;
  created_at: string;
  updated_at: string;
}

/**
 * Partial update payload for payment_plan_payments
 */
export interface PaymentPlanPaymentUpdate {
  payment_plan_id?: string;
  payment_number?: number;
  due_date?: string;
  is_paid?: boolean;
  paid_date?: string | null;
  month?: string;
}

// ============================================================================
// App Settings Table
// ============================================================================

/**
 * Raw database row for app_settings table
 */
export interface AppSettingsRow {
  id: string;
  theme: string;
  last_export_date: string | null;
  last_import_date: string | null;
  amazon_flex_daily_capacity: number;
  amazon_flex_weekly_capacity: number;
  updated_at: string;
}

/**
 * Partial update payload for app_settings
 */
export interface AppSettingsUpdate {
  theme?: string;
  last_export_date?: string | null;
  last_import_date?: string | null;
  amazon_flex_daily_capacity?: number;
  amazon_flex_weekly_capacity?: number;
}
