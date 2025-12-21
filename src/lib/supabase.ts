// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Standard client for client-side and anonymous usage
// In single-user mode, this client is effectively the "admin" as there's no RLS.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);