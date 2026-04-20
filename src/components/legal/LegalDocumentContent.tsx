import type { ReactNode } from 'react';
import { getAppDomain } from '@/lib/utils/url-helpers';

export type LegalDocumentKind = 'terms' | 'privacy' | 'payment';
export type LegalLanguage = 'ru' | 'en' | 'kk';
export type LegalContentVariant = 'page' | 'modal';

export const LEGAL_EFFECTIVE_DATE = '20.04.2026';
export const LEGAL_VERSION = '2.0';

export const COMPANY_DETAILS = {
  name: 'ИП BEEGIN',
  nameEn: 'BEEGIN Individual Entrepreneur',
  nameKk: 'BEEGIN ЖК',
  bin: '971207300019',
  address: 'г. Алматы, ул. Шолохова, д. 20/7',
  addressEn: 'Almaty, Sholokhov Street, 20/7',
  addressKk: 'Алматы қ., Шолохов көшесі, 20/7',
  email: 'admin@LinkMAX.my',
  phone: '+7 705 109 76 64',
};

interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalDocumentCopy {
  title: string;
  meta: string;
  intro?: string[];
  sections: LegalSection[];
}

export function normalizeLegalLanguage(language?: string): LegalLanguage {
  const baseLanguage = language?.split('-')[0]?.toLowerCase();
  if (baseLanguage === 'en' || baseLanguage === 'kk') {
    return baseLanguage;
  }

  return 'ru';
}

export function getLegalSeo(kind: LegalDocumentKind, language?: string) {
  const lang = normalizeLegalLanguage(language);

  const seo = {
    terms: {
      ru: {
        title: 'Пользовательское соглашение - LinkMAX',
        description: 'Условия использования LinkMAX: аккаунт, страницы, CRM, AI, платежи, обязанности пользователей и правила платформы.',
      },
      en: {
        title: 'Terms of Service - LinkMAX',
        description: 'LinkMAX terms covering accounts, pages, CRM, AI, payments, user responsibilities, and platform rules.',
      },
      kk: {
        title: 'Пайдаланушы келісімі - LinkMAX',
        description: 'LinkMAX пайдалану шарттары: аккаунт, беттер, CRM, AI, төлемдер және платформа ережелері.',
      },
    },
    privacy: {
      ru: {
        title: 'Политика конфиденциальности - LinkMAX',
        description: 'Как LinkMAX обрабатывает аккаунтные, клиентские, аналитические, платежные и технические данные.',
      },
      en: {
        title: 'Privacy Policy - LinkMAX',
        description: 'How LinkMAX processes account, client, analytics, payment, and technical data.',
      },
      kk: {
        title: 'Құпиялылық саясаты - LinkMAX',
        description: 'LinkMAX аккаунт, клиент, аналитика, төлем және техникалық деректерді қалай өңдейді.',
      },
    },
    payment: {
      ru: {
        title: 'Условия оплаты - LinkMAX',
        description: 'Условия оплаты тарифов LinkMAX, комиссий, подписок, возвратов и платежных провайдеров.',
      },
      en: {
        title: 'Payment Terms - LinkMAX',
        description: 'Payment terms for LinkMAX plans, fees, subscriptions, refunds, and payment providers.',
      },
      kk: {
        title: 'Төлем шарттары - LinkMAX',
        description: 'LinkMAX тарифтері, комиссиялар, жазылымдар, қайтарулар және төлем провайдерлері шарттары.',
      },
    },
  } satisfies Record<LegalDocumentKind, Record<LegalLanguage, { title: string; description: string }>>;

  return seo[kind][lang];
}

function getCompanyLine(lang: LegalLanguage): string {
  if (lang === 'en') {
    return `${COMPANY_DETAILS.nameEn}, IIN/BIN ${COMPANY_DETAILS.bin}, address: ${COMPANY_DETAILS.addressEn}, email: ${COMPANY_DETAILS.email}, phone: ${COMPANY_DETAILS.phone}.`;
  }

  if (lang === 'kk') {
    return `${COMPANY_DETAILS.nameKk}, БСН/ЖСН ${COMPANY_DETAILS.bin}, мекенжайы: ${COMPANY_DETAILS.addressKk}, email: ${COMPANY_DETAILS.email}, телефон: ${COMPANY_DETAILS.phone}.`;
  }

  return `${COMPANY_DETAILS.name}, БИН/ИИН ${COMPANY_DETAILS.bin}, адрес: ${COMPANY_DETAILS.address}, email: ${COMPANY_DETAILS.email}, телефон: ${COMPANY_DETAILS.phone}.`;
}

