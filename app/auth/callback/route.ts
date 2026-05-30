import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirect') || '/products';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  const user = data.user;
  const fullName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Xongle User';
  const phone = user.user_metadata.phone_number || `xongle-${user.id.slice(0, 12)}`;
  const referralCode = `XNG${user.id.slice(0, 8).toUpperCase()}`;

  await supabase.from('users').upsert(
    {
      id: user.id,
      phone,
      name: fullName,
      role: 'buyer',
      referral_code: referralCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
