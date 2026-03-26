import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollabNotificationRequest {
  targetUserId: string;
  requesterName: string;
  message?: string;
  type: 'request' | 'accepted' | 'rejected';
}

// Send Telegram notification
async function sendTelegramNotification(
  chatId: string,
  requesterName: string,
  message: string | undefined,
  type: 'request' | 'accepted' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured()) {
      console.log("Telegram gateway not configured");
    };
  }

  let text: string;
  switch (type) {
    case 'request':
      text = `🤝 *Запрос на коллаборацию!*\n\n👤 *От:* ${requesterName}`;
      if (message) text += `\n💬 *Сообщение:* ${message}`;
      text += `\n\nОткройте приложение, чтобы принять или отклонить.`;
      break;
    case 'accepted':
      text = `✅ *Коллаборация принята!*\n\n👤 ${requesterName} принял(а) ваш запрос на коллаборацию.`;
      break;
    case 'rejected':
      text = `❌ *Коллаборация отклонена*\n\n👤 ${requesterName} отклонил(а) ваш запрос.`;
      break;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.error("Telegram API error:", result);
      return { success: false, error: result.description };
    }

    console.log("Telegram collab notification sent successfully");
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
    const { targetUserId, requesterName, message, type }: CollabNotificationRequest = await req.json();
    
    console.log(`Sending collab notification (${type}) to user ${targetUserId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get notification settings from user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('telegram_notifications_enabled, telegram_chat_id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Could not fetch user profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      console.log('Telegram notifications not enabled for user');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Telegram not enabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendTelegramNotification(
      profile.telegram_chat_id,
      requesterName,
      message,
      type
    );

    return new Response(
      JSON.stringify({ success: result.success, error: result.error }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending collab notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
