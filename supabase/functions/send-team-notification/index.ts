import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  targetUserId: string;
  teamId: string;
  type: 'invited' | 'joined' | 'left' | 'removed';
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

    const { targetUserId, teamId, type } = await req.json() as NotificationPayload;
    if (!targetUserId || !teamId || !type) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Load team and verify caller has authority for this notification type
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('id, name, owner_id')
      .eq('id', teamId)
      .maybeSingle();
    if (!team) {
      return new Response(
        JSON.stringify({ success: false, error: 'team_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerMembership } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', callerId)
      .maybeSingle();
    const callerIsOwner = team.owner_id === callerId;
    const callerIsMember = !!callerMembership || callerIsOwner;

    // Authorization matrix
    if (type === 'invited' && !callerIsOwner) {
      return new Response(JSON.stringify({ success: false, error: 'only_owner_can_invite' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (type === 'removed' && !callerIsOwner) {
      return new Response(JSON.stringify({ success: false, error: 'only_owner_can_remove' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if ((type === 'joined' || type === 'left') && !callerIsMember) {
      return new Response(JSON.stringify({ success: false, error: 'not_team_member' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // For join/leave notices, target must be the team owner (the one being notified)
    if ((type === 'joined' || type === 'left') && targetUserId !== team.owner_id) {
      return new Response(JSON.stringify({ success: false, error: 'invalid_target' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Derive inviter/actor name from caller's own profile — never trust body
    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', callerId)
      .maybeSingle();
    const actorName = callerProfile?.display_name || callerProfile?.username || 'Кто-то';
    const teamName = team.name as string;

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
      case 'invited':
        message = `🎉 Приглашение в команду!\n\n${actorName} приглашает вас в команду "${teamName}".\n\nВойдите в lnkmx.my чтобы присоединиться!`;
        break;
      case 'joined':
        message = `👋 Новый участник!\n\n${actorName} присоединился к вашей команде "${teamName}".`;
        break;
      case 'left':
        message = `🚪 Участник вышел\n\n${actorName} покинул вашу команду "${teamName}".`;
        break;
      case 'removed':
        message = `⚠️ Вы были удалены из команды "${teamName}".`;
        break;
    }

    if (!isConfigured()) {
      return new Response(JSON.stringify({ error: 'not_configured' }), { status: 500 });
    }

    try {
      await sendMessage(profile.telegram_chat_id, message, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error('Telegram API error:', sendError);
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram send failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-team-notification:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
