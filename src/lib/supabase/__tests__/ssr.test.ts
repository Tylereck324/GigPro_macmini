import { describe, expect, it, vi, afterEach } from 'vitest';

const createServerClient = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => createServerClient(...args),
}));

import { createSupabaseServerClient, getPublicSupabaseEnv } from '@/lib/supabase/ssr';

describe('supabase ssr helpers', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    createServerClient.mockReset();
  });

  it('getPublicSupabaseEnv throws when required env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => getPublicSupabaseEnv()).toThrow();
  });

  it('createSupabaseServerClient wires request/response cookies into createServerClient', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key';

    const request = {
      cookies: {
        getAll: vi.fn(() => [{ name: 'a', value: '1' }]),
      },
    } as any;

    const response = {
      cookies: {
        set: vi.fn(),
      },
    } as any;

    createSupabaseServerClient(request, response);

    expect(createServerClient).toHaveBeenCalledTimes(1);
    const [url, key, options] = createServerClient.mock.calls[0] as any[];
    expect(url).toBe('http://localhost');
    expect(key).toBe('anon_key');
    expect(options.cookies.getAll()).toEqual([{ name: 'a', value: '1' }]);

    options.cookies.setAll([{ name: 'b', value: '2', options: { path: '/' } }]);
    expect(response.cookies.set).toHaveBeenCalledWith('b', '2', { path: '/' });
  });
});

