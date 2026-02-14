import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  targetUserId: string;
  teamName: string;
  inviterName?: string;
  type: 'invited' | 'joined' | 'left' | 'removed';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetUserId, teamName, inviterName, type } = await req.json() as NotificationPayload;

    console.log(`Sending team notification: ${type} for team "${teamName}" to user ${targetUserId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get target user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_chat_id, telegram_notifications_enabled')
      .eq('id', targetUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      console.log('User has Telegram notifications disabled or no chat_id');
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'notifications_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build message based on type
    let message = '';
    switch (type) {
      case 'invited':
        message = `🎉 Приглашение в команду!\n\n${inviterName || 'Кто-то'} приглашает вас в команду "${teamName}".\n\nВойдите в LinkMAX чтобы присоединиться!`;
        break;
      case 'joined':
        message = `👋 Новый участник!\n\n${inviterName || 'Кто-то'} присоединился к вашей команде "${teamName}".`;
        break;
      case 'left':
        message = `🚪 Участник вышел\n\n${inviterName || 'Кто-то'} покинул вашу команду "${teamName}".`;
        break;
      case 'removed':
        message = `⚠️ Вы были удалены из команды "${teamName}".`;
        break;
    }

    // Send Telegram notification
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: profile.telegram_chat_id,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Telegram API error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram send failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Telegram notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-team-notification:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
