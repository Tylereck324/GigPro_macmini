import { saveAs } from 'file-saver';
import { db } from '../db/schema';
import type { ExportData } from '@/types/settings';

/**
 * Export all data to JSON file
 */
export async function exportData(): Promise<void> {
  try {
    // Fetch all data from IndexedDB
    const [
      incomeEntries,
      dailyData,
      fixedExpenses,
      variableExpenses,
      paymentPlans,
      paymentPlanPayments,
      settings,
    ] = await Promise.all([
      db.incomeEntries.toArray(),
      db.dailyData.toArray(),
      db.fixedExpenses.toArray(),
      db.variableExpenses.toArray(),
      db.paymentPlans.toArray(),
      db.paymentPlanPayments.toArray(),
      db.settings.toArray(),
    ]);

    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        incomeEntries,
        dailyData,
        fixedExpenses,
        variableExpenses,
        paymentPlans,
        paymentPlanPayments,
        settings: settings[0] || {
          id: 'settings',
          theme: 'light',
          lastExportDate: null,
          lastImportDate: null,
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
    await db.settings.update('settings', {
      lastExportDate: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Import data from JSON file
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

    // Clear existing data
    await Promise.all([
      db.incomeEntries.clear(),
      db.dailyData.clear(),
      db.fixedExpenses.clear(),
      db.variableExpenses.clear(),
      db.paymentPlans.clear(),
      db.paymentPlanPayments.clear(),
    ]);

    // Import data
    await Promise.all([
      imported.data.incomeEntries && imported.data.incomeEntries.length > 0
        ? db.incomeEntries.bulkAdd(imported.data.incomeEntries)
        : Promise.resolve(),
      imported.data.dailyData && imported.data.dailyData.length > 0
        ? db.dailyData.bulkAdd(imported.data.dailyData)
        : Promise.resolve(),
      imported.data.fixedExpenses && imported.data.fixedExpenses.length > 0
        ? db.fixedExpenses.bulkAdd(imported.data.fixedExpenses)
        : Promise.resolve(),
      imported.data.variableExpenses && imported.data.variableExpenses.length > 0
        ? db.variableExpenses.bulkAdd(imported.data.variableExpenses)
        : Promise.resolve(),
      imported.data.paymentPlans && imported.data.paymentPlans.length > 0
        ? db.paymentPlans.bulkAdd(imported.data.paymentPlans)
        : Promise.resolve(),
      imported.data.paymentPlanPayments && imported.data.paymentPlanPayments.length > 0
        ? db.paymentPlanPayments.bulkAdd(imported.data.paymentPlanPayments)
        : Promise.resolve(),
    ]);

    // Update last import date in settings
    await db.settings.update('settings', {
      lastImportDate: Date.now(),
      updatedAt: Date.now(),
    });
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
    incomeCount,
    dailyDataCount,
    fixedExpenseCount,
    variableExpenseCount,
    paymentPlanCount,
    settings,
  ] = await Promise.all([
    db.incomeEntries.count(),
    db.dailyData.count(),
    db.fixedExpenses.count(),
    db.variableExpenses.count(),
    db.paymentPlans.count(),
    db.settings.get('settings'),
  ]);

  return {
    incomeEntries: incomeCount,
    dailyData: dailyDataCount,
    fixedExpenses: fixedExpenseCount,
    variableExpenses: variableExpenseCount,
    paymentPlans: paymentPlanCount,
    lastExportDate: settings?.lastExportDate || null,
    lastImportDate: settings?.lastImportDate || null,
  };
}

/**
 * Clear all data (with confirmation)
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.incomeEntries.clear(),
    db.dailyData.clear(),
    db.fixedExpenses.clear(),
    db.variableExpenses.clear(),
    db.paymentPlans.clear(),
    db.paymentPlanPayments.clear(),
  ]);
}
