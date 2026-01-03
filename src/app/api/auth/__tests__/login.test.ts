import { afterEach, describe, expect, it, vi } from 'vitest';

const signInWithPassword = vi.fn();
const createSupabaseServerClient = vi.fn(() => ({
  auth: { signInWithPassword },
}));

vi.mock('@/lib/supabase/ssr', () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    signInWithPassword.mockReset();
    createSupabaseServerClient.mockClear();
  });

  function makeRequest(body: unknown) {
    return {
      json: vi.fn(async () => body),
      cookies: { getAll: vi.fn(() => []) },
    } as any;
  }

  it('returns 400 for invalid PIN', async () => {
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';

    const response = await POST(makeRequest({ pin: '123' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    });
  });

  it('returns 401 when Supabase rejects login', async () => {
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';

    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login' },
    });

    const response = await POST(makeRequest({ pin: '123456' }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Invalid login' });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: '123456',
    });
  });

  it('returns 200 on success', async () => {
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';

    signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    const response = await POST(makeRequest({ pin: '123456' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });
});

