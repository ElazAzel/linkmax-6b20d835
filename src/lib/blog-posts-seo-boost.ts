// Search snippet rewrites for posts that already get Google impressions
// (positions 6–10) but no clicks. Merged over base/hub posts in blog-posts.ts.
import type { BlogPost } from './blog-post-types';

type Boost = Pick<BlogPost, 'metaTitle' | 'metaDescription' | 'related'> & {
  extraFaq?: NonNullable<BlogPost['faq']>;
};

export const SEO_BOOST: Record<string, Boost> = {
  'kak-prinimat-oplatu-cherez-whatsapp-v-kazakhstane': {
    metaTitle: 'Оплата через WhatsApp в Казахстане: 3 способа',
    metaDescription:
      'Как принять оплату от клиента прямо в WhatsApp: ссылка Kaspi, счёт со страницы и предоплата за запись. Комиссии, касса для самозанятых, пошагово.',
    related: ['kak-podklyuchit-kaspi-qr-k-stranice-uslug', 'mini-crm-dlya-frilansera-zachem-i-kak', 'skolko-stoit-sayt-vizitka-v-kazakhstane'],
    extraFaq: [
      { question: 'Можно ли принять оплату, не выходя из переписки в WhatsApp?', answer: 'Да. Отправьте клиенту ссылку на страницу услуги с кнопкой оплаты Kaspi: он платит в один клик и возвращается в чат.' },
      { question: 'Как не потерять заявки из WhatsApp?', answer: 'Каждая заявка со страницы сохраняется в мини-CRM и приходит уведомлением в Telegram, даже если чат пропущен.' },
    ],
  },
  'telegram-vizitka-dlya-koucha-poshagovo': {
    metaTitle: 'Telegram-визитка за 10 минут: пример и шаги',
    metaDescription:
      'Что такое Telegram-визитка и как сделать её бесплатно: услуги, цены, запись и оплата по одной ссылке. Пример для коуча и эксперта, 5 шагов.',
    related: ['kak-zapisat-klienta-na-konsultatsiyu-onlayn', 'chto-takoe-link-in-bio-i-zachem-on-nuzhen', 'kak-prinimat-oplatu-cherez-whatsapp-v-kazakhstane'],
    extraFaq: [
      { question: 'Сколько стоит Telegram-визитка?', answer: 'В LinkMAX её можно сделать бесплатно. Платный тариф нужен для своего домена и безлимитных заявок.' },
      { question: 'Куда ставить ссылку на визитку в Telegram?', answer: 'В описание профиля, в закреп канала и в подпись к постам. Так клиент сразу видит услуги и кнопку записи.' },
    ],
  },
  'taplink-vs-linkmax-sravnenie-2026': {
    metaTitle: 'Taplink или LinkMAX: что выбрать в 2026',
    metaDescription:
      'Честное сравнение Taplink и LinkMAX: цены, бесплатный тариф, оплаты Kaspi и Robokassa, заявки в Telegram, SEO. Таблица и вывод, кому что подойдёт.',
    related: ['linktree-vs-taplink-vs-linkmax', 'kakoy-konstruktor-saytov-vybrat-dlya-mikrobiznesa', 'chto-takoe-link-in-bio-i-zachem-on-nuzhen'],
    extraFaq: [
      { question: 'Есть ли бесплатная альтернатива Taplink?', answer: 'Да. В LinkMAX есть бесплатный тариф с неограниченным числом ссылок, формой заявки и уведомлениями в Telegram.' },
      { question: 'Подходит ли LinkMAX для Казахстана и Узбекистана?', answer: 'Да. Интерфейс на русском, казахском, узбекском и английском, есть оплата через Kaspi.' },
    ],
  },
  'mini-crm-dlya-frilansera-zachem-i-kak': {
    metaTitle: 'Мини-CRM для фрилансера: бесплатно за 10 минут',
    metaDescription:
      'Простая бесплатная CRM для фрилансера вместо Excel и заметок: клиенты, заявки, статусы и напоминания в Telegram. Что выбрать и как настроить.',
    related: ['crm-dlya-malogo-biznesa-prostaya', 'kak-prinimat-zayavki-iz-instagram-bez-direct', 'onlayn-zapis-klientov-kak-nastroit'],
    extraFaq: [
      { question: 'Чем мини-CRM лучше таблицы Excel?', answer: 'Заявки попадают в неё сами со страницы, у каждого клиента есть статус и история, а напоминания приходят в Telegram.' },
      { question: 'Есть ли бесплатная CRM для фрилансера?', answer: 'Да. В LinkMAX до 50 заявок бесплатно, на Pro без ограничений.' },
    ],
  },
  'skolko-stoit-sayt-vizitka-v-kazakhstane': {
    metaTitle: 'Сайт-визитка в Казахстане: цены 2026 в тенге',
    metaDescription:
      'Сколько стоит сайт-визитка в Казахстане: фрилансер, веб-студия или конструктор. Цены в тенге, сроки, скрытые расходы и как сделать бесплатно.',
    related: ['sayt-vizitka-besplatno-kak-sdelat', 'kakoy-konstruktor-saytov-vybrat-dlya-mikrobiznesa', 'kak-prinimat-oplatu-cherez-whatsapp-v-kazakhstane'],
    extraFaq: [
      { question: 'Можно ли сделать сайт-визитку бесплатно?', answer: 'Да. На конструкторе LinkMAX страница с услугами, ценами и формой заявки бесплатна и работает по ссылке lnkmx.my/имя.' },
      { question: 'Сколько времени занимает запуск?', answer: 'На конструкторе около 10 минут. У фрилансера или студии обычно от недели до месяца.' },
    ],
  },
  'how-to-add-link-in-bio-to-instagram': {
    related: ['chto-takoe-link-in-bio-i-zachem-on-nuzhen', 'instagram-bio-ideas-for-photographers', 'kak-prinimat-zayavki-iz-instagram-bez-direct'],
  },
};

