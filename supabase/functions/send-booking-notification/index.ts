import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { encryptNotificationSecret } from '../_shared/notification-crypto.ts';
import { reminderScheduledAt } from '../send-booking-reminder/contracts.ts';
import {
  buildBookingNotificationRows,
  safeNotificationMetadata,
} from './contracts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingNotificationRequest {
  bookingId: string;
  accessToken?: string | null;
  locale?: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function locale(value: unknown): 'ru' | 'kk' | 'en' {
  const normalized = typeof value === 'string' ? value.split('-')[0] : '';
  return normalized === 'kk' || normalized === 'en' ? normalized : 'ru';
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function callerRole(req: Request): string | null {
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '');
    if (!token) return null;
    const payload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const decoded = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return json({ success: false, error: 'service_not_configured' }, 500);

    const body = await req.json() as BookingNotificationRequest;
    if (!body?.bookingId || typeof body.bookingId !== 'string') {
      return json({ success: false, error: 'booking_id_required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, owner_id, staff_id, client_name, client_phone, client_email, client_notes, slot_date, slot_time, booking_timezone, service_snapshot, status, deposit_required_amount')
      .eq('id', body.bookingId)
      .maybeSingle();

    if (bookingError || !booking) return json({ success: false, error: 'booking_not_found' }, 404);

    const { data: owner } = await supabase
      .from('user_profiles')
      .select('telegram_chat_id, telegram_notifications_enabled, telegram_language')
      .eq('id', booking.owner_id)
      .maybeSingle();

    let managementUrl: string | null = null;
    let accessTokenVerified = false;
    if (typeof body.accessToken === 'string' && /^[0-9a-f]{64}$/u.test(body.accessToken)) {
      const tokenHash = await sha256(body.accessToken);
      const { data: access } = await supabase
        .from('booking_access_tokens')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('token_hash', tokenHash)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (access) {
        accessTokenVerified = true;
        managementUrl = `https://lnkmx.my/booking/manage/${body.accessToken}`;
      }
    }

    if (callerRole(req) !== 'service_role' && !accessTokenVerified) {
      return json({ success: false, error: 'not_allowed' }, 403);
    }

    const encryptionSecret = Deno.env.get('NOTIFICATION_ENCRYPTION_KEY') || serviceKey;
    const ownerTelegramCiphertext = owner?.telegram_notifications_enabled && owner.telegram_chat_id
      ? await encryptNotificationSecret({ telegram_chat_id: owner.telegram_chat_id }, encryptionSecret)
      : null;
    const customerEmailCiphertext = booking.client_email
      ? await encryptNotificationSecret({ email: booking.client_email, management_url: managementUrl }, encryptionSecret)
      : null;
    const serviceSnapshot = booking.service_snapshot as Record<string, unknown> | null;
    const variables = {
      client_name: String(booking.client_name || ''),
      service_name: typeof serviceSnapshot?.name === 'string' ? serviceSnapshot.name : '',
      slot_date: String(booking.slot_date),
      slot_time: String(booking.slot_time).slice(0, 5),
      timezone: String(booking.booking_timezone || 'Asia/Almaty'),
      booking_status: String(booking.status),
      deposit_required_amount: String(booking.deposit_required_amount || '0.00'),
    };
    const reminderAt = reminderScheduledAt(
      String(booking.slot_date),
      String(booking.slot_time),
      variables.timezone,
    );
    const rows = buildBookingNotificationRows({
      bookingId: booking.id,
      ownerId: booking.owner_id,
      locale: locale(body.locale || owner?.telegram_language),
      variables,
      ownerTelegramCiphertext,
      customerEmailCiphertext,
      reminderScheduledAt: reminderAt,
    });

    let queuedCount = 0;
    if (rows.length > 0) {
      const { data: queuedRows, error: queueError } = await supabase
        .from('notification_queue')
        .upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true })
        .select('id');
      if (queueError) throw new Error('notification_queue_write_failed');
      queuedCount = queuedRows?.length || 0;
    }

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .contains('metadata', { booking_id: booking.id })
      .maybeSingle();
    if (!existingLead) {
      await supabase.from('leads').insert({
        user_id: booking.owner_id,
        name: booking.client_name,
        phone: booking.client_phone,
        email: booking.client_email,
        source: 'form',
        status: 'new',
        notes: `Запись на ${booking.slot_date} в ${booking.slot_time}${booking.client_notes ? `\n\nКомментарий: ${booking.client_notes}` : ''}`,
        metadata: {
          booking_id: booking.id,
          booking_date: booking.slot_date,
          booking_time: booking.slot_time,
          source_type: 'booking',
          staff_id: booking.staff_id,
        },
      });
    }

    for (const row of rows) console.info('booking_notification_queued', safeNotificationMetadata(row.payload));
    return json({ success: true, queued: queuedCount });
  } catch {
    console.error('send_booking_notification_failed');
    return json({ success: false, error: 'notification_enqueue_failed' }, 500);
  }
};

serve(handler);
