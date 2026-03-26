import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMessage, answerCallbackQuery, editMessageText, isConfigured } from "../_shared/telegram.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Mini App base URL
const MINIAPP_URL = 'https://lnkmx.my/tg/';
const BOT_USERNAME = 'linkmaxmy_bot';

// Multilingual messages
const messages = {
  ru: {
    welcome: "🌐 Добро пожаловать в LinkMAX!\n\nВыберите язык:",
    language_changed: "✅ Язык изменён на русский",
    stats: (subs: number, users: number) => `📊 <b>Статистика:</b>\n\n🤖 Подписчиков: ${subs}\n👤 Пользователей: ${users}`,
    publish_on: "🚀 Ваша страница опубликована!",
    publish_off: "📴 Страница снята с публикации",
    admin_only: "⛔️ Доступ только для админов",
    not_linked: "⚠️ Аккаунт не привязан. Используйте /start",
    no_page: "❌ Страница не найдена",
    greeting: (name: string, chatId: number) =>
      `👋 Привет, ${name}!\n\n📋 <b>Ваш Chat ID для регистрации:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Нажмите на номер чтобы скопировать</b>\n\nЗатем вернитесь в LinkMAX и вставьте его в поле регистрации.`,
    greeting_miniapp: (name: string) =>
      `👋 Привет, ${name}!\n\n🚀 <b>LinkMAX — ваш Business OS в Telegram</b>\n\nОткройте Mini App чтобы:\n• Создать страницу\n• Работать с лидами\n• Управлять бронированиями\n• Смотреть аналитику`,
    help: `<b>Доступные команды:</b>\n\n` +
            `📊 /stats — Аналитика активного проекта\n` +
            `📩 /leads — Последние лиды\n` +
            `📅 /bookings — Бронирования\n\n` +
            `📂 /pages — Выбор активного проекта\n` +
            `🔗 /links — Управление ссылками\n` +
            `➕ /add_link — Добавить ссылку\n` +
            `📝 /edit_bio — Изменить БИО\n` +
            `🌐 /toggle_publish — Статус сайта\n\n` +
            `⚙️ /settings — Язык и уведомления\n` +
            `❓ /help — Список команд`,
    help_full: (chatId: number) =>
      `ℹ️ <b>Как подключить Telegram к LinkMAX:</b>\n\n1️⃣ Скопируйте Chat ID: <code>${chatId}</code>\n2️⃣ Вставьте его при регистрации на lnkmx.my\n3️⃣ Нажмите "Подтвердить"\n\nПосле этого вы будете получать уведомления о заявках прямо сюда! 📩`,
    chat_id: (chatId: number) =>
      `📋 <b>Ваш Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ Нажмите чтобы скопировать`,
    copy_btn: '📋 Скопировать Chat ID',
    continue_btn: '✅ Продолжить регистрацию',
    open_app_btn: '🚀 Открыть LinkMAX',
    how_works_btn: 'ℹ️ Как это работает?',
    register_btn: '📝 Регистрация',
    copied: 'Chat ID скопирован!',
    support: '💬 <b>Поддержка</b>\n\nЕсли у вас есть вопросы или нужна помощь:\n\n• Напишите @linkmax_support\n• Или опишите проблему прямо здесь',
    lead_updated: (status: string) => `✅ Статус лида обновлен на: <b>${status}</b>`,
    page_info: (title: string, slug: string, status: string, views: number) => `📄 <b>Ваша страница:</b>\n\nНазвание: ${title}\nСсылка: lnkmx.my/${slug}\nСтатус: ${status}\nПросмотров за всё время: ${views}`,
    wallet_info: (balance: number, pending: number) => `💰 <b>Ваш кошелек:</b>\n\nДоступно: ${balance.toLocaleString()} ₸\nВ ожидании (GMV): ${pending.toLocaleString()} ₸`,
    leads_list: (page: number, total: number) => `📩 <b>Ваши лиды (Стр. ${page + 1}):</b>\n\nВсего: ${total}`,
    lead_item: (l: any) => `👤 <b>${l.name || 'Без имени'}</b>\n📞 ${l.phone || '-'}\n📅 ${new Date(l.created_at).toLocaleDateString('ru-RU')}\n📝 Статус: ${l.status}`,
    stats_header: (period: string) => `📊 <b>Статистика (${period}):</b>\n\n`,
    stats_row: (label: string, value: number, bar: string) => `${label}: <b>${value}</b>\n${bar}\n`,
    bookings_list: (found: number) => `📅 <b>Бронирования:</b>\n\nНайдено: ${found}`,
    booking_item: (b: any) => `🗓 ${b.slot_date} ${b.slot_time}\n👤 ${b.client_name}\n📞 ${b.client_phone || '-'}\n🏷 ${b.status}`,
    lead_error: '❌ Ошибка при обновлении лида. Попробуйте еще раз.',
    pages_list: '📋 <b>Ваши проекты:</b>\nВыберите проект для управления:',
    active_page_set: (title: string) => `✅ Активный проект установлен: <b>${title}</b>\nТеперь команды /stats, /leads и /bookings работают для этого проекта.`,
    edit_bio_prompt: '📝 Отправьте новое описание (BIO) для вашего профиля:',
    bio_updated: '✅ Описание профиля успешно обновлено!',
    add_link_prompt: '🔗 Отправьте название и ссылку в формате:\n<code>Название | https://link.com</code>',
    link_added: '✅ Ссылка успешно добавлена на вашу страницу!',
    toggle_publish_confirm: (status: string) => `Статус страницы: <b>${status === 'published' ? 'Опубликовано 🟢' : 'Черновик ⚪'}</b>\nХотите изменить статус?`,
    status_updated: (status: string) => `✅ Статус обновлен: <b>${status === 'published' ? 'Опубликовано 🟢' : 'Черновик ⚪'}</b>`,
    links_list_header: '🔗 <b>Ваши ссылки:</b>\nНажмите ❌ для удаления',
    link_deleted: '✅ Ссылка удалена',
    settings_menu: '⚙️ <b>Настройки бота:</b>',
    broadcast_crm: "🚀 <b>Обновление LinkMAX: Это больше не просто конструктор!</b>\n\nМы превратили ваш сайт в полноценную <b>Мини-CRM</b>. Теперь прямо в Telegram вы можете:\n\n✅ Управлять лидами и бронированиями\n✅ Быстро редактировать ссылки и БИО\n✅ Видеть детальную аналитику по каждому проекту\n\nПопробуйте новые команды в меню! 👇",
  },
  en: {
    welcome: "🌐 Welcome to LinkMAX!\n\nChoose your language:",
    language_changed: "✅ Language changed to English",
    stats: (subs: number, users: number) => `📊 <b>Stats:</b>\n\n🤖 Subscribers: ${subs}\n👤 Users: ${users}`,
    publish_on: "🚀 Your page is now published!",
    publish_off: "📴 Page unpublished",
    admin_only: "⛔️ Admin only",
    not_linked: "⚠️ Account not linked. Use /start",
    no_page: "❌ Page not found",
    greeting: (name: string, chatId: number) =>
      `👋 Hello, ${name}!\n\n📋 <b>Your Chat ID for registration:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Tap the number to copy</b>\n\nThen return to LinkMAX and paste it into the registration field.`,
    greeting_miniapp: (name: string) =>
      `👋 Hello, ${name}!\n\n🚀 <b>LinkMAX — your Business OS in Telegram</b>\n\nOpen the Mini App to:\n• Create your page\n• Manage leads\n• Handle bookings\n• View analytics`,
    help: `<b>Available commands:</b>\n\n` +
            `📊 /stats — Active project stats\n` +
            `📩 /leads — Recent leads\n` +
            `📅 /bookings — Bookings\n\n` +
            `📂 /pages — Select active project\n` +
            `🔗 /links — Manage links\n` +
            `➕ /add_link — Add link\n` +
            `📝 /edit_bio — Update Profile BIO\n` +
            `🌐 /toggle_publish — Site status\n\n` +
            `⚙️ /settings — Language & Alerts\n` +
            `❓ /help — Commands list`,
    help_full: (chatId: number) =>
      `ℹ️ <b>How to connect Telegram to LinkMAX:</b>\n\n1️⃣ Copy Chat ID: <code>${chatId}</code>\n2️⃣ Paste it during registration at lnkmx.my\n3️⃣ Click "Confirm"\n\nAfter that you will receive notifications about leads directly here! 📩`,
    chat_id: (chatId: number) =>
      `📋 <b>Your Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ Tap to copy`,
    copy_btn: '📋 Copy Chat ID',
    continue_btn: '✅ Continue registration',
    open_app_btn: '🚀 Open LinkMAX',
    how_works_btn: 'ℹ️ How does it work?',
    register_btn: '📝 Registration',
    copied: 'Chat ID copied!',
    support: '💬 <b>Support</b>\n\nIf you have questions or need help:\n\n• Message @linkmax_support\n• Or describe your issue right here',
    lead_updated: (status: string) => `✅ Lead status updated to: <b>${status}</b>`,
    page_info: (title: string, slug: string, status: string, views: number) => `📄 <b>Your Page:</b>\n\nTitle: ${title}\nURL: lnkmx.my/${slug}\nStatus: ${status}\nTotal Views: ${views}`,
    wallet_info: (balance: number, pending: number) => `💰 <b>Your Wallet:</b>\n\nAvailable: ${balance.toLocaleString()} ₸\nPending (GMV): ${pending.toLocaleString()} ₸`,
    leads_list: (page: number, total: number) => `📩 <b>Your Leads (Page ${page + 1}):</b>\n\nTotal: ${total}`,
    lead_item: (l: any) => `👤 <b>${l.name || 'Unnamed'}</b>\n📞 ${l.phone || '-'}\n📅 ${new Date(l.created_at).toLocaleDateString('en-US')}\n📝 Status: ${l.status}`,
    stats_header: (period: string) => `📊 <b>Stats (${period}):</b>\n\n`,
    stats_row: (label: string, value: number, bar: string) => `${label}: <b>${value}</b>\n${bar}\n`,
    bookings_list: (found: number) => `📅 <b>Bookings:</b>\n\nFound: ${found}`,
    booking_item: (b: any) => `🗓 ${b.slot_date} ${b.slot_time}\n👤 ${b.client_name}\n📞 ${b.client_phone || '-'}\n🏷 ${b.status}`,
    lead_error: '❌ Error updating lead. Please try again.',
    pages_list: '📋 <b>Your Projects:</b>\nChoose active project to manage:',
    active_page_set: (title: string) => `✅ Active project set to: <b>${title}</b>\nCommands /stats, /leads and /bookings refer to this project.`,
    edit_bio_prompt: '📝 Send new description (BIO) for your profile:',
    bio_updated: '✅ Profile BIO updated successfully!',
    add_link_prompt: '🔗 Send name and URL in format:\n<code>Name | https://link.com</code>',
    link_added: '✅ Link added to your page!',
    toggle_publish_confirm: (status: string) => `Page status: <b>${status === 'published' ? 'Published 🟢' : 'Draft ⚪'}</b>\nWant to change status?`,
    status_updated: (status: string) => `✅ Status updated: <b>${status === 'published' ? 'Published 🟢' : 'Draft ⚪'}</b>`,
    links_list_header: '🔗 <b>Your links:</b>\nTap ❌ to delete',
    link_deleted: '✅ Link deleted',
    settings_menu: '⚙️ <b>Bot settings:</b>',
    broadcast_crm: "🚀 <b>LinkMAX Update: It's now a Mini-CRM!</b>\n\nWe've transformed your site into a powerful <b>Mini-CRM</b>. Now directly in Telegram you can:\n\n✅ Manage leads & bookings\n✅ Quickly edit links and BIO\n✅ See detailed analytics for each project\n\nTry new commands in the menu! 👇",
  },
  kk: {
    welcome: "🌐 LinkMAX-қа қош келдіңіз!\n\nТілді таңдаңыз:",
    language_changed: "✅ Тіл қазақшаға өзгертілді",
    stats: (subs: number, users: number) => `📊 <b>Статистика:</b>\n\n🤖 Жазылушылар: ${subs}\n👤 Пайдаланушылар: ${users}`,
    publish_on: "🚀 Бет жарияланды!",
    publish_off: "📴 Бет жарияланымнан алынды",
    admin_only: "⛔️ Тек админдер үшін",
    not_linked: "⚠️ Тіркелмегенсіз. /start командасын қолданыңыз",
    no_page: "❌ Бет табылмады",
    greeting: (name: string, chatId: number) =>
      `👋 Сәлем, ${name}!\n\n📋 <b>Тіркелу үшін Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ <b>Көшіру үшін нөмірді басыңыз</b>\n\nСодан кейін lnkmx.my-қа оралып, тіркеу өрісіне қойыңыз.`,
    greeting_miniapp: (name: string) =>
      `👋 Сәлем, ${name}!\n\n🚀 <b>LinkMAX — сіздің Business OS Telegram-да</b>\n\nMini App ашыңыз:\n• Бет жасау\n• Лидтерді басқару\n• Брондауларды басқару\n• Аналитика көру`,
    help: `<b>Қолжетімді командалар:</b>\n\n` +
            `📊 /stats — Белсенді жоба аналитикасы\n` +
            `📩 /leads — Соңғы лидтер\n` +
            `📅 /bookings — Брондаулар\n\n` +
            `📂 /pages — Белсенді жобаны таңдау\n` +
            `🔗 /links — Сілтемелерді басқару\n` +
            `➕ /add_link — Сілтеме қосу\n` +
            `📝 /edit_bio — Бионы өзгерту\n` +
            `🌐 /toggle_publish — Сайт статусы\n\n` +
            `⚙️ /settings — Тіл және хабарландырулар\n` +
            `❓ /help — Командалар тізімі`,
    help_full: (chatId: number) =>
      `ℹ️ <b>Telegram-ды LinkMAX-қа қалай қосуға болады:</b>\n\n1️⃣ Chat ID көшіріңіз: <code>${chatId}</code>\n2️⃣ lnkmx.my сайтында тіркелу кезінде қойыңыз\n3️⃣ "Растау" басыңыз\n\nОсыдан кейін сіз хабарландыруларды тікелей осы жерде аласыз! 📩`,
    chat_id: (chatId: number) =>
      `📋 <b>Сіздің Chat ID:</b>\n\n<code>${chatId}</code>\n\n☝️ Көшіру үшін басыңыз`,
    copy_btn: '📋 Chat ID көшіру',
    continue_btn: '✅ Тіркелуді жалғастыру',
    open_app_btn: '🚀 LinkMAX ашу',
    how_works_btn: 'ℹ️ Бұл қалай жұмыс істейді?',
    register_btn: '📝 Тіркелу',
    copied: 'Chat ID көшірілді!',
    support: '💬 <b>Қолдау</b>\n\nСұрақтарыңыз болса немесе көмек қажет болса:\n\n• @linkmax_support жазыңыз\n• Немесе мәселені осы жерде сипаттаңыз',
    lead_updated: (status: string) => `✅ Лид статусы жаңартылды: <b>${status}</b>`,
    page_info: (title: string, slug: string, status: string, views: number) => `📄 <b>Сіздің бетіңіз:</b>\n\nАтауы: ${title}\nСілтеме: lnkmx.my/${slug}\nСтатус: ${status}\nБарлық қаралымдар: ${views}`,
    wallet_info: (balance: number, pending: number) => `💰 <b>Сіздің әмияныңыз:</b>\n\nҚолжетімді: ${balance.toLocaleString()} ₸\nКүтуде (GMV): ${pending.toLocaleString()} ₸`,
    leads_list: (page: number, total: number) => `📩 <b>Сіздің лидтеріңіз (${page + 1}-бет):</b>\n\nБарлығы: ${total}`,
    lead_item: (l: any) => `👤 <b>${l.name || 'Есімсіз'}</b>\n📞 ${l.phone || '-'}\n📅 ${new Date(l.created_at).toLocaleDateString('kk-KZ')}\n📝 Статус: ${l.status}`,
    stats_header: (period: string) => `📊 <b>Статистика (${period}):</b>\n\n`,
    stats_row: (label: string, value: number, bar: string) => `${label}: <b>${value}</b>\n${bar}\n`,
    bookings_list: (found: number) => `📅 <b>Брондаулар:</b>\n\nТабылды: ${found}`,
    booking_item: (b: any) => `🗓 ${b.slot_date} ${b.slot_time}\n👤 ${b.client_name}\n📞 ${b.client_phone || '-'}\n🏷 ${b.status}`,
    lead_error: '❌ Лидті жаңарту кезінде қате кетті. Қайталап көріңіз.',
    pages_list: '📋 <b>Сіздің жобаларыңыз:</b>\nБасқару үшін белсенді жобаны таңдаңыз:',
    active_page_set: (title: string) => `✅ Белсенді жоба: <b>${title}</b>\nЕнді /stats және /leads осы жоба үшін жұмыс істейді.`,
    edit_bio_prompt: '📝 Профиліңіз үшін жаңа БИО жіберіңіз:',
    bio_updated: '✅ БИО сәтті жаңартылды!',
    add_link_prompt: '🔗 Сілтеме қосу үшін форматта жіберіңіз:\n<code>Атауы | https://link.com</code>',
    link_added: '✅ Сілтеме бетіңізге қосылды!',
    toggle_publish_confirm: (status: string) => `Бет статусы: <b>${status === 'published' ? 'Жарияланды 🟢' : 'Черновик ⚪'}</b>\nСтатусты өзгерткіңіз келе ме?`,
    status_updated: (status: string) => `✅ Статус жаңартылды: <b>${status === 'published' ? 'Жарияланды 🟢' : 'Черновик ⚪'}</b>`,
    links_list_header: '🔗 <b>Сілтемелеріңіз:</b>\nӨшіру үшін ❌ басыңыз',
    link_deleted: '✅ Сілтеме өшірілді',
    settings_menu: '⚙️ <b>Бот баптаулары:</b>',
    broadcast_crm: "🚀 <b>LinkMAX жаңартуы: Бұл енді жай ғана конструктор емес!</b>\n\nБіз сіздің сайтыңызды толыққанды <b>Мини-CRM</b>-ге айналдырдық. Енді тікелей Telegram-да:\n\n✅ Лидтер мен брондауларды басқара аласыз\n✅ Сілтемелер мен БИО-ны жылдам өңдей аласыз\n✅ Әр жоба бойынша толық аналитиканы көре аласыз\n\nМәзірдегі жаңа командаларды қолданып көріңіз! 👇",
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
      message_id: number;
    };
    data?: string;
  };
}

