import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

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

  const response = NextResponse.next();
  const supabase = createSupabaseServerClient(request, response);

  // Check if owner is configured by querying app_owner table
  const { data: owner, error: ownerError } = await supabase
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

  // Owner is configured, now check authentication
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

