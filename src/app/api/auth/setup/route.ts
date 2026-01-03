import { NextResponse, type NextRequest } from 'next/server';
import { parseSixDigitPin } from '@/lib/auth/pin';
import { createSupabaseAdminClient, getServerOwnerEnv } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';

type SetupRequestBody = {
  setupToken?: unknown;
  pin?: unknown;
};

export async function POST(request: NextRequest) {
  let body: SetupRequestBody;
  try {
    body = (await request.json()) as SetupRequestBody;
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

  const { data: existingOwner, error: existingOwnerError } = await admin
    .from('app_owner')
    .select('owner_user_id')
    .eq('id', true)
    .maybeSingle();

  if (existingOwnerError) {
    return NextResponse.json({ error: existingOwnerError.message }, { status: 500 });
  }

  if (existingOwner?.owner_user_id) {
    return NextResponse.json({ error: 'Owner already configured' }, { status: 409 });
  }

  let ownerUserId: string | null = null;

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: env.ownerEmail,
    password: pin,
    email_confirm: true,
  });

  if (!createUserError && createdUser?.user?.id) {
    ownerUserId = createdUser.user.id;
  } else {
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers();
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const match = usersData?.users?.find(
      (u: any) =>
        typeof u?.email === 'string' &&
        u.email.toLowerCase() === env.ownerEmail.toLowerCase()
    );

    if (!match?.id) {
      const message = createUserError?.message || 'Failed to create or find owner user';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    ownerUserId = match.id;
  }

  const { error: upsertError } = await admin
    .from('app_owner')
    .upsert({ id: true, owner_user_id: ownerUserId }, { onConflict: 'id' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
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

