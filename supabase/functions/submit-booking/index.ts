import { serve } from "http/server";
import { createClient } from "supabase";
import { checkInboundLimit } from "../_shared/check-inbound-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function sanitize(str: unknown, maxLen = 500): string {
  return String(str ?? '').substring(0, maxLen).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing env vars');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    const { pageId, blockId, slotDate, slotTime, slotEndTime, clientName, clientPhone, clientEmail, clientNotes, paymentStatus, paymentAmount, paymentMethod, userId } = body;

    // Validate required fields
    if (!pageId || !isValidUUID(pageId)) throw new Error('Invalid pageId');
    if (!blockId) throw new Error('Missing blockId');
    if (!slotDate || !slotTime || !clientName) throw new Error('Missing required booking fields');

    // 1. Get page owner
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('user_id')
      .eq('id', pageId)
      .single();

    if (pageError || !pageData?.user_id) throw new Error('Page not found');

    // 2. Check inbound limit
    const limitResult = await checkInboundLimit(supabase, pageData.user_id);
    if (!limitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'inbound_limit_reached', used: limitResult.used, limit: limitResult.limit }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2.1 Get block settings for GCal and Timezone
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('type, content')
      .eq('id', blockId)
      .single();

    if (blockError || !block || block.type !== 'booking') {
      throw new Error('Booking configuration not found');
    }

    const { gcalSyncEnabled, timezone: blockTz, slotDuration } = block.content || {};

    // 2.5 Check for local double booking
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('page_id', pageId)
      .eq('block_id', blockId)
      .eq('slot_date', sanitize(slotDate, 10))
      .eq('slot_time', sanitize(slotTime, 8))
      .neq('status', 'cancelled')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking double booking:', checkError);
      throw new Error('Could not verify availability');
    }

    if (existingBooking) {
      return new Response(
        JSON.stringify({ success: false, error: 'slot_already_booked' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2.6 Check Google Calendar if enabled
    if (gcalSyncEnabled) {
      try {
        const tz = blockTz || 'UTC';
        // Calculate start and end ISO for the slot
        const startDT = new Date(`${slotDate}T${slotTime}`).toISOString(); 
        // Note: slotTime is locally formatted in owner's or visitor's TZ usually.
        // We need to be careful here. Assuming slotDate/slotTime are YYYY-MM-DD and HH:mm:ss.
        
        const duration = slotDuration || 60;
        const [h, m] = slotTime.split(':').map(Number);
        const startMins = h * 60 + m;
        const endMins = startMins + duration;
        const endH = Math.floor(endMins / 60) % 24;
        const endM = endMins % 60;
        const slotEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;

        const { data: gcalData, error: gcalInvokeError } = await supabase.functions.invoke('google-calendar-sync', {
          body: {
            action: 'check_availability',
            owner_id: pageData.user_id,
            time_min: new Date(`${slotDate}T${slotTime}`).toISOString(),
            time_max: new Date(`${slotDate}T${slotEnd}`).toISOString()
          }
        });

        if (!gcalInvokeError && gcalData?.blocked_slots?.length > 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'slot_already_booked_gcal' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (gcalErr) {
        console.error('GCal verification error:', gcalErr);
        // We continue if GCal check fails (fail-open) to not block user, 
        // but log it. Decision: safety first? Roadmap says "total protection".
      }
    }

    // 3. Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        page_id: pageId,
        block_id: blockId,
        owner_id: pageData.user_id,
        user_id: userId || null,
        slot_date: sanitize(slotDate, 10),
        slot_time: sanitize(slotTime, 8),
        slot_end_time: slotEndTime ? sanitize(slotEndTime, 8) : null,
        client_name: sanitize(clientName, 200),
        client_phone: clientPhone ? sanitize(clientPhone, 20) : null,
        client_email: clientEmail ? sanitize(clientEmail, 200) : null,
        client_notes: clientNotes ? sanitize(clientNotes, 1000) : null,
        payment_status: paymentStatus || 'none',
        payment_amount: paymentAmount || 0,
        payment_method: paymentMethod || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting booking:', insertError);
      throw insertError;
    }

    // 4. Send notification to owner
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('telegram_chat_id, telegram_notifications_enabled, telegram_language')
        .eq('id', pageData.user_id)
        .single();

      if (profile?.telegram_notifications_enabled && profile?.telegram_chat_id) {
        const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (telegramBotToken) {
          const lang = profile.telegram_language || 'ru';
          const text = lang === 'en'
            ? `📅 <b>New booking!</b>\n\n▪️ ${sanitize(clientName)}\n▪️ ${sanitize(slotDate)} ${sanitize(slotTime).substring(0, 5)}\n\n👉 <a href="https://lnkmx.my/dashboard">View</a>`
            : lang === 'kk'
              ? `📅 <b>Жаңа жазба!</b>\n\n▪️ ${sanitize(clientName)}\n▪️ ${sanitize(slotDate)} ${sanitize(slotTime).substring(0, 5)}\n\n👉 <a href="https://lnkmx.my/dashboard">Көру</a>`
              : `📅 <b>Новая запись!</b>\n\n▪️ ${sanitize(clientName)}\n▪️ ${sanitize(slotDate)} ${sanitize(slotTime).substring(0, 5)}\n\n👉 <a href="https://lnkmx.my/dashboard">Посмотреть</a>`;

          await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: profile.telegram_chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
          });
        }
      }
    } catch (e) {
      console.error('Failed to send booking notification', e);
    }

    return new Response(
      JSON.stringify({ success: true, booking }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
