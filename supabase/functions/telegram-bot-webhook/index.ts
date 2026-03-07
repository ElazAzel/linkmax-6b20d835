import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multilingual messages
const messages = {
  ru: {
    welcome: "🌐 Добро пожаловать в lnkmx.my!\n\nВыберите язык:",
    language_changed: "✅ Язык изменён на русский",
    stats: (subs: number, users: number) => `📊 <b>Статистика:</b>\n\n🤖 Подписчиков: ${subs}\n👤 Пользователей: ${users}`,
    publish_on: "🚀 Ваша страница опубликована!",
    publish_off: "📴 Страница снята с публикации",
    admin_only: "⛔️ Доступ только для админов",
    not_linked: "⚠️ Аккаунт не привязан. Используйте /start",
    no_page: "❌ Страница не найдена",
    greeting: (name: string, chatId: number) =>
      `👋 Привет, ${name}!\n\n📋 <b>Ваш Chat ID для регистрации:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Нажмите на номер чтобы скопировать</b>\n\nЗатем вернитесь в lnkmx.my и вставьте его в поле регистрации.`,
    help: `📚 <b>Команды:</b>\n\n/start - Начать работу\n/help - Помощь\n/language - Сменить язык\n/id - Показать Chat ID\n/zone - Сводка по зоне\n/deals - Открытые сделки\n/tasks - Задачи на сегодня\n/contacts - Последние контакты`,
    help_full: (chatId: number) =>
      `ℹ️ <b>Как подключить Telegram к lnkmx.my:</b>\n\n1️⃣ Скопируйте Chat ID: <code>${chatId}</code>\n2️⃣ Вставьте его при регистрации на lnkmx.my\n3️⃣ Нажмите "Подтвердить"\n\nПосле этого вы будете получать уведомления о заявках прямо сюда! 📩`,
    chat_id: (chatId: number) =>
      `📋 <b>Ваш Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ Нажмите чтобы скопировать`,
    copy_btn: '📋 Скопировать Chat ID',
    continue_btn: '✅ Продолжить регистрацию',
    how_works_btn: 'ℹ️ Как это работает?',
    register_btn: '📝 Регистрация',
    copied: 'Chat ID скопирован!',
  },
  en: {
    welcome: "🌐 Welcome to lnkmx.my!\n\nChoose your language:",
    language_changed: "✅ Language changed to English",
    stats: (subs: number, users: number) => `📊 <b>Stats:</b>\n\n🤖 Subscribers: ${subs}\n👤 Users: ${users}`,
    publish_on: "🚀 Your page is now published!",
    publish_off: "📴 Page unpublished",
    admin_only: "⛔️ Admin only",
    not_linked: "⚠️ Account not linked. Use /start",
    no_page: "❌ Page not found",
    greeting: (name: string, chatId: number) =>
      `👋 Hello, ${name}!\n\n📋 <b>Your Chat ID for registration:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Tap the number to copy</b>\n\nThen return to lnkmx.my and paste it into the registration field.`,
    help: `📚 <b>Commands:</b>\n\n/start - Get started\n/help - Help\n/language - Change language\n/id - Show Chat ID\n/zone - Zone overview\n/deals - Open deals\n/tasks - Today's tasks\n/contacts - Recent contacts`,
    help_full: (chatId: number) =>
      `ℹ️ <b>How to connect Telegram to lnkmx.my:</b>\n\n1️⃣ Copy Chat ID: <code>${chatId}</code>\n2️⃣ Paste it during registration at lnkmx.my\n3️⃣ Click "Confirm"\n\nAfter that you will receive notifications about leads directly here! 📩`,
    chat_id: (chatId: number) =>
      `📋 <b>Your Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ Tap to copy`,
    copy_btn: '📋 Copy Chat ID',
    continue_btn: '✅ Continue registration',
    how_works_btn: 'ℹ️ How does it work?',
    register_btn: '📝 Registration',
    copied: 'Chat ID copied!',
  },
  kk: {
    welcome: "🌐 lnkmx.my-қа қош келдіңіз!\n\nТілді таңдаңыз:",
    language_changed: "✅ Тіл қазақшаға өзгертілді",
    stats: (subs: number, users: number) => `📊 <b>Статистика:</b>\n\n🤖 Жазылушылар: ${subs}\n👤 Пайдаланушылар: ${users}`,
    publish_on: "🚀 Бет жарияланды!",
    publish_off: "📴 Бет жарияланымнан алынды",
    admin_only: "⛔️ Тек админдер үшін",
    not_linked: "⚠️ Тіркелмегенсіз. /start командасын қолданыңыз",
    no_page: "❌ Бет табылмады",
    greeting: (name: string, chatId: number) =>
      `👋 Сәлем, ${name}!\n\n📋 <b>Тіркелу үшін Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Көшіру үшін нөмірді басыңыз</b>\n\nСодан кейін lnkmx.my-қа оралып, тіркеу өрісіне қойыңыз.`,
    help: `📚 <b>Командалар:</b>\n\n/start - Бастау\n/help - Көмек\n/language - Тілді өзгерту\n/id - Chat ID көрсету\n/zone - Аймақ шолуы\n/deals - Ашық мәмілелер\n/tasks - Бүгінгі тапсырмалар\n/contacts - Соңғы контактілер`,
    help_full: (chatId: number) =>
      `ℹ️ <b>Telegram-ды lnkmx.my-қа қалай қосуға болады:</b>\n\n1️⃣ Chat ID көшіріңіз: <code>${chatId}</code>\n2️⃣ lnkmx.my сайтында тіркелу кезінде қойыңыз\n3️⃣ "Растау" басыңыз\n\nОсыдан кейін сіз хабарландыруларды тікелей осы жерде аласыз! 📩`,
    chat_id: (chatId: number) =>
      `📋 <b>Сіздің Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ Көшіру үшін басыңыз`,
    copy_btn: '📋 Chat ID көшіру',
    continue_btn: '✅ Тіркелуді жалғастыру',
    how_works_btn: 'ℹ️ Бұл қалай жұмыс істейді?',
    register_btn: '📝 Тіркелу',
    copied: 'Chat ID көшірілді!',
  },
};

