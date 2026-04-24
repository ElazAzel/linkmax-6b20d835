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
];

const ROUTE_TO_KEY: Record<string, string> = {
  'beauty': 'beauty-masters',
  'beauty-masters': 'beauty-masters',
  'masters': 'beauty-masters',
  'tutors': 'tutors',
  'teachers': 'tutors',
  'education': 'tutors',
  'для-бьюти-мастеров': 'beauty-masters',
  'для-репетиторов': 'tutors',
};

export function getNicheLandingByKey(key: string | undefined): NicheLandingData | undefined {
  if (!key) return undefined;
  const normalized = decodeURIComponent(key).toLowerCase();
  const mappedKey = ROUTE_TO_KEY[normalized] || normalized;
  return NICHE_LANDINGS.find((landing) => landing.key === mappedKey);
}
