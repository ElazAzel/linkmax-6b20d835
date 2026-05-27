export type AlternativeSlug =
  | 'linktree'
  | 'taplink'
  | 'bitrix24'
  | 'calendly'
  | 'honeybook'
  | 'tilda'
  | 'notion-sites'
  | 'carrd'
  | 'beacons'
  | 'koji'
  | 'wix';

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
  /** Quick comparison rows for the side-by-side table. */
  compareRows?: Array<{ label: string; them: string; us: string }>;
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
    slug: 'tilda',
    competitor: 'Tilda',
    category: 'Site builder',
    summary:
      'Мощный визуальный конструктор сайтов, но без встроенного CRM, мессенджер-инбокса и локальной приёмки оплат.',
    bestFor: 'Веб-студии и маркетологи, которые делают сайты под клиента.',
    migrationCta: 'Собрать сайт + CRM + оплаты без 5 разных подписок',
    migrationPoints: [
      'Перенести 1–5 страниц как «Сайт» с навигацией и общим футером — без верстальщика.',
      'Заменить связку Tilda + amoCRM + Robokassa + Telegram-бот одним кабинетом.',
      'Подключить Kaspi/СБП оплату прямо в блок услуги — без отдельной кассы.',
    ],
    lnkmxAdvantages: [
      'Сайт + CRM + booking + оплаты + Telegram-инбокс — 1 подписка вместо 5.',
      'AI собирает черновик многостраничника за 2 минуты.',
      'Цена в 5–10× ниже стека Tilda Business + amoCRM + CDN.',
    ],
    route: '/alternatives/tilda',
    compareRows: [
      { label: 'Старт', them: 'от 750 ₽/мес', us: '0 ₽ навсегда' },
      { label: 'CRM встроена', them: 'нет', us: 'да' },
      { label: 'Telegram-инбокс заявок', them: 'через Zapier', us: 'нативно' },
      { label: 'Kaspi / СБП оплаты', them: 'нет', us: 'нативно' },
      { label: 'AI-сборка страницы', them: 'нет', us: '2 минуты' },
      { label: 'Время до первой заявки', them: '1–3 дня', us: '15 минут' },
    ],
  },
  {
    slug: 'bitrix24',
    competitor: 'Bitrix24',
    category: 'Enterprise CRM',
    summary:
      'Глубокая enterprise CRM с высокой когнитивной нагрузкой для соло-операторов и мини-команд. 90% функций не нужны сервисному бизнесу.',
    bestFor: 'Компании 20+ человек с выделенной ops-командой и сложными процессами.',
    migrationCta: 'Упростить стек: антисложный CRM для соло и микро-команд',
    migrationPoints: [
      'Сфокусироваться на 80/20: pipeline, tasks, reminders, мессенджеры.',
      'Снизить время онбординга с недель до 15 минут без внедренца.',
      'Перенести фронт (bio/лендинг) и бэк-офис в единое мобильное приложение.',
    ],
    lnkmxAdvantages: [
      'Анти-сложный UX, разработанный для соло и микро-команд (1–10 человек).',
      'Лиды из WhatsApp/Telegram приходят в инбокс мгновенно, без коннекторов.',
      'Платите 0 ₽/мес на старте — Bitrix24 берёт от 1990 ₽/мес за CRM.',
    ],
    route: '/alternatives/bitrix24',
    compareRows: [
      { label: 'Время онбординга', them: 'недели', us: '15 минут' },
      { label: 'Сайт-визитка из коробки', them: 'нет', us: 'да' },
      { label: 'Мобильный UX', them: 'тяжёлый', us: 'mobile-first' },
      { label: 'Цена для соло', them: 'от 1990 ₽/мес', us: '0 ₽ навсегда' },
      { label: 'Кол-во экранов до 1-й заявки', them: '15+', us: '3' },
    ],
  },
  {
    slug: 'notion-sites',
    competitor: 'Notion Sites',
    category: 'Doc → Site',
    summary:
      'Удобно собрать «лендинг из доки», но без форм, оплат, CRM и мобильной оптимизации витрины услуг.',
    bestFor: 'Лёгкие info-страницы, документация, статичные wiki.',
    migrationCta: 'Превратить страницу в воронку продаж за 10 минут',
    migrationPoints: [
      'Перенести контент из Notion в блоки LinkMAX — заголовки, списки, картинки.',
      'Добавить блоки «Услуга», «Форма брони», «Оплата Kaspi/СБП» — то, чего нет в Notion.',
      'Подключить аналитику конверсий и Telegram-уведомления о заявках.',
    ],
    lnkmxAdvantages: [
      'Реальный продающий лендинг, а не «опубликованная док-страница».',
      'Лид-формы и оплаты — встроены, без третьих сервисов.',
      'SSR + AEO/JSON-LD: индексация в Google и видимость в ChatGPT/Perplexity.',
    ],
    route: '/alternatives/notion-sites',
    compareRows: [
      { label: 'Лид-формы', them: 'нет', us: 'да' },
      { label: 'Приём оплат', them: 'нет', us: 'Kaspi / СБП / Robokassa' },
      { label: 'Мобильная вёрстка для продаж', them: 'базовая', us: 'оптимизирована' },
      { label: 'Конверсия в заявку', them: '~1%', us: '5–8%' },
    ],
  },
  {
    slug: 'carrd',
    competitor: 'Carrd',
    category: 'One-page builder',
    summary:
      'Лёгкий редактор одностраничников по $19/год. Идеален для статичных bio, но не растёт вместе с бизнесом.',
    bestFor: 'Хобби-проекты, простые персональные страницы.',
    migrationCta: 'Собрать растущий мини-сайт с CRM, а не статичный one-pager',
    migrationPoints: [
      'Перенести одностраничник как стартовый шаблон.',
      'Расширить до многостраничника (about/услуги/контакты) без переписывания.',
      'Получить лидов в Telegram и базу клиентов с первого дня.',
    ],
    lnkmxAdvantages: [
      'Многостраничник, а не «один экран на всю жизнь».',
      'Встроенная CRM и инбокс — без перехода на новый стек, когда вырастете.',
      'Локальные оплаты для KZ/RU/UZ и мобильный кабинет.',
    ],
    route: '/alternatives/carrd',
    compareRows: [
      { label: 'Многостраничник', them: 'нет', us: 'да' },
      { label: 'CRM встроена', them: 'нет', us: 'да' },
      { label: 'Оплаты в KZ/RU', them: 'нет', us: 'нативно' },
      { label: 'Цена', them: '$19/год', us: '0 ₽ старт' },
    ],
  },
  {
    slug: 'beacons',
    competitor: 'Beacons',
    category: 'Creator link-in-bio',
    summary:
      'Сильный creator-tool для англоязычного рынка, но без локальных оплат, RU/KK UI и сервисных кейсов (бронь, мастера).',
    bestFor: 'Англоязычные авторы с монетизацией через Stripe/Patreon.',
    migrationCta: 'Перейти на CIS-friendly bio с оплатами и CRM',
    migrationPoints: [
      'Перенести медиа-блоки и links за 5 минут через AI-импорт.',
      'Подключить Kaspi / СБП / Robokassa вместо Stripe (нет в KZ/RU).',
      'Заменить отдельный email-сервис на встроенные Telegram-уведомления.',
    ],
    lnkmxAdvantages: [
      'Полный RU/KK/UZ интерфейс и кейсы под сервисный бизнес.',
      'Локальные оплаты без VPN и зарубежных карт.',
      'Бронирование, документы, инвойсы — творцу-продавцу с реальной услугой.',
    ],
    route: '/alternatives/beacons',
    compareRows: [
      { label: 'Локальные оплаты CIS', them: 'нет', us: 'да' },
      { label: 'RU/KK UI', them: 'нет', us: 'полный' },
      { label: 'Бронь услуг', them: 'базово', us: 'нативно' },
      { label: 'Цена', them: '$10–25/мес', us: '0 ₽ старт' },
    ],
  },
  {
    slug: 'koji',
    competitor: 'Koji',
    category: 'Creator link-in-bio',
    summary:
      'Интересный creator-конструктор с мини-приложениями, но закрылся для большинства активных сценариев и не имеет локальной монетизации.',
    bestFor: 'Креативные эксперименты — мало подходит для системного бизнеса.',
    migrationCta: 'Перейти с Koji на стабильный bio + CRM',
    migrationPoints: [
      'Восстановить структуру bio-страницы за 10 минут.',
      'Перенести продаваемые услуги в блоки с реальной оплатой.',
      'Получить стабильную платформу с активной поддержкой и обновлениями.',
    ],
    lnkmxAdvantages: [
      'Активно развивается: обновления каждую неделю.',
      'Локальные оплаты, CRM, инбокс — для зарабатывающего бизнеса, а не «эксперимента».',
      'RU/KK/UZ поддержка в Telegram.',
    ],
    route: '/alternatives/koji',
    compareRows: [
      { label: 'Стабильность платформы', them: 'низкая', us: 'высокая' },
      { label: 'Локальные оплаты', them: 'нет', us: 'да' },
      { label: 'CRM', them: 'нет', us: 'встроена' },
    ],
  },
  {
    slug: 'wix',
    competitor: 'Wix',
    category: 'Site builder',
    summary:
      'Большой WYSIWYG-конструктор сайтов, но избыточен для сервисного бизнеса: дорого, медленно, без CRM-инбокса в одном окне.',
    bestFor: 'Корпоративные сайты на 10+ страниц с дизайнером.',
    migrationCta: 'Собрать мини-сайт + CRM за 15 минут вместо 5 дней в Wix',
    migrationPoints: [
      'Заменить тяжёлый WYSIWYG на AI-сборку: 2 минуты против 5 дней.',
      'Получить встроенную CRM и инбокс заявок без сторонних плагинов.',
      'Сократить ежемесячные расходы в 5× за счёт встроенных оплат и CRM.',
    ],
    lnkmxAdvantages: [
      'Mobile-first: 80% посетителей с телефона видят оптимизированную версию.',
      'Лиды и сделки в одном кабинете — без перехода в Wix Ascend.',
      'Быстрый старт без обучения — никакого drag-and-drop хаоса.',
    ],
    route: '/alternatives/wix',
    compareRows: [
      { label: 'Время до запуска', them: '3–5 дней', us: '15 минут' },
      { label: 'CRM встроена', them: 'отдельно (Ascend)', us: 'да' },
      { label: 'Цена для соло', them: '$17+ /мес', us: '0 ₽ старт' },
      { label: 'Мобильная скорость', them: 'средняя', us: 'высокая' },
    ],
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
