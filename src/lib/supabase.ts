// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a function to get the client - this allows build to succeed
// even if env vars are missing (they're only needed at runtime)
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, env vars might not be available
    // Return a dummy client that will be replaced at runtime
    if (typeof window === 'undefined') {
      // Server-side during build - create a placeholder
      // This will never be used for actual API calls during static generation
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    // Client-side without env vars - this is a real error
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Standard client for client-side and anonymous usage
// In single-user mode, this client is effectively the "admin" as there's no RLS.
export const supabase = createSupabaseClient();