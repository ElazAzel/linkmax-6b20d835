import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  ownerId: string;
  staffId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  date: string;
  time: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: BookingNotificationRequest = await req.json();

    console.log("Queuing booking notification request:", body);

    const { data: owner } = await supabase
      .from("user_profiles")
      .select("telegram_chat_id, telegram_notifications_enabled")
      .eq("id", body.ownerId)
      .maybeSingle();

    let staffName = "";
    if (body.staffId) {
      // Lookup staff member details
      const { data: staff } = await supabase
        .from("zone_staff")
        .select("name, linked_user_id")
        .eq("id", body.staffId)
        .maybeSingle();

      if (staff) {
        staffName = staff.name;

        // If staff has a linked user, notify them too
        if (staff.linked_user_id) {
          const { data: staffUser } = await supabase
            .from("user_profiles")
            .select("telegram_chat_id, telegram_notifications_enabled")
            .eq("id", staff.linked_user_id)
            .maybeSingle();

          if (staffUser?.telegram_notifications_enabled && staffUser.telegram_chat_id) {
            const staffMessage = `✨ *У вас новая запись!*

👤 *Клиент:* ${body.clientName}
📆 *Дата:* ${body.date}
🕐 *Время:* ${body.time}
${body.notes ? `📝 *Комментарий:* ${body.notes}` : ""}

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
      
👤 *Клиент:* ${body.clientName}
${body.clientPhone ? `📞 *Телефон:* ${body.clientPhone}` : ""}
${body.clientEmail ? `📧 *Email:* ${body.clientEmail}` : ""}
📆 *Дата:* ${body.date}
🕐 *Время:* ${body.time}
${body.notes ? `📝 *Комментарий:* ${body.notes}` : ""}

_Управляйте записями в CRM вашей страницы._`;

      await supabase
        .from("notification_queue")
        .insert({
          user_id: body.ownerId,
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

    // Create a lead from the booking (existing business logic)
    await supabase
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
          source_type: "booking",
          staff_id: body.staffId,
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