function buildPrivacyCopy(lang: LegalLanguage, domain: string): LegalDocumentCopy {
  if (lang === 'en') {
    return {
      title: 'LinkMAX Privacy Policy',
      meta: `Version ${LEGAL_VERSION}. Effective date: ${LEGAL_EFFECTIVE_DATE}.`,
      intro: [
        'This Privacy Policy explains how LinkMAX processes and protects personal data when users, workspace members, and visitors use the platform, public pages, CRM, booking, analytics, payment, AI, Telegram, and integration features.',
      ],
      sections: [
        {
          title: '1. Operator and Scope',
          paragraphs: [
            `The personal data operator for LinkMAX account and platform data is ${getCompanyLine(lang)}`,
            `The current version is available at ${domain}/privacy.`,
            'For account, billing, security, diagnostics, and service communications, LinkMAX acts as an operator/controller. For client data that a user collects through public pages, forms, bookings, CRM, invoices, events, or imports, the user is normally the independent controller/owner of that data, and LinkMAX processes it as a technical platform provider unless mandatory law requires otherwise.',
          ],
        },
        {
          title: '2. Legal Framework',
          paragraphs: [
            'Processing and protection of personal data are carried out under the laws of the Republic of Kazakhstan, including the Law of the Republic of Kazakhstan No. 94-V dated May 21, 2013 "On Personal Data and Their Protection", and other applicable data protection rules where they apply.',
            'If LinkMAX offers services to users in jurisdictions with additional privacy requirements, the relevant mandatory rules apply to the extent required by law.',
          ],
        },
        {
          title: '3. Data We Process',
          bullets: [
            'Account and identity data: name, username, email, phone, language, country or region, authentication identifiers, Telegram ID if connected, workspace and role information.',
            'Business content: public page settings, blocks, links, products, services, files, media, events, booking configuration, AI prompts and generated drafts.',
            'Client and lead data: visitor form submissions, names, contacts, messages, booking details, CRM stages, notes, tasks, invoice or order metadata, event registrations.',
            'Payment and subscription data: plan, billing period, transaction identifiers, payment status, provider metadata, refund status, commission tier. LinkMAX does not intentionally store full card numbers or CVV codes.',
            'Technical, analytics, and security data: IP address, user agent, device and browser data, cookies or similar identifiers, logs, page views, clicks, UTM tags, performance events, crash reports, and fraud prevention signals.',
          ],
        },
        {
          title: '4. Purposes and Grounds',
          bullets: [
            'Creating and securing accounts, workspaces, roles, and sessions.',
            'Providing the page builder, CRM, booking, analytics, payment, AI, Telegram, API, and integration features.',
            'Publishing public pages, processing visitor requests, and routing leads, bookings, events, invoices, notifications, and support messages.',
            'Processing payments, commissions, subscriptions, refunds, chargebacks, tax or accounting records, and payment security checks.',
            'Improving quality, debugging errors, preventing abuse, enforcing platform rules, and complying with legal duties.',
          ],
        },
        {
          title: '5. Client Data and User Duties',
          paragraphs: [
            'Users must have a lawful basis and required consent to collect and process client, lead, visitor, booking, payment, and marketing data through LinkMAX. Users are responsible for the content of their public pages, the legality of their offers, and communications with their own customers.',
            'Users must not upload or collect third-party personal data unless they are legally allowed to do so. Users should not place sensitive data into AI prompts, CRM notes, or public pages unless they have a valid reason and adequate safeguards.',
          ],
        },
        {
          title: '6. Cookies, Analytics, and Pixels',
          paragraphs: [
            'LinkMAX uses cookies and similar technologies for authentication, security, preferences, analytics, attribution, product telemetry, and platform performance.',
            'When a user enables marketing pixels or integrations, selected event data may be sent to the connected provider according to the user configuration and the provider terms. Public page visitors may restrict cookies in browser settings, but some functions may work less reliably.',
          ],
        },
        {
          title: '7. AI and Integrations',
          paragraphs: [
            'AI features may send prompts, page context, selected business information, and generated drafts to AI infrastructure used to provide content generation, translation, or related features.',
            'Connected integrations may include Supabase, Cloudflare, payment providers, Telegram, Google or Apple sign-in, Google Calendar, email delivery, analytics, monitoring, and other providers required for the selected feature. Their own terms and privacy policies may also apply.',
          ],
        },
        {
          title: '8. Data Transfers',
          paragraphs: [
            'Data may be processed by infrastructure, analytics, support, email, payment, AI, and integration providers inside or outside Kazakhstan where necessary to provide the platform. LinkMAX limits transfers to data reasonably needed for the feature, security, support, or legal purpose.',
            'LinkMAX does not sell users personal data. Data may be disclosed to authorities, courts, payment providers, or security partners where required by law, fraud prevention, dispute handling, or platform protection.',
          ],
        },
        {
          title: '9. Storage, Export, and Deletion',
          paragraphs: [
            'Data is stored while the account or workspace exists, while needed to provide services, and during periods required for legal, accounting, security, backup, dispute, or fraud prevention purposes.',
            'Users may request data export, correction, account deletion, or workspace data deletion through the available interface or by contacting support. Some logs, backups, transaction records, and legally required records may be retained for a limited period even after deletion from the active interface.',
          ],
        },
        {
          title: '10. Security',
          paragraphs: [
            'LinkMAX applies organizational and technical measures such as HTTPS, Supabase row-level security, role-based access, workspace isolation, access controls, backups, monitoring, and audit logging where appropriate.',
            'No online service can guarantee absolute security. Users must protect their credentials, devices, API keys, integrations, Telegram accounts, and workspace member access.',
          ],
        },
        {
          title: '11. Data Subject Rights',
          paragraphs: [
            'Data subjects may request information about processing, including confirmation of processing, purposes, sources, methods, the list of processed data, storage periods, recipients where applicable, correction, blocking, deletion, and withdrawal of consent where allowed by law.',
            `Requests can be sent to ${COMPANY_DETAILS.email}. LinkMAX may need to verify the requester identity and may redirect requests about client or lead data to the relevant page owner where that owner controls the data.`,
          ],
        },
        {
          title: '12. Changes',
          paragraphs: [
            `LinkMAX may update this Policy. The updated version becomes effective upon publication at ${domain}/privacy unless another effective date is stated.`,
          ],
        },
      ],
    };
  }

  if (lang === 'kk') {
    return {
      title: 'LinkMAX құпиялылық саясаты',
      meta: `${LEGAL_VERSION} нұсқа. Күшіне ену күні: ${LEGAL_EFFECTIVE_DATE}.`,
      intro: [
        'Осы Саясат LinkMAX платформасын, жария беттерді, CRM, онлайн жазылуды, аналитиканы, төлемдерді, AI, Telegram және интеграцияларды пайдалану кезінде дербес деректердің қалай өңделетінін және қорғалатынын түсіндіреді.',
      ],
      sections: [
        {
          title: '1. Оператор және қолданылу аясы',
          paragraphs: [
            `LinkMAX аккаунт және платформа деректері бойынша дербес деректер операторы: ${getCompanyLine(lang)}`,
            `Ағымдағы нұсқа ${domain}/privacy мекенжайында қолжетімді.`,
            'Аккаунт, төлем, қауіпсіздік, диагностика және сервистік хабарламалар үшін LinkMAX оператор ретінде әрекет етеді. Пайдаланушы жария беттер, нысандар, жазылулар, CRM, шоттар, оқиғалар немесе импорт арқылы жинайтын клиент деректері бойынша әдетте пайдаланушы деректердің дербес бақылаушысы/иесі болып табылады, ал LinkMAX техникалық платформа ретінде өңдейді.',
          ],
        },
        {
          title: '2. Құқықтық негіз',
          paragraphs: [
            'Дербес деректерді өңдеу және қорғау Қазақстан Республикасының заңнамасына, соның ішінде 2013 жылғы 21 мамырдағы № 94-V «Дербес деректер және оларды қорғау туралы» Заңына сәйкес жүзеге асырылады.',
            'Егер LinkMAX қосымша құпиялылық талаптары бар юрисдикцияларда қызмет ұсынса, міндетті нормалар заң талап еткен көлемде қолданылады.',
          ],
        },
        {
          title: '3. Қандай деректер өңделеді',
          bullets: [
            'Аккаунт және сәйкестендіру деректері: аты, username, email, телефон, тіл, ел немесе аймақ, аутентификация идентификаторлары, қосылған болса Telegram ID, workspace және рөлдер.',
            'Бизнес контенті: жария бет параметрлері, блоктар, сілтемелер, өнімдер, қызметтер, файлдар, медиа, оқиғалар, жазылу баптаулары, AI сұраулары және жасалған жобалар.',
            'Клиент және лид деректері: нысан жауаптары, аты-жөні, байланыс деректері, хабарламалар, жазылу мәліметтері, CRM кезеңдері, жазбалар, тапсырмалар, шот немесе тапсырыс метадеректері, оқиға тіркеулері.',
            'Төлем және жазылым деректері: тариф, төлем кезеңі, транзакция идентификаторлары, төлем мәртебесі, провайдер метадеректері, қайтару мәртебесі және комиссия деңгейі. LinkMAX толық карта нөмірін немесе CVV кодын әдейі сақтамайды.',
            'Техникалық, аналитикалық және қауіпсіздік деректері: IP мекенжай, user agent, құрылғы және браузер деректері, cookies, логтар, қаралымдар, кликтер, UTM белгілері, өнім телеметриясы, қате есептері және алаяқтықтың алдын алу сигналдары.',
          ],
        },
        {
          title: '4. Мақсаттар мен негіздер',
          bullets: [
            'Аккаунттарды, workspace-терді, рөлдерді және сессияларды құру және қорғау.',
            'Бет конструкторы, CRM, жазылу, аналитика, төлем, AI, Telegram, API және интеграция функцияларын ұсыну.',
            'Жария беттерді шығару, өтінімдерді өңдеу, лидтерді, жазылуларды, оқиғаларды, шоттарды, хабарламаларды және қолдау сұрауларын бағыттау.',
            'Төлемдерді, комиссияларды, жазылымдарды, қайтаруларды, chargeback-терді, салық/есеп құжаттарын және төлем қауіпсіздігін өңдеу.',
            'Сапаны жақсарту, қателерді түзету, теріс пайдалануды болдырмау, платформа ережелерін орындау және заң талаптарын сақтау.',
          ],
        },
        {
          title: '5. Клиент деректері және пайдаланушы міндеттері',
          paragraphs: [
            'Пайдаланушы LinkMAX арқылы клиент, лид, келуші, жазылу, төлем және маркетинг деректерін жинау үшін заңды негізге және қажет келісімдерге ие болуы тиіс. Пайдаланушы өзінің жария беттерінің мазмұнына, ұсыныстарының заңдылығына және өз клиенттерімен қатынасына жауапты.',
            'Пайдаланушы заңды құқығы болмаса, үшінші тұлғалардың дербес деректерін жүктемеуі немесе жинамауы керек. Құпия деректерді AI сұрауларына, CRM жазбаларына немесе жария беттерге енгізбеу ұсынылады, егер бұған нақты заңды негіз және қорғаныс шаралары болмаса.',
          ],
        },
        {
          title: '6. Cookies, аналитика және пиксельдер',
          paragraphs: [
            'LinkMAX аутентификация, қауіпсіздік, баптаулар, аналитика, атрибуция, өнім телеметриясы және өнімділік үшін cookies және ұқсас технологияларды пайдаланады.',
            'Пайдаланушы маркетинг пиксельдерін немесе интеграцияларды қосқанда, таңдалған оқиға деректері қосылған провайдерге жіберілуі мүмкін. Келушілер cookies-ті браузер баптауларында шектей алады, бірақ кейбір функциялар тұрақсыз жұмыс істеуі мүмкін.',
          ],
        },
        {
          title: '7. AI және интеграциялар',
          paragraphs: [
            'AI функциялары мәтін генерациясы, аударма немесе ұқсас мүмкіндіктер үшін сұрауларды, бет контекстін, таңдалған бизнес ақпаратты және жасалған жобаларды AI инфрақұрылымына жіберуі мүмкін.',
            'Интеграциялар Supabase, Cloudflare, төлем провайдерлері, Telegram, Google немесе Apple кіруі, Google Calendar, email жеткізу, аналитика, monitoring және таңдалған функцияға қажет басқа провайдерлерді қамтуы мүмкін.',
          ],
        },
        {
          title: '8. Деректерді беру',
          paragraphs: [
            'Платформаны ұсыну үшін деректер Қазақстан ішінде немесе одан тыс инфрақұрылым, аналитика, қолдау, email, төлем, AI және интеграция провайдерлері арқылы өңделуі мүмкін. LinkMAX берілетін деректерді функция, қауіпсіздік, қолдау немесе заңды мақсат үшін қажетті көлеммен шектейді.',
            'LinkMAX пайдаланушылардың дербес деректерін сатпайды. Заң, алаяқтықтың алдын алу, дауларды қарау немесе платформаны қорғау талап еткен жағдайда деректер уәкілетті органдарға, соттарға, төлем провайдерлеріне немесе қауіпсіздік серіктестеріне берілуі мүмкін.',
          ],
        },
        {
          title: '9. Сақтау, экспорт және жою',
          paragraphs: [
            'Деректер аккаунт немесе workspace бар кезде, қызмет көрсету үшін қажет уақыт ішінде және заң, бухгалтерлік есеп, қауіпсіздік, backup, дау немесе алаяқтықтың алдын алу мақсаттары талап ететін мерзімде сақталады.',
            'Пайдаланушы қолжетімді интерфейс арқылы немесе қолдауға хабарласып деректерді экспорттауды, түзетуді, аккаунтты немесе workspace деректерін жоюды сұрай алады. Кейбір логтар, backup көшірмелері, транзакция жазбалары және заңмен талап етілетін жазбалар белсенді интерфейстен жойылғаннан кейін де шектеулі мерзім сақталуы мүмкін.',
          ],
        },
        {
          title: '10. Қауіпсіздік',
          paragraphs: [
            'LinkMAX HTTPS, Supabase RLS, рөлдерге негізделген қолжетімділік, workspace оқшаулау, access control, backup, monitoring және audit logs сияқты ұйымдастырушылық және техникалық шараларды қолданады.',
            'Ешбір онлайн сервис толық қауіпсіздікке кепілдік бере алмайды. Пайдаланушы өз құпиясөздерін, құрылғыларын, API кілттерін, интеграцияларын, Telegram аккаунтын және workspace мүшелерінің қолжетімділігін қорғауы тиіс.',
          ],
        },
        {
          title: '11. Деректер субъектісінің құқықтары',
          paragraphs: [
            'Деректер субъектілері өңдеу фактісі, мақсаттары, көздері, әдістері, өңделетін деректер тізімі, сақтау мерзімдері, алушылар туралы ақпаратты, сондай-ақ деректерді түзетуді, бұғаттауды, жоюды және заң рұқсат ететін жағдайларда келісімді қайтарып алуды сұрай алады.',
            `Сұраулар ${COMPANY_DETAILS.email} мекенжайына жіберіледі. LinkMAX сұраушының тұлғасын тексеруі мүмкін және клиент немесе лид деректері бойынша сұрауды тиісті бет иесіне бағыттауы мүмкін.`,
          ],
        },
        {
          title: '12. Өзгерістер',
          paragraphs: [
            `LinkMAX осы Саясатты жаңарта алады. Жаңа нұсқа ${domain}/privacy мекенжайында жарияланған сәттен бастап күшіне енеді, егер басқа күн көрсетілмесе.`,
          ],
        },
      ],
    };
  }

  return {
    title: 'Политика конфиденциальности LinkMAX',
    meta: `Версия ${LEGAL_VERSION}. Дата вступления в силу: ${LEGAL_EFFECTIVE_DATE}.`,
    intro: [
      'Настоящая Политика объясняет, как LinkMAX обрабатывает и защищает персональные данные при использовании платформы, публичных страниц, CRM, онлайн-записи, аналитики, платежей, AI, Telegram и интеграций.',
    ],
    sections: [
      {
        title: '1. Оператор и область действия',
        paragraphs: [
          `Оператор персональных данных по аккаунтным и платформенным данным LinkMAX: ${getCompanyLine(lang)}`,
          `Актуальная версия доступна по адресу ${domain}/privacy.`,
          'По данным аккаунта, биллинга, безопасности, диагностики и сервисных сообщений LinkMAX действует как оператор/контролер. По клиентским данным, которые пользователь собирает через публичные страницы, формы, записи, CRM, счета, события или импорт, пользователь обычно является самостоятельным владельцем/контролером этих данных, а LinkMAX обрабатывает их как технический поставщик платформы, если иное не требуется обязательным законом.',
        ],
      },
      {
        title: '2. Нормативная база',
        paragraphs: [
          'Обработка и защита персональных данных осуществляются по законодательству Республики Казахстан, включая Закон РК от 21 мая 2013 года № 94-V «О персональных данных и их защите», а также иные применимые нормы защиты данных, если они распространяются на конкретные отношения.',
          'Если LinkMAX предлагает сервис пользователям в юрисдикциях с дополнительными требованиями к приватности, соответствующие обязательные правила применяются в объеме, установленном законом.',
        ],
      },
      {
        title: '3. Какие данные обрабатываются',
        bullets: [
          'Аккаунтные и идентификационные данные: имя, username, email, телефон, язык, страна или регион, идентификаторы аутентификации, Telegram ID при подключении, workspace и роли.',
          'Бизнес-контент: настройки публичных страниц, блоки, ссылки, товары, услуги, файлы, медиа, события, настройки записи, AI-промпты и сгенерированные черновики.',
          'Клиентские данные и лиды: заявки из форм, имена, контакты, сообщения, детали записи, CRM-стадии, заметки, задачи, метаданные счетов или заказов, регистрации на события.',
          'Платежные и подписочные данные: тариф, период оплаты, идентификаторы транзакций, статус оплаты, метаданные провайдера, статус возврата, уровень комиссии. LinkMAX не предназначен для хранения полных номеров карт или CVV.',
          'Технические, аналитические и защитные данные: IP-адрес, user agent, данные устройства и браузера, cookies или похожие идентификаторы, логи, просмотры, клики, UTM-метки, телеметрия продукта, отчеты об ошибках и сигналы антифрода.',
        ],
      },
      {
        title: '4. Цели и основания обработки',
        bullets: [
          'Создание и защита аккаунтов, workspace, ролей и сессий.',
          'Предоставление конструктора страниц, CRM, онлайн-записи, аналитики, платежей, AI, Telegram, API и интеграций.',
          'Публикация публичных страниц, обработка запросов посетителей и маршрутизация лидов, записей, событий, счетов, уведомлений и обращений в поддержку.',
          'Обработка платежей, комиссий, подписок, возвратов, chargeback, налоговых или бухгалтерских записей и проверок платежной безопасности.',
          'Улучшение качества, диагностика ошибок, предотвращение злоупотреблений, применение правил платформы и исполнение требований закона.',
        ],
      },
      {
        title: '5. Клиентские данные и обязанности пользователя',
        paragraphs: [
          'Пользователь должен иметь законное основание и необходимые согласия для сбора и обработки клиентских, лидовых, посетительских, платежных и маркетинговых данных через LinkMAX. Пользователь отвечает за содержание своих публичных страниц, законность своих предложений и отношения со своими клиентами.',
          'Пользователь не должен загружать или собирать персональные данные третьих лиц без законного права на это. Не следует помещать чувствительные данные в AI-промпты, CRM-заметки или публичные страницы без действительного основания и достаточных мер защиты.',
        ],
      },
      {
        title: '6. Cookies, аналитика и пиксели',
        paragraphs: [
          'LinkMAX использует cookies и аналогичные технологии для аутентификации, безопасности, настроек, аналитики, атрибуции, продуктовой телеметрии и производительности платформы.',
          'Если пользователь включает маркетинговые пиксели или интеграции, выбранные события могут передаваться подключенному провайдеру согласно настройкам пользователя и условиям провайдера. Посетители публичных страниц могут ограничить cookies в браузере, но часть функций может работать менее стабильно.',
        ],
      },
      {
        title: '7. AI и интеграции',
        paragraphs: [
          'AI-функции могут передавать промпты, контекст страницы, выбранную бизнес-информацию и сгенерированные черновики в AI-инфраструктуру, используемую для генерации контента, перевода или связанных функций.',
          'Подключаемые интеграции могут включать Supabase, Cloudflare, платежных провайдеров, Telegram, вход через Google или Apple, Google Calendar, email-доставку, аналитику, мониторинг и других поставщиков, необходимых для выбранной функции. Их собственные условия и политики также могут применяться.',
        ],
      },
      {
        title: '8. Передача данных',
        paragraphs: [
          'Данные могут обрабатываться инфраструктурными, аналитическими, support, email, платежными, AI и интеграционными провайдерами внутри или за пределами Казахстана, когда это необходимо для работы платформы. LinkMAX ограничивает передачу объемом, разумно необходимым для функции, безопасности, поддержки или законной цели.',
          'LinkMAX не продает персональные данные пользователей. Данные могут быть раскрыты государственным органам, судам, платежным провайдерам или партнерам по безопасности, если это требуется законом, антифродом, урегулированием споров или защитой платформы.',
        ],
      },
      {
        title: '9. Хранение, экспорт и удаление',
        paragraphs: [
          'Данные хранятся, пока существует аккаунт или workspace, пока они нужны для предоставления сервиса, а также в течение сроков, необходимых для закона, бухгалтерии, безопасности, резервных копий, споров или предотвращения мошенничества.',
          'Пользователь может запросить экспорт, исправление, удаление аккаунта или удаление данных workspace через доступный интерфейс либо через поддержку. Некоторые логи, резервные копии, транзакционные записи и обязательные по закону документы могут сохраняться ограниченный период после удаления из активного интерфейса.',
        ],
      },
      {
        title: '10. Безопасность',
        paragraphs: [
          'LinkMAX применяет организационные и технические меры, включая HTTPS, Supabase Row Level Security, ролевой доступ, изоляцию workspace, контроль доступа, резервное копирование, мониторинг и audit logs там, где это уместно.',
          'Ни один онлайн-сервис не может гарантировать абсолютную безопасность. Пользователь обязан защищать свои учетные данные, устройства, API-ключи, интеграции, Telegram-аккаунт и доступ участников workspace.',
        ],
      },
      {
        title: '11. Права субъекта персональных данных',
        paragraphs: [
          'Субъект данных может запросить сведения об обработке, включая подтверждение факта обработки, цели, источники, способы, перечень данных, сроки хранения, получателей при наличии, а также требовать изменения, блокирования, уничтожения данных и отзыва согласия в случаях, предусмотренных законом.',
          `Запросы направляются на ${COMPANY_DETAILS.email}. LinkMAX может проверить личность заявителя и перенаправить запрос по клиентским или лидовым данным соответствующему владельцу страницы, если именно он контролирует эти данные.`,
        ],
      },
      {
        title: '12. Изменения',
        paragraphs: [
          `LinkMAX может обновлять Политику. Новая редакция вступает в силу с момента публикации на ${domain}/privacy, если в ней не указана другая дата.`,
        ],
      },
    ],
  };
}

