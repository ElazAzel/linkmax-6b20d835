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

interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

type TelegramInlineKeyboard = TelegramInlineButton[][];

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

    console.log(`Queuing lead notification for lead ${leadId} to owner ${pageOwnerId}`);

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

    // 1. Queue Telegram notification
    if (settings.telegram_notifications_enabled && settings.telegram_chat_id) {
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

      const inline_keyboard: TelegramInlineKeyboard = [
        [
          { text: "✅ В работу", callback_data: `lead_status:contacted:${leadId}` },
          { text: "💰 Продано", callback_data: `lead_status:won:${leadId}` }
        ]
      ];

      if (leadPhone) {
        const cleanPhone = leadPhone.replace(/\D/g, '');
        inline_keyboard.push([
          { text: "💬 WhatsApp", url: `https://wa.me/${cleanPhone}` },
          { text: "📱 Telegram", url: `https://t.me/+${cleanPhone}` }
        ]);
      }

      const { error: tgError } = await supabase
        .from('notification_queue')
        .insert({
          user_id: pageOwnerId,
          event_type: 'lead_created',
          payload: {
            channel: 'telegram',
            telegram: {
              chat_id: settings.telegram_chat_id,
              text: message,
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard }
            }
          },
          idempotency_key: `lead_${leadId}_tg`
        });

      if (tgError) {
        console.error('Error queuing Telegram:', tgError);
      } else {
        results.telegram = true;
      }
    }

    // 2. Queue Email notification
    if (settings.email_notifications_enabled !== false) {
      const { data: userData } = await supabase.auth.admin.getUserById(pageOwnerId);
      if (userData?.user?.email) {
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
            <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="font-size: 24px; color: #18181b; text-align: center;">🎉 New Lead Captured!</h1>
                <p style="color: #52525b; line-height: 1.6;">Great news! A new lead has been captured from your lnkmx.my page.</p>
                <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <div style="margin-bottom: 12px;"><span style="color: #71717a; font-size: 14px;">Name</span><br/><strong>${safeName}</strong></div>
                  ${safeEmail ? `<div style="margin-bottom: 12px;"><span style="color: #71717a; font-size: 14px;">Email</span><br/><strong>${safeEmail}</strong></div>` : ''}
                  ${safePhone ? `<div style="margin-bottom: 12px;"><span style="color: #71717a; font-size: 14px;">Phone</span><br/><strong>${safePhone}</strong></div>` : ''}
                  <div><span style="color: #71717a; font-size: 14px;">Source</span><br/><strong>${sourceLabels[source] || source}</strong></div>
                </div>
                <p style="text-align: center; color: #a1a1aa; font-size: 12px;">© lnkmx.my</p>
              </div>
            </body>
          </html>
        `;

        const { error: emailError } = await supabase
          .from('notification_queue')
          .insert({
            user_id: pageOwnerId,
            event_type: 'lead_created',
            payload: {
              channel: 'email',
              email: {
                to: ownerEmail,
                subject: `🎉 New Lead: ${safeName}`,
                html: emailHtml
              }
            },
            idempotency_key: `lead_${leadId}_email`
          });

        if (emailError) {
          console.error('Error queuing Email:', emailError);
        } else {
          results.email = true;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in lead notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});