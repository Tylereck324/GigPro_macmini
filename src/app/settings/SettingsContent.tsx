'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Card, Button, ConfirmDialog } from '@/components/ui';
import { exportData, importData, getDataStats, clearAllData } from '@/lib/utils/exportImport';
import { useStore } from '@/store';

export function SettingsContent() {
  const [stats, setStats] = useState({
    incomeEntries: 0,
    dailyData: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    paymentPlans: 0,
    lastExportDate: null as number | null,
    lastImportDate: null as number | null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [clearConfirmStep, setClearConfirmStep] = useState<0 | 1 | 2>(0);

  const loadIncomeEntries = useStore((state) => state.loadIncomeEntries);
  const loadDailyData = useStore((state) => state.loadDailyData);
  const loadFixedExpenses = useStore((state) => state.loadFixedExpenses);
  const loadVariableExpenses = useStore((state) => state.loadVariableExpenses);
  const loadPaymentPlans = useStore((state) => state.loadPaymentPlans);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDataStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load data overview');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportData();
      toast.success('Data exported successfully!');
      await loadStats();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImportFile(file);
    setIsImportConfirmOpen(true);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;

    setIsImportConfirmOpen(false);
    setIsImporting(true);
    try {
      await importData(pendingImportFile);
      toast.success('Data imported successfully!');

      // Reload all data in store
      await Promise.all([
        loadIncomeEntries(),
        loadDailyData(),
        loadFixedExpenses(),
        loadVariableExpenses(),
        loadPaymentPlans(),
      ]);

      await loadStats();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import data');
    } finally {
      setIsImporting(false);
      setPendingImportFile(null);
      resetFileInput();
    }
  };

  const cancelImport = () => {
    setIsImportConfirmOpen(false);
    setPendingImportFile(null);
    resetFileInput();
  };

  const openClearConfirm = () => setClearConfirmStep(1);

  const confirmClear = async () => {
    if (clearConfirmStep === 1) {
      setClearConfirmStep(2);
      return;
    }

    if (clearConfirmStep !== 2) return;

    setClearConfirmStep(0);
    setIsClearing(true);

    try {
      await clearAllData();
      toast.success('All data cleared');

      // Reload stores
      await Promise.all([
        loadIncomeEntries(),
        loadDailyData(),
        loadFixedExpenses(),
        loadVariableExpenses(),
        loadPaymentPlans(),
      ]);

      await loadStats();
    } catch (error) {
      console.error('Clear data error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  const cancelClear = () => setClearConfirmStep(0);

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Settings</h1>
          <p className="text-textSecondary">Manage your data and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Data Statistics */}
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">Data Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{stats.incomeEntries}</div>
                <div className="text-sm text-textSecondary">Income Entries</div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{stats.dailyData}</div>
                <div className="text-sm text-textSecondary">Days with Expenses</div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{stats.fixedExpenses}</div>
                <div className="text-sm text-textSecondary">Fixed Expenses</div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{stats.variableExpenses}</div>
                <div className="text-sm text-textSecondary">Variable Expenses</div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{stats.paymentPlans}</div>
                <div className="text-sm text-textSecondary">Payment Plans</div>
              </div>
            </div>
          </Card>

          {/* Export/Import */}
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">Data Backup</h2>

            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-sm text-textSecondary mb-1">Last Export:</div>
                <div className="text-text font-medium">{formatDate(stats.lastExportDate)}</div>
              </div>

              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="text-sm text-textSecondary mb-1">Last Import:</div>
                <div className="text-text font-medium">{formatDate(stats.lastImportDate)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="primary"
                  onClick={handleExport}
                  disabled={isExporting}
                  fullWidth
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>

                <div>
                  <label className="block cursor-pointer">
                    <span
                      className={`
                        inline-flex items-center justify-center w-full px-4 py-2 text-base font-medium rounded-lg
                        transition-all duration-200
                        ${isImporting
                          ? 'bg-secondary opacity-50 cursor-not-allowed'
                          : 'bg-secondary hover:opacity-90 text-white'
                        }
                      `}
                    >
                      <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                      {isImporting ? 'Importing...' : 'Import Data'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                </div>
              </div>

              <div className="text-sm text-textSecondary space-y-1">
                <p>• Export creates a JSON backup file of all your data</p>
                <p>• Import replaces all existing data with data from a backup file</p>
                <p>• Always export before importing to avoid data loss</p>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card>
            <h2 className="text-xl font-semibold text-danger mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <p className="text-textSecondary">
                Permanently delete all data from the app. This action cannot be undone.
              </p>
              <Button variant="danger" onClick={openClearConfirm} disabled={isClearing}>
                <TrashIcon className="h-5 w-5 mr-2" />
                {isClearing ? 'Deleting...' : 'Delete All Data'}
              </Button>
            </div>
          </Card>

          {/* About */}
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">About GigPro</h2>
            <div className="space-y-2 text-textSecondary">
              <p>Version: 1.0.0</p>
              <p>A comprehensive gig worker tracking application</p>
              <p className="text-sm mt-4">
                Your data is stored in your Supabase database and synced across devices.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isImportConfirmOpen}
        onCancel={cancelImport}
        onConfirm={confirmImport}
        title="Import Data"
        message="Importing will replace all existing data. Are you sure you want to continue?"
        confirmLabel="Import"
        variant="primary"
      />

      <ConfirmDialog
        isOpen={clearConfirmStep !== 0}
        onCancel={cancelClear}
        onConfirm={confirmClear}
        title="Delete All Data"
        message={
          clearConfirmStep === 1
            ? 'Are you sure you want to delete ALL data? This action cannot be undone!'
            : 'This will permanently delete everything. Are you absolutely sure?'
        }
        confirmLabel={clearConfirmStep === 1 ? 'Continue' : 'Delete'}
        variant="danger"
      />
    </>
  );
}
