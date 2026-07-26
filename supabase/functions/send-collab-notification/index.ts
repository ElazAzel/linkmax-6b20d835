import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollabNotificationRequest {
  targetUserId: string;
  message?: string;
  type: 'request' | 'accepted' | 'rejected';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const callerId = claims.claims.sub as string;

    const { targetUserId, message, type }: CollabNotificationRequest = await req.json();
    if (!targetUserId || !type || callerId === targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_request' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify a matching collaboration row links caller and target
    const requesterId = type === 'request' ? callerId : targetUserId;
    const targetId = type === 'request' ? targetUserId : callerId;
    const { data: collab } = await supabase
      .from('collaborations')
      .select('id')
      .eq('requester_id', requesterId)
      .eq('target_id', targetId)
      .maybeSingle();

    if (!collab) {
      return new Response(
        JSON.stringify({ success: false, error: 'no_matching_collaboration' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Derive requesterName from caller's own profile (never trust body)
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', callerId)
      .maybeSingle();
    const requesterName = senderProfile?.display_name || senderProfile?.username || 'Пользователь';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('telegram_notifications_enabled, telegram_chat_id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!profile?.telegram_notifications_enabled || !profile?.telegram_chat_id) {
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isConfigured()) {
      return new Response(
        JSON.stringify({ success: false, error: 'telegram_not_configured' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let text: string;
    switch (type) {
      case 'request':
        text = `🤝 *Запрос на коллаборацию!*\n\n👤 *От:* ${requesterName}`;
        if (message) text += `\n💬 *Сообщение:* ${String(message).slice(0, 500)}`;
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
      await sendMessage(profile.telegram_chat_id, text, { parse_mode: "Markdown" });
    } catch (error: any) {
      console.error("Telegram send error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending collab notification:", error);
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
