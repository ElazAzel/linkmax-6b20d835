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
    greeting: (name: string, chatId: number) =>
      `👋 Привет, ${name}!\n\n📋 <b>Ваш Chat ID для регистрации:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Нажмите на номер чтобы скопировать</b>\n\nЗатем вернитесь в lnkmx.my и вставьте его в поле регистрации.`,
    help: `📚 <b>Команды:</b>\n\n/start - Начать работу\n/help - Помощь\n/language - Сменить язык\n/id - Показать Chat ID`,
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
    greeting: (name: string, chatId: number) =>
      `👋 Hello, ${name}!\n\n📋 <b>Your Chat ID for registration:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Tap the number to copy</b>\n\nThen return to lnkmx.my and paste it into the registration field.`,
    help: `📚 <b>Commands:</b>\n\n/start - Get started\n/help - Help\n/language - Change language\n/id - Show Chat ID`,
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
    greeting: (name: string, chatId: number) =>
      `👋 Сәлем, ${name}!\n\n📋 <b>Тіркелу үшін Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Көшіру үшін нөмірді басыңыз</b>\n\nСодан кейін lnkmx.my-қа оралып, тіркеу өрісіне қойыңыз.`,
    help: `📚 <b>Командалар:</b>\n\n/start - Бастау\n/help - Көмек\n/language - Тілді өзгерту\n/id - Chat ID көрсету`,
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

// Store language preferences in memory for unlinked users
const tempLanguageStore: Record<string, Language> = {};

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

async function getUserLanguage(supabase: any, chatId: string): Promise<Language> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('telegram_language')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (!error && data?.telegram_language) {
      return data.telegram_language as Language;
    }

    // Check temp store for unlinked users
    if (tempLanguageStore[chatId]) {
      return tempLanguageStore[chatId];
    }

    return 'ru';
  } catch (e) {
    console.error('Error getting language:', e);
    return tempLanguageStore[chatId] || 'ru';
  }
}

async function setUserLanguage(supabase: any, chatId: string, language: Language): Promise<void> {
  try {
    // First try to update in database
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

    // Always store in temp (in case user links later)
    tempLanguageStore[chatId] = language;
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
