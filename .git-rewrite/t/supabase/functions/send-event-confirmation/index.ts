/**
 * send-event-confirmation - Sends confirmation notification after event registration
 * Pro-only feature triggered after successful registration
 * Supports: Telegram notification to organizer
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventConfirmationRequest {
  registrationId: string;
  eventId: string;
  ownerId: string;
}

interface EventData {
  title_i18n_json: Record<string, string>;
  start_at: string | null;
  location_value: string | null;
}

interface RegistrationData {
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  event_tickets: Array<{ ticket_code: string }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationId, eventId, ownerId }: EventConfirmationRequest = await req.json();

    if (!registrationId || !eventId || !ownerId) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if owner is Pro (has access to notification features)
    const { data: ownerProfile } = await supabase
      .from("user_profiles")
      .select("is_premium, premium_expires_at, trial_ends_at, telegram_chat_id, telegram_notifications_enabled")
      .eq("id", ownerId)
      .single();

    const isPro = ownerProfile?.is_premium || 
      (ownerProfile?.premium_expires_at && new Date(ownerProfile.premium_expires_at) > new Date()) ||
      (ownerProfile?.trial_ends_at && new Date(ownerProfile.trial_ends_at) > new Date());

    if (!isPro) {
      return new Response(
        JSON.stringify({ success: false, error: "pro_required" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch event and registration data
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title_i18n_json, start_at, location_value")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select("attendee_name, attendee_email, attendee_phone, event_tickets(ticket_code)")
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      throw new Error("Registration not found");
    }

    const eventData = event as EventData;
    const regData = registration as unknown as RegistrationData;
    
    const eventTitle = eventData.title_i18n_json?.ru || eventData.title_i18n_json?.en || "Событие";
    const ticketCode = regData.event_tickets?.[0]?.ticket_code || "N/A";

    // Format date
    let dateString = "";
    if (eventData.start_at) {
      const date = new Date(eventData.start_at);
      dateString = date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Send Telegram notification to organizer
    if (telegramBotToken && ownerProfile?.telegram_chat_id && ownerProfile?.telegram_notifications_enabled) {
      const message = `🎫 *Новая регистрация!*\n\n` +
        `📌 *${eventTitle}*\n\n` +
        `👤 ${regData.attendee_name}\n` +
        `📧 ${regData.attendee_email}\n` +
        (regData.attendee_phone ? `📱 ${regData.attendee_phone}\n` : '') +
        `🎟 Билет: \`${ticketCode}\`\n` +
        (dateString ? `📅 ${dateString}\n` : '') +
        (eventData.location_value ? `📍 ${eventData.location_value}` : '');

      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ownerProfile.telegram_chat_id,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      } catch (telegramError) {
        console.error("Telegram notification failed:", telegramError);
        // Don't fail the whole request for Telegram errors
      }
    }

    console.log("Event registration notification sent for:", registrationId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending event confirmation:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
