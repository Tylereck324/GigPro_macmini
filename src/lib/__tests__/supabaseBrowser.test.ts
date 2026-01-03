import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase browser client', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('creates the Supabase client using createBrowserClient()', async () => {
    vi.resetModules();
    vi.unmock('@/lib/supabase');

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key';

    const createBrowserClient = vi.fn(() => ({ marker: true }));
    vi.doMock('@supabase/ssr', () => ({ createBrowserClient }));

    const mod = await import('@/lib/supabase');
    expect(createBrowserClient).toHaveBeenCalledWith('http://localhost', 'anon_key');
    expect((mod as any).supabase).toEqual({ marker: true });
  });
});

