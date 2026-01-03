import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock global fetch for the REST API call
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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
    // Set env vars
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  });

  afterEach(() => {
    getUser.mockReset();
    mockFetch.mockReset();
    createSupabaseServerClient.mockClear();
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
    // Empty array = no owner configured
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/setup');
  });

  it('redirects unauthenticated users to /login when owner is configured', async () => {
    // Array with owner = configured
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ owner_user_id: 'test-uuid' }]),
    });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('allows authenticated users when owner is configured', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ owner_user_id: 'test-uuid' }]),
    });
    getUser.mockResolvedValue({ data: { user: { id: 'test-uuid' } }, error: null });

    const req = new NextRequest('http://localhost/');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
