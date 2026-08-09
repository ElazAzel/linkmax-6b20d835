import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType =
  | 'gift_received'
  | 'gift_claimed'
  | 'challenge_completed'
  | 'friend_challenge_completed'
  | 'page_liked'
  | 'newsletter_subscribed'
  | 'new_chatbot_lead';

interface NotificationRequest {
  type: NotificationType;
  recipientId: string;
  pageId?: string;
  leadId?: string;
  subscriptionId?: string;
  data?: {
    days?: number;
    challengeTitle?: string;
    message?: string;
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();
    const { type, recipientId } = body;

    const ALLOWED: NotificationType[] = [
      'gift_received', 'gift_claimed', 'challenge_completed',
      'friend_challenge_completed', 'page_liked', 'newsletter_subscribed',
      'new_chatbot_lead',
    ];

    if (!type || !recipientId || !ALLOWED.includes(type)) {
      return json({ success: false, error: 'missing_params' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve the caller (may be anonymous for public-page events)
    let callerId: string | null = null;
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await authClient.auth.getClaims(token);
      const sub = data?.claims?.sub;
      if (typeof sub === 'string' && sub.length > 0) callerId = sub;
    }

    // ── Authorization: the underlying event must really exist and involve the caller ──
    let senderName = 'Пользователь';
    let pageName = '';
    let days = 7;
    let giftMessage: string | undefined;
    let challengeTitle = body.data?.challengeTitle || 'Еженедельный';

    const profileName = async (id: string): Promise<string> => {
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', id)
        .maybeSingle();
      return data?.display_name || data?.username || 'Пользователь';
    };

    switch (type) {
      case 'gift_received': {
        if (!callerId) return json({ success: false, error: 'unauthorized' }, 401);
        const { data: gift } = await supabase
          .from('premium_gifts')
          .select('id, days_gifted, message')
          .eq('sender_id', callerId)
          .eq('recipient_id', recipientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!gift) return json({ success: false, error: 'forbidden' }, 403);
        days = gift.days_gifted ?? 7;
        giftMessage = gift.message ?? undefined;
        senderName = await profileName(callerId);
        break;
      }
      case 'gift_claimed': {
        if (!callerId) return json({ success: false, error: 'unauthorized' }, 401);
        const { data: gift } = await supabase
          .from('premium_gifts')
          .select('id')
          .eq('recipient_id', callerId)
          .eq('sender_id', recipientId)
          .eq('is_claimed', true)
          .limit(1)
          .maybeSingle();
        if (!gift) return json({ success: false, error: 'forbidden' }, 403);
        senderName = await profileName(callerId);
        break;
      }
      case 'challenge_completed': {
        if (!callerId || callerId !== recipientId) {
          return json({ success: false, error: 'forbidden' }, 403);
        }
        break;
      }
      case 'friend_challenge_completed': {
        if (!callerId) return json({ success: false, error: 'unauthorized' }, 401);
        const { data: friendship } = await supabase
          .from('friendships')
          .select('id')
          .eq('status', 'accepted')
          .or(
            `and(user_id.eq.${callerId},friend_id.eq.${recipientId}),and(user_id.eq.${recipientId},friend_id.eq.${callerId})`
          )
          .limit(1)
          .maybeSingle();
        if (!friendship) return json({ success: false, error: 'forbidden' }, 403);
        senderName = await profileName(callerId);
        break;
      }
      case 'page_liked': {
        if (!callerId || !body.pageId) return json({ success: false, error: 'forbidden' }, 403);
        const { data: page } = await supabase
          .from('pages')
          .select('id, title, user_id')
          .eq('id', body.pageId)
          .maybeSingle();
        if (!page || page.user_id !== recipientId) {
          return json({ success: false, error: 'forbidden' }, 403);
        }
        const { data: like } = await supabase
          .from('page_likes')
          .select('id')
          .eq('page_id', body.pageId)
          .eq('user_id', callerId)
          .limit(1)
          .maybeSingle();
        if (!like) return json({ success: false, error: 'forbidden' }, 403);
        pageName = page.title || '';
        break;
      }
      case 'newsletter_subscribed': {
        // Public visitors can subscribe, so authorization is based on the
        // subscription row actually existing for this owner. Anonymous
        // inserts cannot read back their own row (owner-only SELECT policy),
        // so allow resolving it by page_id + email as well.
        let query = supabase
          .from('newsletter_subscriptions')
          .select('id, owner_id, page_id')
          .eq('owner_id', recipientId);

        if (body.subscriptionId) {
          query = query.eq('id', body.subscriptionId);
        } else if (body.pageId && body.subscriberEmail) {
          query = query
            .eq('page_id', body.pageId)
            .eq('email', body.subscriberEmail.trim().toLowerCase());
        } else {
          return json({ success: false, error: 'forbidden' }, 403);
        }

        const { data: sub } = await query
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!sub || sub.owner_id !== recipientId) {
          return json({ success: false, error: 'forbidden' }, 403);
        }
        if (sub.page_id) {
          const { data: page } = await supabase
            .from('pages').select('title').eq('id', sub.page_id).maybeSingle();
          pageName = page?.title || '';
        }
        break;
      }
      case 'new_chatbot_lead': {
        if (!body.leadId) return json({ success: false, error: 'forbidden' }, 403);
        const { data: lead } = await supabase
          .from('leads')
          .select('id, user_id')
          .eq('id', body.leadId)
          .maybeSingle();
        if (!lead || lead.user_id !== recipientId) {
          return json({ success: false, error: 'forbidden' }, 403);
        }
        break;
      }
    }

    // Get recipient's Telegram settings
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('telegram_chat_id, telegram_notifications_enabled')
      .eq('id', recipientId)
      .maybeSingle();

    if (profileError || !profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      return json({ success: false, error: 'telegram_not_enabled' });
    }
    if (!isConfigured()) {
      return json({ success: false, error: 'telegram_not_configured' }, 500);
    }

    // Build message (all dynamic parts derived server-side)
    let message = '';
    switch (type) {
      case 'gift_received':
        message = `🎁 <b>Вам подарили Premium!</b>\n\n${senderName} отправил вам подарок: <b>${days} дней Premium</b>`;
        if (giftMessage) message += `\n\n💬 Сообщение: "${giftMessage}"`;
        message += '\n\n👉 Откройте lnkmx.my, чтобы активировать подарок!';
        break;
      case 'gift_claimed':
        message = `✅ <b>Ваш подарок активирован!</b>\n\n${senderName} активировал ваш подарок Premium!`;
        break;
      case 'challenge_completed':
        message = `🏆 <b>Челлендж выполнен!</b>\n\nВы выполнили челлендж "<b>${challengeTitle}</b>"!\n\n🎉 Получите награду в приложении!`;
        break;
      case 'friend_challenge_completed':
        message = `👏 <b>${senderName}</b> выполнил челлендж!\n\n"${challengeTitle}"`;
        break;
      case 'page_liked':
        message = `❤️ <b>Новый лайк!</b>\n\nКто-то лайкнул вашу страницу${pageName ? ` "${pageName}"` : ''}!\n\n👉 Посмотрите в галерее lnkmx.my`;
        break;
      case 'newsletter_subscribed':
        message = `📧 <b>Новый подписчик!</b>\n\nКто-то подписался на вашу рассылку${pageName ? ` на странице "${pageName}"` : ''}.`;
        break;
      case 'new_chatbot_lead':
        message = `💬 <b>Новый лид из чат-бота!</b>\n\n👉 Откройте CRM в lnkmx.my`;
        break;
    }

    try {
      await sendMessage(profile.telegram_chat_id, message, { parse_mode: 'HTML' });
    } catch (sendError) {
      console.error('Failed to send Telegram message:', sendError);
      return json({ success: false, error: 'telegram_send_failed' });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return json({ success: false, error: 'server_error' }, 500);
  }
});
