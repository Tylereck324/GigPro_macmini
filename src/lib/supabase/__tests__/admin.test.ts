import { afterEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

import { createSupabaseAdminClient, getServerOwnerEnv } from '@/lib/supabase/admin';

describe('supabase admin helpers', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    createClient.mockReset();
  });

  it('getServerOwnerEnv throws when required env vars are missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';
    process.env.GIGPRO_SETUP_TOKEN = 'token';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getServerOwnerEnv()).toThrow();
  });

  it('createSupabaseAdminClient creates a client with service role key and no session persistence', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key';
    process.env.GIGPRO_OWNER_EMAIL = 'owner@example.com';
    process.env.GIGPRO_SETUP_TOKEN = 'token';

    createSupabaseAdminClient();

    expect(createClient).toHaveBeenCalledTimes(1);
    const [url, key, options] = createClient.mock.calls[0] as any[];
    expect(url).toBe('http://localhost');
    expect(key).toBe('service_role_key');
    expect(options).toEqual({
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });
});

