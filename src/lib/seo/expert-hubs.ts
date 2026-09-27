/**
 * Expert directory SEO hubs: niches x cities.
 * Curated list only, so every indexable hub has unique copy (no thin doorway pages).
 */
export type HubLang = 'ru' | 'en' | 'kk';
type L10n = Record<HubLang, string>;

export interface HubNiche {
  slug: string;
  label: L10n;
  /** Plural "who" form used in titles: "Бьюти-мастера" */
  who: L10n;
  /** Genitive-ish phrase for "страница для ..." */
  intro: { ru: string; en: string };
  services: { ru: string[]; en: string[] };
  /** Part of city hubs grid */
  hub: boolean;
}

export interface HubCity {
  slug: string;
  name: L10n;
  /** "в Алматы" */
  inCity: { ru: string; en: string; kk: string };
  aliases: string[];
  country: 'KZ' | 'UZ' | 'RU';
  note: { ru: string; en: string };
}

export const HUB_NICHES: HubNiche[] = [
  {
    slug: 'beauty', hub: true,
    label: { ru: 'Красота', en: 'Beauty', kk: 'Сұлулық' },
    who: { ru: 'Бьюти-мастера', en: 'Beauty specialists', kk: 'Сұлулық шеберлері' },
    intro: {
      ru: 'Мастера маникюра, бровисты, визажисты и парикмахеры показывают работы, прайс и принимают запись прямо в WhatsApp или Telegram.',
      en: 'Nail artists, brow masters, make-up artists and hairdressers show their work, prices and take bookings in WhatsApp or Telegram.',
    },
    services: { ru: ['маникюр', 'брови и ресницы', 'макияж', 'стрижки и окрашивание'], en: ['nails', 'brows and lashes', 'make-up', 'hair'] },
  },
  {
    slug: 'education', hub: true,
    label: { ru: 'Образование', en: 'Education', kk: 'Білім' },
    who: { ru: 'Репетиторы и преподаватели', en: 'Tutors and teachers', kk: 'Репетиторлар' },
    intro: {
      ru: 'Репетиторы по математике, английскому и подготовке к ЕНТ и IELTS: формат занятий, стоимость урока и быстрая запись на пробное.',
      en: 'Math, English, UNT and IELTS tutors: lesson format, price and a quick trial lesson booking.',
    },
    services: { ru: ['подготовка к ЕНТ', 'английский и IELTS', 'математика', 'онлайн-уроки'], en: ['UNT prep', 'English and IELTS', 'math', 'online lessons'] },
  },
  {
    slug: 'fitness', hub: true,
    label: { ru: 'Фитнес', en: 'Fitness', kk: 'Фитнес' },
    who: { ru: 'Фитнес-тренеры', en: 'Fitness coaches', kk: 'Фитнес-жаттықтырушылар' },
    intro: {
      ru: 'Персональные тренеры и инструкторы йоги: программы, результаты клиентов и запись на тренировку в пару касаний.',
      en: 'Personal trainers and yoga instructors: programs, client results and booking a session in a couple of taps.',
    },
    services: { ru: ['персональные тренировки', 'йога', 'онлайн-программы', 'питание'], en: ['personal training', 'yoga', 'online programs', 'nutrition'] },
  },
  {
    slug: 'photo', hub: true,
    label: { ru: 'Фотография', en: 'Photography', kk: 'Фотография' },
    who: { ru: 'Фотографы', en: 'Photographers', kk: 'Фотографтар' },
    intro: {
      ru: 'Свадебные, семейные и контент-фотографы: портфолио, пакеты съёмки и свободные даты без переписки в директе.',
      en: 'Wedding, family and content photographers: portfolio, shoot packages and free dates without DM ping-pong.',
    },
    services: { ru: ['свадебная съёмка', 'семейная фотосессия', 'контент для брендов', 'love story'], en: ['weddings', 'family shoots', 'brand content', 'love story'] },
  },
  {
    slug: 'coaching', hub: true,
    label: { ru: 'Коучинг', en: 'Coaching', kk: 'Коучинг' },
    who: { ru: 'Коучи и психологи', en: 'Coaches and psychologists', kk: 'Коучтар' },
    intro: {
      ru: 'Коучи, психологи и наставники: подход, отзывы клиентов и запись на первую консультацию.',
      en: 'Coaches, psychologists and mentors: approach, client reviews and booking a first session.',
    },
    services: { ru: ['личные консультации', 'карьерный коучинг', 'психотерапия', 'групповые программы'], en: ['1:1 sessions', 'career coaching', 'therapy', 'group programs'] },
  },
  {
    slug: 'business', hub: true,
    label: { ru: 'Бизнес', en: 'Business', kk: 'Бизнес' },
    who: { ru: 'Малый бизнес и услуги', en: 'Small businesses', kk: 'Шағын бизнес' },
    intro: {
      ru: 'Студии, мастерские и локальные компании: каталог услуг, адрес, часы работы и заявки сразу в мессенджер.',
      en: 'Studios, workshops and local companies: service catalog, address, hours and leads straight to a messenger.',
    },
    services: { ru: ['услуги на выезд', 'студии', 'ремонт', 'доставка'], en: ['on-site services', 'studios', 'repair', 'delivery'] },
  },
  { slug: 'consulting', hub: false, label: { ru: 'Консалтинг', en: 'Consulting', kk: 'Кеңес беру' }, who: { ru: 'Консультанты', en: 'Consultants', kk: 'Кеңесшілер' }, intro: { ru: 'Консультанты и эксперты с понятным описанием услуг.', en: 'Consultants with clear service descriptions.' }, services: { ru: [], en: [] } },
  { slug: 'design', hub: false, label: { ru: 'Дизайн', en: 'Design', kk: 'Дизайн' }, who: { ru: 'Дизайнеры', en: 'Designers', kk: 'Дизайнерлер' }, intro: { ru: 'Дизайнеры с портфолио и прайсом.', en: 'Designers with portfolio and prices.' }, services: { ru: [], en: [] } },
  { slug: 'health', hub: false, label: { ru: 'Здоровье', en: 'Health', kk: 'Денсаулық' }, who: { ru: 'Специалисты по здоровью', en: 'Health specialists', kk: 'Денсаулық мамандары' }, intro: { ru: 'Врачи, массажисты и нутрициологи.', en: 'Doctors, massage therapists and nutritionists.' }, services: { ru: [], en: [] } },
  { slug: 'marketing', hub: false, label: { ru: 'Маркетинг', en: 'Marketing', kk: 'Маркетинг' }, who: { ru: 'Маркетологи и SMM', en: 'Marketers', kk: 'Маркетологтар' }, intro: { ru: 'Маркетологи, таргетологи и SMM-специалисты.', en: 'Marketers, ads and SMM specialists.' }, services: { ru: [], en: [] } },
  { slug: 'music', hub: false, label: { ru: 'Музыка', en: 'Music', kk: 'Музыка' }, who: { ru: 'Музыканты', en: 'Musicians', kk: 'Музыканттар' }, intro: { ru: 'Музыканты, диджеи и преподаватели музыки.', en: 'Musicians, DJs and music teachers.' }, services: { ru: [], en: [] } },
  { slug: 'tech', hub: false, label: { ru: 'Технологии', en: 'Technology', kk: 'Технология' }, who: { ru: 'IT-специалисты', en: 'Tech specialists', kk: 'IT мамандары' }, intro: { ru: 'Разработчики и IT-фрилансеры.', en: 'Developers and IT freelancers.' }, services: { ru: [], en: [] } },
  { slug: 'realty', hub: false, label: { ru: 'Недвижимость', en: 'Real estate', kk: 'Жылжымайтын мүлік' }, who: { ru: 'Риелторы', en: 'Realtors', kk: 'Риелторлар' }, intro: { ru: 'Риелторы и агентства недвижимости.', en: 'Realtors and agencies.' }, services: { ru: [], en: [] } },
  { slug: 'events', hub: false, label: { ru: 'Мероприятия', en: 'Events', kk: 'Іс-шаралар' }, who: { ru: 'Организаторы и ведущие', en: 'Event hosts', kk: 'Ұйымдастырушылар' }, intro: { ru: 'Ведущие, организаторы и декораторы.', en: 'Hosts, organizers and decorators.' }, services: { ru: [], en: [] } },
  { slug: 'food', hub: false, label: { ru: 'Еда', en: 'Food', kk: 'Тағам' }, who: { ru: 'Кондитеры и повара', en: 'Bakers and chefs', kk: 'Аспаздар' }, intro: { ru: 'Кондитеры, повара и домашняя кухня.', en: 'Bakers, chefs and home kitchens.' }, services: { ru: [], en: [] } },
  { slug: 'fashion', hub: false, label: { ru: 'Мода', en: 'Fashion', kk: 'Сән' }, who: { ru: 'Стилисты и бренды одежды', en: 'Stylists and brands', kk: 'Стилистер' }, intro: { ru: 'Стилисты, швеи и локальные бренды.', en: 'Stylists, tailors and local brands.' }, services: { ru: [], en: [] } },
  { slug: 'travel', hub: false, label: { ru: 'Путешествия', en: 'Travel', kk: 'Саяхат' }, who: { ru: 'Гиды и турагенты', en: 'Guides and agents', kk: 'Гидтер' }, intro: { ru: 'Гиды, туры и турагенты.', en: 'Guides, tours and travel agents.' }, services: { ru: [], en: [] } },
  { slug: 'art', hub: false, label: { ru: 'Искусство', en: 'Art', kk: 'Өнер' }, who: { ru: 'Художники', en: 'Artists', kk: 'Суретшілер' }, intro: { ru: 'Художники, мастера хендмейда и иллюстраторы.', en: 'Artists, makers and illustrators.' }, services: { ru: [], en: [] } },
  { slug: 'other', hub: false, label: { ru: 'Другое', en: 'Other', kk: 'Басқа' }, who: { ru: 'Специалисты', en: 'Specialists', kk: 'Мамандар' }, intro: { ru: 'Другие специалисты и проекты.', en: 'Other specialists and projects.' }, services: { ru: [], en: [] } },
];

