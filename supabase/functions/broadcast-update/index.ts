import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let customText: string | null = null;
    let broadcastId = `bcast_${Date.now()}`;
    
    try {
      const body = await req.json();
      customText = body.text || null;
      if (body.broadcastId) broadcastId = body.broadcastId;
    } catch (e) {
      // ignore
    }

    // Fetch all users with Telegram Chat IDs
    const { data: users, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, telegram_chat_id, telegram_language')
      .not('telegram_chat_id', 'is', null);

    if (fetchError) throw fetchError;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No users to broadcast to" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Queuing broadcast for ${users.length} users...`);

    // Prepare batch insert entries
    const queueEntries = users.map(user => {
      const lang = (user.telegram_language || 'ru') as keyof typeof broadcastMessages;
      const text = customText || broadcastMessages[lang] || broadcastMessages.ru;
      
      return {
        user_id: user.id,
        event_type: 'broadcast',
        payload: {
          channel: 'telegram',
          telegram: {
            chat_id: user.telegram_chat_id,
            text: text,
            parse_mode: 'HTML',
            reply_markup: getMainKeyboard(lang)
          }
        },
        idempotency_key: `${broadcastId}_${user.id}`
      };
    });

    // Chunked insert (Supabase limit is usually around 1000 rows per insert)
    const chunkSize = 200;
    let successCount = 0;

    for (let i = 0; i < queueEntries.length; i += chunkSize) {
      const chunk = queueEntries.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from('notification_queue')
        .insert(chunk);
      
      if (insertError) {
        console.error(`Error inserting chunk ${i/chunkSize}:`, insertError);
      } else {
        successCount += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Broadcast queued successfully.`,
        total: users.length,
        queued: successCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Broadcast queuing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
