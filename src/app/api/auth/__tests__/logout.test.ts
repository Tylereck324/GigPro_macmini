import { afterEach, describe, expect, it, vi } from 'vitest';

const signOut = vi.fn();
const createSupabaseServerClient = vi.fn(() => ({
  auth: { signOut },
}));

vi.mock('@/lib/supabase/ssr', () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  afterEach(() => {
    signOut.mockReset();
    createSupabaseServerClient.mockClear();
  });

  function makeRequest() {
    return {
      cookies: { getAll: vi.fn(() => []) },
    } as any;
  }

  it('signs out and returns ok', async () => {
    signOut.mockResolvedValue({ error: null });

    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