export const HUB_CITIES: HubCity[] = [
  { slug: 'almaty', country: 'KZ', name: { ru: 'Алматы', en: 'Almaty', kk: 'Алматы' }, inCity: { ru: 'в Алматы', en: 'in Almaty', kk: 'Алматыда' }, aliases: ['Алматы', 'Almaty', 'Алма-Ата'], note: { ru: 'Самый большой рынок частных услуг в Казахстане: клиенты ищут мастера рядом с домом и пишут сразу в WhatsApp.', en: 'The largest private services market in Kazakhstan: clients look for someone nearby and message on WhatsApp right away.' } },
  { slug: 'astana', country: 'KZ', name: { ru: 'Астана', en: 'Astana', kk: 'Астана' }, inCity: { ru: 'в Астане', en: 'in Astana', kk: 'Астанада' }, aliases: ['Астана', 'Astana', 'Нур-Султан'], note: { ru: 'Столица с быстрорастущим спросом на услуги: удобная страница с ценами экономит время и вам, и клиенту.', en: 'A fast-growing capital: a clear page with prices saves time for you and your clients.' } },
  { slug: 'shymkent', country: 'KZ', name: { ru: 'Шымкент', en: 'Shymkent', kk: 'Шымкент' }, inCity: { ru: 'в Шымкенте', en: 'in Shymkent', kk: 'Шымкентте' }, aliases: ['Шымкент', 'Shymkent'], note: { ru: 'Третий по размеру город страны, где большая часть записей идёт через WhatsApp и Instagram.', en: 'The third largest city, where most bookings come through WhatsApp and Instagram.' } },
  { slug: 'karaganda', country: 'KZ', name: { ru: 'Караганда', en: 'Karaganda', kk: 'Қарағанды' }, inCity: { ru: 'в Караганде', en: 'in Karaganda', kk: 'Қарағандыда' }, aliases: ['Караганда', 'Karaganda', 'Қарағанды'], note: { ru: 'Клиенты доверяют специалистам с отзывами и понятным прайсом, а не только аккаунту в соцсетях.', en: 'Clients trust specialists with reviews and clear prices, not just a social profile.' } },
  { slug: 'kostanay', country: 'KZ', name: { ru: 'Костанай', en: 'Kostanay', kk: 'Қостанай' }, inCity: { ru: 'в Костанае', en: 'in Kostanay', kk: 'Қостанайда' }, aliases: ['Костанай', 'Kostanay', 'Қостанай'], note: { ru: 'Сарафанное радио работает лучше рекламы: одна ссылка на страницу легко пересылается знакомым.', en: 'Word of mouth beats ads here: one link to your page is easy to forward.' } },
  { slug: 'tashkent', country: 'UZ', name: { ru: 'Ташкент', en: 'Tashkent', kk: 'Ташкент' }, inCity: { ru: 'в Ташкенте', en: 'in Tashkent', kk: 'Ташкентте' }, aliases: ['Ташкент', 'Tashkent', 'Toshkent'], note: { ru: 'Крупнейший город региона, где заявки чаще всего приходят в Telegram.', en: 'The largest city in the region, where leads mostly arrive in Telegram.' } },
];

