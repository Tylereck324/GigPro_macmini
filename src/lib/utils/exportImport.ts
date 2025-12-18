import { saveAs } from 'file-saver';
import { supabase } from '../supabase';
import type { ExportData } from '@/types/settings';

/**
 * Export all data to JSON file
 * In single-user mode, this fetches all data without user_id filtering.
 */
export async function exportData(): Promise<void> {
  try {
    // Fetch all data from Supabase
    const [
      { data: incomeEntries },
      { data: dailyData },
      { data: fixedExpenses },
      { data: variableExpenses },
      { data: paymentPlans },
      { data: paymentPlanPayments },
      { data: settings },
    ] = await Promise.all([
      supabase.from('income_entries').select('*'),
      supabase.from('daily_data').select('*'),
      supabase.from('fixed_expenses').select('*'),
      supabase.from('variable_expenses').select('*'),
      supabase.from('payment_plans').select('*'),
      supabase.from('payment_plan_payments').select('*'),
      supabase.from('app_settings').select('*').eq('id', 'settings').maybeSingle(), // Use maybeSingle now that it might not exist
    ]);

    // Map data from snake_case to camelCase
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        incomeEntries: (incomeEntries || []).map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          platform: entry.platform,
          customPlatformName: entry.custom_platform_name,
          blockStartTime: entry.block_start_time,
          blockEndTime: entry.block_end_time,
          blockLength: entry.block_length,
          amount: entry.amount,
          notes: entry.notes,
          createdAt: new Date(entry.created_at).getTime(),
          updatedAt: new Date(entry.updated_at).getTime(),
        })),
        dailyData: (dailyData || []).map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          mileage: entry.mileage,
          gasExpense: entry.gas_expense,
          createdAt: new Date(entry.created_at).getTime(),
          updatedAt: new Date(entry.updated_at).getTime(),
        })),
        fixedExpenses: (fixedExpenses || []).map((entry: any) => ({
          id: entry.id,
          name: entry.name,
          amount: entry.amount,
          dueDate: entry.due_date,
          isActive: entry.is_active,
          createdAt: new Date(entry.created_at).getTime(),
          updatedAt: new Date(entry.updated_at).getTime(),
        })),
        variableExpenses: (variableExpenses || []).map((entry: any) => ({
          id: entry.id,
          name: entry.name,
          amount: entry.amount,
          category: entry.category,
          month: entry.month,
          isPaid: entry.is_paid,
          paidDate: entry.paid_date,
          createdAt: new Date(entry.created_at).getTime(),
          updatedAt: new Date(entry.updated_at).getTime(),
        })),
        paymentPlans: (paymentPlans || []).map((entry: any) => ({
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
        })),
        paymentPlanPayments: (paymentPlanPayments || []).map((entry: any) => ({
          id: entry.id,
          paymentPlanId: entry.payment_plan_id,
          paymentNumber: entry.payment_number,
          dueDate: entry.due_date,
          isPaid: entry.is_paid,
          paidDate: entry.paid_date,
          month: entry.month,
          createdAt: new Date(entry.created_at).getTime(),
          updatedAt: new Date(entry.updated_at).getTime(),
        })),
        settings: settings
          ? {
              id: settings.id,
              theme: settings.theme,
              lastExportDate: settings.last_export_date ? new Date(settings.last_export_date).getTime() : null,
              lastImportDate: settings.last_import_date ? new Date(settings.last_import_date).getTime() : null,
              amazonFlexDailyCapacity: settings.amazon_flex_daily_capacity,
              amazonFlexWeeklyCapacity: settings.amazon_flex_weekly_capacity,
              updatedAt: new Date(settings.updated_at).getTime(),
            }
          : {
              id: 'settings',
              theme: 'light',
              lastExportDate: null,
              lastImportDate: null,
              amazonFlexDailyCapacity: 480,
              amazonFlexWeeklyCapacity: 2400,
              updatedAt: Date.now(),
            },
      },
    };

    // Create JSON blob
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `gigpro-backup-${date}.json`;

    // Download file
    saveAs(blob, filename);

    // Update last export date in settings
    await supabase
      .from('app_settings')
      .update({
        last_export_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'settings');
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Import data from JSON file
 * In single-user mode, this inserts data directly without user_id attribution.
 */
export async function importData(file: File): Promise<void> {
  try {
    // Read file
    const text = await file.text();
    const imported: ExportData = JSON.parse(text);

    // Validate version
    if (imported.version !== '1.0') {
      throw new Error(`Unsupported export version: ${imported.version}`);
    }

    // Validate data structure
    if (!imported.data || typeof imported.data !== 'object') {
      throw new Error('Invalid export file format');
    }

    // Clear existing data (all data, no user_id filter needed)
    await Promise.all([
      supabase.from('income_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('daily_data').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('fixed_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('variable_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('payment_plan_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('payment_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);

    // Import income entries (map camelCase to snake_case)
    if (imported.data.incomeEntries && imported.data.incomeEntries.length > 0) {
      const { error: incomeError } = await supabase.from('income_entries').insert(
        imported.data.incomeEntries.map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          platform: entry.platform,
          custom_platform_name: entry.customPlatformName,
          block_start_time: entry.blockStartTime,
          block_end_time: entry.blockEndTime,
          block_length: entry.blockLength,
          amount: entry.amount,
          notes: entry.notes,
          created_at: new Date(entry.createdAt).toISOString(),
          updated_at: new Date(entry.updatedAt).toISOString(),
        }))
      );
      if (incomeError) {
        console.error('Failed to import income entries:', incomeError);
        throw new Error(`Failed to import income entries: ${incomeError.message}`);
      }
    }

    // Import daily data
    if (imported.data.dailyData && imported.data.dailyData.length > 0) {
      const { error: dailyDataError } = await supabase.from('daily_data').insert(
        imported.data.dailyData.map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          mileage: entry.mileage,
          gas_expense: entry.gasExpense,
          created_at: new Date(entry.createdAt).toISOString(),
          updated_at: new Date(entry.updatedAt).toISOString(),
        }))
      );
      if (dailyDataError) {
        console.error('Failed to import daily data:', dailyDataError);
        throw new Error(`Failed to import daily data: ${dailyDataError.message}`);
      }
    }

    // Import fixed expenses
    if (imported.data.fixedExpenses && imported.data.fixedExpenses.length > 0) {
      const { error: fixedExpensesError } = await supabase.from('fixed_expenses').insert(
        imported.data.fixedExpenses.map((entry: any) => ({
          id: entry.id,
          name: entry.name,
          amount: entry.amount,
          due_date: entry.dueDate,
          is_active: entry.isActive,
          created_at: new Date(entry.createdAt).toISOString(),
          updated_at: new Date(entry.updatedAt).toISOString(),
        }))
      );
      if (fixedExpensesError) {
        console.error('Failed to import fixed expenses:', fixedExpensesError);
        throw new Error(`Failed to import fixed expenses: ${fixedExpensesError.message}`);
      }
    }

    // Import variable expenses
    if (imported.data.variableExpenses && imported.data.variableExpenses.length > 0) {
      const { error: variableExpensesError } = await supabase.from('variable_expenses').insert(
        imported.data.variableExpenses.map((entry: any) => ({
          id: entry.id,
          name: entry.name,
          amount: entry.amount,
          category: entry.category,
          month: entry.month,
          is_paid: entry.isPaid,
          paid_date: entry.paidDate,
          created_at: new Date(entry.createdAt).toISOString(),
          updated_at: new Date(entry.updatedAt).toISOString(),
        }))
      );
      if (variableExpensesError) {
        console.error('Failed to import variable expenses:', variableExpensesError);
        throw new Error(`Failed to import variable expenses: ${variableExpensesError.message}`);
      }
    }

    // Import payment plans
    if (imported.data.paymentPlans && imported.data.paymentPlans.length > 0) {
      const { error: paymentPlansError } = await supabase.from('payment_plans').insert(
        imported.data.paymentPlans.map((entry: any) => ({
          id: entry.id,
          name: entry.name,
          provider: entry.provider,
          initial_cost: entry.initialCost,
          total_payments: entry.totalPayments,
          current_payment: entry.currentPayment,
          payment_amount: entry.paymentAmount,
          minimum_monthly_payment: entry.minimumMonthlyPayment,
          start_date: entry.startDate,
          frequency: entry.frequency,
          end_date: entry.endDate,
          minimum_payment: entry.minimumPayment,
          is_complete: entry.isComplete,
          created_at: new Date(entry.createdAt).toISOString(),
          updated_at: new Date(entry.updatedAt).toISOString(),
        }))
      );
      if (paymentPlansError) {
        console.error('Failed to import payment plans:', paymentPlansError);
        throw new Error(`Failed to import payment plans: ${paymentPlansError.message}`);
      }
    }

    // Import payment plan payments
    if (imported.data.paymentPlanPayments && imported.data.paymentPlanPayments.length > 0) {
      const { error: paymentPlanPaymentsError } = await supabase.from('payment_plan_payments').insert(
        imported.data.paymentPlanPayments.map((entry: any) => ({
          id: entry.id,
          payment_plan_id: entry.paymentPlanId,
          payment_number: entry.paymentNumber,
          due_date: entry.dueDate,
          is_paid: entry.isPaid,
          paid_date: entry.paidDate,
          month: entry.month,
          created_at: new Date(entry.createdAt).toISOString(),
          updated_at: new Date(entry.updatedAt).toISOString(),
        }))
      );
      if (paymentPlanPaymentsError) {
        console.error('Failed to import payment plan payments:', paymentPlanPaymentsError);
        throw new Error(`Failed to import payment plan payments: ${paymentPlanPaymentsError.message}`);
      }
    }

    // Import settings
    if (imported.data.settings) {
      // For single-user, we expect one settings entry with id 'settings'
      const { error: upsertError } = await supabase
        .from('app_settings')
        .upsert({ ...imported.data.settings, id: 'settings' }, { onConflict: 'id' });
      if (upsertError) throw new Error(`Failed to import settings: ${upsertError.message}`);
    }


    // Update last import date in settings
    await supabase
      .from('app_settings')
      .update({
        last_import_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'settings');
  } catch (error) {
    console.error('Import failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to import data: ${error.message}`);
    }
    throw new Error('Failed to import data');
  }
}

/**
 * Get import/export statistics
 */
export async function getDataStats() {
  const [
    { count: incomeCount },
    { count: dailyDataCount },
    { count: fixedExpenseCount },
    { count: variableExpenseCount },
    { count: paymentPlanCount },
    { data: settings },
  ] = await Promise.all([
    supabase.from('income_entries').select('*', { count: 'exact', head: true }),
    supabase.from('daily_data').select('*', { count: 'exact', head: true }),
    supabase.from('fixed_expenses').select('*', { count: 'exact', head: true }),
    supabase.from('variable_expenses').select('*', { count: 'exact', head: true }),
    supabase.from('payment_plans').select('*', { count: 'exact', head: true }),
    supabase.from('app_settings').select('*').eq('id', 'settings').maybeSingle(),
  ]);

  return {
    incomeEntries: incomeCount || 0,
    dailyData: dailyDataCount || 0,
    fixedExpenses: fixedExpenseCount || 0,
    variableExpenses: variableExpenseCount || 0,
    paymentPlans: paymentPlanCount || 0,
    lastExportDate: settings?.last_export_date ? new Date(settings.last_export_date).getTime() : null,
    lastImportDate: settings?.last_import_date ? new Date(settings.last_import_date).getTime() : null,
  };
}

/**
 * Clear all data (with confirmation)
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    supabase.from('income_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('daily_data').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('fixed_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('variable_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('payment_plan_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('payment_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);
}
