import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { requireCronAuth } from '../_shared/cron-auth.ts';
import { encryptNotificationSecret } from '../_shared/notification-crypto.ts';
import { safeNotificationMetadata, type BookingNotificationPayload } from '../send-booking-notification/contracts.ts';
import { bookingReminderIdempotencyKey, reminderScheduledAt } from './contracts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isoDateWithOffset(days: number): string {
  const date = new Date(Date.now() + days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const cronAuthError = requireCronAuth(req, corsHeaders);
  if (cronAuthError) return cronAuthError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return json({ success: false, error: 'service_not_configured' }, 500);
    const supabase = createClient(supabaseUrl, serviceKey);
    const encryptionSecret = Deno.env.get('NOTIFICATION_ENCRYPTION_KEY') || serviceKey;

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, owner_id, client_name, client_email, slot_date, slot_time, booking_timezone, service_snapshot, status, deposit_required_amount')
      .gte('slot_date', isoDateWithOffset(-1))
      .lte('slot_date', isoDateWithOffset(3))
      .in('status', ['pending_payment', 'confirmed']);
    if (error) throw new Error('booking_reminder_query_failed');

    let scheduled = 0;
    for (const booking of bookings || []) {
      if (!booking.client_email) continue;
      const scheduledAt = reminderScheduledAt(
        String(booking.slot_date),
        String(booking.slot_time),
        String(booking.booking_timezone || 'Asia/Almaty'),
      );
      const bookingInstant = new Date(scheduledAt).getTime() + 86_400_000;
      if (bookingInstant <= Date.now()) continue;

      const { data: createdNotification } = await supabase
        .from('notification_queue')
        .select('payload')
        .eq('event_type', 'booking_created_customer')
        .contains('payload', { booking_id: booking.id })
        .maybeSingle();
      const createdPayload = createdNotification?.payload as Partial<BookingNotificationPayload> | undefined;
      const reminderLocale = createdPayload?.locale === 'kk' || createdPayload?.locale === 'en'
        ? createdPayload.locale
        : 'ru';
      const secureCiphertext = typeof createdPayload?.secure_ciphertext === 'string'
        ? createdPayload.secure_ciphertext
        : await encryptNotificationSecret({ email: booking.client_email, management_url: null }, encryptionSecret);
      const snapshot = booking.service_snapshot as Record<string, unknown> | null;
      const payload: BookingNotificationPayload = {
        booking_id: booking.id,
        recipient_role: 'customer',
        channel: 'email',
        template_key: 'booking_reminder_24h_customer',
        locale: reminderLocale,
        variables: {
          client_name: String(booking.client_name || ''),
          service_name: typeof snapshot?.name === 'string' ? snapshot.name : '',
          slot_date: String(booking.slot_date),
          slot_time: String(booking.slot_time).slice(0, 5),
          timezone: String(booking.booking_timezone || 'Asia/Almaty'),
          booking_status: String(booking.status),
          deposit_required_amount: String(booking.deposit_required_amount || '0.00'),
        },
        secure_ciphertext: secureCiphertext,
      };
      const idempotencyKey = bookingReminderIdempotencyKey(booking.id, 'email', scheduledAt);
      const { data: queuedRows, error: queueError } = await supabase.from('notification_queue').upsert({
        user_id: null,
        event_type: payload.template_key,
        payload,
        idempotency_key: idempotencyKey,
        scheduled_at: scheduledAt,
      }, { onConflict: 'idempotency_key', ignoreDuplicates: true }).select('id');
      if (queueError || !queuedRows?.length) continue;

      await supabase.rpc('emit_revenue_product_event', {
        p_booking_id: booking.id,
        p_event_name: 'reminder_queued',
        p_actor_type: 'system',
        p_idempotency_key: `event:${idempotencyKey}`,
        p_metadata: { reasonCode: 'reminder_24h' },
      });
      console.info('booking_reminder_queued', safeNotificationMetadata(payload));
      scheduled += 1;
    }

    return json({ success: true, scheduled });
  } catch {
    console.error('send_booking_reminder_failed');
    return json({ success: false, error: 'reminder_schedule_failed' }, 500);
  }
};

serve(handler);
