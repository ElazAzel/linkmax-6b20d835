import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  language: string;
}

/**
 * SEOHead - Manages all meta tags, structured data, and bot-content
 * All content is injected into <head>, completely hidden from users
 * - Meta tags: description, keywords, robots, etc.
 * - Open Graph: for social media sharing
 * - Twitter Card: for Twitter sharing
 * - JSON-LD: structured data for search engines
 */
export default function SEOHead({ language }: SEOHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const isRussian = language === 'ru';
    const isKazakh = language === 'kk';
    const locale = isRussian ? 'ru_RU' : isKazakh ? 'kk_KZ' : 'en_US';
    
    // Titles optimized for CTR and clarity - Micro-Business OS positioning
    const titles = {
      ru: 'lnkmx - Micro-Business OS | Конструктор страниц + CRM для бизнеса',
      en: 'lnkmx - Micro-Business OS | Page Builder + CRM for Business',
      kk: 'lnkmx - Micro-Business OS | Бет конструкторы + CRM бизнеске',
    };
    
    const descriptions = {
      ru: 'Операционная система для микро-бизнеса: AI-конструктор страниц, встроенная CRM, форма заявок и Telegram-уведомления. Запустите бизнес за 2 минуты без кода.',
      en: 'Operating system for micro-business: AI page builder, built-in CRM, lead forms and Telegram notifications. Launch your business in 2 minutes with no code.',
      kk: 'Микро-бизнес үшін операциялық жүйе: AI бет конструкторы, ішкі CRM, өтініш формасы және Telegram хабарламалары. Бизнесті 2 минутта кодсыз бастаңыз.',
    };

    const title = titles[language as keyof typeof titles] || titles.ru;
    const description = descriptions[language as keyof typeof descriptions] || descriptions.ru;
    
    document.title = title;

    const setMeta = (name: string, content: string, isProp = false) => {
      const attr = isProp ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let el = document.querySelector(selector) as HTMLLinkElement;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        if (hreflang) el.hreflang = hreflang;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // Core meta - HIDDEN IN HEAD
    setMeta('description', description);
    setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('author', 'lnkmx');
    setMeta('theme-color', '#0080ff');
    setMeta('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    
    // Additional security and performance meta tags - HIDDEN IN HEAD
    setMeta('x-ua-compatible', 'IE=edge');
    setMeta('format-detection', 'telephone=no');

    // Keywords for each language - HIDDEN IN HEAD
    // Extended with long-tail keywords for better targeting
    const keywords = {
      ru: 'micro business os, crm для малого бизнеса, конструктор страниц бесплатно, link in bio, мини-сайт, сайт-визитка, linktree альтернатива, taplink альтернатива, бесплатная crm, как создать сайт-визитку, сайт для небольшого бизнеса, ai конструктор сайтов, telegram интеграция, управление заявками',
      en: 'micro business os, small business crm, page builder no code, link in bio, mini-site, business card website, linktree alternative, taplink alternative, free crm, create business site, ai website builder, telegram integration, lead management',
      kk: 'micro business os, шағын бизнес crm, бет конструкторы бәс, link in bio, мини-сайт, сайт-визитка, linktree баламасы, taplink баламасы, telegram интеграциясы, өтініш басқару',
    };
    setMeta('keywords', keywords[language as keyof typeof keywords] || keywords.ru);

    // Canonical & hreflang - HIDDEN IN HEAD
    setLink('canonical', 'https://lnkmx.my/');
    setLink('alternate', 'https://lnkmx.my/?lang=ru', 'ru');
    setLink('alternate', 'https://lnkmx.my/?lang=en', 'en');
    setLink('alternate', 'https://lnkmx.my/?lang=kk', 'kk');
    setLink('alternate', 'https://lnkmx.my/', 'x-default');

    // Update html lang - NOT IN HEAD, but global
    document.documentElement.lang = language === 'kk' ? 'kk' : language === 'en' ? 'en' : 'ru';

    // Open Graph - HIDDEN IN HEAD (used only when shared on social media)
    const ogImage = 'https://lnkmx.my/og-image.png';
    setMeta('og:type', 'website', true);
    setMeta('og:url', 'https://lnkmx.my/', true);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:site_name', 'lnkmx', true);
    setMeta('og:locale', locale, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:image:type', 'image/png', true);

    // Twitter - HIDDEN IN HEAD (used only when shared on Twitter)
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);
    setMeta('twitter:site', '@lnkmx_app');
    setMeta('twitter:creator', '@lnkmx_app');

    // Additional meta for LinkedIn
    setMeta('linkedin:title', title);
    setMeta('linkedin:description', description);

    // JSON-LD Structured Data - HIDDEN IN HEAD (type: application/ld+json prevents rendering)
    const existingSchemas = document.querySelectorAll('script.landing-schema');
    existingSchemas.forEach(el => el.remove());

    const faqItems = [
      {
        question: t('landingV5.faq.q1.question'),
        answer: t('landingV5.faq.q1.answer'),
      },
      {
        question: t('landingV5.faq.q2.question'),
        answer: t('landingV5.faq.q2.answer'),
      },
      {
        question: t('landingV5.faq.q3.question'),
        answer: t('landingV5.faq.q3.answer'),
      },
    ];

    // All schemas are type="application/ld+json" which prevents them from being rendered as text
    const schemas = [
      // Organization - HIDDEN IN HEAD
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://lnkmx.my/#organization',
        name: 'lnkmx',
        url: 'https://lnkmx.my/',
        logo: 'https://lnkmx.my/favicon.jpg',
        sameAs: ['https://t.me/lnkmx_app'],
        description: description,
      },
      // WebSite with SearchAction - HIDDEN IN HEAD
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://lnkmx.my/#website',
        name: 'lnkmx',
        url: 'https://lnkmx.my/',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://lnkmx.my/{username}',
          'query-input': 'required name=username',
        },
        inLanguage: language,
      },
      // SoftwareApplication - positioned as Micro-Business OS - HIDDEN IN HEAD
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'lnkmx - Micro-Business OS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: description,
        url: 'https://lnkmx.my/',
        image: ogImage,
        featureList: [
          'AI Page Builder',
          'CRM',
          'Lead Management',
          'Telegram Notifications',
          'Analytics',
          'Booking System',
          'Forms',
          'Multi-language Support'
        ],
        offers: [
          {
            '@type': 'Offer',
            name: 'Free Plan',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            category: 'SaaS'
          },
          {
            '@type': 'Offer',
            name: 'Pro Plan',
            price: '5',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            category: 'SaaS'
          },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '150',
          bestRating: '5',
          worstRating: '1'
        },
      },
      // FAQPage - HIDDEN IN HEAD
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      // BreadcrumbList - HIDDEN IN HEAD
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://lnkmx.my/'
          }
        ]
      }
    ];

    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json'; // This prevents browser from rendering it as text
      script.className = 'landing-schema'; // Class for easy cleanup
      // Using textContent prevents XSS and ensures proper escaping
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script.landing-schema').forEach(el => el.remove());
    };
  }, [language, t]);

  // This component renders nothing - all content is injected into <head>
  return null;
}