function buildTermsCopy(lang: LegalLanguage, domain: string): LegalDocumentCopy {
  if (lang === 'en') {
    return {
      title: 'LinkMAX Terms of Service',
      meta: `Version ${LEGAL_VERSION}. Effective date: ${LEGAL_EFFECTIVE_DATE}.`,
      intro: [
        'These Terms govern access to and use of LinkMAX, a mobile-first Business OS for solo entrepreneurs and micro-businesses. By creating an account, using the platform, publishing a page, connecting integrations, or paying for services, the user accepts these Terms, the Privacy Policy, and the Payment Terms.',
      ],
      sections: [
        {
          title: '1. Administration Details',
          paragraphs: [getCompanyLine(lang)],
        },
        {
          title: '2. Platform',
          paragraphs: [
            `LinkMAX includes the website ${domain}, public pages, dashboard, PWA, Telegram interfaces, APIs, CRM, booking, analytics, payment, AI, file, workspace, and integration features provided now or in the future.`,
            'Some features may be free, paid, experimental, limited by plan, or available only in selected regions, browsers, devices, payment providers, or integrations.',
          ],
        },
        {
          title: '3. Acceptance and Eligibility',
          paragraphs: [
            'The user must be legally capable to enter into these Terms. If the user acts for a company, sole proprietor, studio, agency, or client, the user confirms that they are authorized to bind that organization or client.',
            'Acceptance occurs through registration, actual use, publication of a page, connection of an integration, activation of a plan, or payment.',
          ],
        },
        {
          title: '4. Account and Workspace Security',
          bullets: [
            'The user must provide accurate information and keep account details current.',
            'The user is responsible for passwords, devices, Telegram access, API keys, connected providers, workspace roles, and all actions performed through the account.',
            'The user must notify LinkMAX if they suspect unauthorized access, leaked credentials, or unsafe workspace permissions.',
          ],
        },
        {
          title: '5. User Content and Public Pages',
          paragraphs: [
            'The user is responsible for all content, offers, links, prices, services, products, events, files, messages, forms, client records, invoices, and public information placed in LinkMAX.',
            'The user must have the rights and permissions required for content, trademarks, images, media, personal data, marketing claims, prices, services, products, and communications.',
          ],
        },
        {
          title: '6. Client Relations',
          paragraphs: [
            'LinkMAX provides platform infrastructure. The user remains responsible for their own services, appointments, products, events, customer promises, taxes, refunds to their customers, consumer disclosures, licenses, and compliance with professional rules.',
            'Unless explicitly stated otherwise, LinkMAX is not a party to transactions between a user and their clients, visitors, buyers, patients, students, subscribers, or event attendees.',
          ],
        },
        {
          title: '7. Prohibited Use',
          bullets: [
            'Illegal, fraudulent, misleading, extremist, violent, hateful, pornographic, or rights-infringing content.',
            'Collection, publication, sale, or transfer of personal data without a lawful basis.',
            'Malware, phishing, spam, scraping, credential harvesting, platform abuse, bypassing limits, or unauthorized access.',
            'Unsafe medical, financial, legal, or other regulated claims without proper qualifications and disclosures.',
            'Use that violates payment provider rules, advertising platform rules, sanctions, export restrictions, or applicable law.',
          ],
        },
        {
          title: '8. AI Features',
          paragraphs: [
            'AI-generated text, translations, suggestions, and layouts may be inaccurate or incomplete. The user must review and approve AI output before publication or use.',
            'AI features are not legal, medical, financial, tax, or other professional advice. The user is responsible for the final content and for not submitting sensitive or unauthorized data into prompts.',
          ],
        },
        {
          title: '9. Integrations and API',
          paragraphs: [
            'Connected providers may have their own rules, limits, outages, permissions, and privacy policies. LinkMAX is not responsible for third-party provider actions outside LinkMAX control.',
            'API keys and webhooks must be stored securely. LinkMAX may revoke or limit API access if it threatens security, stability, tenant isolation, or platform rules.',
          ],
        },
        {
          title: '10. Paid Features',
          paragraphs: [
            'Paid plans, commissions, transaction fees, payment providers, refunds, renewals, cancellations, and chargebacks are governed by the Payment Terms, which are part of these Terms.',
            `Current plan composition and prices are shown on ${domain}/pricing and in the payment interface before purchase. If the interface and a marketing page differ, the payment confirmation screen controls for that purchase.`,
          ],
        },
        {
          title: '11. Availability and Changes',
          paragraphs: [
            'The platform is provided on an "as is" and "as available" basis. LinkMAX works to keep the product fast and reliable, but does not guarantee uninterrupted operation, error-free behavior, continuous availability of every feature, or compatibility with every device, browser, bot, integration, or payment provider.',
            'LinkMAX may change, suspend, limit, or discontinue features when needed for product development, security, legal compliance, platform stability, or plan simplification.',
          ],
        },
        {
          title: '12. Intellectual Property',
          paragraphs: [
            'LinkMAX, its code, design, brand, templates, documentation, and platform materials belong to LinkMAX or are used legally. Users receive a limited, non-exclusive, non-transferable right to use the platform under these Terms.',
            'The user keeps rights to their content but grants LinkMAX a non-exclusive license to host, store, reproduce, display, process, back up, transmit, and adapt it technically as needed to operate the platform and connected features.',
          ],
        },
        {
          title: '13. Moderation and Termination',
          paragraphs: [
            'LinkMAX may review, hide, remove, limit, suspend, or block content, pages, integrations, workspaces, or accounts if there is a suspected violation, security risk, legal risk, payment dispute, provider requirement, or abuse.',
            'The user may stop using the platform and request account deletion, subject to retention required for legal, security, payment, accounting, backup, or dispute purposes.',
          ],
        },
        {
          title: '14. Liability and Disputes',
          paragraphs: [
            'To the maximum extent allowed by law, LinkMAX is not liable for indirect losses, lost profits, lost revenue, lost customers, data loss caused by user actions, third-party failures, force majeure, or expectations not expressly agreed in writing.',
            'These Terms are governed by the laws of the Republic of Kazakhstan. Disputes are first handled through negotiations and support. If unresolved, they are considered by the competent court unless mandatory law provides another forum.',
          ],
        },
        {
          title: '15. Updates',
          paragraphs: [
            `LinkMAX may update these Terms. The updated version becomes effective upon publication at ${domain}/terms unless another effective date is stated.`,
          ],
        },
      ],
    };
  }

  if (lang === 'kk') {
    return {
      title: 'LinkMAX пайдаланушы келісімі',
      meta: `${LEGAL_VERSION} нұсқа. Күшіне ену күні: ${LEGAL_EFFECTIVE_DATE}.`,
      intro: [
        'Осы Келісім LinkMAX - жеке кәсіпкерлер мен шағын бизнеске арналған mobile-first Business OS платформасына қол жеткізу және оны пайдалану шарттарын реттейді. Аккаунт жасау, платформаны пайдалану, бетті жариялау, интеграция қосу немесе төлем жасау арқылы пайдаланушы осы Келісімді, Құпиялылық саясатын және Төлем шарттарын қабылдайды.',
      ],
      sections: [
        { title: '1. Әкімшілік деректері', paragraphs: [getCompanyLine(lang)] },
        {
          title: '2. Платформа',
          paragraphs: [
            `LinkMAX құрамына ${domain} сайты, жария беттер, dashboard, PWA, Telegram интерфейстері, API, CRM, жазылу, аналитика, төлем, AI, файлдар, workspace және қазіргі немесе болашақ интеграциялар кіреді.`,
            'Кейбір функциялар тегін, ақылы, эксперименттік, тарифпен шектелген немесе белгілі аймақтарда, браузерлерде, құрылғыларда, төлем провайдерлерінде немесе интеграцияларда ғана қолжетімді болуы мүмкін.',
          ],
        },
        {
          title: '3. Қабылдау және құқық қабілеттілігі',
          paragraphs: [
            'Пайдаланушы осы Келісімді қабылдауға әрекет қабілетті болуы тиіс. Егер пайдаланушы компания, ИП, студия, агенттік немесе клиент атынан әрекет етсе, ол тиісті өкілеттігі бар екенін растайды.',
            'Келісімді қабылдау тіркелу, нақты пайдалану, бетті жариялау, интеграция қосу, тарифті іске қосу немесе төлем жасау арқылы жүзеге асады.',
          ],
        },
        {
          title: '4. Аккаунт және workspace қауіпсіздігі',
          bullets: [
            'Пайдаланушы дұрыс ақпарат беруге және аккаунт мәліметтерін өзекті ұстауға міндетті.',
            'Пайдаланушы құпиясөздерге, құрылғыларға, Telegram қолжетімділігіне, API кілттеріне, қосылған провайдерлерге, workspace рөлдеріне және аккаунт арқылы жасалған барлық әрекеттерге жауапты.',
            'Рұқсатсыз кіру, құпиясөздің таралуы немесе workspace рұқсаттарының қауіпті бапталуы күдігі болса, пайдаланушы LinkMAX-қа хабарлауы керек.',
          ],
        },
        {
          title: '5. Пайдаланушы контенті және жария беттер',
          paragraphs: [
            'Пайдаланушы LinkMAX-та орналастырған барлық контентке, ұсыныстарға, сілтемелерге, бағаларға, қызметтерге, өнімдерге, оқиғаларға, файлдарға, хабарламаларға, нысандарға, клиент жазбаларына, шоттарға және жария ақпаратқа жауапты.',
            'Пайдаланушы контент, тауар белгілері, суреттер, медиа, дербес деректер, маркетинг уәделері, бағалар, қызметтер, өнімдер және коммуникациялар үшін қажетті құқықтар мен рұқсаттарға ие болуы тиіс.',
          ],
        },
        {
          title: '6. Клиенттермен қатынас',
          paragraphs: [
            'LinkMAX платформа инфрақұрылымын ұсынады. Пайдаланушы өз қызметтеріне, жазылуларына, өнімдеріне, оқиғаларына, клиенттерге берген уәделеріне, салықтарына, өз клиенттеріне қайтарымдарға, тұтынушыға ақпарат беруге, лицензияларға және кәсіби ережелерге жауапты.',
            'Егер бөлек көрсетілмесе, LinkMAX пайдаланушы мен оның клиенттері, келушілері, сатып алушылары, пациенттері, студенттері, жазылушылары немесе оқиға қатысушылары арасындағы мәмілелердің тарапы емес.',
          ],
        },
        {
          title: '7. Тыйым салынған пайдалану',
          bullets: [
            'Заңсыз, алаяқтық, жаңылыстыратын, экстремистік, зорлыққа шақыратын, жек көрушілік, порнографиялық немесе құқық бұзатын контент.',
            'Заңды негізсіз дербес деректерді жинау, жариялау, сату немесе беру.',
            'Malware, phishing, spam, scraping, credential harvesting, платформаны теріс пайдалану, лимиттерді айналып өту немесе рұқсатсыз қолжетімділік.',
            'Тиісті біліктілік пен ескертулерсіз қауіпті медициналық, қаржылық, заңдық немесе басқа реттелетін мәлімдемелер.',
            'Төлем провайдері, жарнама платформасы, санкциялар, экспорт шектеулері немесе қолданылатын заң ережелерін бұзатын пайдалану.',
          ],
        },
        {
          title: '8. AI функциялары',
          paragraphs: [
            'AI жасаған мәтін, аударма, ұсыныстар және layout қате немесе толық емес болуы мүмкін. Пайдаланушы AI нәтижесін жариялау немесе пайдалану алдында тексеріп, мақұлдауы тиіс.',
            'AI функциялары заң, медицина, қаржы, салық немесе басқа кәсіби кеңес болып саналмайды. Соңғы контентке және prompt-тарға құпия немесе рұқсатсыз деректер енгізбеуге пайдаланушы жауапты.',
          ],
        },
        {
          title: '9. Интеграциялар және API',
          paragraphs: [
            'Қосылған провайдерлердің өз ережелері, лимиттері, ақаулары, рұқсаттары және құпиялылық саясаттары болуы мүмкін. LinkMAX өз бақылауынан тыс үшінші тарап әрекеттеріне жауапты емес.',
            'API кілттері мен webhooks қауіпсіз сақталуы тиіс. Егер қауіпсіздікке, тұрақтылыққа, tenant оқшаулауына немесе платформа ережелеріне қауіп төнсе, LinkMAX API қолжетімділігін шектеуі немесе қайтарып алуы мүмкін.',
          ],
        },
        {
          title: '10. Ақылы функциялар',
          paragraphs: [
            'Ақылы тарифтер, комиссиялар, транзакциялық алымдар, төлем провайдерлері, қайтарулар, ұзартулар, бас тартулар және chargeback мәселелері осы Келісімнің бөлігі болып табылатын Төлем шарттарымен реттеледі.',
            `Ағымдағы тариф құрамы мен бағалар ${domain}/pricing бетінде және төлем алдында интерфейсте көрсетіледі. Интерфейс пен маркетинг беті арасында айырмашылық болса, нақты сатып алу үшін төлемді растау экраны басым болады.`,
          ],
        },
        {
          title: '11. Қолжетімділік және өзгерістер',
          paragraphs: [
            'Платформа "as is" және "as available" негізінде беріледі. LinkMAX өнімді жылдам және тұрақты ұстауға тырысады, бірақ үздіксіз жұмысқа, қатесіз мінез-құлыққа, әр функцияның үнемі қолжетімділігіне немесе әр құрылғымен, браузермен, bot-пен, интеграциямен не төлем провайдерімен үйлесімділікке кепілдік бермейді.',
            'LinkMAX өнім дамуы, қауіпсіздік, заң талаптары, тұрақтылық немесе тарифтерді жеңілдету үшін функцияларды өзгертуі, тоқтатуы, шектеуі немесе алып тастауы мүмкін.',
          ],
        },
        {
          title: '12. Зияткерлік меншік',
          paragraphs: [
            'LinkMAX, оның коды, дизайны, бренді, шаблондары, құжаттамасы және платформа материалдары LinkMAX-қа тиесілі немесе заңды негізде пайдаланылады. Пайдаланушы осы Келісім бойынша шектеулі, айрықша емес және берілмейтін пайдалану құқығын алады.',
            'Пайдаланушы өз контентіне құқықтарын сақтайды, бірақ платформаны және қосылған функцияларды іске қосу үшін қажет көлемде LinkMAX-қа оны хостингтеу, сақтау, көшіру, көрсету, өңдеу, backup жасау, беру және техникалық бейімдеу құқығын береді.',
          ],
        },
        {
          title: '13. Модерация және тоқтату',
          paragraphs: [
            'Ереже бұзылуы, қауіпсіздік тәуекелі, заңдық тәуекел, төлем дауы, провайдер талабы немесе теріс пайдалану күдігі болса, LinkMAX контентті, беттерді, интеграцияларды, workspace немесе аккаунттарды тексеруі, жасыруы, жоюы, шектеуі, тоқтатуы немесе бұғаттауы мүмкін.',
            'Пайдаланушы платформаны пайдалануды тоқтатып, аккаунтты жоюды сұрай алады, бірақ заң, қауіпсіздік, төлем, бухгалтерлік есеп, backup немесе дау мақсаттары үшін сақталатын деректер болуы мүмкін.',
          ],
        },
        {
          title: '14. Жауапкершілік және даулар',
          paragraphs: [
            'Заң рұқсат еткен ең жоғары көлемде LinkMAX жанама шығындарға, жоғалған пайдаға, жоғалған табысқа, жоғалған клиенттерге, пайдаланушы әрекеттерінен, үшінші тарап ақауларынан, форс-мажордан немесе жазбаша келісілмеген күтулерден туындаған деректер жоғалуына жауап бермейді.',
            'Осы Келісімге Қазақстан Республикасының заңнамасы қолданылады. Даулар алдымен келіссөздер және қолдау арқылы шешіледі. Шешілмесе, міндетті заң басқа тәртіп белгілемесе, құзыретті сотта қаралады.',
          ],
        },
        {
          title: '15. Жаңартулар',
          paragraphs: [
            `LinkMAX осы Келісімді жаңарта алады. Жаңа нұсқа ${domain}/terms мекенжайында жарияланған сәттен бастап күшіне енеді, егер басқа күн көрсетілмесе.`,
          ],
        },
      ],
    };
  }

  return {
    title: 'Пользовательское соглашение LinkMAX',
    meta: `Версия ${LEGAL_VERSION}. Дата вступления в силу: ${LEGAL_EFFECTIVE_DATE}.`,
    intro: [
      'Настоящее Соглашение регулирует доступ и использование LinkMAX - mobile-first Business OS для индивидуальных предпринимателей, экспертов и микробизнеса. Создавая аккаунт, используя платформу, публикуя страницу, подключая интеграции или оплачивая услуги, пользователь принимает настоящее Соглашение, Политику конфиденциальности и Условия оплаты.',
    ],
    sections: [
      { title: '1. Реквизиты Администрации', paragraphs: [getCompanyLine(lang)] },
      {
        title: '2. Платформа',
        paragraphs: [
          `LinkMAX включает сайт ${domain}, публичные страницы, dashboard, PWA, Telegram-интерфейсы, API, CRM, онлайн-запись, аналитику, платежи, AI, файлы, workspace и интеграционные функции, предоставляемые сейчас или в будущем.`,
          'Часть функций может быть бесплатной, платной, экспериментальной, ограниченной тарифом или доступной только в отдельных регионах, браузерах, устройствах, платежных провайдерах или интеграциях.',
        ],
      },
      {
        title: '3. Акцепт и правоспособность',
        paragraphs: [
          'Пользователь должен быть дееспособным для принятия настоящего Соглашения. Если пользователь действует от имени компании, ИП, студии, агентства или клиента, он подтверждает, что имеет полномочия принять условия от имени соответствующего лица.',
          'Акцептом является регистрация, фактическое использование, публикация страницы, подключение интеграции, активация тарифа или оплата.',
        ],
      },
      {
        title: '4. Аккаунт и безопасность workspace',
        bullets: [
          'Пользователь обязан предоставлять достоверную информацию и поддерживать данные аккаунта в актуальном состоянии.',
          'Пользователь отвечает за пароли, устройства, доступ к Telegram, API-ключи, подключенных провайдеров, роли workspace и все действия, совершенные через аккаунт.',
          'Пользователь должен уведомить LinkMAX при подозрении на несанкционированный доступ, утечку учетных данных или небезопасные права участников workspace.',
        ],
      },
      {
        title: '5. Контент пользователя и публичные страницы',
        paragraphs: [
          'Пользователь отвечает за весь контент, предложения, ссылки, цены, услуги, товары, события, файлы, сообщения, формы, клиентские записи, счета и публичную информацию, размещенную в LinkMAX.',
          'Пользователь должен иметь права и разрешения на контент, товарные знаки, изображения, медиа, персональные данные, маркетинговые утверждения, цены, услуги, товары и коммуникации.',
        ],
      },
      {
        title: '6. Отношения с клиентами пользователя',
        paragraphs: [
          'LinkMAX предоставляет платформенную инфраструктуру. Пользователь остается ответственным за собственные услуги, записи, товары, события, обещания клиентам, налоги, возвраты своим клиентам, раскрытия для потребителей, лицензии и соблюдение профессиональных правил.',
          'Если прямо не указано иное, LinkMAX не является стороной сделок между пользователем и его клиентами, посетителями, покупателями, пациентами, студентами, подписчиками или участниками событий.',
        ],
      },
      {
        title: '7. Запрещенное использование',
        bullets: [
          'Незаконный, мошеннический, вводящий в заблуждение, экстремистский, насильственный, ненавистнический, порнографический или нарушающий права контент.',
          'Сбор, публикация, продажа или передача персональных данных без законного основания.',
          'Malware, phishing, spam, scraping, credential harvesting, злоупотребление платформой, обход лимитов или несанкционированный доступ.',
          'Опасные медицинские, финансовые, юридические или иные регулируемые утверждения без надлежащей квалификации и раскрытий.',
          'Использование, нарушающее правила платежных провайдеров, рекламных платформ, санкции, экспортные ограничения или применимое право.',
        ],
      },
      {
        title: '8. AI-функции',
        paragraphs: [
          'AI-сгенерированный текст, переводы, подсказки и макеты могут быть неточными или неполными. Пользователь обязан проверить и утвердить AI-результат до публикации или использования.',
          'AI-функции не являются юридической, медицинской, финансовой, налоговой или иной профессиональной консультацией. Пользователь отвечает за итоговый контент и за то, чтобы не отправлять в промпты чувствительные или неразрешенные данные.',
        ],
      },
      {
        title: '9. Интеграции и API',
        paragraphs: [
          'У подключенных провайдеров могут быть собственные правила, лимиты, сбои, разрешения и политики приватности. LinkMAX не отвечает за действия третьих провайдеров вне контроля LinkMAX.',
          'API-ключи и webhooks должны храниться безопасно. LinkMAX может отозвать или ограничить API-доступ, если он угрожает безопасности, стабильности, tenant isolation или правилам платформы.',
        ],
      },
      {
        title: '10. Платные функции',
        paragraphs: [
          'Платные тарифы, комиссии, транзакционные сборы, платежные провайдеры, возвраты, продления, отмены и chargeback регулируются Условиями оплаты, которые являются частью настоящего Соглашения.',
          `Актуальный состав тарифов и цены отображаются на ${domain}/pricing и в интерфейсе оплаты перед покупкой. Если интерфейс оплаты и маркетинговая страница расходятся, для конкретной покупки приоритет имеет экран подтверждения оплаты.`,
        ],
      },
      {
        title: '11. Доступность и изменения',
        paragraphs: [
          'Платформа предоставляется на условиях "как есть" и "по доступности". LinkMAX стремится поддерживать продукт быстрым и надежным, но не гарантирует бесперебойную работу, отсутствие ошибок, постоянную доступность каждой функции или совместимость с каждым устройством, браузером, bot, интеграцией или платежным провайдером.',
          'LinkMAX может изменять, приостанавливать, ограничивать или прекращать функции, когда это нужно для развития продукта, безопасности, соблюдения закона, стабильности платформы или упрощения тарифов.',
        ],
      },
      {
        title: '12. Интеллектуальная собственность',
        paragraphs: [
          'LinkMAX, его код, дизайн, бренд, шаблоны, документация и материалы платформы принадлежат LinkMAX или используются на законных основаниях. Пользователь получает ограниченное, неисключительное, непередаваемое право использовать платформу по настоящему Соглашению.',
          'Пользователь сохраняет права на свой контент, но предоставляет LinkMAX неисключительную лицензию на хостинг, хранение, воспроизведение, отображение, обработку, резервное копирование, передачу и техническую адаптацию контента в объеме, необходимом для работы платформы и подключенных функций.',
        ],
      },
      {
        title: '13. Модерация и прекращение доступа',
        paragraphs: [
          'LinkMAX может проверять, скрывать, удалять, ограничивать, приостанавливать или блокировать контент, страницы, интеграции, workspace или аккаунты при подозрении на нарушение, риск безопасности, юридический риск, платежный спор, требование провайдера или злоупотребление.',
          'Пользователь может прекратить использование платформы и запросить удаление аккаунта с учетом хранения, необходимого для закона, безопасности, платежей, бухгалтерии, backup или споров.',
        ],
      },
      {
        title: '14. Ответственность и споры',
        paragraphs: [
          'В максимальной степени, разрешенной законом, LinkMAX не отвечает за косвенные убытки, упущенную выгоду, потерю выручки, потерю клиентов, потерю данных из-за действий пользователя, сбои третьих сторон, форс-мажор или ожидания, не согласованные письменно.',
          'К настоящему Соглашению применяется право Республики Казахстан. Споры сначала решаются через переговоры и поддержку. Если спор не урегулирован, он рассматривается компетентным судом, если обязательный закон не предусматривает иной порядок.',
        ],
      },
      {
        title: '15. Обновления',
        paragraphs: [
          `LinkMAX может обновлять Соглашение. Новая редакция вступает в силу с момента публикации на ${domain}/terms, если в ней не указана другая дата.`,
        ],
      },
    ],
  };
}

