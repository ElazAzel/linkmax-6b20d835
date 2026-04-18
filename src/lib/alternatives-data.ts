export type AlternativeSlug = 'linktree' | 'taplink' | 'bitrix24' | 'calendly' | 'honeybook';

export interface AlternativeProfile {
  slug: AlternativeSlug;
  competitor: string;
  category: string;
  summary: string;
  bestFor: string;
  migrationCta: string;
  migrationPoints: string[];
  lnkmxAdvantages: string[];
  route: string;
}

export const ALTERNATIVE_PROFILES: AlternativeProfile[] = [
  {
    slug: 'linktree',
    competitor: 'Linktree',
    category: 'Link-in-bio',
    summary:
      'Подходит для простых bio-страниц, но обычно требует внешний стек для лидов, CRM и операционки.',
    bestFor: 'Creator-профили с акцентом на ссылки и базовую аналитику.',
    migrationCta: 'Перенести bio-страницу и добавить CRM в один клик',
    migrationPoints: [
      'Импортировать структуру страниц и блоки офферов без ручной пересборки.',
      'Подключить лид-формы и Telegram-уведомления без сторонних zaps.',
      'Добавить мини-CRM и задачи для обработки заявок внутри LinkMAX.',
    ],
    lnkmxAdvantages: [
      'Страница + лиды + задачи + сделки в одном продукте.',
      'Локализация RU/KK/EN и сценарии для региональных продаж.',
      'Быстрый запуск без отдельной CRM-интеграции.',
    ],
    route: '/alternatives/linktree',
  },
  {
    slug: 'taplink',
    competitor: 'Taplink',
    category: 'Мини-лендинг в соцсетях',
    summary:
      'Сильный выбор для Instagram-сценариев в CIS, но с ограниченной глубиной операционных процессов.',
    bestFor: 'Микробизнес, которому важен быстрый запуск под соцсети.',
    migrationCta: 'Перейти с Taplink на LinkMAX с сохранением конверсии',
    migrationPoints: [
      'Собрать вертикальные шаблоны (beauty/coach/expert/realtor) за 10–15 минут.',
      'Включить pipeline и задачи для обработки заявок после клика в bio.',
      'Подключить локальные оплаты и прозрачную fee-логику на тарифе.',
    ],
    lnkmxAdvantages: [
      'Мини-лендинг + booking + CRM и документы в одном окне.',
      'Мобильный дашборд для соло и микро-команд.',
      'Усиленные сценарии локальных оплат и региональные кейсы.',
    ],
    route: '/alternatives/taplink',
  },
  {
    slug: 'bitrix24',
    competitor: 'Bitrix24',
    category: 'CRM / Business OS',
    summary:
      'Глубокая enterprise CRM с высокой когнитивной нагрузкой для соло-операторов и мини-команд.',
    bestFor: 'Компании с выделенной ops-командой и сложными процессами.',
    migrationCta: 'Упростить стек: перейти на anti-complex CRM для соло',
    migrationPoints: [
      'Сфокусироваться на 80/20-процессах: pipeline, tasks, reminders, documents.',
      'Снизить время онбординга до первой заявки/брони без долгого внедрения.',
      'Перенести клиентский фронт (bio/лендинг) и бэк-офис в единый интерфейс.',
    ],
    lnkmxAdvantages: [
      'Анти-сложный UX для сервисного бизнеса.',
      'Быстрый путь до первой ценности (TTFV) для соло-формата.',
      'Минимум внедрения и настройки.',
    ],
    route: '/alternatives/bitrix24',
  },
  {
    slug: 'calendly',
    competitor: 'Calendly',
    category: 'Scheduling',
    summary:
      'Best-in-class по записи, но закрывает только один job-to-be-done без CRM и витрины продаж.',
    bestFor: 'Команды, которым нужен только scheduling-воркфлоу.',
    migrationCta: 'Добавить к booking полноценную воронку продаж и follow-up',
    migrationPoints: [
      'Сохранить запись на услуги и дополнить её лид-этапами в pipeline.',
      'Включить напоминания и follow-up после брони без внешней автоматизации.',
      'Использовать лендинг-блоки оффера и оплаты в одной системе.',
    ],
    lnkmxAdvantages: [
      'Booking связан с CRM и сделками, а не живет отдельно.',
      'Единая аналитика по источнику лида и конверсии в бронь.',
      'Готовые страницы под запись и продажу услуг.',
    ],
    route: '/alternatives/calendly',
  },
  {
    slug: 'honeybook',
    competitor: 'HoneyBook',
    category: 'Service business suite',
    summary:
      'Сильный back-office для сервисного бизнеса, но с более сложной упаковкой для региональных рынков.',
    bestFor: 'Сервисные команды с mature-процессами и англоязычным стеком.',
    migrationCta: 'Запустить local-first business OS без тяжёлого внедрения',
    migrationPoints: [
      'Собрать витрину, лид-форму, booking и документы в одном продукте.',
      'Включить локализацию и региональные сценарии коммуникаций.',
      'Упростить операционку для соло/микро-команды без потери контроля.',
    ],
    lnkmxAdvantages: [
      'Local-first подход для Central Asia и emerging markets.',
      'Фокус на быстром запуске и прозрачной монетизации.',
      'Встроенные инструменты продаж без перегруза enterprise-функциями.',
    ],
    route: '/alternatives/honeybook',
  },
];

export const getAlternativeProfile = (slug?: string) =>
  ALTERNATIVE_PROFILES.find((profile) => profile.slug === slug);
