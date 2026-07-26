import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  targetUserId: string;
  type: 'request' | 'accepted';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const callerId = claims.claims.sub as string;

    const { targetUserId, type } = await req.json() as NotificationPayload;
    if (!targetUserId || !type || callerId === targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // For a 'request': caller must be requester (user_id) with target as friend_id.
    // For an 'accepted': caller must be the acceptor (friend_id) with target as user_id.
    const userId = type === 'request' ? callerId : targetUserId;
    const friendId = type === 'request' ? targetUserId : callerId;
    const requiredStatus = type === 'request' ? 'pending' : 'accepted';

    const { data: friendship } = await supabaseAdmin
      .from('friendships')
      .select('id, status')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .maybeSingle();

    if (!friendship || friendship.status !== requiredStatus) {
      return new Response(
        JSON.stringify({ success: false, error: 'no_matching_friendship' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Derive sender name from caller's own profile
    const { data: senderProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', callerId)
      .maybeSingle();
    const senderName = senderProfile?.display_name || senderProfile?.username || 'Кто-то';

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_chat_id, telegram_notifications_enabled')
      .eq('id', targetUserId)
      .maybeSingle();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'notifications_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let message = '';
    switch (type) {
      case 'request':
        message = `👋 <b>Новый запрос в друзья!</b>\n\n${senderName} хочет добавить вас в друзья.\n\nОткройте lnkmx.my, чтобы принять или отклонить запрос.`;
        break;
      case 'accepted':
        message = `🎉 <b>Запрос принят!</b>\n\n${senderName} принял(а) ваш запрос в друзья.\n\nТеперь вы друзья в lnkmx.my!`;
        break;
    }

    if (!isConfigured()) {
      return new Response(JSON.stringify({ error: 'Telegram not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    try {
      await sendMessage(profile.telegram_chat_id, message, { parse_mode: 'HTML' });
    } catch (tgErr) {
      console.error('Telegram send error:', tgErr);
      return new Response(
        JSON.stringify({ success: false, error: String(tgErr) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