type Language = 'ru' | 'en' | 'kk';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      chat: { id: number };
    };
    data?: string;
  };
}

const tempLanguageStore: Record<string, string> = {};

async function getUserLanguage(supabase: any, chatId: string): Promise<Language> {
  try {
    const { data, error } = await supabase
      .from('telegram_bot_settings')
      .select('language')
      .eq('chat_id', chatId)
      .maybeSingle();

    if (!error && data?.language) {
      return data.language as Language;
    }

    // Fallback to user_profiles if linked
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('telegram_language')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (profileData?.telegram_language) {
      return profileData.telegram_language as Language;
    }

    return 'ru';
  } catch (e) {
    console.error('Error getting language:', e);
    return tempLanguageStore[chatId] || 'ru';
  }
}

async function setUserLanguage(supabase: any, chatId: string, language: Language): Promise<void> {
  try {
    // Upsert into telegram_bot_settings
    await supabase.rpc('upsert_telegram_bot_settings', {
      p_chat_id: chatId,
      p_language: language
    });

    // Also update profile if linked
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (existingUser) {
      await supabase
        .from('user_profiles')
        .update({ telegram_language: language })
        .eq('telegram_chat_id', chatId);
    }
    console.log(`Language set to ${language} for chat ${chatId}`);
  } catch (e) {
    console.error('Error setting language:', e);
    tempLanguageStore[chatId] = language;
  }
}

function getLanguageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
        { text: '🇬🇧 English', callback_data: 'lang_en' },
        { text: '🇰🇿 Қазақша', callback_data: 'lang_kk' },
      ],
    ],
  };
}

