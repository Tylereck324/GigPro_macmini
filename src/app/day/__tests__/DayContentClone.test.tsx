import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';
import { DayContent } from '../[date]/DayContent';

vi.mock('@/store', async () => {
  const actual = await vi.importActual<any>('@/store');
  return {
    ...actual,
    useIncomeForDate: () => [],
    useIncomeForMonth: () => [
      {
        id: '1',
        date: '2025-12-10',
        platform: 'DoorDash',
        customPlatformName: undefined,
        blockStartTime: null,
        blockEndTime: null,
        blockLength: null,
        amount: 50,
        notes: '',
        createdAt: 0,
        updatedAt: 0,
      },
    ],
    useIncomeActions: () => ({
      loadIncomeEntries: vi.fn().mockResolvedValue(undefined),
      addIncomeEntry: vi.fn().mockResolvedValue({ id: 'new-id' }),
      updateIncomeEntry: vi.fn(),
      deleteIncomeEntry: vi.fn(),
    }),
    useDailyDataStore: () => ({
      dailyData: {},
      loadDailyData: vi.fn().mockResolvedValue(undefined),
      updateDailyData: vi.fn(),
    }),
  };
});

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('DayContent clone flow', () => {
  test('opens clone modal and clones entries', async () => {
    render(
      <>
        <Toaster />
        <DayContent date="2025-12-15" />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: /Clone last income day/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Clone 1 entries/ }));

    await waitFor(() => {
      expect(screen.getByText(/Cloned 1 entries/)).toBeInTheDocument();
    });
  });
});
