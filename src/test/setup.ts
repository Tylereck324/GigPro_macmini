import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Set dummy Supabase environment variables for tests to prevent errors
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_key';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock File.prototype.text()
if (typeof File !== 'undefined' && !File.prototype.text) {
  Object.defineProperty(File.prototype, 'text', {
    writable: true,
    value: vi.fn(function (this: File) {
      return Promise.resolve(new Response(this).text());
    }),
  });
}

// Mock Supabase client for tests
vi.mock('@/lib/supabase', () => {
  const mockSelectResponse = {
    data: [],
    error: null,
    maybeSingle: vi.fn(() => ({ data: null, error: null })),
    single: vi.fn(() => ({ data: null, error: null })),
  };

  const mockFromResponse = {
    select: vi.fn(() => mockSelectResponse),
    insert: vi.fn(() => ({ data: [], error: null })),
    update: vi.fn(() => ({ data: [], error: null })),
    delete: vi.fn(() => ({ error: null })), // delete returns an object with error, not data
    upsert: vi.fn(() => ({ data: null, error: null })),
    eq: vi.fn(() => mockSelectResponse), // eq() returns an object that has select, single, maybeSingle
    neq: vi.fn(() => ({ delete: vi.fn(() => ({ error: null })) })), // neq() returns an object that has delete
  };

  return {
    supabase: {
      from: vi.fn(() => mockFromResponse),
      auth: {
        getUser: vi.fn(() => ({ data: { user: null }, error: null })),
      },
    },
  };
});
