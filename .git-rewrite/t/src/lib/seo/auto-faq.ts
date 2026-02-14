/**
 * Auto-FAQ Generator for AEO/GEO
 * 
 * Generates relevant FAQ questions based on profile niche and services.
 * Questions are designed to match common AI search queries.
 */

import type { Block, PricingBlock, BookingBlock } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';

export interface AutoFAQItem {
  question: string;
  answer: string;
}

interface FAQTemplates {
  howMuch: { q: string; a: string };
  howLong: { q: string; a: string };
  howWorks: { q: string; a: string };
  whoSuitable: { q: string; a: string };
  whatResults: { q: string; a: string };
  howToBook: { q: string; a: string };
  whereLocated: { q: string; a: string };
  whatIncluded: { q: string; a: string };
  paymentMethods: { q: string; a: string };
  cancellation: { q: string; a: string };
}

const FAQ_TEMPLATES: Record<'ru' | 'en' | 'kk', FAQTemplates> = {
  ru: {
    howMuch: {
      q: 'Сколько стоят услуги {name}?',
      a: '{name} предлагает услуги от {minPrice} {currency}. Полный список услуг и цен доступен на странице.',
    },
    howLong: {
      q: 'Сколько времени занимает консультация/сессия?',
      a: 'Продолжительность сессии зависит от выбранной услуги. Обычно от 30 минут до 2 часов. Точное время указано в описании каждой услуги.',
    },
    howWorks: {
      q: 'Как проходит работа с {name}?',
      a: 'Работа включает несколько этапов: первичная консультация, определение задач, работа над достижением целей, получение результата. Запишитесь для первой встречи.',
    },
    whoSuitable: {
      q: 'Кому подходят услуги {name}?',
      a: 'Услуги {name} подходят тем, кто ищет {services}. Свяжитесь для уточнения, подходит ли это именно вам.',
    },
    whatResults: {
      q: 'Какие результаты можно ожидать?',
      a: 'Результаты зависят от ваших целей и вовлеченности. {name} поможет достичь конкретных результатов в {niche}.',
    },
    howToBook: {
      q: 'Как записаться к {name}?',
      a: 'Записаться можно прямо на этой странице через форму онлайн-записи или связавшись через мессенджер.',
    },
    whereLocated: {
      q: 'Где находится {name}?',
      a: '{name} работает {location}. Возможен как онлайн-формат, так и личные встречи.',
    },
    whatIncluded: {
      q: 'Что входит в стоимость услуг?',
      a: 'В стоимость входит полный комплекс услуг согласно описанию. Дополнительные услуги обсуждаются отдельно.',
    },
    paymentMethods: {
      q: 'Какие способы оплаты доступны?',
      a: 'Доступны различные способы оплаты: Kaspi, банковский перевод, наличные. Уточняйте при записи.',
    },
    cancellation: {
      q: 'Какие условия отмены записи?',
      a: 'Отмена или перенос записи возможны за 24 часа до назначенного времени. Свяжитесь заранее для изменения записи.',
    },
  },
  en: {
    howMuch: {
      q: 'How much do {name}\'s services cost?',
      a: '{name} offers services starting from {minPrice} {currency}. Full service list and pricing available on this page.',
    },
    howLong: {
      q: 'How long does a consultation/session take?',
      a: 'Session duration depends on the service selected. Usually 30 minutes to 2 hours. Exact time is specified in each service description.',
    },
    howWorks: {
      q: 'How does working with {name} work?',
      a: 'The process includes several stages: initial consultation, defining goals, working towards objectives, achieving results. Book your first meeting.',
    },
    whoSuitable: {
      q: 'Who are {name}\'s services suitable for?',
      a: '{name}\'s services are suitable for those looking for {services}. Contact to clarify if this is right for you.',
    },
    whatResults: {
      q: 'What results can be expected?',
      a: 'Results depend on your goals and commitment. {name} will help achieve specific results in {niche}.',
    },
    howToBook: {
      q: 'How to book with {name}?',
      a: 'You can book directly on this page through the online booking form or by contacting via messenger.',
    },
    whereLocated: {
      q: 'Where is {name} located?',
      a: '{name} works {location}. Both online and in-person formats are available.',
    },
    whatIncluded: {
      q: 'What is included in the service price?',
      a: 'The price includes the full service package as described. Additional services are discussed separately.',
    },
    paymentMethods: {
      q: 'What payment methods are available?',
      a: 'Various payment methods available: Kaspi, bank transfer, cash. Clarify when booking.',
    },
    cancellation: {
      q: 'What are the cancellation terms?',
      a: 'Cancellation or rescheduling is possible 24 hours before the scheduled time. Contact in advance to change your booking.',
    },
  },
  kk: {
    howMuch: {
      q: '{name} қызметтерінің құны қанша?',
      a: '{name} қызметтері {minPrice} {currency} бастап ұсынылады. Толық тізім мен бағалар осы бетте қолжетімді.',
    },
    howLong: {
      q: 'Кеңес/сессия қанша уақыт алады?',
      a: 'Сессияның ұзақтығы таңдалған қызметке байланысты. Әдетте 30 минуттан 2 сағатқа дейін.',
    },
    howWorks: {
      q: '{name} қалай жұмыс істейді?',
      a: 'Жұмыс бірнеше кезеңнен тұрады: алғашқы кеңес, мақсаттарды анықтау, нәтижеге жету. Алғашқы кездесуге жазылыңыз.',
    },
    whoSuitable: {
      q: '{name} қызметтері кімге қолайлы?',
      a: '{name} қызметтері {services} іздейтіндерге қолайлы. Сізге сәйкес келетінін нақтылау үшін хабарласыңыз.',
    },
    whatResults: {
      q: 'Қандай нәтижелер күтуге болады?',
      a: 'Нәтижелер сіздің мақсаттарыңыз бен қатысуыңызға байланысты. {name} {niche} саласында нақты нәтижелерге жетуге көмектеседі.',
    },
    howToBook: {
      q: '{name}-ға қалай жазылуға болады?',
      a: 'Осы беттегі онлайн жазылу формасы арқылы немесе мессенджер арқылы хабарласып жазылуға болады.',
    },
    whereLocated: {
      q: '{name} қайда орналасқан?',
      a: '{name} {location} жұмыс істейді. Онлайн және жеке кездесу форматтары қолжетімді.',
    },
    whatIncluded: {
      q: 'Қызмет құнына не кіреді?',
      a: 'Құнға сипаттама бойынша толық қызмет пакеті кіреді. Қосымша қызметтер бөлек талқыланады.',
    },
    paymentMethods: {
      q: 'Қандай төлем әдістері қолжетімді?',
      a: 'Әртүрлі төлем әдістері қолжетімді: Kaspi, банктік аударым, қолма-қол ақша.',
    },
    cancellation: {
      q: 'Жазылуды бас тарту шарттары қандай?',
      a: 'Жоспарланған уақыттан 24 сағат бұрын бас тарту немесе қайта жоспарлау мүмкін.',
    },
  },
};