export const SEO_BOOST_NEW_POSTS: BlogPost[] = [
  {
    slug: 'how-to-add-link-in-bio-to-instagram',
    title: 'Как добавить ссылку в шапку профиля Instagram: пошагово',
    metaTitle: 'Как добавить ссылку в bio Instagram: 4 шага',
    metaDescription:
      'Как поставить ссылку в описание профиля Instagram с телефона, сколько ссылок можно добавить и как сделать одну ссылку на все услуги и контакты.',
    description: 'Пошаговая инструкция: как добавить ссылку в шапку профиля Instagram и как собрать одну страницу со всеми услугами, ценами и контактами.',
    publishedAt: '2026-10-30',
    readingMinutes: 4,
    tags: ['instagram', 'link-in-bio'],
    answer:
      'Откройте свой профиль в Instagram, нажмите «Редактировать профиль», затем «Ссылки» и «Добавить внешнюю ссылку». Вставьте адрес и сохраните. Instagram позволяет до 5 ссылок, но в шапке видна только первая, поэтому удобнее поставить одну ссылку на страницу со всеми услугами.',
    sections: [
      {
        heading: 'Как добавить ссылку с телефона',
        paragraphs: ['Вся настройка занимает минуту:'],
        bullets: [
          'Откройте профиль и нажмите «Редактировать профиль»',
          'Выберите «Ссылки», затем «Добавить внешнюю ссылку»',
          'Вставьте адрес и при желании подпишите его',
          'Нажмите «Готово»: ссылка появится под описанием профиля',
        ],
      },
      {
        heading: 'Почему лучше одна ссылка на все услуги',
        paragraphs: [
          'Клиенты редко раскрывают список из нескольких ссылок. Одна страница с услугами, ценами, кнопками WhatsApp и Telegram и формой записи работает лучше.',
          'Такую страницу можно бесплатно собрать в LinkMAX и поставить адрес lnkmx.my/имя в шапку профиля.',
        ],
        links: [{ label: 'Что такое link-in-bio', href: '/blog/chto-takoe-link-in-bio-i-zachem-on-nuzhen' }],
      },
    ],
    faq: [
      { question: 'Сколько ссылок можно добавить в Instagram?', answer: 'До 5 ссылок, но в шапке профиля сразу видна только первая.' },
      { question: 'Почему ссылка в Instagram не кликается?', answer: 'Ссылки в подписях к постам не кликабельны. Работают только ссылки в разделе «Ссылки» профиля и в историях.' },
    ],
    cta: { label: 'Сделать страницу для bio бесплатно', href: '/auth?ref=blog-how-to-add-link-in-bio' },
  },
];

export function applySeoBoost(post: BlogPost): BlogPost {
  const b = SEO_BOOST[post.slug];
  if (!b) return post;
  const faq = [...(post.faq ?? [])];
  for (const f of b.extraFaq ?? []) if (!faq.some((x) => x.question === f.question)) faq.push(f);
  return {
    ...post,
    metaTitle: b.metaTitle ?? post.metaTitle,
    metaDescription: b.metaDescription ?? post.metaDescription,
    related: b.related ?? post.related,
    faq,
    updatedAt: '2026-10-30',
  };
}