function buildPaymentCopy(lang: LegalLanguage, domain: string): LegalDocumentCopy {
  if (lang === 'en') {
    return {
      title: 'LinkMAX Payment Terms',
      meta: `Version ${LEGAL_VERSION}. Effective date: ${LEGAL_EFFECTIVE_DATE}.`,
      intro: [
        'These Payment Terms govern LinkMAX plans, subscriptions, commissions, transaction fees, payment providers, cancellations, and refund requests. They are part of the Terms of Service.',
      ],
      sections: [
        {
          title: '1. Scope',
          paragraphs: [
            'The Terms apply to paid LinkMAX features, plan upgrades, transaction-based fees, payment links, invoices, wallet or payout features where available, and other paid services shown in the product.',
            'Payments from a page visitor or client to a LinkMAX user may be subject to additional rules of the user, payment provider, bank, card network, marketplace, or connected merchant account.',
          ],
        },
        {
          title: '2. Current Plan Model',
          bullets: [
            'Identity: free entry plan with limited features and LinkMAX branding.',
            'Starter: no monthly subscription fee, with a platform transaction fee of 7% on processed transactions where monetization features are used.',
            'Pro: prepaid subscription with reduced platform transaction fee of 1% on processed transactions.',
            'Business or custom plans: terms, team limits, commissions, and payment periods may be agreed separately or shown in the product.',
          ],
        },
        {
          title: '3. Pro Price Reference',
          paragraphs: [
            'At the publication date, Pro reference prices shown in Kazakhstan tenge are: 3 months - 4,350 KZT per month; 6 months - 3,698 KZT per month; 12 months - 3,045 KZT per month. The final total, discounts, taxes, and provider fees are shown before payment and may be updated for new purchases.',
            `The current price and included features are available at ${domain}/pricing and in the checkout interface.`,
          ],
        },
        {
          title: '4. Payment Procedure',
          paragraphs: [
            'Payment is made through available payment providers and methods shown in the checkout interface, including bank cards and supported regional providers where enabled.',
            'A paid plan or feature is activated after successful confirmation from the payment provider. Standard activation target is up to 15 minutes, but provider delays, antifraud checks, or incidents may take longer.',
          ],
        },
        {
          title: '5. Commissions and Transaction Fees',
          paragraphs: [
            'Platform transaction fees are charged or retained according to the active plan and product configuration. Payment providers, banks, card networks, and currency conversion services may apply additional fees outside LinkMAX control.',
            'If a transaction is refunded, reversed, charged back, or disputed, provider fees, platform fees, and payout adjustments may be handled according to the payment provider rules, plan terms, and applicable law.',
          ],
        },
        {
          title: '6. Renewal, Downgrade, and Cancellation',
          paragraphs: [
            'Prepaid subscription periods run from successful payment confirmation until the end of the selected period. Auto-renewal applies only if explicitly enabled and supported by the payment provider.',
            'The user may stop using a paid plan by disabling auto-renewal where available or by not paying for the next period. Cancellation does not automatically refund an already paid period unless these Terms, a specific offer, or mandatory law requires otherwise.',
          ],
        },
        {
          title: '7. Refunds',
          paragraphs: [
            'Refunds are considered under applicable law, these Terms, the specific offer, and payment provider rules. A refund may be possible if the paid service was not activated, was not materially used, or could not be provided due to LinkMAX fault.',
            'Unless a specific offer says otherwise, a standard refund request for a subscription purchase should be sent within 14 calendar days after payment. Active use of paid features, AI generation, custom domain setup, publication, CRM use, integrations, or provider costs may reduce or exclude a refund where allowed by law.',
            `To request a refund, contact ${COMPANY_DETAILS.email} and include account email, payment date, amount, payment method or provider, and reason. LinkMAX may request additional verification.`,
          ],
        },
        {
          title: '8. User Sales and Customer Refunds',
          paragraphs: [
            'The LinkMAX user remains responsible for their own customers, bookings, products, services, taxes, fiscal documents, refund policy, cancellations, and consumer claims. LinkMAX does not become the seller of the users goods or services unless expressly agreed in writing.',
            'If a user collects prepayments, event fees, invoices, tips, or other customer payments through LinkMAX tools, the user must clearly disclose their own terms to their customers.',
          ],
        },
        {
          title: '9. Fraud, Chargebacks, and Suspension',
          paragraphs: [
            'LinkMAX may pause access, payouts, payment links, monetization tools, or accounts during suspected fraud, abuse, illegal activity, chargebacks, provider requests, sanctions checks, or security incidents.',
            'Chargeback, refund, and dispute costs may be deducted from available balances or future payouts where supported by the payment flow and allowed by law.',
          ],
        },
        {
          title: '10. Changes',
          paragraphs: [
            'LinkMAX may update plans, pricing, fees, payment methods, providers, and these Payment Terms for future purchases or future billing periods. The updated version becomes effective upon publication unless another date is stated.',
          ],
        },
      ],
    };
  }

  if (lang === 'kk') {
    return {
      title: 'LinkMAX төлем шарттары',
      meta: `${LEGAL_VERSION} нұсқа. Күшіне ену күні: ${LEGAL_EFFECTIVE_DATE}.`,
      intro: [
        'Осы Төлем шарттары LinkMAX тарифтерін, жазылымдарын, комиссияларын, транзакциялық алымдарын, төлем провайдерлерін, бас тартуларды және қайтару сұрауларын реттейді. Олар Пайдаланушы келісімінің бөлігі болып табылады.',
      ],
      sections: [
        {
          title: '1. Қолданылу аясы',
          paragraphs: [
            'Шарттар ақылы LinkMAX функцияларына, тариф жаңартуларына, транзакцияға негізделген алымдарға, төлем сілтемелеріне, шоттарға, қолжетімді болса wallet немесе payout функцияларына және өнімде көрсетілген басқа ақылы қызметтерге қолданылады.',
            'Жария бет келушісі немесе клиенті LinkMAX пайдаланушысына төлейтін төлемдерге пайдаланушының, төлем провайдерінің, банктің, карта желісінің, marketplace немесе қосылған merchant аккаунтының қосымша ережелері қолданылуы мүмкін.',
          ],
        },
        {
          title: '2. Ағымдағы тариф моделі',
          bullets: [
            'Identity: шектеулі функциялар мен LinkMAX branding бар тегін бастапқы тариф.',
            'Starter: ай сайынғы жазылым төлемі жоқ, монетизация функциялары қолданылғанда өңделген транзакциялардан 7% платформа комиссиясы бар.',
            'Pro: алдын ала төленетін жазылым және өңделген транзакциялардан 1% төмендетілген платформа комиссиясы.',
            'Business немесе custom тарифтер: шарттар, команда лимиттері, комиссиялар және төлем кезеңдері бөлек келісіммен немесе өнімде көрсетілуі мүмкін.',
          ],
        },
        {
          title: '3. Pro бағалары бойынша анықтама',
          paragraphs: [
            'Жарияланған күні Pro үшін теңгедегі анықтамалық бағалар: 3 ай - айына 4 350 KZT; 6 ай - айына 3 698 KZT; 12 ай - айына 3 045 KZT. Соңғы сома, жеңілдіктер, салықтар және провайдер алымдары төлем алдында көрсетіледі және жаңа сатып алулар үшін жаңартылуы мүмкін.',
            `Ағымдағы баға және функциялар ${domain}/pricing бетінде және checkout интерфейсінде көрсетіледі.`,
          ],
        },
        {
          title: '4. Төлем тәртібі',
          paragraphs: [
            'Төлем checkout интерфейсінде көрсетілген қолжетімді төлем провайдерлері және әдістері арқылы, соның ішінде банк карталары және қосылған болса аймақтық провайдерлер арқылы жасалады.',
            'Ақылы тариф немесе функция төлем провайдері сәтті растағаннан кейін іске қосылады. Әдеттегі мақсатты іске қосу уақыты 15 минутқа дейін, бірақ провайдер кідірісі, antifraud тексерісі немесе incident ұзаққа созылуы мүмкін.',
          ],
        },
        {
          title: '5. Комиссиялар және транзакциялық алымдар',
          paragraphs: [
            'Платформа транзакциялық алымдары белсенді тарифке және өнім конфигурациясына сәйкес алынады немесе ұсталады. Төлем провайдерлері, банктер, карта желілері және валюта айырбастау қызметтері LinkMAX бақылауынан тыс қосымша комиссия қолдануы мүмкін.',
            'Транзакция қайтарылса, кері қайтарылса, chargeback немесе дау болса, провайдер алымдары, платформа комиссиялары және payout түзетулері төлем провайдері ережелері, тариф шарттары және заң бойынша өңделуі мүмкін.',
          ],
        },
        {
          title: '6. Ұзарту, төмендету және бас тарту',
          paragraphs: [
            'Алдын ала төленген жазылым кезеңі төлем сәтті расталған күннен таңдалған кезең соңына дейін жүреді. Автоұзарту тек нақты қосылған және төлем провайдері қолдаған жағдайда қолданылады.',
            'Пайдаланушы автоұзартуды өшіру арқылы немесе келесі кезең үшін төлем жасамау арқылы ақылы тарифті тоқтата алады. Бас тарту бұрын төленген кезеңді автоматты түрде қайтармайды, егер осы Шарттар, нақты ұсыныс немесе міндетті заң басқаша талап етпесе.',
          ],
        },
        {
          title: '7. Қайтарулар',
          paragraphs: [
            'Қайтарулар қолданылатын заң, осы Шарттар, нақты ұсыныс және төлем провайдері ережелері бойынша қаралады. Ақылы сервис іске қосылмаса, елеулі түрде пайдаланылмаса немесе LinkMAX кінәсінен ұсынылмаса, қайтару мүмкін болуы мүмкін.',
            'Егер нақты ұсыныста басқаша көрсетілмесе, жазылым бойынша стандартты қайтару сұрауы төлемнен кейін 14 күнтізбелік күн ішінде жіберілуі тиіс. Ақылы функцияларды белсенді пайдалану, AI генерациясы, custom domain баптау, жариялау, CRM пайдалану, интеграциялар немесе провайдер шығындары заң рұқсат ететін көлемде қайтаруды азайтуы немесе болдырмауы мүмкін.',
            `Қайтаруды сұрау үшін ${COMPANY_DETAILS.email} мекенжайына аккаунт email-ін, төлем күнін, сомасын, төлем әдісін немесе провайдерін және себебін жіберіңіз. LinkMAX қосымша растауды сұрауы мүмкін.`,
          ],
        },
        {
          title: '8. Пайдаланушы сатылымдары және клиент қайтарулары',
          paragraphs: [
            'LinkMAX пайдаланушысы өз клиенттері, жазылулары, өнімдері, қызметтері, салықтары, фискалдық құжаттары, қайтару саясаты, бас тартулар және тұтынушы шағымдары үшін жауапты. Егер жазбаша бөлек келісілмесе, LinkMAX пайдаланушы тауарлары немесе қызметтерінің сатушысы болмайды.',
            'Егер пайдаланушы LinkMAX құралдары арқылы алдын ала төлем, event fee, invoice, tip немесе басқа клиент төлемдерін жинаса, ол өз клиенттеріне өз шарттарын анық көрсетуі тиіс.',
          ],
        },
        {
          title: '9. Fraud, chargeback және тоқтату',
          paragraphs: [
            'Алаяқтық, теріс пайдалану, заңсыз әрекет, chargeback, провайдер талабы, sanctions check немесе қауіпсіздік incident күдігі болса, LinkMAX қолжетімділікті, payout-тарды, төлем сілтемелерін, монетизация құралдарын немесе аккаунттарды уақытша тоқтатуы мүмкін.',
            'Chargeback, қайтару және дау шығындары төлем ағыны қолдайтын және заң рұқсат ететін жағдайда қолжетімді баланстан немесе болашақ payout-тардан ұсталып қалуы мүмкін.',
          ],
        },
        {
          title: '10. Өзгерістер',
          paragraphs: [
            'LinkMAX болашақ сатып алулар немесе болашақ төлем кезеңдері үшін тарифтерді, бағаларды, алымдарды, төлем әдістерін, провайдерлерді және осы Төлем шарттарын жаңарта алады. Жаңа нұсқа жарияланған сәттен бастап күшіне енеді, егер басқа күн көрсетілмесе.',
          ],
        },
      ],
    };
  }

  return {
    title: 'Условия оплаты LinkMAX',
    meta: `Версия ${LEGAL_VERSION}. Дата вступления в силу: ${LEGAL_EFFECTIVE_DATE}.`,
    intro: [
      'Настоящие Условия оплаты регулируют тарифы LinkMAX, подписки, комиссии, транзакционные сборы, платежных провайдеров, отмены и запросы возврата. Они являются частью Пользовательского соглашения.',
    ],
    sections: [
      {
        title: '1. Область действия',
        paragraphs: [
          'Условия применяются к платным функциям LinkMAX, апгрейдам тарифов, транзакционным сборам, платежным ссылкам, счетам, wallet или payout функциям при наличии, а также другим платным услугам, отображаемым в продукте.',
          'Платежи от посетителя страницы или клиента пользователю LinkMAX могут дополнительно регулироваться правилами пользователя, платежного провайдера, банка, карточной сети, marketplace или подключенного merchant-аккаунта.',
        ],
      },
      {
        title: '2. Текущая модель тарифов',
        bullets: [
          'Identity: бесплатный стартовый тариф с ограниченными функциями и брендингом LinkMAX.',
          'Starter: без ежемесячной подписки, с платформенной комиссией 7% от обработанных транзакций при использовании monetization-функций.',
          'Pro: предоплачиваемая подписка со сниженной платформенной комиссией 1% от обработанных транзакций.',
          'Business или custom-тарифы: условия, лимиты команды, комиссии и периоды оплаты могут согласовываться отдельно или отображаться в продукте.',
        ],
      },
      {
        title: '3. Ориентиры стоимости Pro',
        paragraphs: [
          'На дату публикации ориентировочные цены Pro в тенге: 3 месяца - 4 350 KZT в месяц; 6 месяцев - 3 698 KZT в месяц; 12 месяцев - 3 045 KZT в месяц. Итоговая сумма, скидки, налоги и комиссии провайдера показываются до оплаты и могут обновляться для новых покупок.',
          `Актуальная цена и состав функций доступны на ${domain}/pricing и в checkout-интерфейсе.`,
        ],
      },
      {
        title: '4. Порядок оплаты',
        paragraphs: [
          'Оплата производится через доступных платежных провайдеров и способы, указанные в checkout-интерфейсе, включая банковские карты и поддерживаемых региональных провайдеров при наличии.',
          'Платный тариф или функция активируется после успешного подтверждения платежным провайдером. Ориентир активации - до 15 минут, но задержки провайдера, антифрод-проверки или инциденты могут занимать больше времени.',
        ],
      },
      {
        title: '5. Комиссии и транзакционные сборы',
        paragraphs: [
          'Платформенные транзакционные сборы списываются или удерживаются согласно активному тарифу и конфигурации продукта. Платежные провайдеры, банки, карточные сети и сервисы конвертации валют могут применять дополнительные комиссии вне контроля LinkMAX.',
          'Если транзакция возвращена, отменена, оспорена или ушла в chargeback, комиссии провайдера, платформенные сборы и корректировки payout могут обрабатываться по правилам платежного провайдера, условиям тарифа и применимому закону.',
        ],
      },
      {
        title: '6. Продление, downgrade и отмена',
        paragraphs: [
          'Предоплаченный период подписки действует с момента успешного подтверждения оплаты до окончания выбранного периода. Автопродление применяется только если оно явно включено и поддерживается платежным провайдером.',
          'Пользователь может прекратить использование платного тарифа, отключив автопродление при наличии или не оплатив следующий период. Отмена не означает автоматический возврат уже оплаченного периода, если иное не предусмотрено настоящими Условиями, конкретной офертой или обязательным законом.',
        ],
      },
      {
        title: '7. Возвраты',
        paragraphs: [
          'Возвраты рассматриваются с учетом применимого закона, настоящих Условий, конкретного предложения и правил платежного провайдера. Возврат может быть возможен, если платная услуга не была активирована, существенно не использовалась или не могла быть предоставлена по вине LinkMAX.',
          'Если в конкретном предложении не указано иное, стандартный запрос возврата по покупке подписки следует направить в течение 14 календарных дней после оплаты. Активное использование платных функций, AI-генерации, настройки custom domain, публикации, CRM, интеграций или расходы провайдера могут уменьшить или исключить возврат в пределах, разрешенных законом.',
          `Для запроса возврата напишите на ${COMPANY_DETAILS.email} и укажите email аккаунта, дату платежа, сумму, способ оплаты или провайдера и причину. LinkMAX может запросить дополнительное подтверждение.`,
        ],
      },
      {
        title: '8. Продажи пользователя и возвраты его клиентам',
        paragraphs: [
          'Пользователь LinkMAX отвечает за своих клиентов, записи, товары, услуги, налоги, фискальные документы, правила возврата, отмены и претензии потребителей. LinkMAX не становится продавцом товаров или услуг пользователя, если это прямо не согласовано письменно.',
          'Если пользователь собирает предоплаты, event fees, инвойсы, tips или иные клиентские платежи через инструменты LinkMAX, он обязан ясно раскрыть собственные условия своим клиентам.',
        ],
      },
      {
        title: '9. Fraud, chargeback и приостановка',
        paragraphs: [
          'LinkMAX может приостановить доступ, payouts, платежные ссылки, инструменты монетизации или аккаунты при подозрении на мошенничество, злоупотребление, незаконную активность, chargeback, запрос провайдера, санкционные проверки или инциденты безопасности.',
          'Расходы по chargeback, возвратам и спорам могут удерживаться из доступных балансов или будущих выплат, если это поддерживается платежным потоком и разрешено законом.',
        ],
      },
      {
        title: '10. Изменения',
        paragraphs: [
          'LinkMAX может обновлять тарифы, цены, сборы, способы оплаты, провайдеров и настоящие Условия оплаты для будущих покупок или будущих платежных периодов. Обновленная версия вступает в силу с момента публикации, если не указана другая дата.',
        ],
      },
    ],
  };
}

