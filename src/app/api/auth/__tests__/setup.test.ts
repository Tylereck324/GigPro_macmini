import { afterEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const upsert = vi.fn();
const from = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle,
    })),
  })),
  upsert,
}));

const createUser = vi.fn();
const listUsers = vi.fn();
const createSupabaseAdminClient = vi.fn(() => ({
  from,
  auth: { admin: { createUser, listUsers } },
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

import { POST } from '@/app/api/auth/setup/route';

describe('POST /api/auth/setup', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    maybeSingle.mockReset();
    upsert.mockReset();
    from.mockClear();
    createUser.mockReset();
    listUsers.mockReset();
    createSupabaseAdminClient.mockClear();
    signInWithPassword.mockReset();
    createSupabaseServerClient.mockClear();
  });

  function makeRequest(body: unknown) {
    return {
      json: vi.fn(async () => body),
      cookies: { getAll: vi.fn(() => []) },
    } as any;
  }

  function setRequiredEnv() {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role';
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';
    process.env.GIGPRO_SETUP_TOKEN = 'setup_token';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key';
  }

  it('returns 403 for wrong setup token', async () => {
    setRequiredEnv();

    const response = await POST(
      makeRequest({ setupToken: 'wrong', pin: '123456' })
    );

    expect(response.status).toBe(403);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid pin', async () => {
    setRequiredEnv();

    const response = await POST(
      makeRequest({ setupToken: 'setup_token', pin: '123' })
    );

    expect(response.status).toBe(400);
  });

  it('returns 409 when owner is already configured', async () => {
    setRequiredEnv();
    maybeSingle.mockResolvedValue({ data: { owner_user_id: 'user-1' }, error: null });

    const response = await POST(
      makeRequest({ setupToken: 'setup_token', pin: '123456' })
    );

    expect(response.status).toBe(409);
  });

  it('creates owner user, stores app_owner, and signs in when not configured', async () => {
    setRequiredEnv();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    createUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    upsert.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });

    const response = await POST(
      makeRequest({ setupToken: 'setup_token', pin: '123456' })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });

    expect(upsert).toHaveBeenCalledWith(
      { id: true, owner_user_id: 'user-1' },
      { onConflict: 'id' }
    );
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: '123456',
    });
  });
});
