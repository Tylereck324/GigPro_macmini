import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayMetrics } from '../DayMetrics';
import type { DailyProfit } from '@/types/dailyData';

describe('DayMetrics', () => {
  test('renders nothing when no activity', () => {
    const profit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 0,
      gasExpense: 0,
      profit: 0,
      earningsPerMile: null,
    };

    const { container } = render(<DayMetrics profit={profit} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders income and profit when no expenses', () => {
    const profit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 250,
      gasExpense: 0,
      profit: 250,
      earningsPerMile: 5,
    };

    render(<DayMetrics profit={profit} />);

    // Should show income (amounts >= 100 show as whole dollars: "$250")
    expect(screen.getAllByText(/\$250/)[0]).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();

    // Should NOT show expenses line (gasExpense is 0)
    const expensesText = screen.queryByText('↓');
    expect(expensesText).not.toBeInTheDocument();

    // Should show profit
    expect(screen.getByText('=')).toBeInTheDocument();
  });

  test('renders all three lines when expenses exist', () => {
    const profit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 250,
      gasExpense: 80,
      profit: 170,
      earningsPerMile: 3.5,
    };

    render(<DayMetrics profit={profit} />);

    // Income line
    expect(screen.getByText('↑')).toBeInTheDocument();

    // Expenses line
    expect(screen.getByText('↓')).toBeInTheDocument();

    // Profit line
    expect(screen.getByText('=')).toBeInTheDocument();

    // All amounts should be visible
    // Amounts >= 100 show as whole dollars (e.g., "$250")
    // Amounts < 100 show with cents (e.g., "$80.00")
    expect(screen.getByText(/\$250/)).toBeInTheDocument();
    expect(screen.getByText(/\$80\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$170/)).toBeInTheDocument();
  });

  test('applies correct colors for profit line', () => {
    const positiveProfit: DailyProfit = {
      date: '2025-01-15',
      totalIncome: 250,
      gasExpense: 80,
      profit: 170,
      earningsPerMile: 3.5,
    };

    const { rerender } = render(<DayMetrics profit={positiveProfit} />);

    // Find profit amount (the one with 170) - amounts >= 100 show as "$170"
    const profitElement = screen.getByText(/\$170/);
    expect(profitElement).toHaveClass('text-success');

    // Test negative profit (amounts < 100 show with cents: "-$50.00")
    const negativeProfit: DailyProfit = {
      ...positiveProfit,
      profit: -50,
    };

    rerender(<DayMetrics profit={negativeProfit} />);
    const lossElement = screen.getByText(/-\$50\.00/);
    expect(lossElement).toHaveClass('text-danger');
  });
});

describe('DayMetrics integration', () => {
  test('handles null profit gracefully', () => {
    const { container } = render(<DayMetrics profit={null as any} />);
    expect(container.firstChild).toBeNull();
  });
});
