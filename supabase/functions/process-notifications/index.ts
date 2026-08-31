import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { requireCronAuth } from '../_shared/cron-auth.ts';
import { decryptNotificationSecret } from '../_shared/notification-crypto.ts';
import { sendMessage } from '../_shared/telegram.ts';
import {
  safeNotificationMetadata,
  type BookingNotificationPayload,
} from '../send-booking-notification/contracts.ts';
import { buildDeliveryFact, sanitizeDeliveryError } from './contracts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueItem {
  id: string;
  payload: unknown;
  retry_count: number | null;
}

interface DeliverySecret {
  telegram_chat_id?: string | number;
  email?: string;
  management_url?: string | null;
}

interface LegacyNotificationPayload {
  channel: 'telegram' | 'email' | 'all';
  telegram?: { chat_id: string | number; text: string; parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2' };
  email?: { to: string; subject: string; html: string };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isPayload(value: unknown): value is BookingNotificationPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<BookingNotificationPayload>;
  return typeof payload.booking_id === 'string'
    && (payload.recipient_role === 'owner' || payload.recipient_role === 'staff' || payload.recipient_role === 'customer')
    && (payload.channel === 'telegram' || payload.channel === 'email')
    && typeof payload.template_key === 'string'
    && typeof payload.locale === 'string'
    && !!payload.variables
    && typeof payload.variables === 'object'
    && typeof payload.secure_ciphertext === 'string';
}

function isLegacyPayload(value: unknown): value is LegacyNotificationPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<LegacyNotificationPayload>;
  return payload.channel === 'telegram' || payload.channel === 'email' || payload.channel === 'all';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderMessage(payload: BookingNotificationPayload, managementUrl: string | null) {
  const variables = payload.variables;
  const isEnglish = payload.locale === 'en';
  const isKazakh = payload.locale === 'kk';
  const dateTime = `${variables.slot_date} · ${variables.slot_time} (${variables.timezone})`;
  const pendingDeposit = variables.booking_status === 'pending_payment';
  const title = payload.template_key === 'booking_created_owner'
    ? (isEnglish ? 'New booking' : isKazakh ? 'Жаңа жазылу' : 'Новая запись')
    : payload.template_key === 'booking_reminder_24h_customer'
    ? (isEnglish ? 'Booking reminder' : isKazakh ? 'Жазылу туралы еске салу' : 'Напоминание о записи')
    : pendingDeposit
    ? (isEnglish ? 'Waiting for deposit confirmation' : isKazakh ? 'Алдын ала төлем расталуын күтуде' : 'Ожидает подтверждения предоплаты')
    : (isEnglish ? 'Booking confirmed' : isKazakh ? 'Жазылу расталды' : 'Запись подтверждена');
  const lines = [
    title,
    variables.service_name,
    dateTime,
    payload.recipient_role === 'owner' ? variables.client_name : '',
    managementUrl || '',
  ].filter(Boolean);
  const text = lines.join('\n');
  const html = `<h2>${escapeHtml(title)}</h2><p><strong>${escapeHtml(variables.service_name)}</strong></p><p>${escapeHtml(dateTime)}</p>${managementUrl ? `<p><a href="${escapeHtml(managementUrl)}">${isEnglish ? 'Manage booking' : isKazakh ? 'Жазылуды басқару' : 'Управление записью'}</a></p>` : ''}`;
  return { title, text, html };
}

async function deliverLegacy(payload: LegacyNotificationPayload): Promise<void> {
  if ((payload.channel === 'telegram' || payload.channel === 'all') && payload.telegram) {
    await sendMessage(payload.telegram.chat_id, payload.telegram.text, {
      parse_mode: payload.telegram.parse_mode,
    });
  }
  if ((payload.channel === 'email' || payload.channel === 'all') && payload.email) {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'lnkmx.my <admin@lnkmx.my>',
        to: [payload.email.to],
        subject: payload.email.subject,
        html: payload.email.html,
      }),
    });
    if (!response.ok) throw new Error('email_provider_rejected');
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const cronAuthError = requireCronAuth(req, corsHeaders);
  if (cronAuthError) return cronAuthError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return json({ success: false, error: 'service_not_configured' }, 500);
    const encryptionSecret = Deno.env.get('NOTIFICATION_ENCRYPTION_KEY') || serviceKey;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error: claimError } = await supabase.rpc('claim_notification_batch', { p_limit: 10 });
    if (claimError) throw new Error('notification_claim_failed');
    const queue = (data || []) as QueueItem[];
    const results: Array<{ id: string; status: string; error_code?: string }> = [];

    for (const item of queue) {
      let payload: BookingNotificationPayload | null = null;
      try {
        if (!isPayload(item.payload)) {
          if (!isLegacyPayload(item.payload)) throw new Error('notification_payload_invalid');
          await deliverLegacy(item.payload);
          await supabase.from('notification_queue').update({
            status: 'sent',
            processed_at: new Date().toISOString(),
            last_error: null,
            locked_at: null,
          }).eq('id', item.id);
          console.info('legacy_notification_delivered', { queue_id: item.id });
          results.push({ id: item.id, status: 'sent' });
          await new Promise((resolve) => setTimeout(resolve, 50));
          continue;
        }
        payload = item.payload;
        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('slot_date, slot_time, booking_timezone, status')
          .eq('id', payload.booking_id)
          .maybeSingle();
        const staleReminder = payload.template_key === 'booking_reminder_24h_customer'
          && currentBooking
          && (
            String(currentBooking.slot_date) !== payload.variables.slot_date
            || String(currentBooking.slot_time).slice(0, 5) !== payload.variables.slot_time
          );
        if (
          !currentBooking
          || ['cancelled', 'completed', 'no_show'].includes(String(currentBooking.status))
          || staleReminder
        ) {
          await supabase.from('notification_queue').update({
            status: 'skipped',
            processed_at: new Date().toISOString(),
            last_error: staleReminder ? 'booking_rescheduled' : 'booking_not_active',
            locked_at: null,
          }).eq('id', item.id);
          results.push({ id: item.id, status: 'skipped' });
          continue;
        }
        payload = {
          ...payload,
          variables: {
            ...payload.variables,
            slot_date: String(currentBooking.slot_date),
            slot_time: String(currentBooking.slot_time).slice(0, 5),
            timezone: String(currentBooking.booking_timezone || payload.variables.timezone),
            booking_status: String(currentBooking.status),
          },
        };
        const secret = await decryptNotificationSecret<DeliverySecret>(payload.secure_ciphertext, encryptionSecret);
        const rendered = renderMessage(payload, secret.management_url || null);

        if (payload.channel === 'telegram') {
          if (!secret.telegram_chat_id) throw new Error('notification_destination_missing');
          await sendMessage(secret.telegram_chat_id, rendered.text, { disable_web_page_preview: true });
        } else {
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');
          if (!secret.email) throw new Error('notification_destination_missing');
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'lnkmx.my <admin@lnkmx.my>',
              to: [secret.email],
              subject: rendered.title,
              html: rendered.html,
            }),
          });
          if (!response.ok) throw new Error('email_provider_rejected');
        }

        await supabase.from('notification_queue').update({
          status: 'sent',
          processed_at: new Date().toISOString(),
          last_error: null,
          locked_at: null,
        }).eq('id', item.id);
        const fact = buildDeliveryFact({
          queueId: item.id,
          bookingId: payload.booking_id,
          recipientRole: payload.recipient_role,
          channel: payload.channel,
          templateKey: payload.template_key,
          outcome: 'delivered',
        });
        await supabase.from('notification_delivery_events').upsert(fact, {
          onConflict: 'queue_id,event_kind', ignoreDuplicates: true,
        });
        if (payload.template_key === 'booking_reminder_24h_customer') {
          await supabase.rpc('emit_revenue_product_event', {
            p_booking_id: payload.booking_id,
            p_event_name: 'reminder_delivered',
            p_actor_type: 'system',
            p_idempotency_key: `notification:${item.id}:reminder_delivered`,
            p_metadata: { reasonCode: 'reminder_24h' },
          });
        }
        console.info('booking_notification_delivered', safeNotificationMetadata(payload));
        results.push({ id: item.id, status: 'sent' });
      } catch (deliveryError) {
        const retryCount = (item.retry_count || 0) + 1;
        const terminal = retryCount > 3;
        const errorCode = sanitizeDeliveryError(deliveryError);
        await supabase.from('notification_queue').update({
          status: terminal ? 'failed' : 'pending',
          retry_count: retryCount,
          last_error: errorCode,
          processed_at: new Date().toISOString(),
          scheduled_at: terminal
            ? new Date().toISOString()
            : new Date(Date.now() + Math.min(2 ** retryCount, 60) * 60_000).toISOString(),
          locked_at: null,
        }).eq('id', item.id);
        if (terminal && payload) {
          const fact = buildDeliveryFact({
            queueId: item.id,
            bookingId: payload.booking_id,
            recipientRole: payload.recipient_role,
            channel: payload.channel,
            templateKey: payload.template_key,
            outcome: 'failed',
            error: deliveryError,
          });
          await supabase.from('notification_delivery_events').upsert(fact, {
            onConflict: 'queue_id,event_kind', ignoreDuplicates: true,
          });
        }
        console.warn('booking_notification_delivery_failed', {
          ...(payload ? safeNotificationMetadata(payload) : {}),
          error_code: errorCode,
          terminal,
        });
        results.push({ id: item.id, status: terminal ? 'failed' : 'pending', error_code: errorCode });
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return json({ results });
  } catch {
    console.error('notification_processor_failed');
    return json({ error: 'notification_processor_failed' }, 500);
  }
};

serve(handler);
