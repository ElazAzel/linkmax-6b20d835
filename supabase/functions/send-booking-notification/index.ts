import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  bookingId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json() as BookingNotificationRequest;

    if (!body?.bookingId || typeof body.bookingId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "bookingId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-derive all booking data from DB — never trust request body for lead content.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, staff_id, client_name, client_phone, client_email, booking_date, booking_time, notes")
      .eq("id", body.bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ success: false, error: "booking_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerId = booking.user_id as string;
    const staffId = booking.staff_id as string | null;
    const clientName = booking.client_name as string;
    const clientPhone = booking.client_phone as string | null;
    const clientEmail = booking.client_email as string | null;
    const date = booking.booking_date as string;
    const time = booking.booking_time as string;
    const notes = booking.notes as string | null;

    const { data: owner } = await supabase
      .from("user_profiles")
      .select("telegram_chat_id, telegram_notifications_enabled")
      .eq("id", ownerId)
      .maybeSingle();

    let staffName = "";
    if (staffId) {
      const { data: staff } = await supabase
        .from("zone_staff")
        .select("name, linked_user_id")
        .eq("id", staffId)
        .maybeSingle();

      if (staff) {
        staffName = staff.name;

        if (staff.linked_user_id) {
          const { data: staffUser } = await supabase
            .from("user_profiles")
            .select("telegram_chat_id, telegram_notifications_enabled")
            .eq("id", staff.linked_user_id)
            .maybeSingle();

          if (staffUser?.telegram_notifications_enabled && staffUser.telegram_chat_id) {
            const staffMessage = `✨ *У вас новая запись!*

👤 *Клиент:* ${clientName}
📆 *Дата:* ${date}
🕐 *Время:* ${time}
${notes ? `📝 *Комментарий:* ${notes}` : ""}

_Подготовьтесь к встрече!_`;

            await supabase
              .from("notification_queue")
              .insert({
                user_id: staff.linked_user_id,
                event_type: 'booking_created_staff',
                payload: {
                  channel: 'telegram',
                  telegram: {
                    chat_id: staffUser.telegram_chat_id,
                    text: staffMessage,
                    parse_mode: 'Markdown'
                  }
                }
              });
          }
        }
      }
    }

    if (owner?.telegram_notifications_enabled && owner.telegram_chat_id) {
      const message = `📅 *Новая запись!*
${staffName ? `🎯 *Специалист:* ${staffName}` : ""}
      
👤 *Клиент:* ${clientName}
${clientPhone ? `📞 *Телефон:* ${clientPhone}` : ""}
${clientEmail ? `📧 *Email:* ${clientEmail}` : ""}
📆 *Дата:* ${date}
🕐 *Время:* ${time}
${notes ? `📝 *Комментарий:* ${notes}` : ""}

_Управляйте записями в CRM вашей страницы._`;

      await supabase
        .from("notification_queue")
        .insert({
          user_id: ownerId,
          event_type: 'booking_created',
          payload: {
            channel: 'telegram',
            telegram: {
              chat_id: owner.telegram_chat_id,
              text: message,
              parse_mode: 'Markdown'
            }
          }
        });
    }

    // Create a lead from the booking (existing business logic) — sourced from verified booking row.
    await supabase
      .from("leads")
      .insert({
        user_id: ownerId,
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        source: "form",
        status: "new",
        notes: `Запись на ${date} в ${time}${notes ? `\n\nКомментарий: ${notes}` : ""}`,
        metadata: {
          booking_id: booking.id,
          booking_date: date,
          booking_time: time,
          source_type: "booking",
          staff_id: staffId,
          staff_name: staffName
        }
      });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-booking-notification:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
