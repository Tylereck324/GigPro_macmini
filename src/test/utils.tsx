import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that wraps components with providers if needed
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Helper to create mock API responses
export function createMockResponse<T>(data: T, ok = true) {
  return {
    ok,
    json: async () => data,
    status: ok ? 200 : 400,
  } as Response;
}

// Helper to create mock Supabase responses
export function createSupabaseResponse<T>(data: T | null, error: any = null) {
  return {
    data,
    error,
  };
}

// Mock income entry factory
export function createMockIncomeEntry(overrides = {}) {
  return {
    id: 'test-id-1',
    date: '2025-12-01',
    platform: 'amazon_flex',
    customPlatformName: null,
    blockStartTime: '2025-12-01T10:00:00Z',
    blockEndTime: '2025-12-01T14:00:00Z',
    blockLength: 240,
    amount: 100,
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// Mock fixed expense factory
export function createMockFixedExpense(overrides = {}) {
  return {
    id: 'expense-1',
    name: 'Rent',
    amount: 1500,
    dueDate: 1,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}
