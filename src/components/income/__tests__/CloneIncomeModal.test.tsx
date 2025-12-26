import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloneIncomeModal } from '../CloneIncomeModal';
import type { IncomeEntry } from '@/types/income';

describe('CloneIncomeModal', () => {
  const entries: IncomeEntry[] = [
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
    {
      id: '2',
      date: '2025-12-10',
      platform: 'AmazonFlex',
      customPlatformName: undefined,
      blockStartTime: null,
      blockEndTime: null,
      blockLength: null,
      amount: 100,
      notes: '',
      createdAt: 0,
      updatedAt: 0,
    },
  ];

  test('renders default source date and all entries selected', () => {
    render(
      <CloneIncomeModal
        isOpen
        targetDate="2025-12-15"
        monthEntries={entries}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Source date')).toHaveValue('2025-12-10');
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.every((box) => (box as HTMLInputElement).checked)).toBe(true);
  });

  test('summary updates when selection changes', () => {
    render(
      <CloneIncomeModal
        isOpen
        targetDate="2025-12-15"
        monthEntries={entries}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Selected: 2/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText(/Selected: 1/)).toBeInTheDocument();
  });

  test('confirm calls onConfirm with selected entries and source date', () => {
    const onConfirm = vi.fn();
    render(
      <CloneIncomeModal
        isOpen
        targetDate="2025-12-15"
        monthEntries={entries}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Clone 2 entries/ }));

    expect(onConfirm).toHaveBeenCalledWith({
      sourceDate: '2025-12-10',
      selected: entries,
    });
  });
});
