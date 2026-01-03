import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsContent } from '../SettingsContent';

const exportImportMocks = vi.hoisted(() => ({
  exportData: vi.fn().mockResolvedValue(undefined),
  importData: vi.fn().mockResolvedValue(undefined),
  getDataStats: vi.fn().mockResolvedValue({
    incomeEntries: 0,
    dailyData: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    paymentPlans: 0,
    lastExportDate: null,
    lastImportDate: null,
  }),
  clearAllData: vi.fn().mockResolvedValue(undefined),
}));

const storeMocks = vi.hoisted(() => ({
  loadIncomeEntries: vi.fn().mockResolvedValue(undefined),
  loadDailyData: vi.fn().mockResolvedValue(undefined),
  loadFixedExpenses: vi.fn().mockResolvedValue(undefined),
  loadVariableExpenses: vi.fn().mockResolvedValue(undefined),
  loadPaymentPlans: vi.fn().mockResolvedValue(undefined),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/lib/utils/exportImport', () => exportImportMocks);
vi.mock('@/store', () => ({
  useStore: (selector: any) => selector(storeMocks),
}));
vi.mock('react-hot-toast', () => ({ default: toastMocks }));

describe('SettingsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders accurate storage information (Supabase, not IndexedDB)', async () => {
    render(<SettingsContent />);

    // Wait for initial stats load (avoids act warnings)
    await waitFor(() => expect(exportImportMocks.getDataStats).toHaveBeenCalled());

    expect(screen.getByText(/supabase/i)).toBeInTheDocument();
    expect(screen.queryByText(/indexeddb/i)).not.toBeInTheDocument();
  });

  it('uses ConfirmDialog for delete-all flow (no window.confirm)', async () => {
    render(<SettingsContent />);

    await waitFor(() => expect(exportImportMocks.getDataStats).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /delete all data/i }));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('uses ConfirmDialog for import flow (no window.confirm)', async () => {
    const { container } = render(<SettingsContent />);

    await waitFor(() => expect(exportImportMocks.getDataStats).toHaveBeenCalled());

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();

    const file = new File([JSON.stringify({ version: '1.0', exportDate: new Date().toISOString(), data: {} })], 'backup.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
