import type { Niche } from '@/lib/niches';

export interface NicheLandingFaq {
  question: string;
  answer: string;
}

export interface NicheLandingData {
  key: string;
  niche: Niche;
  galleryNiche: Niche;
  canonicalPath: string;
  authFrom: string;
  badge: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  primaryCta: string;
  secondaryCta: string;
  previewTitle: string;
  previewSubtitle: string;
  visualAlt: string;
  stats: Array<{ value: string; label: string }>;
  outcomes: Array<{ title: string; description: string }>;
  workflow: Array<{ title: string; description: string }>;
  faq: NicheLandingFaq[];
  schemaServiceName: string;
  audience: string;
}

export const NICHE_LANDINGS: NicheLandingData[] = [
  {
    key: 'beauty-masters',
    niche: 'beauty',
    galleryNiche: 'beauty',
    canonicalPath: '/для-бьюти-мастеров',
    authFrom: 'beauty-masters-seo',
    badge: 'Для бьюти-мастеров',
    title: 'Онлайн-запись, мини-сайт и база клиентов для бьюти-мастера',
    description:
      'LinkMAX собирает страницу услуг, запись, заявки и Telegram-уведомления в одном мобильном кабинете. Без связки из Taplink, таблиц и ручной переписки.',
    seoTitle: 'Онлайн-запись для бьюти-мастеров — мини-сайт и CRM | LinkMAX',
    seoDescription:
      'Создайте страницу бьюти-мастера с услугами, записью, заявками и Telegram-уведомлениями. AI соберет мини-сайт за 2 минуты.',
    primaryCta: 'Создать страницу мастера',
    secondaryCta: 'Посмотреть примеры',
    previewTitle: 'Nail Studio Aida',
    previewSubtitle: 'Маникюр, педикюр, запись на неделю',
    visualAlt: 'Пример мобильной страницы бьюти-мастера в LinkMAX',
    stats: [
      { value: '2 мин', label: 'до первой страницы' },
      { value: '1 ссылка', label: 'для Instagram bio' },
      { value: '0 ₸', label: 'старт без карты' },
    ],
    outcomes: [
      {
        title: 'Клиент видит услуги и цены',
        description: 'Страница отвечает на вопросы до переписки: услуги, стоимость, свободные слоты и контакты.',
      },
      {
        title: 'Заявки не теряются',
        description: 'Новые записи и формы попадают в кабинет, а уведомления можно включить в Telegram.',
      },
      {
        title: 'Профиль выглядит дороже',
        description: 'Liquid Glass-страница работает как аккуратный мобильный сайт, а не набор случайных ссылок.',
      },
    ],
    workflow: [
      {
        title: 'Выберите цель и сферу',
        description: 'После регистрации LinkMAX уже подставит beauty-шаблон и сократит первый запуск.',
      },
      {
        title: 'AI соберет блоки',
        description: 'Профиль, услуги, мессенджеры, форма и запись появляются сразу в редакторе.',
      },
      {
        title: 'Опубликуйте и подключите Telegram',
        description: 'Получите ссылку lnkmx.my и включите мгновенные уведомления о новых клиентах.',
      },
    ],
    faq: [
      {
        question: 'Можно ли сделать страницу для записи без сайта?',
        answer:
          'Да. LinkMAX создает мобильную страницу с услугами, ценами, формой заявки и ссылками на мессенджеры. Эту ссылку можно поставить в Instagram, TikTok или Telegram.',
      },
      {
        question: 'Подойдет ли LinkMAX мастеру, который работает один?',
        answer:
          'Да. Платформа рассчитана на соло-специалистов: все ключевые действия доступны с телефона и не требуют сложной CRM-настройки.',
      },
      {
        question: 'Нужно ли платить сразу?',
        answer:
          'Нет. Начать можно бесплатно: создать страницу, опубликовать ссылку и проверить поток заявок без банковской карты.',
      },
    ],
    schemaServiceName: 'LinkMAX for beauty masters',
    audience: 'Beauty professionals, nail artists, lash makers, brow artists, hair stylists',
  },
  {
    key: 'tutors',
    niche: 'education',
    galleryNiche: 'education',
    canonicalPath: '/для-репетиторов',
    authFrom: 'tutors-seo',
    badge: 'Для репетиторов и наставников',
    title: 'Страница репетитора, заявки на занятия и расписание в одном месте',
    description:
      'LinkMAX помогает репетитору быстро собрать понятную страницу: предметы, форматы занятий, стоимость, отзывы, заявка и контакт без длинной переписки.',
    seoTitle: 'Сайт для репетитора — заявки, расписание и мини-CRM | LinkMAX',
    seoDescription:
      'Создайте страницу репетитора с предметами, ценами, заявкой на занятие и Telegram-уведомлениями. AI подготовит структуру за 2 минуты.',
    primaryCta: 'Создать страницу репетитора',
    secondaryCta: 'Открыть примеры',
    previewTitle: 'Math Tutor Dana',
    previewSubtitle: 'ЕНТ, IELTS Math, индивидуальные занятия',
    visualAlt: 'Пример мобильной страницы репетитора в LinkMAX',
    stats: [
      { value: '2 мин', label: 'до черновика' },
      { value: '24/7', label: 'прием заявок' },
      { value: '1 кабинет', label: 'страница + лиды' },
    ],
    outcomes: [
      {
        title: 'Родители быстро понимают оффер',
        description: 'Предметы, форматы, стоимость и результат занятий собраны на одной ясной странице.',
      },
      {
        title: 'Заявки приходят структурно',
        description: 'Форма собирает имя, контакт, класс, цель и удобное время без хаоса в личных сообщениях.',
      },
      {
        title: 'Легче масштабировать занятия',
        description: 'Можно вести индивидуальные заявки, мини-группы, консультации и материалы из одного профиля.',
      },
    ],
    workflow: [
      {
        title: 'Опишите предмет и формат',
        description: 'Укажите классы, экзамены, онлайн/офлайн, цену и свободные окна.',
      },
      {
        title: 'AI соберет страницу',
        description: 'LinkMAX добавит профиль, услуги, заявку, FAQ, отзывы и быстрые контакты.',
      },
      {
        title: 'Получайте заявки в Telegram',
        description: 'После публикации подключите уведомления и отвечайте новым ученикам быстрее.',
      },
    ],
    faq: [
      {
        question: 'Можно ли сделать сайт репетитора без дизайнера?',
        answer:
          'Да. В LinkMAX достаточно выбрать сферу, описать предметы и формат занятий. AI создаст структуру страницы, которую можно сразу отредактировать и опубликовать.',
      },
      {
        question: 'Подойдет ли страница для рекламы и Instagram?',
        answer:
          'Да. Ссылку lnkmx.my можно использовать в bio, сторис, рекламных объявлениях и сообщениях. Клиент попадает сразу на понятное предложение и форму заявки.',
      },
      {
        question: 'Можно ли принимать заявки на пробное занятие?',
        answer:
          'Да. На страницу можно добавить форму или блок записи, чтобы ученик оставлял контакт, цель обучения и удобное время.',
      },
    ],
    schemaServiceName: 'LinkMAX for tutors',
    audience: 'Tutors, teachers, mentors, online educators, course creators',
  },
  // ===== KEYWORD-FIRST LANDINGS (SEO Sprint 2026-05) =====
  {
    key: 'taplink-alternative',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/taplink-alternative',
    authFrom: 'taplink-alt-seo',
    badge: 'Альтернатива Taplink',
    title: 'LinkMAX — современная альтернатива Taplink для специалистов',
    description:
      'Мультиссылка с CRM, формой заявок, мессенджерами, аналитикой и оплатами. Перенос профиля за 5 минут, без потери ссылок и подписчиков.',
    seoTitle: 'Альтернатива Taplink — LinkMAX мультиссылка с CRM и формой заявок',
    seoDescription:
      'Сравните LinkMAX и Taplink: бесплатный старт, AI-сборка за 2 минуты, лиды в Telegram, оплаты Robokassa. Альтернатива Taplink без подписки за рубежом.',
    primaryCta: 'Перенести с Taplink бесплатно',
    secondaryCta: 'Сравнить функции',
    previewTitle: 'Switching from Taplink',
    previewSubtitle: 'Мультиссылка + лиды + оплаты в одном кабинете',
    visualAlt: 'Сравнение LinkMAX и Taplink — мультиссылка для специалиста',
    stats: [
      { value: '5 мин', label: 'на перенос профиля' },
      { value: '0 ₸', label: 'старт без карты' },
      { value: '4 валюты', label: 'RUB / KZT / UZS / USD' },
    ],
    outcomes: [
      { title: 'Заявки попадают в один кабинет', description: 'Формы, мессенджеры и оплаты — в одном дашборде, а не в разрозненных вкладках.' },
      { title: 'Реальная CRM в комплекте', description: 'Лиды, статусы, заметки, напоминания и Telegram-уведомления входят в бесплатный план.' },
      { title: 'Локальные оплаты', description: 'Robokassa и переводы по СБП работают в РФ, KZ и UZ без VPN и сложных интеграций.' },
    ],
    workflow: [
      { title: 'Импортируйте профиль', description: 'Соберите страницу за 2 минуты с помощью AI — описание, услуги, ссылки и контакты.' },
      { title: 'Подключите оплаты', description: 'Robokassa или ручные счета — выбирайте, как принимать платежи в вашей стране.' },
      { title: 'Замените ссылку в bio', description: 'Поставьте lnkmx.my/ваш-ник в Instagram, TikTok, Telegram — старые ссылки перенесите за минуту.' },
    ],
    faq: [
      { question: 'Чем LinkMAX лучше Taplink?', answer: 'Бесплатный старт без ограничения по блокам, встроенная CRM с лидами и Telegram-уведомлениями, локальные оплаты Robokassa, AI-сборка страницы и работа в Казахстане, Узбекистане и СНГ без VPN.' },
      { question: 'Можно ли перенести профиль из Taplink?', answer: 'Да. AI-генератор соберёт аналогичную структуру за 2 минуты — нужно скопировать описание и список услуг. Дизайн адаптируется автоматически.' },
      { question: 'Сколько стоит?', answer: 'Старт бесплатный. Pro дешевле подписки Taplink Pro и снижает комиссию с оплат с 7% до 1%.' },
      { question: 'Работает ли в Instagram bio?', answer: 'Да. Короткая ссылка lnkmx.my/имя ставится в био, открывается мгновенно и не блокируется в РФ/KZ/UZ.' },
      { question: 'Есть ли встроенная аналитика?', answer: 'Да. Просмотры, клики по кнопкам, источники трафика, гео и устройства — без подключения внешних сервисов.' },
    ],
    schemaServiceName: 'LinkMAX — Taplink alternative',
    audience: 'Service professionals, coaches, freelancers, beauty masters switching from Taplink',
  },
  {
    key: 'sayt-vizitka',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/sayt-vizitka-dlya-uslug',
    authFrom: 'sayt-vizitka-seo',
    badge: 'Сайт-визитка для услуг',
    title: 'Сайт-визитка для услуг — мини-сайт с заявками за 5 минут',
    description:
      'Создайте сайт-визитку для услуг без программиста: блоки услуг, цены, форма заявки, мессенджеры, отзывы и оплаты. Бесплатно, без хостинга, мобильная адаптация автоматически.',
    seoTitle: 'Сайт-визитка для услуг — конструктор LinkMAX, бесплатно',
    seoDescription:
      'Сайт-визитка для услуг с формой заявки, мессенджерами и онлайн-оплатой. AI соберёт страницу за 2 минуты, без хостинга и кода. Старт бесплатно.',
    primaryCta: 'Создать сайт-визитку',
    secondaryCta: 'Посмотреть примеры',
    previewTitle: 'Сайт-визитка специалиста',
    previewSubtitle: 'Услуги · Цены · Заявка · Контакты',
    visualAlt: 'Пример мобильной сайт-визитки для услуг в LinkMAX',
    stats: [
      { value: '5 мин', label: 'до публикации' },
      { value: '0 ₸', label: 'без хостинга и кода' },
      { value: '100%', label: 'мобильная адаптация' },
    ],
    outcomes: [
      { title: 'Клиент видит услуги и цены сразу', description: 'Структурированные блоки заменяют переписку «уточните цены».' },
      { title: 'Заявки приходят в Telegram', description: 'Форма собирает имя, телефон, услугу и сразу пушит уведомление в бот.' },
      { title: 'Выглядит как настоящий сайт', description: 'Liquid Glass-дизайн, OG-превью, SSL, домен lnkmx.my или свой.' },
    ],
    workflow: [
      { title: 'Опишите услугу', description: 'Укажите сферу, цели, перечень услуг и цены — AI соберёт первый черновик.' },
      { title: 'Отредактируйте блоки', description: 'Перетаскивайте блоки услуг, отзывов, FAQ, добавляйте формы и оплаты.' },
      { title: 'Опубликуйте и поделитесь', description: 'Получите короткую ссылку и QR-код для визиток, рекламы и Instagram bio.' },
    ],
    faq: [
      { question: 'Чем сайт-визитка отличается от мультиссылки?', answer: 'Сайт-визитка содержит структуру: о себе, услуги, цены, отзывы, форму заявки. Мультиссылка — только набор кнопок. В LinkMAX можно собрать оба варианта.' },
      { question: 'Нужен ли хостинг или домен?', answer: 'Нет. Страница хостится на lnkmx.my бесплатно. Свой домен можно подключить на тарифе Pro.' },
      { question: 'Можно ли принимать оплаты прямо со страницы?', answer: 'Да. Подключите Robokassa (Россия) или Kaspi (Казахстан) — клиент платит сразу со страницы.' },
      { question: 'Можно ли сделать сайт-визитку для мастера маникюра, репетитора, коуча?', answer: 'Да. AI определит сферу и подставит релевантные блоки. Шаблоны есть для бьюти, образования, фитнеса, психологии, фотографии и других услуг.' },
      { question: 'Сколько стоит сайт-визитка?', answer: 'Бесплатно. Pro нужен только если хотите свой домен, расширенную CRM и комиссию 1% вместо 7%.' },
    ],
    schemaServiceName: 'LinkMAX — site card builder for services',
    audience: 'Service professionals, small business owners, freelancers needing a one-page site',
  },
  {
    key: 'multilink',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/multilink',
    authFrom: 'multilink-seo',
    badge: 'Мультиссылка',
    title: 'Мультиссылка — одна ссылка для Instagram, TikTok и Telegram',
    description:
      'Соберите все ссылки, мессенджеры и предложения в одной короткой ссылке lnkmx.my/имя. Мультиссылка с аналитикой кликов, CRM и приёмом заявок — бесплатно.',
    seoTitle: 'Мультиссылка LinkMAX — одна ссылка для соцсетей с CRM',
    seoDescription:
      'Мультиссылка для Instagram, TikTok, WhatsApp и Telegram. Аналитика кликов, форма заявки, оплаты и CRM. Создайте за 2 минуты, бесплатно.',
    primaryCta: 'Создать мультиссылку',
    secondaryCta: 'Посмотреть демо',
    previewTitle: 'lnkmx.my/your-name',
    previewSubtitle: 'Все ссылки в одном месте',
    visualAlt: 'Пример мультиссылки LinkMAX в Instagram bio',
    stats: [
      { value: '2 мин', label: 'до первой ссылки' },
      { value: '∞', label: 'кнопок без лимита' },
      { value: '0 ₸', label: 'на старте' },
    ],
    outcomes: [
      { title: 'Одна короткая ссылка', description: 'lnkmx.my/имя помещается в bio Instagram, TikTok, X — без сокращателей.' },
      { title: 'Аналитика по каждой кнопке', description: 'Видно, какие ссылки приносят клики и заявки, какие — лишние.' },
      { title: 'Не просто ссылки — приём лидов', description: 'Поверх мультиссылки можно добавить форму, оплату и CRM.' },
    ],
    workflow: [
      { title: 'Добавьте свои ссылки', description: 'Instagram, TikTok, YouTube, WhatsApp, Telegram, сайт, оплата — в любом порядке.' },
      { title: 'Настройте оформление', description: 'Выберите тему, аватар, обложку. Liquid Glass-дизайн адаптируется автоматически.' },
      { title: 'Поделитесь ссылкой', description: 'Поставьте в bio соцсетей, отправьте в сообщениях, добавьте на визитку с QR.' },
    ],
    faq: [
      { question: 'Что такое мультиссылка?', answer: 'Мультиссылка (multilink, link-in-bio) — одна короткая ссылка, ведущая на страницу со всеми вашими ссылками, контактами и предложениями. Помещается в bio Instagram/TikTok, где разрешена только одна ссылка.' },
      { question: 'Бесплатна ли мультиссылка в LinkMAX?', answer: 'Да. Базовый тариф включает неограниченное количество кнопок, базовую аналитику и форму заявок.' },
      { question: 'Чем отличается от Linktree?', answer: 'LinkMAX добавляет CRM, форму заявок с Telegram-уведомлениями, приём оплат и AI-сборку. Работает без VPN в РФ, KZ, UZ.' },
      { question: 'Можно ли подключить свой домен?', answer: 'Да, на тарифе Pro. Например, имя.com будет вести на вашу мультиссылку.' },
      { question: 'Работает ли с Instagram?', answer: 'Да. Короткая ссылка lnkmx.my/имя ставится в Instagram bio и открывается с любого устройства.' },
    ],
    schemaServiceName: 'LinkMAX multilink',
    audience: 'Creators, influencers, small businesses, service professionals using Instagram/TikTok',
  },
  {
    key: 'link-in-bio',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/link-in-bio-ru',
    authFrom: 'link-in-bio-seo',
    badge: 'Link in Bio',
    title: 'Link in Bio с заявками, оплатами и CRM — для русскоязычных создателей',
    description:
      'Link-in-bio сервис нового поколения: одна ссылка собирает заявки, принимает оплату и хранит контакты клиентов. Работает в РФ, KZ, UZ без VPN.',
    seoTitle: 'Link in Bio — LinkMAX, заявки и оплаты с одной ссылки',
    seoDescription:
      'Link in bio с встроенной CRM, формой заявок, оплатами и аналитикой. Бесплатный старт, локальные платежи, поддержка 4 языков.',
    primaryCta: 'Создать link-in-bio',
    secondaryCta: 'Смотреть примеры',
    previewTitle: 'Link in Bio · Pro',
    previewSubtitle: 'Заявки + оплаты + CRM',
    visualAlt: 'Пример link-in-bio страницы LinkMAX',
    stats: [
      { value: '2 мин', label: 'до публикации' },
      { value: '4 страны', label: 'RU · KZ · UZ · USD' },
      { value: 'CRM', label: 'входит в бесплатный план' },
    ],
    outcomes: [
      { title: 'Не просто список ссылок', description: 'Форма заявки + оплата + CRM прямо в link-in-bio.' },
      { title: 'Локальные оплаты', description: 'Robokassa, СБП, Kaspi — без зарубежных карт.' },
      { title: 'AI-сборка', description: 'Опишите, кто вы — AI соберёт блоки, тексты и иконки.' },
    ],
    workflow: [
      { title: 'Заполните мини-онбординг', description: 'Ниша, цель, услуги, контакты — 60 секунд.' },
      { title: 'AI соберёт страницу', description: 'Структура, тексты, кнопки и форма появятся автоматически.' },
      { title: 'Опубликуйте и продвигайте', description: 'Ссылка lnkmx.my/имя готова для bio, рекламы и QR-кодов.' },
    ],
    faq: [
      { question: 'Что такое link in bio?', answer: 'Link-in-bio — это одна ссылка, которую размещают в bio Instagram, TikTok, X. Она открывает страницу со всеми вашими предложениями, формой заявки и оплатой.' },
      { question: 'Чем link-in-bio LinkMAX отличается от Linktree?', answer: 'Встроенная CRM с лидами, локальные оплаты, AI-сборка, поддержка русского/казахского/узбекского, работа без VPN.' },
      { question: 'Можно ли принимать оплату через link-in-bio?', answer: 'Да. Подключите Robokassa или Kaspi — клиент платит со страницы, вы видите оплату в кабинете.' },
    ],
    schemaServiceName: 'LinkMAX link-in-bio',
    audience: 'Russian-speaking creators, freelancers, micro-businesses',
  },
  {
    key: 'vizitka-onlayn',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/vizitka-onlayn',
    authFrom: 'vizitka-onlayn-seo',
    badge: 'Визитка онлайн',
    title: 'Визитка онлайн — создайте цифровую визитку с QR-кодом бесплатно',
    description:
      'Цифровая визитка с фото, контактами, услугами, формой заявки и QR-кодом. Замените бумажные визитки одной короткой ссылкой lnkmx.my/имя.',
    seoTitle: 'Визитка онлайн — цифровая визитка с QR-кодом, LinkMAX',
    seoDescription:
      'Создайте онлайн-визитку с фото, услугами, контактами и QR-кодом за 5 минут. Бесплатно, мобильно, с приёмом заявок и оплатой.',
    primaryCta: 'Создать визитку онлайн',
    secondaryCta: 'Сгенерировать QR',
    previewTitle: 'Цифровая визитка',
    previewSubtitle: 'Контакты · Услуги · QR',
    visualAlt: 'Пример онлайн-визитки LinkMAX с QR-кодом',
    stats: [
      { value: '5 мин', label: 'на сборку' },
      { value: 'QR', label: 'код в подарок' },
      { value: '0 ₸', label: 'старт' },
    ],
    outcomes: [
      { title: 'Замена бумажным визиткам', description: 'Одна ссылка lnkmx.my/имя плюс QR-код вместо стопки картонок.' },
      { title: 'Обновляется в любой момент', description: 'Поменяли телефон или должность — клиенты видят актуальное.' },
      { title: 'Принимает заявки', description: 'Форма обратной связи и кнопки мессенджеров встроены в визитку.' },
    ],
    workflow: [
      { title: 'Загрузите фото и контакты', description: 'Имя, должность, телефон, email, мессенджеры.' },
      { title: 'Добавьте услуги или ссылки', description: 'Кратко опишите, чем помогаете и куда вести клиента.' },
      { title: 'Сохраните QR-код', description: 'Скачайте QR для печати на визитках, баннерах, упаковке.' },
    ],
    faq: [
      { question: 'Чем онлайн-визитка лучше бумажной?', answer: 'Не теряется, обновляется без перепечати, ведёт сразу в WhatsApp/Telegram, собирает заявки и хранит статистику просмотров.' },
      { question: 'Можно ли получить QR-код?', answer: 'Да. QR-код вашей визитки доступен в кабинете — скачивается в PNG/SVG для печати.' },
      { question: 'Сколько стоит?', answer: 'Базовая визитка бесплатна. Pro нужен для своего домена и расширенной CRM.' },
    ],
    schemaServiceName: 'LinkMAX digital business card',
    audience: 'Professionals, sales reps, founders, networkers replacing paper business cards',
  },
  // ===== PROGRAMMATIC /dlya/{niche} =====
  {
    key: 'photographers',
    niche: 'art',
    galleryNiche: 'art',
    canonicalPath: '/dlya/photographer',
    authFrom: 'dlya-photographer',
    badge: 'Для фотографов',
    title: 'Сайт фотографа — портфолио, цены и заявки в одной ссылке',
    description:
      'Соберите портфолио фотографа, прайс на съёмки, форму заявки и контакты в одной мультиссылке. AI создаст структуру за 2 минуты.',
    seoTitle: 'Сайт фотографа — портфолио и заявки на съёмку | LinkMAX',
    seoDescription:
      'Создайте страницу фотографа: портфолио, прайс, форма заявки на съёмку, оплаты. Бесплатно, мобильно, с Telegram-уведомлениями.',
    primaryCta: 'Создать страницу фотографа',
    secondaryCta: 'Открыть примеры',
    previewTitle: 'Photographer Portfolio',
    previewSubtitle: 'Портфолио · Прайс · Заявка',
    visualAlt: 'Пример страницы фотографа в LinkMAX',
    stats: [
      { value: '2 мин', label: 'на портфолио' },
      { value: 'Галерея', label: 'до 100 фото' },
      { value: '0 ₸', label: 'на старте' },
    ],
    outcomes: [
      { title: 'Портфолио на телефоне', description: 'Карусели и галереи адаптируются под мобильный экран.' },
      { title: 'Прайс и пакеты', description: 'Блок услуг с ценами на семейную, свадебную, lifestyle-съёмку.' },
      { title: 'Заявки на съёмку в Telegram', description: 'Дата, локация, формат — сразу в бот.' },
    ],
    workflow: [
      { title: 'Опишите специализацию', description: 'Свадьба, lifestyle, предметка — AI подставит шаблон.' },
      { title: 'Добавьте фото', description: 'Загрузите портфолио из 10–30 лучших кадров.' },
      { title: 'Опубликуйте', description: 'Ссылка lnkmx.my/имя для Instagram bio и рекламы.' },
    ],
    faq: [
      { question: 'Можно ли загрузить много фото?', answer: 'Да, до 100 фото на странице. Используйте блок карусели или галереи.' },
      { question: 'Подходит ли для свадебного фотографа?', answer: 'Да. Можно показать пакеты, отзывы, забронированные даты и форму заявки.' },
    ],
    schemaServiceName: 'LinkMAX for photographers',
    audience: 'Photographers, wedding photographers, lifestyle photographers',
  },
  {
    key: 'coaches',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/dlya/coach',
    authFrom: 'dlya-coach',
    badge: 'Для коучей',
    title: 'Страница коуча — программы, отзывы, заявки на сессию',
    description:
      'Соберите страницу коуча с описанием программ, форматом работы, отзывами клиентов и формой заявки на бесплатную сессию.',
    seoTitle: 'Сайт коуча — программы, заявки и оплаты | LinkMAX',
    seoDescription:
      'Создайте страницу коуча с программами, отзывами, кейсами и формой заявки на сессию. Принимайте оплаты и ведите CRM в одном кабинете.',
    primaryCta: 'Создать страницу коуча',
    secondaryCta: 'Смотреть примеры',
    previewTitle: 'Coach Page',
    previewSubtitle: 'Программы · Кейсы · Заявка',
    visualAlt: 'Пример страницы коуча в LinkMAX',
    stats: [
      { value: '2 мин', label: 'до публикации' },
      { value: 'CRM', label: 'для учеников' },
      { value: '0 ₸', label: 'старт' },
    ],
    outcomes: [
      { title: 'Понятный оффер', description: 'Программы, длительность, формат, цена — без длинной переписки.' },
      { title: 'Социальные доказательства', description: 'Кейсы, отзывы, видео результатов.' },
      { title: 'Заявки в Telegram', description: 'Имя, цель, бюджет — сразу в бот, без потерь.' },
    ],
    workflow: [
      { title: 'Опишите ниши', description: 'Lifecoach, бизнес-коуч, психолог — AI подставит блоки.' },
      { title: 'Добавьте программы и цены', description: 'Индивидуальные сессии, групповые программы, пакеты.' },
      { title: 'Опубликуйте', description: 'Используйте ссылку в bio, рекламе и Telegram-канале.' },
    ],
    faq: [
      { question: 'Можно ли принимать предоплату?', answer: 'Да. Через Robokassa клиент оплачивает сессию или программу прямо со страницы.' },
      { question: 'Подходит ли для психолога?', answer: 'Да. Шаблон гибкий — можно адаптировать под психолога, ментора, эксперта.' },
    ],
    schemaServiceName: 'LinkMAX for coaches',
    audience: 'Coaches, mentors, business coaches, life coaches',
  },
  {
    key: 'private-masters',
    niche: 'beauty',
    galleryNiche: 'beauty',
    canonicalPath: '/dlya/master',
    authFrom: 'dlya-master',
    badge: 'Для частных мастеров',
    title: 'Страница частного мастера — услуги, запись, отзывы',
    description:
      'Сайт-визитка для частного мастера: маникюр, бровист, барбер, массажист, мастер тату. Услуги, цены, запись и отзывы за 5 минут.',
    seoTitle: 'Сайт частного мастера — запись и услуги | LinkMAX',
    seoDescription:
      'Соберите страницу частного мастера: услуги с ценами, запись, отзывы, мессенджеры. Бесплатно, без хостинга и кода.',
    primaryCta: 'Создать страницу мастера',
    secondaryCta: 'Посмотреть пример',
    previewTitle: 'Private Master',
    previewSubtitle: 'Услуги · Запись · Отзывы',
    visualAlt: 'Пример страницы частного мастера',
    stats: [
      { value: '5 мин', label: 'до публикации' },
      { value: '24/7', label: 'запись онлайн' },
      { value: '0 ₸', label: 'бесплатно' },
    ],
    outcomes: [
      { title: 'Запись без переписки', description: 'Клиент выбирает услугу, дату и время — оставляет заявку.' },
      { title: 'Отзывы укрепляют доверие', description: 'Реальные отзывы клиентов прямо на странице.' },
      { title: 'Все мессенджеры рядом', description: 'WhatsApp, Telegram, Instagram — кнопки на странице.' },
    ],
    workflow: [
      { title: 'Опишите сферу', description: 'Маникюр, барбер, массаж — выберите свою.' },
      { title: 'Перечислите услуги и цены', description: 'AI подставит структуру и оформление.' },
      { title: 'Опубликуйте', description: 'Получите короткую ссылку для Instagram и визитки.' },
    ],
    faq: [
      { question: 'Подойдёт ли мастеру тату или массажа?', answer: 'Да. Шаблон гибкий, подходит для любого частного мастера сферы услуг.' },
      { question: 'Можно ли принимать предоплату?', answer: 'Да. Подключите Robokassa или Kaspi для предоплаты услуги.' },
    ],
    schemaServiceName: 'LinkMAX for private masters',
    audience: 'Private service masters, barbers, tattoo artists, massage therapists',
  },
  {
    key: 'psychologists',
    niche: 'health',
    galleryNiche: 'health',
    canonicalPath: '/dlya/psychologist',
    authFrom: 'dlya-psychologist',
    badge: 'Для психологов',
    title: 'Страница психолога — методы, форматы, запись на консультацию',
    description:
      'Соберите профессиональную страницу психолога с методами работы, образованием, форматами сессий и формой записи на консультацию.',
    seoTitle: 'Сайт психолога — запись на консультацию онлайн | LinkMAX',
    seoDescription:
      'Создайте страницу психолога с описанием методов, образованием, форматами сессий и заявкой на консультацию. Конфиденциально и просто.',
    primaryCta: 'Создать страницу психолога',
    secondaryCta: 'Открыть пример',
    previewTitle: 'Psychologist',
    previewSubtitle: 'Методы · Сессии · Заявка',
    visualAlt: 'Пример страницы психолога',
    stats: [
      { value: '2 мин', label: 'AI-сборка' },
      { value: 'Онлайн', label: 'формат сессий' },
      { value: '0 ₸', label: 'старт' },
    ],
    outcomes: [
      { title: 'Понятная методология', description: 'КПТ, гештальт, EMDR — клиент видит подход и решает.' },
      { title: 'Деликатная заявка', description: 'Форма с минимумом полей и согласием на обработку данных.' },
      { title: 'Запись без переписки', description: 'Свободные слоты и подтверждение через Telegram-бот.' },
    ],
    workflow: [
      { title: 'Опишите подход', description: 'Образование, опыт, темы работы — AI соберёт блоки.' },
      { title: 'Укажите форматы', description: 'Индивидуальные, парные, групповые, онлайн/офлайн.' },
      { title: 'Опубликуйте', description: 'Используйте ссылку в Instagram, в карточке b17/Profi.' },
    ],
    faq: [
      { question: 'Защищены ли данные клиентов?', answer: 'Да. LinkMAX соответствует требованиям 152-ФЗ. Форма поддерживает согласие на обработку персональных данных.' },
      { question: 'Можно ли принимать оплату онлайн?', answer: 'Да. Robokassa или ручные счета.' },
    ],
    schemaServiceName: 'LinkMAX for psychologists',
    audience: 'Psychologists, therapists, mental health professionals',
  },
  {
    key: 'fitness-trainers',
    niche: 'fitness',
    galleryNiche: 'fitness',
    canonicalPath: '/dlya/fitness',
    authFrom: 'dlya-fitness',
    badge: 'Для фитнес-тренеров',
    title: 'Страница фитнес-тренера — программы, абонементы, запись',
    description:
      'Сайт фитнес-тренера с программами тренировок, ценами на абонементы, отзывами учеников и формой записи. Подходит для онлайн и офлайн.',
    seoTitle: 'Сайт фитнес-тренера — программы и запись | LinkMAX',
    seoDescription:
      'Создайте страницу тренера: программы, абонементы, отзывы, форма записи, оплата. Подходит для онлайн-тренировок и зала.',
    primaryCta: 'Создать страницу тренера',
    secondaryCta: 'Открыть примеры',
    previewTitle: 'Fitness Trainer',
    previewSubtitle: 'Программы · Абонементы · Запись',
    visualAlt: 'Пример страницы фитнес-тренера',
    stats: [
      { value: '2 мин', label: 'AI-сборка' },
      { value: 'Видео', label: 'программы и упражнения' },
      { value: '0 ₸', label: 'старт' },
    ],
    outcomes: [
      { title: 'Программы на любом устройстве', description: 'Видео и описание тренировок открываются с телефона.' },
      { title: 'Продажа абонементов', description: 'Месячный, квартальный, годовой — с оплатой со страницы.' },
      { title: 'Отзывы учеников', description: 'Социальное доказательство усиливает конверсию.' },
    ],
    workflow: [
      { title: 'Опишите специализацию', description: 'Силовые, кроссфит, EMS, йога — AI подберёт блоки.' },
      { title: 'Добавьте программы и цены', description: 'Индивидуальные, групповые, онлайн-курсы.' },
      { title: 'Опубликуйте', description: 'Ссылка для Instagram bio и таргета.' },
    ],
    faq: [
      { question: 'Подходит ли для онлайн-тренера?', answer: 'Да. Можно добавить видео-программы, расписание онлайн-эфиров и оплату.' },
      { question: 'Можно ли продавать абонементы?', answer: 'Да. Подключите Robokassa — оплата абонемента приходит на счёт мгновенно.' },
    ],
    schemaServiceName: 'LinkMAX for fitness trainers',
    audience: 'Fitness trainers, online coaches, yoga instructors, gym instructors',
  },
  {
    key: 'designers',
    niche: 'art',
    galleryNiche: 'art',
    canonicalPath: '/dlya/designer',
    authFrom: 'dlya-designer',
    badge: 'Для дизайнеров',
    title: 'Сайт дизайнера — портфолио, услуги, заявки на проект',
    description:
      'Соберите портфолио дизайнера с кейсами, услугами, ценами и формой заявки на проект. Подходит для графических, UX/UI, веб-дизайнеров и иллюстраторов.',
    seoTitle: 'Сайт дизайнера — портфолио и заявки | LinkMAX',
    seoDescription:
      'Создайте сайт дизайнера: портфолио, кейсы, услуги, цены, заявка. Бесплатно, мобильно, с CRM и приёмом оплат.',
    primaryCta: 'Создать сайт дизайнера',
    secondaryCta: 'Смотреть примеры',
    previewTitle: 'Designer Portfolio',
    previewSubtitle: 'Кейсы · Услуги · Заявка',
    visualAlt: 'Пример страницы дизайнера',
    stats: [
      { value: '2 мин', label: 'AI-сборка' },
      { value: 'Кейсы', label: 'с изображениями' },
      { value: '0 ₸', label: 'бесплатно' },
    ],
    outcomes: [
      { title: 'Кейсы вместо длинного резюме', description: 'Изображения, описание задачи и результата.' },
      { title: 'Прозрачный прайс', description: 'Цены на лого, сайт, упаковку — без длинных созвонов.' },
      { title: 'Заявки с брифом', description: 'Форма собирает задачу, сроки и бюджет.' },
    ],
    workflow: [
      { title: 'Выберите специализацию', description: 'Графический, UX/UI, веб, иллюстратор.' },
      { title: 'Загрузите 5–10 кейсов', description: 'Картинки, описание, ссылка на проект.' },
      { title: 'Опубликуйте', description: 'Используйте ссылку в Behance, Dribbble, Telegram.' },
    ],
    faq: [
      { question: 'Можно ли заменить Behance/Dribbble?', answer: 'LinkMAX дополняет, а не заменяет. Это лендинг для клиентов: оффер, цены, форма заявки.' },
      { question: 'Можно ли принимать предоплату за проект?', answer: 'Да. Подключите Robokassa для предоплат.' },
    ],
    schemaServiceName: 'LinkMAX for designers',
    audience: 'Graphic designers, UX/UI designers, web designers, illustrators',
  },
  {
    key: 'linktree-alternative',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/linktree-alternative',
    authFrom: 'linktree-alt-seo',
    badge: 'Альтернатива Linktree',
    title: 'LinkMAX — альтернатива Linktree с CRM, оплатами и AI-сборкой',
    description:
      'Аналог Linktree на русском: мультиссылка с формой заявки, Telegram-уведомлениями, Robokassa и Kaspi. Бесплатный старт, работает в РФ, KZ и UZ без VPN.',
    seoTitle: 'Альтернатива Linktree — LinkMAX, мультиссылка с CRM и оплатами',
    seoDescription:
      'Сравнение LinkMAX и Linktree: бесплатный план без лимитов, лиды в Telegram, локальные оплаты, поддержка 4 языков. Перенос за 5 минут.',
    primaryCta: 'Создать бесплатно',
    secondaryCta: 'Сравнить с Linktree',
    previewTitle: 'Switching from Linktree',
    previewSubtitle: 'Мультиссылка + CRM + оплаты',
    visualAlt: 'Сравнение LinkMAX и Linktree — мультиссылка для специалиста',
    stats: [
      { value: '0 ₸', label: 'бесплатный план' },
      { value: '5 мин', label: 'перенос профиля' },
      { value: 'CRM', label: 'входит в комплект' },
    ],
    outcomes: [
      { title: 'CRM, а не только ссылки', description: 'Каждый клик и заявка попадают в воронку лидов с напоминаниями.' },
      { title: 'Локальные оплаты', description: 'Robokassa, СБП, Kaspi — Linktree не принимает оплаты в РФ и СНГ.' },
      { title: 'Без VPN', description: 'Открывается в Instagram bio из РФ, KZ, UZ — Linktree часто блокируется.' },
    ],
    workflow: [
      { title: 'Опишите профиль', description: 'AI соберёт мультиссылку с блоками услуг, контактов и формы за 2 минуты.' },
      { title: 'Подключите оплаты', description: 'Robokassa или Kaspi — оплата идёт сразу на ваш счёт.' },
      { title: 'Замените ссылку в bio', description: 'lnkmx.my/имя — короткая, быстрая, кириллица допустима.' },
    ],
    faq: [
      { question: 'Чем LinkMAX лучше Linktree?', answer: 'Бесплатная CRM с лидами, локальные оплаты (Robokassa, Kaspi, СБП), AI-сборка страницы, русский/казахский/узбекский интерфейс, работа без VPN в РФ и СНГ.' },
      { question: 'Можно ли импортировать ссылки из Linktree?', answer: 'Да. Скопируйте ссылки из Linktree, AI добавит их на страницу за минуту. Дизайн адаптируется автоматически.' },
      { question: 'Сколько кнопок можно добавить?', answer: 'Без ограничений на бесплатном плане, в отличие от Linktree Free.' },
      { question: 'Работает ли в Instagram bio в России?', answer: 'Да. lnkmx.my открывается без VPN, страница загружается за <1 секунды на мобильном.' },
    ],
    schemaServiceName: 'LinkMAX — Linktree alternative',
    audience: 'Creators, freelancers, small businesses switching from Linktree',
  },
  {
    key: 'crm-dlya-uslug',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/crm-dlya-uslug',
    authFrom: 'crm-services-seo',
    badge: 'CRM для услуг',
    title: 'CRM для услуг и мессенджеров — лиды из WhatsApp и Telegram в одном кабинете',
    description:
      'Простая CRM для самозанятых и малого бизнеса в сфере услуг: заявки из WhatsApp, Telegram и форм собираются в одну воронку. Напоминания, статусы, оплаты — без Excel.',
    seoTitle: 'CRM для услуг и мессенджеров — LinkMAX, бесплатно',
    seoDescription:
      'CRM для услуг с приёмом заявок из WhatsApp, Telegram и формы на сайте. Воронка лидов, напоминания, счета. Бесплатно до 50 лидов в месяц.',
    primaryCta: 'Запустить CRM бесплатно',
    secondaryCta: 'Как это работает',
    previewTitle: 'CRM · Inbox',
    previewSubtitle: 'WhatsApp · Telegram · Форма',
    visualAlt: 'Кабинет CRM для услуг с лидами из мессенджеров',
    stats: [
      { value: '50 лидов', label: 'бесплатно в месяц' },
      { value: '< 1 мин', label: 'до новой заявки в боте' },
      { value: '3 канала', label: 'WhatsApp · Telegram · форма' },
    ],
    outcomes: [
      { title: 'Все заявки в одном месте', description: 'WhatsApp, Telegram, формы и звонки собираются в единый inbox.' },
      { title: 'Никто не забыт', description: 'Напоминания и статусы лидов: новый → переписка → оплата → выполнено.' },
      { title: 'Счета и оплаты', description: 'Выставляйте счета Robokassa или Kaspi прямо из карточки лида.' },
    ],
    workflow: [
      { title: 'Подключите мессенджеры', description: 'Привяжите Telegram-бот и WhatsApp-номер за 2 минуты.' },
      { title: 'Принимайте лиды', description: 'Каждая заявка автоматически создаёт карточку в воронке.' },
      { title: 'Закрывайте сделки', description: 'Перемещайте лиды по стадиям, выставляйте счета, получайте оплаты.' },
    ],
    faq: [
      { question: 'Подходит ли CRM для самозанятых?', answer: 'Да. LinkMAX заточен под соло-специалистов и микро-бизнес: всё работает с телефона, без обучения и долгих настроек.' },
      { question: 'Как заявки попадают из WhatsApp в CRM?', answer: 'Через кнопку wa.me на вашей странице — клик сразу создаёт лида с источником "WhatsApp". Аналогично для Telegram.' },
      { question: 'Сколько стоит?', answer: 'Бесплатно до 50 лидов в месяц. Pro — безлимит, автоматизации и команда.' },
      { question: 'Можно ли работать без сайта?', answer: 'Да. Используйте LinkMAX-страницу как сайт-визитку с формой заявки. Лиды сразу попадают в CRM.' },
      { question: 'Есть ли мобильное приложение?', answer: 'Да. PWA-приложение работает на iOS и Android, push-уведомления о новых заявках включаются за минуту.' },
    ],
    schemaServiceName: 'LinkMAX CRM for services',
    audience: 'Self-employed service providers, beauty masters, tutors, coaches, small studios',
  },
  {
    key: 'link-in-bio-en',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/link-in-bio',
    authFrom: 'link-in-bio-en-seo',
    badge: 'Link in Bio',
    title: 'Link in Bio with CRM, Payments & AI — Built for Creators in 2 Minutes',
    description:
      'A modern link-in-bio tool with built-in CRM, lead capture forms, local payments and AI page builder. Free forever, works without VPN in 50+ countries.',
    seoTitle: 'Link in Bio — LinkMAX, CRM & Payments in One Link',
    seoDescription:
      'Best link in bio alternative with built-in CRM, payment processing, AI builder and analytics. Free plan with unlimited buttons, no ads.',
    primaryCta: 'Create my link in bio',
    secondaryCta: 'See examples',
    previewTitle: 'Link in Bio · Pro',
    previewSubtitle: 'Leads + payments + CRM',
    visualAlt: 'Example LinkMAX link in bio page on mobile',
    stats: [
      { value: '2 min', label: 'to publish' },
      { value: 'Free', label: 'forever plan' },
      { value: 'CRM', label: 'built-in' },
    ],
    outcomes: [
      { title: 'More than a link list', description: 'Capture leads, accept payments, manage clients — all from one URL.' },
      { title: 'AI page builder', description: 'Describe your business, get a polished bio page in 2 minutes.' },
      { title: 'Real analytics', description: 'See clicks, sources, devices and conversions — no Google Analytics required.' },
    ],
    workflow: [
      { title: 'Sign up free', description: 'No credit card. Pick a username — lnkmx.my/your-name.' },
      { title: 'Let AI build it', description: 'Answer 3 questions, the page is ready with copy, icons and CTA.' },
      { title: 'Share & grow', description: 'Drop the link in Instagram, TikTok and YouTube bios.' },
    ],
    faq: [
      { question: 'What is link in bio?', answer: 'A single short URL placed in your social media bio (Instagram, TikTok, X). It opens a landing page with all your links, services and contact options.' },
      { question: 'How is LinkMAX different from Linktree?', answer: 'LinkMAX includes a real CRM, lead forms with instant Telegram alerts, local payment methods (Robokassa, Kaspi, Stripe), AI page builder and works without VPN globally.' },
      { question: 'Is it really free?', answer: 'Yes. Unlimited buttons, basic analytics and 50 leads/month on the free plan. Pro adds custom domain, advanced CRM and lower fees.' },
      { question: 'Can I accept payments?', answer: 'Yes. Connect Stripe, Robokassa or Kaspi — clients pay directly from your bio link.' },
    ],
    schemaServiceName: 'LinkMAX link-in-bio',
    audience: 'Creators, influencers, freelancers, small businesses worldwide',
  },
  {
    key: 'linktree-alternative-en',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/linktree-alternative-en',
    authFrom: 'linktree-alt-en-seo',
    badge: 'Linktree alternative',
    title: 'The Linktree Alternative with Built-in CRM and Payments',
    description:
      'Migrate from Linktree to LinkMAX in 5 minutes. Get unlimited buttons, lead capture, payments and AI page builder — all on the free plan.',
    seoTitle: 'Linktree Alternative — LinkMAX, Free CRM & Payments',
    seoDescription:
      'A better Linktree alternative: unlimited links, built-in CRM, payment processing, AI builder and analytics. Free forever, no ads.',
    primaryCta: 'Switch from Linktree free',
    secondaryCta: 'Compare features',
    previewTitle: 'Better than Linktree',
    previewSubtitle: 'Unlimited links · CRM · payments',
    visualAlt: 'LinkMAX vs Linktree comparison',
    stats: [
      { value: '0$', label: 'forever plan' },
      { value: '∞', label: 'unlimited buttons' },
      { value: '5 min', label: 'to migrate' },
    ],
    outcomes: [
      { title: 'A CRM, not just links', description: 'Capture leads, track sources, follow up — Linktree stops at the click.' },
      { title: 'Direct payments', description: 'Stripe, Robokassa, Kaspi — sell services directly from your bio link.' },
      { title: 'No ads, no upsell', description: 'Even the free plan stays clean. No "Powered by Linktree" branding.' },
    ],
    workflow: [
      { title: 'Sign up free', description: 'No credit card required. Claim your username.' },
      { title: 'Import your links', description: 'Paste your Linktree URL — AI rebuilds the structure in 60 seconds.' },
      { title: 'Replace bio link', description: 'Switch lnkmx.my/your-name in Instagram, TikTok and YouTube.' },
    ],
    faq: [
      { question: 'Why switch from Linktree?', answer: 'LinkMAX adds a free CRM, lead capture forms, real payments, AI builder and removes Linktree branding — all on the free plan.' },
      { question: 'Will my Linktree links break?', answer: 'No. Keep Linktree active while you migrate. Once ready, just update the bio URL.' },
      { question: 'Is there a free plan?', answer: 'Yes — forever free, unlimited buttons, no ads, 50 leads/month in CRM.' },
      { question: 'Can I use a custom domain?', answer: 'Yes, on the Pro plan. Connect your own domain in 2 minutes.' },
    ],
    schemaServiceName: 'LinkMAX — Linktree alternative',
    audience: 'Creators and small businesses migrating from Linktree',
  },
  {
    key: 'crm-for-services-en',
    niche: 'expert',
    galleryNiche: 'expert',
    canonicalPath: '/crm-for-services',
    authFrom: 'crm-services-en-seo',
    badge: 'CRM for service businesses',
    title: 'CRM for Service Businesses — Capture Leads from WhatsApp, Telegram & Forms',
    description:
      'A lightweight CRM for solo pros and small service teams. All leads from WhatsApp, Telegram and your bio link funnel into one inbox with reminders, statuses and invoicing.',
    seoTitle: 'CRM for Service Businesses — LinkMAX, Free Plan',
    seoDescription:
      'Simple CRM built for service businesses: WhatsApp & Telegram leads in one inbox, reminders, invoices, payments. Free up to 50 leads/month.',
    primaryCta: 'Start free CRM',
    secondaryCta: 'How it works',
    previewTitle: 'CRM · Unified Inbox',
    previewSubtitle: 'WhatsApp · Telegram · Forms',
    visualAlt: 'CRM dashboard with leads from messengers',
    stats: [
      { value: '50 leads', label: 'free monthly' },
      { value: '< 1 min', label: 'lead-to-alert time' },
      { value: '3 channels', label: 'WhatsApp · Telegram · web' },
    ],
    outcomes: [
      { title: 'One inbox for everything', description: 'WhatsApp, Telegram, web forms and calls all land in a single feed.' },
      { title: 'Nothing falls through', description: 'Statuses and reminders move leads from new → chatting → paid → done.' },
      { title: 'Invoices in-app', description: 'Send invoices via Stripe, Robokassa or Kaspi straight from the lead card.' },
    ],
    workflow: [
      { title: 'Connect messengers', description: 'Add your Telegram bot and WhatsApp number in 2 minutes.' },
      { title: 'Receive leads', description: 'Every chat opens a CRM card with source, contact and history.' },
      { title: 'Close deals', description: 'Move leads through stages, send invoices, collect payments — from your phone.' },
    ],
    faq: [
      { question: 'Is this CRM right for solo pros?', answer: 'Yes. LinkMAX is designed for solo service providers and micro teams: mobile-first, no training required, free to start.' },
      { question: 'How do WhatsApp leads land in the CRM?', answer: 'Via wa.me buttons on your bio page — every click creates a lead tagged "WhatsApp". Same for Telegram and web forms.' },
      { question: 'How much does it cost?', answer: 'Free up to 50 leads/month. Pro removes the limit, adds automations and team seats.' },
      { question: 'Does it work without a website?', answer: 'Yes. Your LinkMAX bio page acts as a one-page site with a contact form — leads go straight to the CRM.' },
      { question: 'Is there a mobile app?', answer: 'Yes, a PWA app for iOS and Android with push notifications for new leads.' },
    ],
    schemaServiceName: 'LinkMAX CRM for services',
    audience: 'Service businesses, solo pros, beauty studios, coaches, tutors worldwide',
  },
];

