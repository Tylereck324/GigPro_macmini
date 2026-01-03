import { afterEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const from = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle,
    })),
  })),
}));

const updateUserById = vi.fn();
const createSupabaseAdminClient = vi.fn(() => ({
  from,
  auth: { admin: { updateUserById } },
}));

vi.mock('@/lib/supabase/admin', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/admin')>(
    '@/lib/supabase/admin'
  );
  return {
    ...actual,
    createSupabaseAdminClient: (...args: unknown[]) =>
      createSupabaseAdminClient(...args),
  };
});

const signInWithPassword = vi.fn();
const createSupabaseServerClient = vi.fn(() => ({
  auth: { signInWithPassword },
}));

vi.mock('@/lib/supabase/ssr', () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { POST } from '@/app/api/auth/reset-pin/route';

describe('POST /api/auth/reset-pin', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    maybeSingle.mockReset();
    from.mockClear();
    updateUserById.mockReset();
    createSupabaseAdminClient.mockClear();
    signInWithPassword.mockReset();
    createSupabaseServerClient.mockClear();
  });

  function setRequiredEnv() {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';
    process.env.GIGPRO_SETUP_TOKEN = 'setup_token';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key';
  }

  function makeRequest(body: unknown) {
    return {
      json: vi.fn(async () => body),
      cookies: { getAll: vi.fn(() => []) },
    } as any;
  }

  it('returns 403 for wrong setup token', async () => {
    setRequiredEnv();

    const response = await POST(makeRequest({ setupToken: 'wrong', pin: '123456' }));
    expect(response.status).toBe(403);
  });

  it('returns 409 when owner is not configured', async () => {
    setRequiredEnv();
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(makeRequest({ setupToken: 'setup_token', pin: '123456' }));
    expect(response.status).toBe(409);
  });

  it('updates password and signs in', async () => {
    setRequiredEnv();
    maybeSingle.mockResolvedValue({ data: { owner_user_id: 'user-1' }, error: null });
    updateUserById.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });

    const response = await POST(makeRequest({ setupToken: 'setup_token', pin: '123456' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(updateUserById).toHaveBeenCalledWith('user-1', { password: '123456' });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: '123456',
    });
  });
});

