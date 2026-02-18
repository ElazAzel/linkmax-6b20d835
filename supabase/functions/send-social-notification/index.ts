import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'gift_received' | 'gift_claimed' | 'challenge_completed' | 'friend_challenge_completed';
  recipientId: string;
  data?: {
    senderName?: string;
    days?: number;
    challengeTitle?: string;
    friendName?: string;
    message?: string;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientId, data }: NotificationRequest = await req.json();
    
    if (!type || !recipientId) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_params' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recipient's Telegram settings
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('telegram_chat_id, telegram_notifications_enabled, display_name, username')
      .eq('id', recipientId)
      .single();

    if (profileError || !profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      console.log('Recipient has no Telegram notifications enabled');
      return new Response(
        JSON.stringify({ success: false, error: 'telegram_not_enabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'bot_not_configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build message based on notification type
    let message = '';
    switch (type) {
      case 'gift_received':
        message = `🎁 <b>Вам подарили Premium!</b>\n\n${data?.senderName || 'Пользователь'} отправил вам подарок: <b>${data?.days || 7} дней Premium</b>`;
        if (data?.message) {
          message += `\n\n💬 Сообщение: "${data.message}"`;
        }
        message += '\n\n👉 Откройте lnkmx.my, чтобы активировать подарок!';
        break;

      case 'gift_claimed':
        message = `✅ <b>Ваш подарок активирован!</b>\n\n${data?.senderName || 'Получатель'} активировал ваш подарок Premium!`;
        break;

      case 'challenge_completed':
        message = `🏆 <b>Челлендж выполнен!</b>\n\nВы выполнили челлендж "<b>${data?.challengeTitle || 'Еженедельный'}</b>"!\n\n🎉 Получите награду в приложении!`;
        break;

      case 'friend_challenge_completed':
        message = `👏 <b>${data?.friendName || 'Ваш друг'}</b> выполнил челлендж!\n\n"${data?.challengeTitle || 'Еженедельный челлендж'}"`;
        break;

      default:
        message = '📬 У вас новое уведомление в lnkmx.my!';
    }

    console.log(`Sending ${type} notification to ${profile.telegram_chat_id}`);

    // Send Telegram message
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
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

    const result = await response.json();
    console.log('Telegram API response:', JSON.stringify(result));

    if (!result.ok) {
      console.error('Failed to send Telegram message:', result.description);
      return new Response(
        JSON.stringify({ success: false, error: 'telegram_send_failed', description: result.description }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