function getLegalCopy(kind: LegalDocumentKind, lang: LegalLanguage, domain: string): LegalDocumentCopy {
  if (kind === 'privacy') {
    return buildPrivacyCopy(lang, domain);
  }

  if (kind === 'payment') {
    return buildPaymentCopy(lang, domain);
  }

  return buildTermsCopy(lang, domain);
}

function Title({ variant, children }: { variant: LegalContentVariant; children: ReactNode }) {
  if (variant === 'modal') {
    return <h2 className="text-lg font-semibold mb-4">{children}</h2>;
  }

  return <h1 className="text-3xl font-bold mb-6">{children}</h1>;
}

function SectionTitle({ variant, children }: { variant: LegalContentVariant; children: ReactNode }) {
  if (variant === 'modal') {
    return <h3 className="font-semibold mt-6 mb-2">{children}</h3>;
  }

  return <h2 className="text-2xl font-semibold mt-8 mb-4">{children}</h2>;
}

export function LegalDocumentContent({
  kind,
  language,
  variant = 'page',
}: {
  kind: LegalDocumentKind;
  language?: string;
  variant?: LegalContentVariant;
}) {
  const lang = normalizeLegalLanguage(language);
  const copy = getLegalCopy(kind, lang, getAppDomain());
  const paragraphClass = variant === 'modal' ? 'text-sm text-muted-foreground mb-2' : 'mb-2';
  const metaClass = variant === 'modal' ? 'mb-4 text-sm text-muted-foreground' : 'mb-6 text-muted-foreground';
  const listClass = variant === 'modal'
    ? 'list-disc pl-5 mb-3 space-y-1 text-sm text-muted-foreground'
    : 'list-disc pl-6 mb-4 space-y-1';

  return (
    <>
      <Title variant={variant}>{copy.title}</Title>
      <p className={metaClass}>{copy.meta}</p>

      {copy.intro?.map((paragraph) => (
        <p key={paragraph} className={variant === 'modal' ? paragraphClass : 'mb-6'}>
          {paragraph}
        </p>
      ))}

      {copy.sections.map((section) => (
        <section key={section.title}>
          <SectionTitle variant={variant}>{section.title}</SectionTitle>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className={paragraphClass}>
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className={listClass}>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

