import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

// Admin client for checking app_owner (RLS blocks anon/authenticated access)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always allow these paths
  const isPublicPath =
    pathname.startsWith('/setup') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if owner is configured using admin client (bypasses RLS)
  const admin = createAdminClient();
  if (!admin) {
    // If admin client can't be created (missing env vars), redirect to setup
    // This handles first-run or misconfigured deployments
    if (pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  const { data: owner, error: ownerError } = await admin
    .from('app_owner')
    .select('owner_user_id')
    .eq('id', true)
    .maybeSingle();

  // If owner is not configured (table empty or doesn't exist), redirect to setup
  if (ownerError || !owner?.owner_user_id) {
    // Don't redirect if already going to login (let login handle the redirect)
    if (pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // Owner is configured, now check authentication using SSR client
  const response = NextResponse.next();
  const supabase = createSupabaseServerClient(request, response);
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

