/**
 * LinkMAX integrations catalog.
 * Inspired by public-apis: a curated, machine-readable registry that powers
 * both the /integrations page and the public API catalog for AI agents.
 */

export type IntegrationCategory =
  | 'messengers'
  | 'payments'
  | 'media'
  | 'analytics'
  | 'automation'
  | 'agents'
  | 'data';

export type IntegrationStatus = 'live' | 'beta' | 'planned';

export interface Integration {
  slug: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  /** Requires the user to configure an account/key on their side */
  requiresSetup: boolean;
  description: { ru: string; en: string };
  docsUrl?: string;
}

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, { ru: string; en: string }> = {
  messengers: { ru: 'Мессенджеры', en: 'Messengers' },
  payments: { ru: 'Платежи', en: 'Payments' },
  media: { ru: 'Медиа и контент', en: 'Media & content' },
  analytics: { ru: 'Аналитика', en: 'Analytics' },
  automation: { ru: 'Автоматизация', en: 'Automation' },
  agents: { ru: 'AI-агенты', en: 'AI agents' },
  data: { ru: 'Данные', en: 'Data' },
};

export const INTEGRATIONS: Integration[] = [
  {
    slug: 'telegram',
    name: 'Telegram',
    category: 'messengers',
    status: 'live',
    requiresSetup: true,
    description: {
      ru: 'Мгновенные уведомления о лидах, заявках и оплатах в личный чат или чат команды.',
      en: 'Instant lead, booking and payment notifications in a personal or team chat.',
    },
  },
  {
    slug: 'whatsapp',
    name: 'WhatsApp',
    category: 'messengers',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Кнопки и CTA-блоки с прямым переходом в WhatsApp с предзаполненным сообщением.',
      en: 'Buttons and CTA blocks that open WhatsApp with a pre-filled message.',
    },
  },
  {
    slug: 'robokassa',
    name: 'Robokassa',
    category: 'payments',
    status: 'live',
    requiresSetup: true,
    description: {
      ru: 'Приём оплат за услуги, события, офферы и подписки с автоматическим вебхуком.',
      en: 'Accept payments for services, events, offers and subscriptions with webhooks.',
    },
  },
  {
    slug: 'paddle',
    name: 'Paddle',
    category: 'payments',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Merchant of Record для международных подписок LinkMAX.',
      en: 'Merchant of Record for international LinkMAX subscriptions.',
    },
  },
  {
    slug: 'unsplash',
    name: 'Unsplash',
    category: 'media',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Поиск бесплатных фото прямо в редакторе блоков — без загрузки файлов.',
      en: 'Search free stock photos right inside the block editor.',
    },
  },
  {
    slug: 'pexels',
    name: 'Pexels',
    category: 'media',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Второй источник бесплатных фото для обложек, кнопок и каталогов.',
      en: 'Second free photo source for covers, buttons and catalogs.',
    },
  },
  {
    slug: 'microlink',
    name: 'Microlink',
    category: 'media',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Автозаполнение заголовка, описания и превью по ссылке в блоке-ссылке.',
      en: 'Autofills title, description and thumbnail from any link.',
    },
  },
  {
    slug: 'nager-holidays',
    name: 'Nager.Date',
    category: 'data',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Публичные праздники по странам — для расписания и слотов бронирования.',
      en: 'Public holidays per country for schedules and booking slots.',
    },
  },
  {
    slug: 'restcountries',
    name: 'REST Countries',
    category: 'data',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Флаги, телефонные коды и локализованные названия стран для форм.',
      en: 'Flags, dial codes and localized country names for forms.',
    },
  },
  {
    slug: 'nbk-rates',
    name: 'National Bank of Kazakhstan',
    category: 'data',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Актуальные курсы валют для мультивалютных цен и выплат.',
      en: 'Live FX rates for multi-currency pricing and payouts.',
    },
  },
  {
    slug: 'mcp',
    name: 'Model Context Protocol',
    category: 'agents',
    status: 'live',
    requiresSetup: true,
    description: {
      ru: 'AI-агенты (Claude, ChatGPT) читают страницы, лиды и аналитику по OAuth 2.1.',
      en: 'AI agents (Claude, ChatGPT) read pages, leads and analytics over OAuth 2.1.',
    },
    docsUrl: '/docs/api',
  },
  {
    slug: 'docuseal',
    name: 'DocuSeal',
    category: 'automation',
    status: 'live',
    requiresSetup: true,
    description: {
      ru: 'Электронная подпись договоров и актов прямо из карточки сделки.',
      en: 'E-signature for contracts and acts straight from a deal card.',
    },
  },
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    category: 'automation',
    status: 'live',
    requiresSetup: true,
    description: {
      ru: 'Двусторонняя синхронизация записей и слотов с календарём.',
      en: 'Two-way sync of bookings and slots with your calendar.',
    },
  },
  {
    slug: 'google-search-console',
    name: 'Google Search Console',
    category: 'analytics',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Автоматическая отправка страниц на индексацию после публикации.',
      en: 'Automatic indexing submission after each publish.',
    },
  },
  {
    slug: 'indexnow',
    name: 'IndexNow / Yandex',
    category: 'analytics',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Мгновенный пинг поисковиков при изменении страницы.',
      en: 'Instant search engine ping when a page changes.',
    },
  },
  {
    slug: 'google-forms-import',
    name: 'Google Forms',
    category: 'automation',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Импорт существующей формы в блок-форму LinkMAX одним URL.',
      en: 'Import an existing form into a LinkMAX form block by URL.',
    },
  },
  {
    slug: 'resend',
    name: 'Resend',
    category: 'automation',
    status: 'live',
    requiresSetup: false,
    description: {
      ru: 'Транзакционные письма: билеты, подтверждения, напоминания.',
      en: 'Transactional email: tickets, confirmations, reminders.',
    },
  },
  {
    slug: 'webhooks',
    name: 'Outgoing webhooks',
    category: 'automation',
    status: 'live',
    requiresSetup: true,
    description: {
      ru: 'Любое событие страницы можно отправить в n8n, Make или свой сервер.',
      en: 'Send any page event to n8n, Make or your own server.',
    },
  },
];

export const LIVE_INTEGRATIONS = INTEGRATIONS.filter((i) => i.status === 'live');

export function groupIntegrations(list: Integration[] = INTEGRATIONS) {
  const groups = new Map<IntegrationCategory, Integration[]>();
  for (const item of list) {
    const arr = groups.get(item.category) ?? [];
    arr.push(item);
    groups.set(item.category, arr);
  }
  return Array.from(groups.entries());
}
