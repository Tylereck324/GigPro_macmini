import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

// Check if owner is configured using direct REST API (Edge compatible)
async function checkOwnerConfigured(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return false;
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_owner?id=eq.true&select=owner_user_id`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    if (!res.ok) {
      // Table might not exist or other error
      return false;
    }

    const data = await res.json();
    // data is an array, check if there's an owner with a user_id
    return Array.isArray(data) && data.length > 0 && !!data[0]?.owner_user_id;
  } catch {
    return false;
  }
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

  // Check if owner is configured using direct REST call (bypasses RLS with service role)
  const ownerConfigured = await checkOwnerConfigured();

  // If owner is not configured, redirect to setup
  if (!ownerConfigured) {
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

