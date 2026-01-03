import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Header } from '../Header';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace }),
}));

describe('Header logout', () => {
  it('logs out and redirects to /login', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as any);

    render(<Header />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' })
    );
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
