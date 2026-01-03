import { createClient } from '@supabase/supabase-js';

export function getServerOwnerEnv(): {
  supabaseUrl: string;
  serviceRoleKey: string;
  ownerEmail: string;
  setupToken: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  const ownerEmail = process.env.GIGPRO_OWNER_EMAIL;
  if (!ownerEmail) {
    throw new Error('Missing GIGPRO_OWNER_EMAIL');
  }

  const setupToken = process.env.GIGPRO_SETUP_TOKEN;
  if (!setupToken) {
    throw new Error('Missing GIGPRO_SETUP_TOKEN');
  }

  return { supabaseUrl, serviceRoleKey, ownerEmail, setupToken };
}

export function createSupabaseAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getServerOwnerEnv();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