interface AutoFAQContext {
  name: string;
  niche?: string;
  location?: string;
  services: string[];
  minPrice?: number;
  currency?: string;
  hasBooking: boolean;
}

/**
 * Generate auto FAQ based on profile context
 */
export function generateAutoFAQ(
  context: AutoFAQContext,
  language: 'ru' | 'en' | 'kk' = 'ru',
  maxItems: number = 5
): AutoFAQItem[] {
  const templates = FAQ_TEMPLATES[language];
  const faqs: AutoFAQItem[] = [];
  
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/\{name\}/g, context.name || 'специалист')
      .replace(/\{niche\}/g, context.niche || 'своей сфере')
      .replace(/\{location\}/g, context.location || 'онлайн')
      .replace(/\{services\}/g, context.services.slice(0, 2).join(', ') || 'профессиональные услуги')
      .replace(/\{minPrice\}/g, String(context.minPrice || ''))
      .replace(/\{currency\}/g, context.currency || 'KZT');
  };
  
  // Priority 1: Pricing question (if has pricing)
  if (context.minPrice) {
    faqs.push({
      question: replacePlaceholders(templates.howMuch.q),
      answer: replacePlaceholders(templates.howMuch.a),
    });
  }
  
  // Priority 2: How to book (if has booking)
  if (context.hasBooking) {
    faqs.push({
      question: replacePlaceholders(templates.howToBook.q),
      answer: replacePlaceholders(templates.howToBook.a),
    });
  }
  
  // Priority 3: How it works
  faqs.push({
    question: replacePlaceholders(templates.howWorks.q),
    answer: replacePlaceholders(templates.howWorks.a),
  });
  
  // Priority 4: Who is suitable
  if (context.services.length > 0) {
    faqs.push({
      question: replacePlaceholders(templates.whoSuitable.q),
      answer: replacePlaceholders(templates.whoSuitable.a),
    });
  }
  
  // Priority 5: Results
  faqs.push({
    question: replacePlaceholders(templates.whatResults.q),
    answer: replacePlaceholders(templates.whatResults.a),
  });
  
  // Priority 6: Payment methods (if has pricing)
  if (context.minPrice) {
    faqs.push({
      question: replacePlaceholders(templates.paymentMethods.q),
      answer: replacePlaceholders(templates.paymentMethods.a),
    });
  }
  
  // Priority 7: Cancellation (if has booking)
  if (context.hasBooking) {
    faqs.push({
      question: replacePlaceholders(templates.cancellation.q),
      answer: replacePlaceholders(templates.cancellation.a),
    });
  }
  
  return faqs.slice(0, maxItems);
}

/**
 * Extract FAQ context from blocks
 */
export function extractFAQContext(
  blocks: Block[],
  name: string | undefined,
  niche: string | undefined,
  location: string | undefined,
  language: 'ru' | 'en' | 'kk'
): AutoFAQContext {
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  const hasBooking = blocks.some(b => b.type === 'booking');
  
  // Extract services
  const services: string[] = [];
  if (pricingBlock?.items) {
    for (const item of pricingBlock.items.slice(0, 3)) {
      const serviceName = getI18nText(item.name, language);
      if (serviceName) services.push(serviceName);
    }
  }
  
  // Find minimum price
  let minPrice: number | undefined;
  let currency: string | undefined;
  if (pricingBlock?.items) {
    const prices = pricingBlock.items
      .map(item => item.price)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    if (prices.length > 0) {
      minPrice = Math.min(...prices);
      currency = pricingBlock.currency || 'KZT';
    }
  }
  
  return {
    name: name || '',
    niche,
    location,
    services,
    minPrice,
    currency,
    hasBooking,
  };
}

/**
 * Check if user already has sufficient FAQ
 */
export function hasUserFAQ(blocks: Block[]): boolean {
  const faqBlock = blocks.find(b => b.type === 'faq') as { items?: unknown[] } | undefined;
  return (faqBlock?.items?.length ?? 0) >= 3;
}
