import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BOT_USERNAME = 'linkmaxmy_bot';
const MINIAPP_URL = 'https://lnkmx.my/tg/';

const broadcastMessages = {
  ru: "🚀 <b>Обновление LinkMAX: Это больше не просто конструктор!</b>\n\nМы превратили ваш сайт в полноценную <b>Мини-CRM</b>. Теперь прямо в Telegram вы можете:\n\n✅ Управлять лидами и бронированиями\n✅ Быстро редактировать ссылки и БИО\n✅ Видеть детальную аналитику по каждому проекту\n\nПопробуйте новые команды в меню! 👇",
  en: "🚀 <b>LinkMAX Update: It's now a Mini-CRM!</b>\n\nWe've transformed your site into a powerful <b>Mini-CRM</b>. Now directly in Telegram you can:\n\n✅ Manage leads & bookings\n✅ Quickly edit links and BIO\n✅ See detailed analytics for each project\n\nTry new commands in the menu! 👇",
  kk: "🚀 <b>LinkMAX жаңартуы: Бұл енді жай ғана конструктор емес!</b>\n\nБіз сіздің сайтыңызды толыққанды <b>Мини-CRM</b>-ге айналдырдық. Енді тікелей Telegram-да:\n\n✅ Лидтер мен брондауларды басқара аласыз\n✅ Сілтемелер мен БИО-ны жылдам өңдей аласыз\n✅ Әр жоба бойынша толық аналитиканы көре аласыз\n\nМәзірдегі жаңа командаларды қолданып көріңіз! 👇"
};

function getMainKeyboard(lang: string) {
  const openAppBtn = lang === 'ru' ? '🚀 Открыть LinkMAX' : lang === 'kk' ? '🚀 LinkMAX ашу' : '🚀 Open LinkMAX';
  return {
    inline_keyboard: [
      [{ text: openAppBtn, web_app: { url: MINIAPP_URL } }],
      [{ text: '📊 Analytics', callback_data: 'stats' }, { text: '📩 CRM / Leads', callback_data: 'leads' }],
      [{ text: '📂 Projects / Страницы', callback_data: 'pages' }],
    ],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!isConfigured()) throw new Error('Telegram connector not configured');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Check for custom message in body
    let customText: string | null = null;
    try {
      const body = await req.json();
      customText = body.text || null;
    } catch (e) {
      // No body or invalid JSON, ignore
    }

    // Fetch all users with Telegram Chat IDs
    const { data: users, error: fetchError } = await supabase
      .from('user_profiles')
      .select('telegram_chat_id, telegram_language')
      .not('telegram_chat_id', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`Starting broadcast to ${users?.length || 0} users...`);

    let successCount = 0;
    let failCount = 0;

    for (const user of (users || [])) {
      const chatId = user.telegram_chat_id;
      const lang = (user.telegram_language || 'ru') as keyof typeof broadcastMessages;
      const text = customText || broadcastMessages[lang] || broadcastMessages.ru;

      try {
        await sendMessage(chatId, text, { parse_mode: 'HTML' });
        successCount++;
        
        // Small delay to prevent rate limits (30 msgs per second limit for TG)
        await new Promise(resolve => setTimeout(resolve, 50)); 
      } catch (e: any) {
        console.error(`Error sending message to ${chatId}:`, e);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Broadcast completed.`,
        total: (users || []).length,
        success: successCount,
        failed: failCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
