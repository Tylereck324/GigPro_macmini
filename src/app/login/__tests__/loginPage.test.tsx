import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LoginPage from '../page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock fetch for the status check
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: owner is configured, so login page shows
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ownerConfigured: true }),
    });
  });

  it('renders PIN input and submit button', async () => {
    render(<LoginPage />);

    // Wait for the loading state to finish
    await waitFor(() => {
      expect(screen.getByLabelText(/pin/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});
