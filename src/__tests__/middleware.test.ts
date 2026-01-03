import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock for admin client (used for app_owner check)
const adminFromSelect = vi.fn();
const createClient = vi.fn(() => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: adminFromSelect,
      })),
    })),
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

// Mock for SSR client (used for auth check)
const getUser = vi.fn();
const createSupabaseServerClient = vi.fn(() => ({
  auth: { getUser },
}));

vi.mock('@/lib/supabase/ssr', () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { middleware } from '../../middleware';

describe('middleware auth gating', () => {
  beforeEach(() => {
    // Set env vars for admin client
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  });

  afterEach(() => {
    getUser.mockReset();
    adminFromSelect.mockReset();
    createSupabaseServerClient.mockClear();
    createClient.mockClear();
    vi.unstubAllEnvs();
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
    adminFromSelect.mockResolvedValue({ data: null, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/setup');
  });

  it('redirects unauthenticated users to /login when owner is configured', async () => {
    adminFromSelect.mockResolvedValue({ data: { owner_user_id: 'test-uuid' }, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('allows authenticated users when owner is configured', async () => {
    adminFromSelect.mockResolvedValue({ data: { owner_user_id: 'test-uuid' }, error: null });
    getUser.mockResolvedValue({ data: { user: { id: 'test-uuid' } }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