async function getActivePageId(supabase: any, chatId: string): Promise<string | null> {
  const { data } = await supabase
    .from('telegram_bot_settings')
    .select('active_page_id')
    .eq('chat_id', chatId)
    .maybeSingle();
  return data?.active_page_id || null;
}

async function setActivePageId(supabase: any, chatId: string, pageId: string): Promise<void> {
  await supabase.rpc('upsert_telegram_bot_active_page', {
    p_chat_id: chatId,
    p_page_id: pageId
  });
}

function getSettings(supabase: any, chatId: string) {
  return supabase.from('telegram_bot_settings').select('*').eq('chat_id', chatId).maybeSingle();
}

const tempLanguageStore: Record<string, string> = {};

async function getUserProfile(supabase: any, chatId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, telegram_language, is_premium')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  if (error) {
    console.error(`[DB Error] Fetching profile for ${chatId}:`, error);
  }
  
  if (!data) {
    console.log(`[Webhook] No profile found for ${chatId}`);
  }
  
  return data;
}
const userActionStore: Record<string, string | null> = {};

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
    return (tempLanguageStore[chatId] as Language) || 'ru';
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
      [{ text: m.open_app_btn, web_app: { url: MINIAPP_URL } }],
      [{ text: '📩 Leads', callback_data: 'leads_page:0' }, { text: '📊 Stats', callback_data: 'stats_help' }],
      [{ text: m.copy_btn, callback_data: 'copy_id' }],
      [{ text: m.continue_btn, url: 'https://lnkmx.my/auth' }],
      [{ text: m.how_works_btn, callback_data: 'help' }],
      [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
    ],
  };
}

