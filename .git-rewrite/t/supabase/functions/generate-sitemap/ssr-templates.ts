/**
 * SSR Templates v2.0 - Enhanced for SEO/GEO/AEO
 */

import { escapeHtml, getOgLocale, buildHreflangLinks, truncate } from './seo-helpers.ts';

const DEFAULT_OG_IMAGE = 'https://lnkmx.my/og-image.png';
const BASE_URL = 'https://lnkmx.my';

export type LanguageKey = 'ru' | 'en' | 'kk';

// ============ LANDING CONTENT ============

type LandingContent = {
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  cta: string;
  aboutTitle: string;
  aboutBody: string;
  forTitle: string;
  forList: string[];
  whereTitle: string;
  whereList: string[];
  answersTitle: string;
  answers: { q: string; a: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  keyFactsTitle: string;
  keyFacts: string[];
  answerBlock: string;
};

type GalleryContent = {
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  highlightsTitle: string;
  highlights: string[];
  locationTitle: string;
  locationBody: string;
  topProfilesTitle: string;
  keyFactsTitle: string;
  keyFacts: string[];
  answerBlock: string;
};

const LANDING_CONTENT: Record<LanguageKey, LandingContent> = {
  ru: {
    title: 'lnkmx — Micro-Business OS | Конструктор страниц + CRM',
    description: 'Операционная система для микро-бизнеса: AI-конструктор страниц, встроенная CRM, формы заявок и Telegram-уведомления. Запуск за 2 минуты без кода.',
    h1: 'Micro-Business OS для микро-бизнеса',
    subtitle: 'Мини-сайт, CRM и заявки в одном месте — без кода и сложной настройки.',
    cta: 'Создать бесплатно',
    aboutTitle: 'Что такое lnkmx',
    aboutBody: 'lnkmx — это конструктор страниц и CRM, который превращает соцсети в полноценную точку продаж. Создайте страницу, принимайте заявки, управляйте клиентами и получайте аналитику.',
    forTitle: 'Для кого подходит',
    forList: ['Эксперты и консультанты', 'Малый бизнес и салоны', 'Блогеры и создатели курсов', 'Организаторы событий'],
    whereTitle: 'Где используют',
    whereList: ['Казахстан, Россия, Кыргызстан', 'Алматы, Астана, Шымкент', 'Онлайн и офлайн сервисы'],
    answersTitle: 'Короткие ответы',
    answers: [
      { q: 'Как быстро запустить страницу?', a: '2 минуты: ответьте на вопросы — AI соберёт страницу.' },
      { q: 'Есть ли встроенная CRM?', a: 'Да, заявки и клиенты сохраняются в одном месте.' },
      { q: 'Подходит ли для локального бизнеса?', a: 'Да, можно указать город и контакты, подключить карту и запись.' },
    ],
    faqTitle: 'Часто задаваемые вопросы',
    faq: [
      { q: 'Нужен ли дизайнер?', a: 'Нет, готовые блоки и AI помогут запуститься без дизайнера.' },
      { q: 'Можно ли менять язык?', a: 'Да, поддерживаются RU/EN/KK и переключение языков.' },
      { q: 'Есть ли бесплатный тариф?', a: 'Да, можно стартовать бесплатно и перейти на Pro при росте.' },
    ],
    keyFactsTitle: 'Ключевые факты',
    keyFacts: [
      'Запуск страницы за 2 минуты',
      '25+ типов блоков',
      'Встроенная CRM для заявок',
      'Telegram-уведомления',
      'Поддержка RU/EN/KK языков',
      'Аналитика просмотров и кликов',
    ],
    answerBlock: 'lnkmx — это операционная система для микро-бизнеса, объединяющая AI-конструктор страниц, CRM и аналитику. Позволяет создать профессиональный мини-сайт за 2 минуты без кода, принимать заявки и управлять клиентами.',
  },
  en: {
    title: 'lnkmx — Micro-Business OS | Page Builder + CRM',
    description: 'Operating system for micro-business: AI page builder, built-in CRM, lead forms and Telegram notifications. Launch in 2 minutes with no code.',
    h1: 'Micro-Business OS for creators & small business',
    subtitle: 'Landing page, CRM, and lead capture in one place — no code needed.',
    cta: 'Start free',
    aboutTitle: 'What is lnkmx',
    aboutBody: 'lnkmx is a page builder with CRM that turns social traffic into sales. Build a page, collect leads, manage clients, and track analytics.',
    forTitle: 'Who it is for',
    forList: ['Experts & consultants', 'Small businesses & studios', 'Creators and course makers', 'Event organizers'],
    whereTitle: 'Where it works best',
    whereList: ['Kazakhstan, Russia, Kyrgyzstan', 'Almaty, Astana, Shymkent', 'Online and offline services'],
    answersTitle: 'Quick answers',
    answers: [
      { q: 'How fast can I launch?', a: '2 minutes: answer a few questions and AI builds your page.' },
      { q: 'Is there a CRM included?', a: 'Yes, all leads and customers stay in one dashboard.' },
      { q: 'Is it good for local business?', a: 'Yes, add city, map, and booking to get local leads.' },
    ],
    faqTitle: 'Frequently Asked Questions',
    faq: [
      { q: 'Do I need a designer?', a: 'No, ready-made blocks and AI handle the layout.' },
      { q: 'Can I switch languages?', a: 'Yes, RU/EN/KK are supported with easy switching.' },
      { q: 'Is there a free plan?', a: 'Yes, start free and upgrade when you grow.' },
    ],
    keyFactsTitle: 'Key Facts',
    keyFacts: [
      'Launch a page in 2 minutes',
      '25+ block types',
      'Built-in CRM for leads',
      'Telegram notifications',
      'RU/EN/KK language support',
      'Views and clicks analytics',
    ],
    answerBlock: 'lnkmx is a micro-business operating system combining AI page builder, CRM, and analytics. Create a professional mini-site in 2 minutes without code, collect leads, and manage clients.',
  },
  kk: {
    title: 'lnkmx — Micro-Business OS | Бет конструкторы + CRM',
    description: 'Микро-бизнеске арналған операциялық жүйе: AI бет конструкторы, ішкі CRM, өтінім формалары және Telegram хабарламалары. 2 минутта кодсыз іске қосыңыз.',
    h1: 'Микро-бизнеске арналған Micro-Business OS',
    subtitle: 'Мини-сайт, CRM және өтінімдер — бір жерде, кодсыз.',
    cta: 'Тегін бастау',
    aboutTitle: 'lnkmx деген не',
    aboutBody: 'lnkmx — парақша құрастырушы және CRM. Әлеуметтік желідегі трафикті сатылымға айналдырып, өтінімдерді жинап, клиенттерді басқаруға көмектеседі.',
    forTitle: 'Кімге арналған',
    forList: ['Сарапшылар мен кеңесшілер', 'Шағын бизнес пен салондар', 'Креаторлар мен курс авторлары', 'Іс-шара ұйымдастырушылар'],
    whereTitle: 'Қай жерде қолданады',
    whereList: ['Қазақстан, Ресей, Қырғызстан', 'Алматы, Астана, Шымкент', 'Онлайн және офлайн қызметтер'],
    answersTitle: 'Қысқа жауаптар',
    answers: [
      { q: 'Қаншалықты тез іске қосамын?', a: '2 минутта: бірнеше сұраққа жауап бересіз — AI парақшаны құрады.' },
      { q: 'CRM бар ма?', a: 'Иә, барлық өтінімдер бір жүйеде сақталады.' },
      { q: 'Жергілікті бизнеске жарай ма?', a: 'Иә, қала, карта және жазылу функцияларын қосуға болады.' },
    ],
    faqTitle: 'Жиі қойылатын сұрақтар',
    faq: [
      { q: 'Дизайнер керек пе?', a: 'Жоқ, дайын блоктар мен AI көмектеседі.' },
      { q: 'Тілді ауыстыруға бола ма?', a: 'Иә, RU/EN/KK тілдері қолжетімді.' },
      { q: 'Тегін тариф бар ма?', a: 'Иә, тегін бастауға болады.' },
    ],
    keyFactsTitle: 'Негізгі фактілер',
    keyFacts: [
      'Парақшаны 2 минутта іске қосу',
      '25+ блок түрлері',
      'Өтінімдерге арналған CRM',
      'Telegram хабарламалары',
      'RU/EN/KK тілдерін қолдау',
      'Көрулер мен басулар аналитикасы',
    ],
    answerBlock: 'lnkmx — AI бет конструкторы, CRM және аналитиканы біріктіретін микро-бизнес операциялық жүйесі. 2 минутта кодсыз кәсіби мини-сайт жасап, өтінімдерді жинап, клиенттерді басқарыңыз.',
  },
};

// ============ GALLERY CONTENT ============

const GALLERY_CONTENT: Record<LanguageKey, GalleryContent> = {
  ru: {
    title: 'Галерея lnkmx — примеры link in bio и мини-сайтов',
    description: 'Подборка лучших страниц lnkmx: ниши, шаблоны, идеи. Посмотрите, как выглядят реальные профили.',
    h1: 'Галерея страниц lnkmx',
    subtitle: 'Смотрите реальные профили, вдохновляйтесь нишами и копируйте решения.',
    highlightsTitle: 'Что вы найдёте в галерее',
    highlights: ['Топовые страницы по лайкам', 'Примеры по нишам: beauty, education, consulting', 'Готовые структуры блоков'],
    locationTitle: 'Локальная релевантность',
    locationBody: 'В галерее много локальных бизнесов — можно искать примеры по вашему городу.',
    topProfilesTitle: 'Популярные профили',
    keyFactsTitle: 'Ключевые факты о галерее',
    keyFacts: ['Сотни реальных примеров', '15+ категорий ниш', 'Фильтрация по популярности', 'Примеры из Казахстана и СНГ'],
    answerBlock: 'Галерея lnkmx — это коллекция реальных link in bio страниц от экспертов, бизнесов и креаторов.',
  },
  en: {
    title: 'lnkmx Gallery — link in bio examples and templates',
    description: 'Discover top lnkmx pages: niches, templates, and inspiration.',
    h1: 'lnkmx Gallery',
    subtitle: 'Browse real profiles, explore niches, and copy proven layouts.',
    highlightsTitle: 'What you get inside',
    highlights: ['Top pages by likes and views', 'Niche examples: beauty, education, consulting', 'Ready-to-use block structures'],
    locationTitle: 'Local relevance',
    locationBody: 'Many pages are built for local businesses — find examples from your city or country.',
    topProfilesTitle: 'Top profiles',
    keyFactsTitle: 'Key facts about gallery',
    keyFacts: ['Hundreds of real page examples', '15+ niche categories', 'Filter by popularity', 'Examples from Kazakhstan and CIS'],
    answerBlock: 'lnkmx Gallery is a collection of real link in bio pages from experts, businesses, and creators.',
  },
  kk: {
    title: 'lnkmx галереясы — link in bio мысалдары мен мини-сайттар',
    description: 'lnkmx үздік парақшалары: нишалар, шаблондар, идеялар.',
    h1: 'lnkmx парақшалар галереясы',
    subtitle: 'Нақты профильдерді қарап, нишалардан шабыт алыңыз.',
    highlightsTitle: 'Галереядан не табасыз',
    highlights: ['Лайк пен қаралымы көп үздік беттер', 'Beauty, education, consulting сияқты нишалар', 'Дайын блок құрылымдары'],
    locationTitle: 'Жергілікті өзектілік',
    locationBody: 'Галереяда жергілікті бизнеске арналған көп беттер бар.',
    topProfilesTitle: 'Танымал профильдер',
    keyFactsTitle: 'Галерея туралы негізгі фактілер',
    keyFacts: ['Жүздеген нақты бет мысалдары', '15+ ниша санаттары', 'Танымалдылығы бойынша сүзу', 'Қазақстан мен ТМД елдерінен мысалдар'],
    answerBlock: 'lnkmx галереясы — бұл сарапшылар, бизнестер және креаторлардан нақты link in bio беттерінің жинағы.',
  },
};

// ============ TYPES ============

export type GalleryItem = {
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  niche: string | null;
};

// ============ LANDING HTML ============

export function buildLandingHtml(lang: LanguageKey, baseUrl: string): string {
  const content = LANDING_CONTENT[lang] || LANDING_CONTENT.ru;
  const locale = getOgLocale(lang);
  const hreflangLinks = buildHreflangLinks(baseUrl, '/', ['ru', 'en', 'kk']);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${baseUrl}/#faq`,
    mainEntity: content.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: 'lnkmx',
        url: `${baseUrl}/`,
        inLanguage: lang,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/{username}`,
          'query-input': 'required name=username',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'lnkmx',
        url: `${baseUrl}/`,
        logo: `${baseUrl}/favicon.jpg`,
        areaServed: content.whereList,
      },
      {
        '@type': 'SoftwareApplication',
        name: 'lnkmx - Micro-Business OS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: content.description,
        sameAs: ['https://t.me/lnkmx_app'],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#software`,
        name: 'lnkmx - Micro-Business OS',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Business Operating System',
        operatingSystem: 'Web',
        description: content.description,
        featureList: content.keyFacts,
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pro', price: '5', priceCurrency: 'USD' },
        ],
      },
      faqSchema,
    ],
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.title)}</title>
  <meta name="description" content="${escapeHtml(content.description)}">
  <meta name="robots" content="index, follow">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${baseUrl}/">
  ${hreflangLinks}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(content.title)}">
  <meta property="og:description" content="${escapeHtml(content.description)}">
  <meta property="og:url" content="${baseUrl}/">
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}">
  <meta property="og:locale" content="${locale}">
  <meta property="og:site_name" content="lnkmx">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(content.title)}">
  <meta name="twitter:description" content="${escapeHtml(content.description)}">
  <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">
  <meta name="twitter:site" content="@lnkmx_app">
  <meta name="ai-summary" content="${escapeHtml(content.answerBlock)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; color: #111; background: #fff; line-height: 1.6; }
    main { max-width: 800px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; line-height: 1.2; }
    h2 { margin-top: 2rem; font-size: 1.4rem; color: #333; }
    ul { padding-left: 1.2rem; }
    li { margin-bottom: 0.5rem; }
    .answer-block { background: #f8f9fa; border-left: 4px solid #0f62fe; padding: 16px; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
    .key-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 1rem 0; }
    .key-fact { background: #f0f4f8; padding: 12px; border-radius: 8px; font-size: 0.95rem; }
    .faq dt { font-weight: 600; margin-top: 1rem; }
    .faq dd { margin-left: 0; margin-bottom: 0.5rem; color: #555; }
    .cta { margin-top: 1.5rem; }
    .cta a { display: inline-block; padding: 14px 24px; border-radius: 999px; background: #0f62fe; color: #fff; text-decoration: none; font-weight: 600; }
    .cta a:hover { background: #0052cc; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #eee; text-align: center; color: #666; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(content.h1)}</h1>
      <p>${escapeHtml(content.subtitle)}</p>
      <div class="cta"><a href="${baseUrl}/auth">${escapeHtml(content.cta)}</a></div>
    </header>

    <!-- Answer Block for AI extraction -->
    <section class="answer-block" aria-label="Summary">
      <p><strong>${lang === 'ru' ? 'Кратко' : lang === 'kk' ? 'Қысқаша' : 'Summary'}:</strong> ${escapeHtml(content.answerBlock)}</p>
    </section>

    <!-- Key Facts -->
    <section aria-label="${content.keyFactsTitle}">
      <h2>${escapeHtml(content.keyFactsTitle)}</h2>
      <div class="key-facts">
        ${content.keyFacts.map((fact) => `<div class="key-fact">✓ ${escapeHtml(fact)}</div>`).join('')}
      </div>
    </section>

    <section>
      <h2>${escapeHtml(content.aboutTitle)}</h2>
      <p>${escapeHtml(content.aboutBody)}</p>
    </section>

    <section>
      <h2>${escapeHtml(content.forTitle)}</h2>
      <ul>${content.forList.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>

    <section>
      <h2>${escapeHtml(content.whereTitle)}</h2>
      <ul>${content.whereList.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>

    <section aria-label="${content.answersTitle}">
      <h2>${escapeHtml(content.answersTitle)}</h2>
      <dl class="faq">
        ${content.answers.map((item) => `<dt>${escapeHtml(item.q)}</dt><dd>${escapeHtml(item.a)}</dd>`).join('')}
      </dl>
    </section>

    <section id="faq" itemscope itemtype="https://schema.org/FAQPage">
      <h2>${escapeHtml(content.faqTitle)}</h2>
      <dl class="faq">
        ${content.faq.map((item) => `
          <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
            <dt itemprop="name">${escapeHtml(item.q)}</dt>
            <dd itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
              <span itemprop="text">${escapeHtml(item.a)}</span>
            </dd>
          </div>
        `).join('')}
      </dl>
    </section>

    <footer>
      <p><a href="${baseUrl}/">lnkmx.my</a> - Micro-Business OS</p>
      <p><small>${lang === 'ru' ? 'Платформа для микро-бизнеса' : lang === 'kk' ? 'Микро-бизнес платформасы' : 'Platform for micro-business'}</small></p>
    </footer>
  </main>
</body>
</html>`;
}

// ============ GALLERY HTML ============

export function buildGalleryHtml(lang: LanguageKey, baseUrl: string, items: GalleryItem[], niche?: string | null): string {
  const content = GALLERY_CONTENT[lang] || GALLERY_CONTENT.ru;
  const locale = getOgLocale(lang);
  const querySuffix = niche ? `?niche=${encodeURIComponent(niche)}` : '';
  const canonicalUrl = `${baseUrl}/gallery${querySuffix}`;
  const hreflangLinks = buildHreflangLinks(baseUrl, `/gallery${querySuffix}`, ['ru', 'en', 'kk']);

  const nicheLabel = niche || 'all';
  const title = niche ? `${content.title} - ${nicheLabel}` : content.title;

  const itemList = items.slice(0, 20).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${baseUrl}/${item.slug}`,
    name: item.title || item.slug,
    image: item.avatar_url || DEFAULT_OG_IMAGE,
  }));

  // Combined ItemList with CollectionPage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        name: title,
        description: content.description,
        url: canonicalUrl,
        inLanguage: lang,
        isPartOf: { '@id': `${baseUrl}/#website` },
        mainEntity: { '@id': `${canonicalUrl}#itemlist` },
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#itemlist`,
        itemListElement: itemList,
        numberOfItems: items.length,
        name: content.topProfilesTitle,
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(content.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  ${hreflangLinks}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(content.description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}">
  <meta property="og:locale" content="${locale}">
  <meta property="og:site_name" content="lnkmx">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(content.description)}">
  <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">
  <meta name="ai-summary" content="${escapeHtml(content.answerBlock)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; color: #111; background: #fff; line-height: 1.6; }
    main { max-width: 960px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { margin-top: 2rem; font-size: 1.3rem; }
    ul { padding-left: 1.2rem; }
    .answer-block { background: #f8f9fa; border-left: 4px solid #0f62fe; padding: 16px; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
    .key-facts { display: flex; flex-wrap: wrap; gap: 8px; margin: 1rem 0; }
    .key-fact { background: #e8f0fe; padding: 8px 12px; border-radius: 20px; font-size: 0.9rem; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); margin-top: 1.5rem; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; }
    .card h3 { margin: 0 0 8px; font-size: 1.1rem; }
    .card p { margin: 0; color: #666; font-size: 0.9rem; }
    .card a { color: #0f62fe; text-decoration: none; font-weight: 600; }
    .card a:hover { text-decoration: underline; }
    .card img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; margin-bottom: 8px; }
    .niche-tag { display: inline-block; background: #f0f4f8; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; color: #555; margin-top: 8px; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #eee; text-align: center; color: #666; }
  </style>
</head>
<body>
  <main>
      <h1>${escapeHtml(content.h1)}${niche ? ` - ${escapeHtml(nicheLabel)}` : ''}</h1>
      <p>${escapeHtml(content.subtitle)}</p>
    </header>

    <!-- Answer Block -->
    <section class="answer-block" aria-label="Summary">
      <p><strong>${lang === 'ru' ? 'Кратко' : lang === 'kk' ? 'Қысқаша' : 'Summary'}:</strong> ${escapeHtml(content.answerBlock)}</p>
    </section>

    <!-- Key Facts -->
    <section aria-label="${content.keyFactsTitle}">
      <h2>${escapeHtml(content.keyFactsTitle)}</h2>
      <div class="key-facts">
        ${content.keyFacts.map((fact) => `<span class="key-fact">✓ ${escapeHtml(fact)}</span>`).join('')}
      </div>
    </section>

    <section>
      <h2>${escapeHtml(content.highlightsTitle)}</h2>
      <ul>${content.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>

    <section>
      <h2>${escapeHtml(content.locationTitle)}</h2>
      <p>${escapeHtml(content.locationBody)}</p>
    </section>

    <section aria-label="${content.topProfilesTitle}">
      <h2>${escapeHtml(content.topProfilesTitle)}</h2>
      <div class="grid">
        ${items.slice(0, 20).map((item) => `
          <article class="card" itemscope itemtype="https://schema.org/Person">
            ${item.avatar_url ? `<img src="${escapeHtml(item.avatar_url)}" alt="${escapeHtml(item.title || item.slug)}" loading="lazy" itemprop="image">` : ''}
            <h3 itemprop="name"><a href="${baseUrl}/${escapeHtml(item.slug)}" itemprop="url">${escapeHtml(item.title || '@' + item.slug)}</a></h3>
            <p itemprop="description">${escapeHtml(truncate(item.description || '', 100))}</p>
            ${item.niche ? `<span class="niche-tag">${escapeHtml(item.niche)}</span>` : ''}
          </article>
        `).join('')}
      </div>
    </section>

    <footer>
      <p><a href="${baseUrl}/">lnkmx.my</a></p>
    </footer>
  </main>
</body>
</html>`;
}

export { LANDING_CONTENT, GALLERY_CONTENT };
