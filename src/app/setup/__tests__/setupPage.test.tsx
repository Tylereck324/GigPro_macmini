import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SetupPage from '../page';

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

describe('SetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders setup form when owner not configured (first run)', async () => {
    // Owner not configured - show setup form
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ownerConfigured: false }),
    });

    render(<SetupPage />);

    // Wait for the loading state to finish
    await waitFor(() => {
      expect(screen.getByText(/welcome to gigpro/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/setup token/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument();
  });

  it('renders reset PIN form when owner is configured', async () => {
    // Owner configured - show reset form only
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ownerConfigured: true }),
    });

    render(<SetupPage />);

    // Wait for the loading state to finish and reset form to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset pin/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/setup token/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset pin/i })).toBeInTheDocument();
  });
});
