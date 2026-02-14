import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  leadId: string;
  pageOwnerId: string;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  source: string;
}

interface NotificationSettings {
  email_notifications_enabled: boolean | null;
  telegram_notifications_enabled: boolean | null;
  telegram_chat_id: string | null;
}

// HTML encode user input to prevent XSS in emails
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => entities[char] || char);
}

// Send Telegram notification
async function sendTelegramNotification(
  chatId: string,
  leadName: string,
  leadEmail: string | null,
  leadPhone: string | null,
  source: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    console.log("TELEGRAM_BOT_TOKEN not configured");
    return { success: false, error: "Telegram not configured" };
  }

  const sourceLabels: Record<string, string> = {
    'form': '📝 Форма',
    'page_view': '👁 Просмотр',
    'messenger': '💬 Мессенджер',
    'manual': '✏️ Вручную',
    'other': '📌 Другое'
  };

  let message = `🎉 *Новая заявка!*\n\n`;
  message += `👤 *Имя:* ${leadName}\n`;
  if (leadEmail) message += `📧 *Email:* ${leadEmail}\n`;
  if (leadPhone) message += `📱 *Телефон:* ${leadPhone}\n`;
  message += `📍 *Источник:* ${sourceLabels[source] || source}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.error("Telegram API error:", result);
      return { success: false, error: result.description };
    }

    console.log("Telegram notification sent successfully");
    return { success: true };
  } catch (error: any) {
    console.error("Telegram send error:", error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, pageOwnerId, leadName, leadEmail, leadPhone, source }: LeadNotificationRequest = await req.json();
    
    // Sanitize all user inputs
    const safeName = escapeHtml(leadName);
    const safeEmail = escapeHtml(leadEmail);
    const safePhone = escapeHtml(leadPhone);

    console.log(`Sending lead notification for lead ${leadId} to owner ${pageOwnerId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get notification settings from user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email_notifications_enabled, telegram_notifications_enabled, telegram_chat_id')
      .eq('id', pageOwnerId)
      .maybeSingle();

    if (profileError) {
      console.error('Could not fetch user profile:', profileError);
    }

    const settings: NotificationSettings = profile || {
      email_notifications_enabled: true,
      telegram_notifications_enabled: false,
      telegram_chat_id: null
    };

    const results: { email?: boolean; telegram?: boolean } = {};

    // Send Telegram notification
    if (settings.telegram_notifications_enabled && settings.telegram_chat_id) {
      const telegramResult = await sendTelegramNotification(
        settings.telegram_chat_id,
        leadName,
        leadEmail,
        leadPhone,
        source
      );
      results.telegram = telegramResult.success;
    }

    // Send email notification
    if (settings.email_notifications_enabled !== false) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.log("RESEND_API_KEY not configured, skipping email");
      } else {
        // Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(pageOwnerId);

        if (userError || !userData?.user?.email) {
          console.error('Could not find owner email:', userError);
        } else {
          const ownerEmail = userData.user.email;
          const sourceLabels: Record<string, string> = {
            'form': 'Contact Form',
            'page_view': 'Page View',
            'messenger': 'Messenger',
            'manual': 'Manual Entry',
            'other': 'Other'
          };

          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Lead Captured</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 40px 20px;">
                      <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                          <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                              <h1 style="margin: 0; color: #18181b; font-size: 24px; font-weight: 600;">🎉 New Lead Captured!</h1>
                            </div>
                            
                            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                              Great news! A new lead has been captured from your LinkMAX page.
                            </p>
                            
                            <table role="presentation" style="width: 100%; background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                              <tr>
                                <td style="padding: 20px;">
                                  <table role="presentation" style="width: 100%;">
                                    <tr>
                                      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                                        <span style="color: #71717a; font-size: 14px;">Name</span>
                                        <div style="color: #18181b; font-size: 16px; font-weight: 500; margin-top: 4px;">${safeName}</div>
                                      </td>
                                    </tr>
                                    ${safeEmail ? `
                                    <tr>
                                      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                                        <span style="color: #71717a; font-size: 14px;">Email</span>
                                        <div style="color: #18181b; font-size: 16px; font-weight: 500; margin-top: 4px;">
                                          <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none;">${safeEmail}</a>
                                        </div>
                                      </td>
                                    </tr>
                                    ` : ''}
                                    ${safePhone ? `
                                    <tr>
                                      <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                                        <span style="color: #71717a; font-size: 14px;">Phone</span>
                                        <div style="color: #18181b; font-size: 16px; font-weight: 500; margin-top: 4px;">
                                          <a href="tel:${safePhone}" style="color: #2563eb; text-decoration: none;">${safePhone}</a>
                                        </div>
                                      </td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                      <td style="padding: 8px 0;">
                                        <span style="color: #71717a; font-size: 14px;">Source</span>
                                        <div style="color: #18181b; font-size: 16px; font-weight: 500; margin-top: 4px;">${sourceLabels[source] || source}</div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0;">
                              View and manage this lead in your LinkMAX dashboard.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 20px 40px; background-color: #f4f4f5; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                              © ${new Date().getFullYear()} LinkMAX. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "LinkMAX <onboarding@resend.dev>",
              to: [ownerEmail],
              subject: `🎉 New Lead: ${safeName}`,
              html: emailHtml,
            }),
          });

          const emailResult = await emailResponse.json();
          results.email = emailResponse.ok;

          if (!emailResponse.ok) {
            console.error("Failed to send email:", emailResult);
          } else {
            console.log("Email sent successfully:", emailResult.id);
          }
        }
      }
    }

    console.log("Notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending lead notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});