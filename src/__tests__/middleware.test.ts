import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();
const fromSelect = vi.fn();
const createSupabaseServerClient = vi.fn(() => ({
  auth: { getUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: fromSelect,
      })),
    })),
  })),
}));

vi.mock('@/lib/supabase/ssr', () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { middleware } from '../../middleware';

describe('middleware auth gating', () => {
  afterEach(() => {
    getUser.mockReset();
    fromSelect.mockReset();
    createSupabaseServerClient.mockClear();
  });

  it('does not redirect setup/auth/static paths', async () => {
    const allowedPaths = ['/setup', '/api/auth/login', '/_next/static/chunk.js'];

    for (const path of allowedPaths) {
      const req = new NextRequest(`http://localhost${path}`);
      const res = await middleware(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  });

  it('redirects to /setup when owner not configured', async () => {
    fromSelect.mockResolvedValue({ data: null, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/setup');
  });

  it('redirects unauthenticated users to /login when owner is configured', async () => {
    fromSelect.mockResolvedValue({ data: { owner_user_id: 'test-uuid' }, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('allows authenticated users when owner is configured', async () => {
    fromSelect.mockResolvedValue({ data: { owner_user_id: 'test-uuid' }, error: null });
    getUser.mockResolvedValue({ data: { user: { id: 'test-uuid' } }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
