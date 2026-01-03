import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();
const createSupabaseServerClient = vi.fn(() => ({
  auth: { getUser },
}));

vi.mock('@/lib/supabase/ssr', () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { middleware } from '../../middleware';

describe('middleware auth gating', () => {
  afterEach(() => {
    getUser.mockReset();
    createSupabaseServerClient.mockClear();
  });

  it('does not redirect login/setup/auth/static paths', async () => {
    const allowedPaths = ['/login', '/setup', '/api/auth/login', '/_next/static/chunk.js'];

    for (const path of allowedPaths) {
      const req = new NextRequest(`http://localhost${path}`);
      const res = await middleware(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  });

  it('redirects unauthenticated users to /login', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });
});

