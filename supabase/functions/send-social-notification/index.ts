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
  // Server-verified references (never free-form text)
  giftId?: string;
  pageId?: string;
  leadId?: string;
  challengeTitle?: string;
  subscriberEmail?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 300);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as NotificationRequest;
    const { type, recipientId } = body;

    if (!type || !recipientId) {
      return json({ success: false, error: 'missing_params' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve the authenticated caller (may be null for public page events)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    let callerId: string | null = null;
    if (token) {
      const { data } = await createClient(supabaseUrl, anonKey).auth.getUser(token);
      callerId = data?.user?.id ?? null;
    }

    const requireAuth = (): string | null => callerId;

    async function displayName(userId: string): Promise<string> {
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', userId)
        .maybeSingle();
      return data?.display_name || data?.username || 'Пользователь';
    }

    // ---------- Authorization + message construction from verified DB state ----------
    let message = '';

    switch (type) {
      case 'gift_received': {
        const caller = requireAuth();
        if (!caller) return json({ success: false, error: 'unauthorized' }, 401);
        const { data: gift } = await supabase
          .from('premium_gifts')
          .select('id, days_gifted, message, sender_id, recipient_id')
          .eq('sender_id', caller)
          .eq('recipient_id', recipientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!gift) return json({ success: false, error: 'forbidden' }, 403);

        message = `🎁 <b>Вам подарили Premium!</b>\n\n${esc(await displayName(caller))} отправил вам подарок: <b>${esc(gift.days_gifted ?? 7)} дней Premium</b>`;
        if (gift.message) message += `\n\n💬 Сообщение: "${esc(gift.message)}"`;
        message += '\n\n👉 Откройте lnkmx.my, чтобы активировать подарок!';
        break;
      }

      case 'gift_claimed': {
        const caller = requireAuth();
        if (!caller) return json({ success: false, error: 'unauthorized' }, 401);
        // Caller must be the recipient of a claimed gift sent by recipientId (the sender)
        const { data: gift } = await supabase
          .from('premium_gifts')
          .select('id')
          .eq('recipient_id', caller)
          .eq('sender_id', recipientId)
          .eq('is_claimed', true)
          .limit(1)
          .maybeSingle();
        if (!gift) return json({ success: false, error: 'forbidden' }, 403);

        message = `✅ <b>Ваш подарок активирован!</b>\n\n${esc(await displayName(caller))} активировал ваш подарок Premium!`;
        break;
      }

      case 'challenge_completed': {
        const caller = requireAuth();
        if (!caller || caller !== recipientId) {
          return json({ success: false, error: 'forbidden' }, 403);
        }
        message = `🏆 <b>Челлендж выполнен!</b>\n\nВы выполнили челлендж "<b>${esc(body.challengeTitle || 'Еженедельный')}</b>"!\n\n🎉 Получите награду в приложении!`;
        break;
      }

      case 'friend_challenge_completed': {
        const caller = requireAuth();
        if (!caller) return json({ success: false, error: 'unauthorized' }, 401);
        const { data: friendship } = await supabase
          .from('friendships')
          .select('id')
          .eq('status', 'accepted')
          .or(
            `and(user_id.eq.${caller},friend_id.eq.${recipientId}),and(user_id.eq.${recipientId},friend_id.eq.${caller})`
          )
          .limit(1)
          .maybeSingle();
        if (!friendship) return json({ success: false, error: 'forbidden' }, 403);

        message = `👏 <b>${esc(await displayName(caller))}</b> выполнил челлендж!\n\n"${esc(body.challengeTitle || 'Еженедельный челлендж')}"`;
        break;
      }

      case 'page_liked': {
        // Triggered by public visitors: verify the page exists and is owned by recipientId
        if (!body.pageId) return json({ success: false, error: 'missing_params' }, 400);
        const { data: page } = await supabase
          .from('pages')
          .select('id, user_id, title')
          .eq('id', body.pageId)
          .maybeSingle();
        if (!page || page.user_id !== recipientId) {
          return json({ success: false, error: 'forbidden' }, 403);
        }
        message = `❤️ <b>Новый лайк!</b>\n\nКто-то лайкнул вашу страницу${page.title ? ` "${esc(page.title)}"` : ''}!\n\n👉 Посмотрите в галерее lnkmx.my`;
        break;
      }

      case 'newsletter_subscribed': {
        // Triggered by public visitors: a matching subscription row must exist for this owner
        const email = typeof body.subscriberEmail === 'string' ? body.subscriberEmail.trim().toLowerCase() : '';
        if (!email) return json({ success: false, error: 'missing_params' }, 400);
        const { data: sub } = await supabase
          .from('newsletter_subscriptions')
          .select('id, email, page_id, owner_id')
          .eq('owner_id', recipientId)
          .eq('email', email)
          .limit(1)
          .maybeSingle();
        if (!sub) return json({ success: false, error: 'forbidden' }, 403);

        let pageName = '';
        if (sub.page_id) {
          const { data: page } = await supabase
            .from('pages')
            .select('title')
            .eq('id', sub.page_id)
            .maybeSingle();
          pageName = page?.title || '';
        }
        message = `📧 <b>Новый подписчик!</b>\n\n${esc(sub.email)} подписался на вашу рассылку${pageName ? ` на странице "${esc(pageName)}"` : ''}.`;
        break;
      }

      case 'new_chatbot_lead': {
        // The lead must genuinely belong to the recipient
        if (!body.leadId) return json({ success: false, error: 'missing_params' }, 400);
        const { data: lead } = await supabase
          .from('leads')
          .select('id, name, phone, user_id, metadata')
          .eq('id', body.leadId)
          .eq('user_id', recipientId)
          .maybeSingle();
        if (!lead) return json({ success: false, error: 'forbidden' }, 403);

        const meta = (lead.metadata ?? {}) as Record<string, unknown>;
        const intent = meta.intent === 'commercial' ? '🔥 Коммерческий интерес' : 'ℹ️ Инфо-запрос';
        message =
          `🤖 <b>Новый лид из чат-бота</b>\n\n` +
          `👤 ${esc(lead.name)}\n` +
          `📱 ${esc(lead.phone || '—')}\n` +
          `${intent}\n` +
          `💬 ${esc(meta.last_query || '—')}\n\n` +
          `👉 https://lnkmx.my/crm?lead=${esc(lead.id)}`;
        break;
      }

      default:
        return json({ success: false, error: 'invalid_type' }, 400);
    }

    // ---------- Delivery ----------
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('telegram_chat_id, telegram_notifications_enabled')
      .eq('id', recipientId)
      .single();

    if (profileError || !profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      return json({ success: false, error: 'telegram_not_enabled' });
    }
    if (!isConfigured()) {
      return json({ success: false, error: 'telegram_not_configured' }, 500);
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