const ROUTE_TO_KEY: Record<string, string> = {
  'beauty': 'beauty-masters',
  'beauty-masters': 'beauty-masters',
  'tutors': 'tutors',
  'teachers': 'tutors',
  'education': 'tutors',
  'для-бьюти-мастеров': 'beauty-masters',
  'для-репетиторов': 'tutors',
  'taplink-alternative': 'taplink-alternative',
  'sayt-vizitka': 'sayt-vizitka',
  'sayt-vizitka-dlya-uslug': 'sayt-vizitka',
  'multilink': 'multilink',
  'link-in-bio': 'link-in-bio',
  'link-in-bio-ru': 'link-in-bio',
  'vizitka-onlayn': 'vizitka-onlayn',
  'photographer': 'photographers',
  'photographers': 'photographers',
  'coach': 'coaches',
  'coaches': 'coaches',
  'master': 'private-masters',
  'masters': 'beauty-masters',
  'private-master': 'private-masters',
  'private-masters': 'private-masters',
  'psychologist': 'psychologists',
  'psychologists': 'psychologists',
  'fitness': 'fitness-trainers',
  'fitness-trainer': 'fitness-trainers',
  'designer': 'designers',
  'designers': 'designers',
  'linktree-alternative': 'linktree-alternative',
  'crm-dlya-uslug': 'crm-dlya-uslug',
  'crm-dlya-mastera': 'crm-dlya-uslug',
  'link-in-bio-en': 'link-in-bio-en',
  'link-in-bio-english': 'link-in-bio-en',
  'linktree-alternative-en': 'linktree-alternative-en',
  'crm-for-services': 'crm-for-services-en',
  'crm-for-services-en': 'crm-for-services-en',
};

export function getNicheLandingByKey(key: string | undefined): NicheLandingData | undefined {
  if (!key) return undefined;
  const normalized = decodeURIComponent(key).toLowerCase();
  const mappedKey = ROUTE_TO_KEY[normalized] || normalized;
  return NICHE_LANDINGS.find((landing) => landing.key === mappedKey);
}
