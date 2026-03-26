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
    const { targetUserId, type } = await req.json() as NotificationPayload;

    console.log(`Sending friend notification: ${type} to user ${targetUserId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get sender's profile
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user: sender } } = await supabaseClient.auth.getUser();
    
    let senderName = 'Кто-то';
    if (sender) {
      const { data: senderProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', sender.id)
        .maybeSingle();
      
      senderName = senderProfile?.display_name || senderProfile?.username || 'Кто-то';
    }

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

    // Build message
    let message = '';
    switch (type) {
      case 'request':
        message = `👋 <b>Новый запрос в друзья!</b>\n\n${senderName} хочет добавить вас в друзья.\n\nОткройте lnkmx.my, чтобы принять или отклонить запрос.`;
        break;
      case 'accepted':
        message = `🎉 <b>Запрос принят!</b>\n\n${senderName} принял(а) ваш запрос в друзья.\n\nТеперь вы друзья в lnkmx.my!`;
        break;
    }

    // Send Telegram notification
    if (!isConfigured()) {
      console.log("Telegram gateway not configured");
    }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramResponse = await sendMessage(profile.telegram_chat_id, message, { parse_mode: 'HTML' });

    const telegramResult = await telegramResponse.json();
    if (!telegramResult.ok) {
      console.error('Telegram API error:', telegramResult);
      return new Response(
        JSON.stringify({ success: false, error: telegramResult.description }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Friend notification sent successfully');
    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
