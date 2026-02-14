import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  ownerId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  date: string;
  time: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: BookingNotificationRequest = await req.json();
    
    console.log("Received booking notification request:", body);

    // Get owner profile
    const { data: owner, error: ownerError } = await supabase
      .from("user_profiles")
      .select("telegram_chat_id, telegram_notifications_enabled, username, display_name")
      .eq("id", body.ownerId)
      .maybeSingle();

    if (ownerError) {
      console.error("Error fetching owner:", ownerError);
      throw new Error("Failed to fetch owner profile");
    }

    if (!owner) {
      console.log("Owner not found:", body.ownerId);
      return new Response(
        JSON.stringify({ success: false, error: "Owner not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Owner profile:", { 
      telegramEnabled: owner.telegram_notifications_enabled,
      hasChatId: !!owner.telegram_chat_id 
    });

    // Send Telegram notification if enabled
    if (
      telegramBotToken &&
      owner.telegram_notifications_enabled &&
      owner.telegram_chat_id
    ) {
      const message = `📅 *Новая запись!*

👤 *Клиент:* ${body.clientName}
${body.clientPhone ? `📞 *Телефон:* ${body.clientPhone}` : ""}
${body.clientEmail ? `📧 *Email:* ${body.clientEmail}` : ""}
📆 *Дата:* ${body.date}
🕐 *Время:* ${body.time}
${body.notes ? `📝 *Комментарий:* ${body.notes}` : ""}

_Управляйте записями в CRM вашей страницы._`;

      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: owner.telegram_chat_id,
              text: message,
              parse_mode: "Markdown",
            }),
          }
        );

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.text();
          console.error("Telegram API error:", errorData);
        } else {
          console.log("Telegram notification sent successfully");
        }
      } catch (telegramError) {
        console.error("Error sending Telegram notification:", telegramError);
      }
    }

    // Create a lead from the booking
    try {
      const { error: leadError } = await supabase
        .from("leads")
        .insert({
          user_id: body.ownerId,
          name: body.clientName,
          phone: body.clientPhone || null,
          email: body.clientEmail || null,
          source: "form",
          status: "new",
          notes: `Запись на ${body.date} в ${body.time}${body.notes ? `\n\nКомментарий: ${body.notes}` : ""}`,
          metadata: {
            booking_date: body.date,
            booking_time: body.time,
            source_type: "booking"
          }
        });

      if (leadError) {
        console.error("Error creating lead:", leadError);
      } else {
        console.log("Lead created successfully");
      }
    } catch (leadCreationError) {
      console.error("Error in lead creation:", leadCreationError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-booking-notification:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