export const findHubNiche = (slug?: string) => HUB_NICHES.find((n) => n.slug === slug);
export const findHubCity = (slug?: string) => HUB_CITIES.find((c) => c.slug === slug);
export const HUB_NICHES_INDEXED = HUB_NICHES.filter((n) => n.hub);

export const pickLang = (lang: string): HubLang => (lang === 'en' ? 'en' : lang === 'kk' ? 'kk' : 'ru');
const textLang = (lang: HubLang): 'ru' | 'en' => (lang === 'en' ? 'en' : 'ru');

export interface HubMeta {
  title: string;
  h1: string;
  description: string;
  intro: string;
  path: string;
}

export function buildHubMeta(lang: HubLang, niche?: HubNiche, city?: HubCity): HubMeta {
  const tl = textLang(lang);
  const en = tl === 'en';
  if (niche && city) {
    const who = niche.who[lang];
    return {
      path: `/experts/${niche.slug}/${city.slug}`,
      h1: `${who} ${city.inCity[lang]}`,
      title: en
        ? `${who} ${city.inCity.en}: prices, reviews, booking | LinkMAX`
        : `${who} ${city.inCity.ru}: цены, отзывы, запись | LinkMAX`,
      description: en
        ? `${who} ${city.inCity.en} with pages on LinkMAX: services, prices, reviews and booking in WhatsApp or Telegram.`
        : `${who} ${city.inCity.ru} на LinkMAX: ${niche.services.ru.slice(0, 3).join(', ')}. Цены, отзывы и запись в WhatsApp или Telegram.`,
      intro: `${niche.intro[tl]} ${city.note[tl]}`,
    };
  }
  if (city) {
    return {
      path: `/experts/city/${city.slug}`,
      h1: en ? `Specialists ${city.inCity.en}` : `Специалисты ${city.inCity[lang]}`,
      title: en
        ? `Specialists and services ${city.inCity.en} | LinkMAX catalog`
        : `Специалисты и услуги ${city.inCity.ru}: каталог страниц | LinkMAX`,
      description: en
        ? `Find beauty masters, tutors, coaches and photographers ${city.inCity.en}. Pages with prices, reviews and messenger booking.`
        : `Мастера красоты, репетиторы, тренеры, фотографы ${city.inCity.ru}. Страницы с ценами, отзывами и записью в мессенджер.`,
      intro: city.note[tl],
    };
  }
  if (niche) {
    return {
      path: `/experts/${niche.slug}`,
      h1: en ? `${niche.who.en} on LinkMAX` : `${niche.who[lang]} на LinkMAX`,
      title: en
        ? `${niche.who.en}: pages with prices and booking | LinkMAX`
        : `${niche.who.ru}: страницы с ценами и записью | LinkMAX`,
      description: en
        ? `${niche.intro.en}`
        : `${niche.intro.ru}`,
      intro: niche.intro[tl],
    };
  }
  return {
    path: '/experts',
    h1: en ? 'Find a specialist' : 'Каталог специалистов',
    title: en
      ? 'Specialists catalog: beauty, tutors, coaches, photographers | LinkMAX'
      : 'Каталог специалистов: мастера, репетиторы, тренеры, фотографы | LinkMAX',
    description: en
      ? 'Pages of specialists and small businesses in Kazakhstan and Central Asia with prices, reviews and booking in WhatsApp or Telegram.'
      : 'Страницы специалистов и малого бизнеса Казахстана и Узбекистана: цены, отзывы и запись в WhatsApp или Telegram.',
    intro: en
      ? 'Browse by city or niche. Every card opens a real specialist page.'
      : 'Выбирайте по городу или направлению. Каждая карточка ведёт на живую страницу специалиста.',
  };
}

/** All hub paths for sitemap generation */
export function allHubPaths(): string[] {
  const out = HUB_NICHES_INDEXED.map((n) => `/experts/${n.slug}`);
  for (const c of HUB_CITIES) {
    out.push(`/experts/city/${c.slug}`);
    for (const n of HUB_NICHES_INDEXED) out.push(`/experts/${n.slug}/${c.slug}`);
  }
  return out;
}