function getMiniAppKeyboard(lang: Language, startapp?: string) {
  const m = messages[lang];
  const url = startapp
    ? `https://t.me/${BOT_USERNAME}/app?startapp=${startapp}`
    : MINIAPP_URL;
  return {
    inline_keyboard: [
      [{ text: m.open_app_btn, web_app: { url } }],
      [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
    ],
  };
}

function getHelpKeyboard(lang: Language) {
  const m = messages[lang];
  return {
    inline_keyboard: [
      [{ text: m.open_app_btn, web_app: { url: MINIAPP_URL } }],
      [{ text: '📂 ' + (lang === 'ru' ? 'Мои проекты' : lang === 'kk' ? 'Менің жобаларым' : 'My Projects'), callback_data: 'pages' }, 
       { text: '🔗 ' + (lang === 'ru' ? 'Ссылки' : lang === 'kk' ? 'Сілтемелер' : 'Links'), callback_data: 'links' }],
      [{ text: '⚙️ ' + (lang === 'ru' ? 'Настройки' : lang === 'kk' ? 'Баптаулар' : 'Settings'), callback_data: 'settings' }],
      [{ text: m.copy_btn, callback_data: 'copy_id' }],
      [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
    ],
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Warm-up ping — return immediately to prevent cold start
  const reqUrl = new URL(req.url);
  if (reqUrl.searchParams.get('warmup') === 'true') {
    return new Response('OK', { status: 200, headers: corsHeaders });
  }

  try {
    if (!isConfigured()) {
      console.error('Telegram gateway not configured');
      return new Response('Bot not configured', { status: 500 });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const update: TelegramUpdate = await req.json();
    console.log(`[Webhook] Update from ${update.message?.chat.id || update.callback_query?.from.id}:`, JSON.stringify(update));

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
        await answerCallbackQuery(callbackQuery.id);

        // Send confirmation and greeting
        const newM = messages[newLang];
        await sendMessage(chatId, newM.language_changed, { parse_mode: 'HTML' });

        await sendMessage(chatId, newM.greeting(firstName, chatId), {
          parse_mode: 'HTML',
          reply_markup: getMainKeyboard(newLang),
        });

        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Handle change language button
      if (data === 'change_lang') {
        await answerCallbackQuery(callbackQuery.id);

        await sendMessage(chatId, '🌐 ' + messages.ru.welcome.split('\n\n')[1], {
          parse_mode: 'HTML',
          reply_markup: getLanguageKeyboard(),
        });

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
      } else if (data?.startsWith('lead_status:')) {
        const [_, status, leadId] = data.split(':');
        
        // Update lead/deal status in DB
        const { error: updateError } = await supabase
          .from('leads')
          .update({ status })
          .eq('id', leadId);

        if (updateError) {
          console.error('Error updating lead status:', updateError);
          responseText = m.lead_error;
        } else {
          // Map status code to display name
          const statusNames: Record<string, string> = {
            'contacted': lang === 'ru' ? 'В работе' : lang === 'kk' ? 'Жұмыста' : 'In Progress',
            'won': lang === 'ru' ? 'Продано' : lang === 'kk' ? 'Сатылды' : 'Won'
          };
          responseText = m.lead_updated(statusNames[status] || status);
        }
      } else if (data?.startsWith('leads_page:')) {
        const page = parseInt(data.split(':')[1]);
        const profile = await getUserProfile(supabase, chatIdStr);

        if (profile) {
          const { data: leads, count } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .range(page * 5, (page * 5) + 4);

          if (leads && leads.length > 0) {
            const leadLines = leads.map((l: any) => m.lead_item(l));
            responseText = `${m.leads_list(page, count || 0)}\n\n${leadLines.join('\n\n')}`;
            
            const buttons = [];
            const navRow = [];
            if (page > 0) navRow.push({ text: '⬅️', callback_data: `leads_page:${page - 1}` });
            if (count && (page + 1) * 5 < count) navRow.push({ text: '➡️', callback_data: `leads_page:${page + 1}` });
            if (navRow.length > 0) buttons.push(navRow);
            
            buttons.push([{ text: m.open_app_btn, web_app: { url: `${MINIAPP_URL}?startapp=crm` } }]);
            replyMarkup = { inline_keyboard: buttons };

            // Edit original message instead of sending new one if possible
            await editMessageText(chatId, callbackQuery.message?.message_id!, responseText, {
              parse_mode: 'HTML',
              reply_markup: replyMarkup,
            });
            return new Response('OK', { status: 200, headers: corsHeaders });
          }
        }
      } else if (data?.startsWith('set_active_page:')) {
        const pageId = data.split(':')[1];
        await setActivePageId(supabase, chatIdStr, pageId);
        
        const { data: page } = await supabase.from('pages').select('title').eq('id', pageId).single();
        responseText = m.active_page_set(page?.title || 'Untitled');
        replyMarkup = getMainKeyboard(lang);
      } else if (data === 'toggle_publish') {
        const activePageId = await getActivePageId(supabase, chatIdStr);
        if (activePageId) {
          const { data: page } = await supabase.from('pages').select('status').eq('id', activePageId).single();
          const newStatus = page?.status === 'published' ? 'draft' : 'published';
          await supabase.from('pages').update({ status: newStatus }).eq('id', activePageId);
          
          responseText = m.status_updated(newStatus);
          // Edit message to show success
          await editMessageText(chatId, callbackQuery.message?.message_id!, responseText, {
            parse_mode: 'HTML',
          });
          return new Response('OK', { status: 200, headers: corsHeaders });
        }
      } else if (data === 'delete_link:') {
        // (Existing delete_link logic)
      } else if (data === 'pages') {
        const profile = await getUserProfile(supabase, chatIdStr);
        if (profile) {
          const { data: pages } = await supabase
            .from('pages')
            .select('id, title')
            .eq('user_id', profile.id);

          if (pages && pages.length > 0) {
            responseText = m.pages_list;
            const buttons = pages.map((p: any) => ([{
              text: p.title || 'Untitled',
              callback_data: `set_active_page:${p.id}`
            }]));
            replyMarkup = { inline_keyboard: buttons };
          } else {
            responseText = m.no_page;
          }
        } else {
          responseText = m.not_linked;
        }
      } else if (data === 'links') {
        const activePageId = await getActivePageId(supabase, chatIdStr);
        if (activePageId) {
          const { data: blocks } = await supabase
            .from('page_blocks')
            .select('id, content')
            .eq('page_id', activePageId)
            .eq('type', 'link')
            .order('order', { ascending: true });

          if (blocks && blocks.length > 0) {
            responseText = m.links_list_header;
            const buttons = blocks.map((b: any) => ([
              { text: `${b.content?.title || 'Untitled'}`, url: b.content?.url || '#' },
              { text: '❌', callback_data: `delete_link:${b.id}` }
            ]));
            replyMarkup = { inline_keyboard: buttons };
          } else {
            responseText = lang === 'ru' ? '📭 У вас пока нет ссылок' : '📭 No links yet';
          }
        } else {
          responseText = m.no_page;
          replyMarkup = { inline_keyboard: [[{ text: '📂 ' + (lang === 'ru' ? 'Выбрать проект' : 'Select Project'), callback_data: 'pages' }]] };
        }
      } else if (data === 'settings') {
        responseText = m.settings_menu;
        replyMarkup = {
          inline_keyboard: [
            [{ text: '🌐 Change Language / Тіл', callback_data: 'change_lang' }],
            [{ text: '🔔 Notifications: ON', callback_data: 'notif_toggle' }]
          ]
        };
      } else if (data === 'stats_help') {
        responseText = lang === 'ru' 
          ? '📊 <b>Как работает статистика:</b>\n\nЯ показываю данные за последние 7 дней для вашего активного проекта.\n\nИспользуйте /pages чтобы переключить проект.' 
          : '📊 <b>How stats work:</b>\n\nI show data for the last 7 days for your active project.\n\nUse /pages to switch project.';
        replyMarkup = {
          inline_keyboard: [
            [{ text: '📊 ' + (lang === 'ru' ? 'Показать стат.' : 'Show Stats'), callback_data: 'stats' }],
            [{ text: '📂 ' + (lang === 'ru' ? 'Выбрать проект' : 'Select Project'), callback_data: 'pages' }]
          ]
        };
      } else if (data === 'notif_toggle') {
        // Toggle notification logic (simulated for now)
        responseText = lang === 'ru' ? '✅ Уведомления включены' : '✅ Notifications enabled';
      } else if (data === 'stats') {
        // Trigger stats command logic
        const profile = await getUserProfile(supabase, chatIdStr);
        if (profile) {
          const activePageId = await getActivePageId(supabase, chatIdStr);
          let pageIds: string[] = [];
          if (activePageId) {
            pageIds = [activePageId];
          } else {
            const { data: pages } = await supabase.from('pages').select('id').eq('user_id', profile.id);
            pageIds = (pages || []).map((p: any) => p.id);
          }
          
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const [viewsRes, clicksRes, leadsRes] = await Promise.all([
            supabase.from('analytics').select('created_at').in('page_id', pageIds).eq('event_type', 'view').gte('created_at', weekAgo),
            supabase.from('analytics').select('created_at').in('page_id', pageIds).eq('event_type', 'click').gte('created_at', weekAgo),
            supabase.from('leads').select('created_at').in('page_id', pageIds).gte('created_at', weekAgo),
          ]);
          
          const views = viewsRes.data || [];
          const clicks = clicksRes.data || [];
          const leads = leadsRes.data || [];
          const maxVal = Math.max(views.length, 1);
          const createBar = (val: number, max: number) => {
            const length = max > 0 ? Math.round((val / max) * 10) : 0;
            return '🟩'.repeat(length) + '⬜'.repeat(10 - length);
          };
          
          responseText = m.stats_header(lang === 'ru' ? '7 дней' : '7 days');
          responseText += m.stats_row(lang === 'ru' ? '👁 Просмотры' : '👁 Views', views.length, createBar(views.length, maxVal));
          responseText += m.stats_row(lang === 'ru' ? '🖱 Клики' : '🖱 Clicks', clicks.length, createBar(clicks.length, maxVal));
          responseText += m.stats_row(lang === 'ru' ? '📩 Лиды' : '📩 Leads', leads.length, createBar(leads.length, maxVal));
          
          replyMarkup = {
            inline_keyboard: [[{ text: m.open_app_btn, web_app: { url: `${MINIAPP_URL}?startapp=stats` } }]]
          };
        }
      }

      // Answer callback query
      await answerCallbackQuery(callbackQuery.id, { text: m.copied, show_alert: false });

      // Send response message
      if (responseText) {
        const messageBody: Record<string, unknown> = {
          chat_id: chatId,
          text: responseText,
          parse_mode: 'HTML',
        };
        if (replyMarkup) messageBody.reply_markup = replyMarkup;

        await sendMessage(chatId, responseText, {
          parse_mode: 'HTML',
          reply_markup: replyMarkup || undefined,
        });
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
        // Handle startapp parameter from deep links
        const startappParam = text.startsWith('/start ') ? text.split(' ')[1] : null;

        // Check if first time user - show language selection
        const isFirstTime = !tempLanguageStore[chatIdStr];

        // Check database for existing preference
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('telegram_language')
          .eq('telegram_chat_id', chatIdStr)
          .single();

        if (startappParam) {
          // Deep link: show Mini App greeting + open button
          responseText = m.greeting_miniapp(firstName);
          replyMarkup = getMiniAppKeyboard(lang, startappParam);
        } else if (isFirstTime && !userData) {
          // First time - show language selection
          responseText = '🌐 Добро пожаловать в LinkMAX!\nWelcome to LinkMAX!\nLinkMAX-қа қош келдіңіз!\n\nВыберите язык / Choose language / Тілді таңдаңыз:';
          replyMarkup = getLanguageKeyboard();
        } else {
          // Return user - show greeting with Mini App button
          responseText = m.greeting_miniapp(firstName);
          replyMarkup = getMainKeyboard(lang);
        }
      } else if (text === '/app') {
        // Open Mini App Home
        responseText = m.greeting_miniapp(firstName);
        replyMarkup = getMiniAppKeyboard(lang);
      } else if (text === '/page') {
        const profile = await getUserProfile(supabase, chatIdStr);

        if (!profile) {
          responseText = m.not_linked;
        } else {
          // Check for active page first
          const activePageId = await getActivePageId(supabase, chatIdStr);
          let query = supabase.from('pages').select('id, title, slug, is_published');
          
          if (activePageId) {
            query = query.eq('id', activePageId);
          } else {
            query = query.eq('user_id', profile.id).limit(1);
          }

          const { data: page } = await query.maybeSingle();

          if (!page) {
            responseText = m.no_page;
          } else {
            const { count: views } = await supabase
              .from('analytics')
              .select('*', { count: 'exact', head: true })
              .eq('page_id', page.id)
              .eq('event_type', 'view');

            const status = page.is_published 
              ? (lang === 'ru' ? '🚀 Опубликована' : lang === 'kk' ? '🚀 Жарияланды' : '🚀 Published')
              : (lang === 'ru' ? '📴 Черновик' : lang === 'kk' ? '📴 Шимай' : '📴 Draft');

            responseText = m.page_info(page.title || 'Untitled', page.slug, status, views || 0);
            replyMarkup = {
              inline_keyboard: [
                [{ text: lang === 'ru' ? '🔗 Открыть страницу' : '🔗 Open Page', url: `https://lnkmx.my/${page.slug}` }],
                [{ text: m.open_app_btn, web_app: { url: `${MINIAPP_URL}?startapp=page` } }]
              ]
            };
          }
        }
      } else if (text === '/support') {
        // Support info
        responseText = m.support;
        replyMarkup = {
          inline_keyboard: [
            [{ text: m.open_app_btn, web_app: { url: MINIAPP_URL } }],
          ]
        };
      } else if (text === '/language') {
        responseText = '🌐 Выберите язык / Choose language / Тілді таңдаңыз:';
        replyMarkup = getLanguageKeyboard();
      } else if (text === '/help') {
        responseText = m.help;
        replyMarkup = getHelpKeyboard(lang);
      } else if (text === '/id') {
        responseText = m.chat_id(chatId);
        replyMarkup = {
          inline_keyboard: [
            [{ text: m.open_app_btn, web_app: { url: MINIAPP_URL } }],
            [{ text: m.continue_btn, url: 'https://lnkmx.my/auth' }],
            [{ text: '🌐 Language / Тіл', callback_data: 'change_lang' }],
          ]
        };
      } else if (text === '/wallet' || text === '/balance') {
        const profile = await getUserProfile(supabase, chatIdStr);

        if (!profile) {
          responseText = m.not_linked;
        } else {
          // Fetch wallet and pending GMV
          const { data: wallet } = await supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', profile.id)
            .maybeSingle();

          const { data: transactions } = await supabase
            .from('wallet_transactions')
            .select('gross_amount')
            .eq('user_id', profile.id)
            .eq('status', 'pending');
          
          const pendingGMV = (transactions || []).reduce((sum: number, t: any) => sum + (t.gross_amount || 0), 0);
          
          responseText = m.wallet_info(wallet?.balance || 0, pendingGMV);
          replyMarkup = {
            inline_keyboard: [
              [{ text: m.open_app_btn, web_app: { url: MINIAPP_URL } }],
              [{ text: lang === 'ru' ? '💳 Вывод средств' : lang === 'kk' ? '💳 Қаражатты шығару' : '💳 Withdraw', url: `${MINIAPP_URL}?startapp=wallet` }]
            ]
          };
        }
      } else if (text === '/zone' || text === '/deals' || text === '/tasks' || text === '/contacts') {
        // Zone commands — find user's zone through linked profile
        const profile = await getUserProfile(supabase, chatIdStr);

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
      } else if (text === '/bookings') {
        const profile = await getUserProfile(supabase, chatIdStr);

        if (!profile) {
          responseText = m.not_linked;
        } else {
          const activePageId = await getActivePageId(supabase, chatIdStr);
          let pageIds: string[] = [];

          if (activePageId) {
            pageIds = [activePageId];
          } else {
            const { data: pages } = await supabase.from('pages').select('id').eq('user_id', profile.id);
            pageIds = (pages || []).map((p: any) => p.id);
          }
          
          const { data: bookings } = await supabase
            .from('bookings')
            .select('*')
            .in('page_id', pageIds)
            .order('slot_date', { ascending: true })
            .gte('slot_date', new Date().toISOString().split('T')[0])
            .limit(5);

          if (!bookings || bookings.length === 0) {
            responseText = lang === 'ru' ? '📅 Активных бронирований нет' : lang === 'kk' ? '📅 Белсенді брондаулар жоқ' : '📅 No active bookings';
          } else {
            const bookingLines = bookings.map((b: any) => m.booking_item(b));
            responseText = `${m.bookings_list(bookings.length)}\n\n${bookingLines.join('\n\n')}`;
            replyMarkup = {
              inline_keyboard: [[{ text: m.open_app_btn, web_app: { url: `${MINIAPP_URL}?startapp=bookings` } }]]
            };
          }
        }
      } else if (text === '/pages') {
        const profile = await getUserProfile(supabase, chatIdStr);

        if (!profile) {
          responseText = m.not_linked;
        } else {
          const { data: pages } = await supabase
            .from('pages')
            .select('id, title')
            .eq('user_id', profile.id);

          if (!pages || pages.length === 0) {
            responseText = m.no_page;
          } else {
            responseText = m.pages_list;
            const buttons = pages.map((p: any) => ([{
              text: p.title || 'Untitled',
              callback_data: `set_active_page:${p.id}`
            }]));
            replyMarkup = { inline_keyboard: buttons };
          }
        }
      } else if (text === '/edit_bio' || text === '/edit_profile') {
        responseText = m.edit_bio_prompt;
        userActionStore[chatIdStr] = 'edit_bio';
      } else if (text === '/add_link') {
        responseText = m.add_link_prompt;
        userActionStore[chatIdStr] = 'add_link';
      } else if (userActionStore[chatIdStr] === 'edit_bio') {
        const profile = await getUserProfile(supabase, chatIdStr);
        
        if (profile) {
          await supabase.from('user_profiles').update({ bio: text }).eq('id', profile.id);
          responseText = m.bio_updated;
          userActionStore[chatIdStr] = null;
        }
      } else if (userActionStore[chatIdStr] === 'add_link') {
        const parts = text.split('|');
        if (parts.length >= 2) {
          const title = parts[0].trim();
          const url = parts[1].trim();
          const profile = await getUserProfile(supabase, chatIdStr);
          
          if (profile) {
            let pageId = await getActivePageId(supabase, chatIdStr);
            if (!pageId) {
              const { data: firstPage } = await supabase.from('pages').select('id').eq('user_id', profile.id).limit(1).maybeSingle();
              pageId = firstPage?.id;
            }

            if (pageId) {
              await supabase.from('page_blocks').insert({
                page_id: pageId,
                type: 'link',
                content: { title, url },
                order: 99
              });
              responseText = m.link_added;
              userActionStore[chatIdStr] = null;
            } else {
              responseText = m.no_page;
            }
          }
        } else {
          responseText = m.add_link_prompt;
        }
      } else if (text === '/leads' || text === '/crm') {
        const profile = await getUserProfile(supabase, chatIdStr);

        if (!profile) {
          responseText = m.not_linked;
        } else {
          const activePageId = await getActivePageId(supabase, chatIdStr);
          let query = supabase.from('leads').select('*', { count: 'exact' });
          
          if (activePageId) {
            query = query.eq('page_id', activePageId);
          } else {
            query = query.eq('user_id', profile.id);
          }

          const { data: leads, count } = await query
            .order('created_at', { ascending: false })
            .range(0, 4);

          if (!leads || leads.length === 0) {
            responseText = lang === 'ru' ? '📭 У вас пока нет лидов' : lang === 'kk' ? '📭 Сізде әлі лидтер жоқ' : '📭 No leads yet';
          } else {
            const leadLines = leads.map((l: any) => m.lead_item(l));
            responseText = `${m.leads_list(0, count || 0)}\n\n${leadLines.join('\n\n')}`;
            
            const buttons = [];
            if (count && count > 5) {
              buttons.push([{ text: '➡️', callback_data: 'leads_page:1' }]);
            }
            buttons.push([{ text: m.open_app_btn, web_app: { url: `${MINIAPP_URL}?startapp=crm` } }]);
            replyMarkup = { inline_keyboard: buttons };
          }
        }
      } else if (text === '/stats') {
        const profile = await getUserProfile(supabase, chatIdStr);

        if (!profile) {
          responseText = m.not_linked;
        } else {
          const activePageId = await getActivePageId(supabase, chatIdStr);
          let pageIds: string[] = [];
          if (activePageId) {
            pageIds = [activePageId];
          } else {
            const { data: pages } = await supabase.from('pages').select('id').eq('user_id', profile.id);
            pageIds = (pages || []).map((p: any) => p.id);
          }
          
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const [viewsRes, clicksRes, leadsRes] = await Promise.all([
            supabase.from('analytics').select('created_at').in('page_id', pageIds).eq('event_type', 'view').gte('created_at', weekAgo),
            supabase.from('analytics').select('created_at').in('page_id', pageIds).eq('event_type', 'click').gte('created_at', weekAgo),
            supabase.from('leads').select('created_at').in('page_id', pageIds).gte('created_at', weekAgo),
          ]);

          const views = viewsRes.data || [];
          const clicks = clicksRes.data || [];
          const leads = leadsRes.data || [];

          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const v24 = views.filter((v: any) => v.created_at >= dayAgo).length;
          const c24 = clicks.filter((c: any) => c.created_at >= dayAgo).length;
          const l24 = leads.filter((l: any) => l.created_at >= dayAgo).length;

          const createBar = (val: number, max: number) => {
            const length = max > 0 ? Math.round((val / max) * 10) : 0;
            return '🟩'.repeat(length) + '⬜'.repeat(10 - length);
          };

          const maxVal = Math.max(views.length, 1);
          const period = lang === 'ru' ? '7 дней' : lang === 'kk' ? '7 күн' : '7 days';
          
          responseText = m.stats_header(period);
          responseText += m.stats_row(lang === 'ru' ? '👁 Просмотры' : '👁 Views', views.length, createBar(views.length, maxVal));
          responseText += m.stats_row(lang === 'ru' ? '🖱 Клики' : '🖱 Clicks', clicks.length, createBar(clicks.length, maxVal));
          responseText += m.stats_row(lang === 'ru' ? '📩 Лиды' : '📩 Leads', leads.length, createBar(leads.length, maxVal));
          
          if (lang === 'ru') {
            responseText += `\n🆕 <b>За последние 24ч:</b>\n+${v24} просмотров, +${l24} лидов`;
          } else {
            responseText += `\n🆕 <b>In last 24h:</b>\n+${v24} views, +${l24} leads`;
          }

          replyMarkup = {
            inline_keyboard: [[{ text: m.open_app_btn, web_app: { url: `${MINIAPP_URL}?startapp=stats` } }]]
          };
        }
      } else if (text === '/toggle_publish') {
        const activePageId = await getActivePageId(supabase, chatIdStr);
        if (activePageId) {
          const { data: page } = await supabase.from('pages').select('status, title').eq('id', activePageId).single();
          responseText = m.toggle_publish_confirm(page?.status);
          replyMarkup = {
            inline_keyboard: [[{ text: '🔄 Toggle', callback_data: 'toggle_publish' }]]
          };
        } else {
          responseText = m.no_page;
        }
      } else if (text === '/links') {
        const activePageId = await getActivePageId(supabase, chatIdStr);
        if (activePageId) {
          const { data: blocks } = await supabase
            .from('page_blocks')
            .select('id, content')
            .eq('page_id', activePageId)
            .eq('type', 'link')
            .order('order', { ascending: true });

          if (blocks && blocks.length > 0) {
            responseText = m.links_list_header;
            const buttons = blocks.map((b: any) => ([
              { text: `${b.content?.title || 'Untitled'}`, url: b.content?.url || '#' },
              { text: '❌', callback_data: `delete_link:${b.id}` }
            ]));
            replyMarkup = { inline_keyboard: buttons };
          } else {
            responseText = lang === 'ru' ? '📭 У вас пока нет ссылок' : '📭 No links yet';
          }
        } else {
          responseText = m.no_page;
        }
      } else if (text === '/settings') {
        responseText = m.settings_menu;
        replyMarkup = {
          inline_keyboard: [
            [{ text: '🌐 Change Language / Тіл', callback_data: 'change_lang' }],
            [{ text: '🔔 Notifications: ON', callback_data: 'notif_toggle' }]
          ]
        };
      } else if (text === '/admin_broadcast_crm') {
        const profile = await getUserProfile(supabase, chatIdStr);
        if (profile?.role === 'admin') {
          // This will be handled by a separate function, but here we can at least confirm
          responseText = "⚠️ Running broadcast via separate function is recommended. Use 'supabase functions invoke broadcast-update'";
        } else {
          responseText = m.admin_only;
        }
      } else {
        // Any other message - just show the ID
        responseText = m.chat_id(chatId);
        replyMarkup = getHelpKeyboard(lang);
      }

      // Send response
      await sendMessage(chatId, responseText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup || undefined,
      });

      // Message sent via gateway
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
