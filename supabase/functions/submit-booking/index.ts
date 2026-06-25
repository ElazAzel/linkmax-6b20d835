import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkInboundLimit } from "../_shared/check-inbound-limit.ts";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

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

    const { pageId, blockId, staffId, slotDate, slotTime, slotEndTime, clientName, clientPhone, clientEmail, clientNotes, paymentStatus, paymentAmount, paymentMethod } = body;

    // Validate required fields
    if (!pageId || !isValidUUID(pageId)) throw new Error('Invalid pageId');
    if (!blockId) throw new Error('Missing blockId');
    if (!slotDate || !slotTime || !clientName) throw new Error('Missing required booking fields');

    // Resolve userId strictly from the verified JWT — never trust client-supplied userId.
    let verifiedUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (anonKey) {
        const authClient = createClient(supabaseUrl, anonKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData } = await authClient.auth.getClaims(token);
        const sub = claimsData?.claims?.sub;
        if (sub && typeof sub === 'string') verifiedUserId = sub;
      }
    }

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

    // 2.5 Check for local double booking (Staff or Resource)
    let finalResourceId = body.resourceId || null;

    // If no resourceId provided, try to find an available one if the page has resources
    const { data: resources } = await supabase
      .from('zone_resources')
      .select('id, capacity')
      .eq('zone_id', pageId)
      .eq('is_active', true);

    if (resources && resources.length > 0) {
      // Find all booked resource IDs for this slot
      const { data: bookedResources } = await supabase
        .from('bookings')
        .select('resource_id')
        .eq('page_id', pageId)
        .eq('slot_date', sanitize(slotDate, 10))
        .eq('slot_time', sanitize(slotTime, 8))
        .neq('status', 'cancelled')
        .not('resource_id', 'is', null);

      const bookedIds = new Set(bookedResources?.map(b => b.resource_id) || []);
      
      if (!finalResourceId) {
        // Auto-assign first available resource
        const availableResource = resources.find(r => !bookedIds.has(r.id));
        if (availableResource) {
          finalResourceId = availableResource.id;
        } else {
          return new Response(
            JSON.stringify({ success: false, error: 'no_resources_available' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (bookedIds.has(finalResourceId)) {
        return new Response(
          JSON.stringify({ success: false, error: 'resource_already_booked' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for staff double booking
    const { data: existingStaffBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('page_id', pageId)
      .eq('slot_date', sanitize(slotDate, 10))
      .eq('slot_time', sanitize(slotTime, 8))
      .eq('staff_id', staffId || null)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking double booking:', checkError);
      throw new Error('Could not verify availability');
    }

    if (existingStaffBooking) {
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
            staff_id: staffId || null,
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
        // Fail-open strategy: log error but don't block the user
      }
    }

    // 3. Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        page_id: pageId,
        block_id: blockId,
        owner_id: pageData.user_id,
        user_id: verifiedUserId,
        slot_date: sanitize(slotDate, 10),
        slot_time: sanitize(slotTime, 8),
        slot_end_time: slotEndTime ? sanitize(slotEndTime, 8) : null,
        client_name: sanitize(clientName, 200),
        client_phone: clientPhone ? sanitize(clientPhone, 20) : null,
        client_email: clientEmail ? sanitize(clientEmail, 200) : null,
        client_notes: sanitize(clientNotes, 1000) || null,
        staff_id: staffId || null,
        payment_status: paymentStatus || 'none',
        payment_amount: paymentAmount || 0,
        payment_method: paymentMethod || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting booking:', insertError);
      
      // Handle absolute double-booking protection (DB unique constraint)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ success: false, error: 'slot_already_booked' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw insertError;
    }

    // 3.1 Push to Google Calendar automatically if enabled
    if (gcalSyncEnabled && booking?.id) {
      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: {
            action: 'push_booking',
            payload: { 
              booking_id: booking.id,
              staff_id: staffId || null
            }
          }
        });
        console.log(`Booking ${booking.id} pushed to GCal`);
      } catch (pushErr) {
        console.error('Failed to auto-push to GCal:', pushErr);
      }
    }

    // 4. Send notification and create lead via send-booking-notification
    try {
      await supabase.functions.invoke('send-booking-notification', {
        body: {
          ownerId: pageData.user_id,
          staffId: staffId || null,
          clientName: sanitize(clientName, 200),
          clientPhone: clientPhone || null,
          clientEmail: clientEmail || null,
          date: sanitize(slotDate, 10),
          time: sanitize(slotTime, 5),
          notes: sanitize(clientNotes, 500) || null
        }
      });
    } catch (e) {
      console.error('Failed to trigger booking notification function', e);
    }

    return new Response(
      JSON.stringify({ success: true, booking }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Request could not be processed. Please try again.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