function getMainKeyboard(lang: Language) {
  const m = messages[lang];
  return {
    inline_keyboard: [
      [{ text: m.copy_btn, callback_data: 'copy_id' }],
      [{ text: m.continue_btn, url: 'https://lnkmx.my/auth' }],
      [{ text: m.how_works_btn, callback_data: 'help' }],
      [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
    ],
  };
}

function getHelpKeyboard(lang: Language) {
  const m = messages[lang];
  return {
    inline_keyboard: [
      [{ text: m.copy_btn, callback_data: 'copy_id' }],
      [{ text: m.register_btn, url: 'https://lnkmx.my/auth' }],
      [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
    ],
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Warm-up ping — return immediately to prevent cold start
  const reqUrl = new URL(req.url);
  if (reqUrl.searchParams.get('warmup') === 'true') {
    return new Response('OK', { status: 200, headers: corsHeaders });
  }

  try {
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!telegramBotToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response('Bot not configured', { status: 500 });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message?.chat?.id || callbackQuery.from.id;
      const chatIdStr = chatId.toString();
      const data = callbackQuery.data;
      const firstName = callbackQuery.from.first_name;

      // Get user language
      const lang = await getUserLanguage(supabase, chatIdStr);
      const m = messages[lang];

      let responseText = '';
      let replyMarkup: object | null = null;

      // Handle language selection
      if (data?.startsWith('lang_')) {
        const newLang = data.replace('lang_', '') as Language;
        await setUserLanguage(supabase, chatIdStr, newLang);

        // Answer callback
        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/answerCallbackQuery`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQuery.id }),
          }
        );

        // Send confirmation and greeting
        const newM = messages[newLang];
        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: newM.language_changed,
              parse_mode: 'HTML',
            }),
          }
        );

        // Send greeting with ID
        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: newM.greeting(firstName, chatId),
              parse_mode: 'HTML',
              reply_markup: getMainKeyboard(newLang),
            }),
          }
        );

        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Handle change language button
      if (data === 'change_lang') {
        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/answerCallbackQuery`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQuery.id }),
          }
        );

        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '🌐 ' + messages.ru.welcome.split('\n\n')[1],
              parse_mode: 'HTML',
              reply_markup: getLanguageKeyboard(),
            }),
          }
        );

        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      if (data === 'get_id' || data === 'copy_id') {
        responseText = m.chat_id(chatId);
        replyMarkup = {
          inline_keyboard: [
            [{ text: m.continue_btn, url: 'https://lnkmx.my/auth' }]
          ]
        };
      } else if (data === 'help') {
        responseText = m.help_full(chatId);
        replyMarkup = getHelpKeyboard(lang);
      }

      // Answer callback query
      await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: m.copied,
            show_alert: false
          }),
        }
      );

      // Send response message
      if (responseText) {
        const messageBody: Record<string, unknown> = {
          chat_id: chatId,
          text: responseText,
          parse_mode: 'HTML',
        };
        if (replyMarkup) messageBody.reply_markup = replyMarkup;

        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageBody),
          }
        );
      }

      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle text messages
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const chatIdStr = chatId.toString();
      const text = update.message.text.trim();
      const firstName = update.message.from.first_name || 'friend';

      // Get user language
      const lang = await getUserLanguage(supabase, chatIdStr);
      const m = messages[lang];

      let responseText = '';
      let replyMarkup: object | null = null;

      if (text === '/start' || text.startsWith('/start ')) {
        // Check if first time user - show language selection
        const isFirstTime = !tempLanguageStore[chatIdStr];

        // Check database for existing preference
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('telegram_language')
          .eq('telegram_chat_id', chatIdStr)
          .single();

        if (isFirstTime && !userData) {
          // First time - show language selection
          responseText = '🌐 Добро пожаловать в lnkmx.my!\nWelcome to lnkmx.my!\nLinkMAX-қа қош келдіңіз!\n\nВыберите язык / Choose language / Тілді таңдаңыз:';
          replyMarkup = getLanguageKeyboard();
        } else {
          // Return user - use their language
          responseText = m.greeting(firstName, chatId);
          replyMarkup = getMainKeyboard(lang);
        }
      } else if (text === '/language') {
        responseText = '🌐 Выберите язык / Choose language / Тілді таңдаңыз:';
        replyMarkup = getLanguageKeyboard();
      } else if (text === '/help') {
        responseText = m.help_full(chatId);
        replyMarkup = getHelpKeyboard(lang);
      } else if (text === '/id') {
        responseText = m.chat_id(chatId);
        replyMarkup = {
          inline_keyboard: [
            [{ text: m.continue_btn, url: 'https://lnkmx.my/auth' }],
            [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
          ]
        };
      } else if (text === '/stats') {
        // Check if admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('telegram_chat_id', chatIdStr)
          .maybeSingle();

        const { data: isAdmin } = profile ? await supabase.rpc('has_role', { _user_id: profile.id, _role: 'admin' }) : { data: false };

        if (isAdmin) {
          const { count: subsCount } = await supabase.from('telegram_bot_settings').select('*', { count: 'exact', head: true });
          const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
          responseText = m.stats(subsCount || 0, usersCount || 0);
        } else {
          responseText = m.admin_only;
        }
      } else if (text === '/publish') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('telegram_chat_id', chatIdStr)
          .maybeSingle();

        if (profile) {
          const { data: page } = await supabase.from('pages').select('id, is_published').eq('user_id', profile.id).maybeSingle();
          if (page) {
            const newStatus = !page.is_published;
            await supabase.from('pages').update({ is_published: newStatus }).eq('id', page.id);
            responseText = newStatus ? m.publish_on : m.publish_off;
          } else {
            responseText = m.no_page;
          }
        } else {
          responseText = m.not_linked;
        }
      } else if (text === '/zone' || text === '/deals' || text === '/tasks' || text === '/contacts') {
        // Zone commands — find user's zone through linked profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('telegram_chat_id', chatIdStr)
          .maybeSingle();

        if (!profile) {
          responseText = m.not_linked;
        } else {
          // Find user's zone (first membership)
          const { data: membership } = await supabase
            .from('zone_members')
            .select('zone_id')
            .eq('user_id', profile.id)
            .limit(1)
            .maybeSingle();

          if (!membership) {
            responseText = lang === 'ru' ? '❌ У вас нет привязанных зон' : lang === 'kk' ? '❌ Сізде байланыстырылған аймақтар жоқ' : '❌ No zones found';
          } else {
            const zoneId = membership.zone_id;

            if (text === '/zone') {
              // Zone overview: counts of deals, contacts, tasks
              const [dealsRes, contactsRes, tasksRes, zoneRes] = await Promise.all([
                supabase.from('zone_deals').select('*', { count: 'exact', head: true }).eq('zone_id', zoneId).eq('status', 'open'),
                supabase.from('zone_contacts').select('*', { count: 'exact', head: true }).eq('zone_id', zoneId),
                supabase.from('zone_tasks').select('*', { count: 'exact', head: true }).eq('zone_id', zoneId).neq('status', 'done'),
                supabase.from('zones').select('name').eq('id', zoneId).single(),
              ]);
              const zoneName = zoneRes.data?.name || 'Zone';
              if (lang === 'ru') {
                responseText = `🏢 <b>${zoneName}</b>\n\n📊 Сводка:\n• Открытые сделки: ${dealsRes.count || 0}\n• Контакты: ${contactsRes.count || 0}\n• Активные задачи: ${tasksRes.count || 0}`;
              } else if (lang === 'kk') {
                responseText = `🏢 <b>${zoneName}</b>\n\n📊 Шолу:\n• Ашық мәмілелер: ${dealsRes.count || 0}\n• Контактілер: ${contactsRes.count || 0}\n• Белсенді тапсырмалар: ${tasksRes.count || 0}`;
              } else {
                responseText = `🏢 <b>${zoneName}</b>\n\n📊 Overview:\n• Open deals: ${dealsRes.count || 0}\n• Contacts: ${contactsRes.count || 0}\n• Active tasks: ${tasksRes.count || 0}`;
              }

            } else if (text === '/deals') {
              const { data: deals } = await supabase
                .from('zone_deals')
                .select('title, value_amount, currency, created_at')
                .eq('zone_id', zoneId)
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(5);
              if (!deals || deals.length === 0) {
                responseText = lang === 'ru' ? '📭 Нет открытых сделок' : lang === 'kk' ? '📭 Ашық мәмілелер жоқ' : '📭 No open deals';
              } else {
                const header = lang === 'ru' ? '💰 <b>Открытые сделки (последние 5):</b>' : lang === 'kk' ? '💰 <b>Ашық мәмілелер (соңғы 5):</b>' : '💰 <b>Open deals (latest 5):</b>';
                const lines = deals.map((d: any, i: number) =>
                  `${i + 1}. ${d.title} — ${d.value_amount?.toLocaleString() || 0} ${d.currency || '₸'}`
                );
                responseText = `${header}\n\n${lines.join('\n')}`;
              }

            } else if (text === '/tasks') {
              const today = new Date().toISOString().split('T')[0];
              const { data: tasks } = await supabase
                .from('zone_tasks')
                .select('title, priority, due_date')
                .eq('zone_id', zoneId)
                .neq('status', 'done')
                .neq('status', 'cancelled')
                .order('due_date', { ascending: true, nullsFirst: false })
                .limit(10);
              if (!tasks || tasks.length === 0) {
                responseText = lang === 'ru' ? '✅ Нет активных задач' : lang === 'kk' ? '✅ Белсенді тапсырмалар жоқ' : '✅ No active tasks';
              } else {
                const overdue = tasks.filter((t: any) => t.due_date && t.due_date < today);
                const todayTasks = tasks.filter((t: any) => t.due_date === today);
                const upcoming = tasks.filter((t: any) => !t.due_date || t.due_date > today);
                const parts: string[] = [];
                if (overdue.length > 0) {
                  const label = lang === 'ru' ? '🔴 Просрочено' : lang === 'kk' ? '🔴 Мерзімі өткен' : '🔴 Overdue';
                  parts.push(`${label}:`);
                  overdue.forEach((t: any) => parts.push(`  • ${t.title} (${t.due_date})`));
                }
                if (todayTasks.length > 0) {
                  const label = lang === 'ru' ? '🟡 Сегодня' : lang === 'kk' ? '🟡 Бүгін' : '🟡 Today';
                  parts.push(`${label}:`);
                  todayTasks.forEach((t: any) => parts.push(`  • ${t.title}`));
                }
                if (upcoming.length > 0) {
                  const label = lang === 'ru' ? '🔵 Предстоящие' : lang === 'kk' ? '🔵 Алдағы' : '🔵 Upcoming';
                  parts.push(`${label}:`);
                  upcoming.slice(0, 5).forEach((t: any) => parts.push(`  • ${t.title}${t.due_date ? ` (${t.due_date})` : ''}`));
                }
                const header = lang === 'ru' ? '📋 <b>Задачи:</b>' : lang === 'kk' ? '📋 <b>Тапсырмалар:</b>' : '📋 <b>Tasks:</b>';
                responseText = `${header}\n\n${parts.join('\n')}`;
              }

            } else if (text === '/contacts') {
              const { data: contacts } = await supabase
                .from('zone_contacts')
                .select('name, phone, email, created_at')
                .eq('zone_id', zoneId)
                .order('created_at', { ascending: false })
                .limit(5);
              if (!contacts || contacts.length === 0) {
                responseText = lang === 'ru' ? '📭 Нет контактов' : lang === 'kk' ? '📭 Контактілер жоқ' : '📭 No contacts';
              } else {
                const header = lang === 'ru' ? '👥 <b>Последние контакты:</b>' : lang === 'kk' ? '👥 <b>Соңғы контактілер:</b>' : '👥 <b>Recent contacts:</b>';
                const lines = contacts.map((c: any, i: number) => {
                  const details = [c.phone, c.email].filter(Boolean).join(' | ');
                  return `${i + 1}. ${c.name}${details ? ` — ${details}` : ''}`;
                });
                responseText = `${header}\n\n${lines.join('\n')}`;
              }
            }
          }
        }
      } else {
        // Any other message - just show the ID
        responseText = m.chat_id(chatId);
        replyMarkup = getHelpKeyboard(lang);
      }

      // Send response
      const messageBody: Record<string, unknown> = {
        chat_id: chatId,
        text: responseText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      if (replyMarkup) {
        messageBody.reply_markup = replyMarkup;
      }

      const sendResponse = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageBody),
        }
      );

      const sendResult = await sendResponse.json();
      console.log('Send message result:', JSON.stringify(sendResult));

      if (!sendResult.ok) {
        console.error('Failed to send message:', sendResult.description);
      }
    }

    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('OK', { status: 200 });
  }
});
