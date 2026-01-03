import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/auth/status
 * Returns whether an owner has been configured (for first-run detection)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();

    const { data: owner, error } = await admin
      .from('app_owner')
      .select('owner_user_id')
      .eq('id', true)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, owner is not configured
      if (error.code === '42P01') {
        return NextResponse.json({ ownerConfigured: false });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ownerConfigured: !!owner?.owner_user_id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
