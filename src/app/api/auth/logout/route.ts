import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseServerClient(request, response);

  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return response;
}

