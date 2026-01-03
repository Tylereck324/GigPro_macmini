import { NextResponse, type NextRequest } from 'next/server';
import { parseSixDigitPin } from '@/lib/auth/pin';
import { createSupabaseAdminClient, getServerOwnerEnv } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

type ResetPinRequestBody = {
  setupToken?: unknown;
  pin?: unknown;
};

export async function POST(request: NextRequest) {
  let body: ResetPinRequestBody;
  try {
    body = (await request.json()) as ResetPinRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let env;
  try {
    env = getServerOwnerEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Missing server configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (body.setupToken !== env.setupToken) {
    return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 });
  }

  let pin: string;
  try {
    pin = parseSixDigitPin(body.pin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid PIN';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: owner, error: ownerError } = await admin
    .from('app_owner')
    .select('owner_user_id')
    .eq('id', true)
    .maybeSingle();

  if (ownerError) {
    return NextResponse.json({ error: ownerError.message }, { status: 500 });
  }

  if (!owner?.owner_user_id) {
    return NextResponse.json({ error: 'Owner not configured' }, { status: 409 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(owner.owner_user_id, {
    password: pin,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseServerClient(request, response);
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: env.ownerEmail,
    password: pin,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 401 });
  }

  return response;
}

