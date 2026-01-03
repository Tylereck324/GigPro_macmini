import { NextResponse, type NextRequest } from 'next/server';
import { parseSixDigitPin } from '@/lib/auth/pin';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let pin: string;
  try {
    pin = parseSixDigitPin((body as any)?.pin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid PIN';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ownerEmail = process.env.GIGPRO_OWNER_EMAIL;
  if (!ownerEmail) {
    return NextResponse.json({ error: 'Missing GIGPRO_OWNER_EMAIL' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseServerClient(request, response);

  const { error } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: pin,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}

