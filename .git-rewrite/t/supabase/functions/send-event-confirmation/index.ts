/**
 * send-event-confirmation - Sends confirmation notification after event registration
 * Pro-only feature triggered after successful registration
 * Supports: Telegram + Email notification to organizer
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
  answers_json: Record<string, unknown> | null;
  event_tickets: Array<{ ticket_code: string }>;
}

interface OwnerProfile {
  is_premium: boolean | null;
  premium_expires_at: string | null;
  trial_ends_at: string | null;
  telegram_chat_id: string | null;
  telegram_notifications_enabled: boolean | null;
  email_notifications_enabled: boolean | null;
}

// Get owner email from auth.users via service role
async function getOwnerEmail(supabaseUrl: string, supabaseServiceKey: string, ownerId: string): Promise<string | null> {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data } = await supabaseAdmin.auth.admin.getUserById(ownerId);
  return data?.user?.email || null;
}

function generateOrganizerEmailHTML(
  eventTitle: string,
  registration: RegistrationData,
  dateString: string,
  location: string | null
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">🎫 Новая регистрация!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b;">${eventTitle}</h2>
              
              <!-- Registration Info -->
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">👤 Имя:</span>
                      <strong style="color: #1e293b; margin-left: 8px;">${registration.attendee_name}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">📧 Email:</span>
                      <a href="mailto:${registration.attendee_email}" style="color: #6366f1; margin-left: 8px;">${registration.attendee_email}</a>
                    </td>
                  </tr>
                  ${registration.attendee_phone ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">📱 Телефон:</span>
                      <a href="tel:${registration.attendee_phone}" style="color: #6366f1; margin-left: 8px;">${registration.attendee_phone}</a>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">🎟 Билет:</span>
                      <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; margin-left: 8px; font-weight: bold;">${registration.event_tickets?.[0]?.ticket_code || 'N/A'}</code>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${dateString || location ? `
              <!-- Event Info -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                ${dateString ? `<p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">📅 ${dateString}</p>` : ''}
                ${location ? `<p style="margin: 0; color: #64748b; font-size: 14px;">📍 ${location}</p>` : ''}
              </div>
              ` : ''}
              
              <p style="margin: 0; text-align: center;">
                <a href="https://linkmax.lovable.app/crm" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Управление регистрациями →
                </a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 30px; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">LNKMX • Уведомление о регистрации</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationId, eventId, ownerId }: EventConfirmationRequest = await req.json();

    if (!registrationId || !eventId || !ownerId) {
      throw new Error("Missing required fields");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if owner is Pro
    const { data: ownerProfile } = await supabase
      .from("user_profiles")
      .select("is_premium, premium_expires_at, trial_ends_at, telegram_chat_id, telegram_notifications_enabled, email_notifications_enabled")
      .eq("id", ownerId)
      .single();

    const profile = ownerProfile as OwnerProfile | null;
    const isPro = profile?.is_premium || 
      (profile?.premium_expires_at && new Date(profile.premium_expires_at) > new Date()) ||
      (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date());

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
      .select("attendee_name, attendee_email, attendee_phone, answers_json, event_tickets(ticket_code)")
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

    const results = { telegram: false, email: false };

    // 1. Send Telegram notification
    if (telegramBotToken && profile?.telegram_chat_id && profile?.telegram_notifications_enabled) {
      const message = `🎫 *Новая регистрация!*\n\n` +
        `📌 *${eventTitle}*\n\n` +
        `👤 ${regData.attendee_name}\n` +
        `📧 ${regData.attendee_email}\n` +
        (regData.attendee_phone ? `📱 ${regData.attendee_phone}\n` : '') +
        `🎟 Билет: \`${ticketCode}\`\n` +
        (dateString ? `📅 ${dateString}\n` : '') +
        (eventData.location_value ? `📍 ${eventData.location_value}` : '');

      try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: profile.telegram_chat_id,
            text: message,
            parse_mode: "Markdown",
          }),
        });
        results.telegram = tgResponse.ok;
      } catch (telegramError) {
        console.error("Telegram notification failed:", telegramError);
      }
    }

    // 2. Send Email notification (if email notifications enabled or not set)
    const emailEnabled = profile?.email_notifications_enabled !== false; // default true
    if (resendApiKey && emailEnabled) {
      try {
        const ownerEmail = await getOwnerEmail(supabaseUrl, supabaseServiceKey, ownerId);
        if (ownerEmail) {
          const resend = new Resend(resendApiKey);
          const emailHTML = generateOrganizerEmailHTML(
            eventTitle,
            regData,
            dateString,
            eventData.location_value
          );

          const { error: emailError } = await resend.emails.send({
            from: "LNKMX <noreply@lnkmx.my>",
            to: [ownerEmail],
            subject: `🎫 Новая регистрация - ${eventTitle}`,
            html: emailHTML,
          });

          if (emailError) {
            console.error("Email send error:", emailError);
          } else {
            results.email = true;
            console.log("Email sent to organizer:", ownerEmail);
          }
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    console.log("Event registration notification sent for:", registrationId, "results:", results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
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
