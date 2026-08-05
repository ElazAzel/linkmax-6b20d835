import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'gift_received' | 'gift_claimed' | 'challenge_completed' | 'friend_challenge_completed' | 'page_liked' | 'newsletter_subscribed';
  recipientId: string;
  data?: {
    senderName?: string;
    days?: number;
    challengeTitle?: string;
    friendName?: string;
    message?: string;
    subscriberEmail?: string;
    pageName?: string;
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
    if (!isConfigured()) {
      console.log("Telegram gateway not configured");
      return new Response(
        JSON.stringify({ success: false, error: 'telegram_not_configured' }),
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

      case 'page_liked':
        message = `❤️ <b>Новый лайк!</b>\n\nКто-то лайкнул вашу страницу${data?.pageName ? ` "${data.pageName}"` : ''}!\n\n👉 Посмотрите в галерее lnkmx.my`;
        break;

      case 'newsletter_subscribed':
        message = `📧 <b>Новый подписчик!</b>\n\n${data?.subscriberEmail || 'Кто-то'} подписался на вашу рассылку${data?.pageName ? ` на странице "${data.pageName}"` : ''}.`;
        break;

      default:
        message = '📬 У вас новое уведомление в lnkmx.my!';
    }

    console.log(`Sending ${type} notification to ${profile.telegram_chat_id}`);

    // Send Telegram message — sendMessage returns parsed JSON, not Response
    try {
      await sendMessage(profile.telegram_chat_id, message, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error('Failed to send Telegram message:', sendError);
      return new Response(
        JSON.stringify({ success: false, error: 'telegram_send_failed' }),
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
