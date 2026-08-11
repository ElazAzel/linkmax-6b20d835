import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAppDomain } from '@/lib/utils/url-helpers';

interface SEOLandingHeadProps {
  currentLanguage: string;
}

export function SEOLandingHead({ currentLanguage }: SEOLandingHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const language = currentLanguage.split('-')[0];
    const isRussian = language === 'ru';
    const isKazakh = language === 'kk';
    const locale = isRussian ? 'ru_RU' : isKazakh ? 'kk_KZ' : 'en_US';
    const domain = getAppDomain();

    // New positioning: Micro-Business OS - page builder + CRM + analytics
    const title = t(
      'seo.landing.title',
      isRussian
        ? 'LinkMAX — страницы, CRM и аналитика для микробизнеса'
        : isKazakh
          ? 'LinkMAX — беттер, CRM және аналитика микробизнеске'
          : 'LinkMAX — Pages, CRM & Analytics for Micro-Business'
    );
    document.title = title;

    // Helper to update or create meta tag
    const setMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to create link tag
    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang) link.hreflang = hreflang;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Clear meta description: OS + page builder + CRM + analytics
    const description = t(
      'seo.landing.description',
      isRussian
        ? 'Конструктор страниц для услуг: сайт-визитка, онлайн-запись, оплата, заявки в Telegram и мини-CRM. Запустите витрину и обработку клиентов в одном месте.'
        : isKazakh
          ? 'Қызметтерге арналған бет конструкторы: сайт-визитка, онлайн жазылу, төлем, Telegram өтінімдері және мини-CRM.'
          : 'Page builder for service businesses: business-card site, online booking, payments, Telegram leads, and mini-CRM in one place.'
    );
    setMetaTag('description', description);

    // Keywords: OS, CRM, page builder, analytics + link-in-bio for discoverability
    const keywords = t(
      'seo.landing.keywords',
      isRussian
        ? 'конструктор сайта для услуг, сайт визитка, онлайн запись, мини-CRM, CRM для малого бизнеса, заявки в Telegram, прием оплаты онлайн, link in bio, мини-сайт, linktree альтернатива, taplink альтернатива'
        : isKazakh
          ? 'қызметтерге сайт жасау, сайт-визитка, онлайн жазылу, мини-CRM, Telegram өтінімдері, онлайн төлем, link in bio, мини-сайт'
          : 'website builder for services, business card website, online booking, mini-CRM, Telegram leads, online payments, link in bio, mini-site, linktree alternative, taplink alternative'
    );
    setMetaTag('keywords', keywords);

    // Enhanced robots directives
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('bingbot', 'index, follow');

    // Author and publisher - use LinkMAX branding
    setMetaTag('author', 'LinkMAX');
    setMetaTag('publisher', 'LinkMAX');
    setMetaTag('application-name', 'LinkMAX');

    // Additional SEO meta tags
    setMetaTag('theme-color', '#0080ff');
    setMetaTag('format-detection', 'telephone=no');
    setMetaTag('mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    setMetaTag('apple-mobile-web-app-title', 'LinkMAX');

    // Font preload for performance
    const preloadFont = document.querySelector('link[rel="preload"][as="font"]');
    if (!preloadFont) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);
    }

    // Canonical: reflect the current language-prefixed route if present.
    const pathLang = (typeof window !== 'undefined'
      ? window.location.pathname.match(/^\/(ru|en|kk|uz)(\/|$)/)?.[1]
      : null);
    const canonicalPath = pathLang ? `/${pathLang}` : '/';
    const canonicalUrl = `${domain}${canonicalPath}`;
    setLinkTag('canonical', canonicalUrl);

    // Hreflang tags for international SEO — use clean path-based URLs
    setLinkTag('alternate', `${domain}/ru`, 'ru');
    setLinkTag('alternate', `${domain}/en`, 'en');
    setLinkTag('alternate', `${domain}/kk`, 'kk');
    setLinkTag('alternate', `${domain}/uz`, 'uz');
    setLinkTag('alternate', `${domain}/`, 'x-default');

    // Update html lang attribute
    document.documentElement.lang = ['ru','en','kk','uz'].includes(language) ? language : 'ru';

    // OG Image
    const ogImageUrl = `${domain}/og-image.png`;

    // Open Graph optimized for social sharing
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:site_name', 'LinkMAX', true);
    setMetaTag('og:locale', locale, true);
    setMetaTag('og:locale:alternate', isRussian ? 'en_US' : 'ru_RU', true);

    // OG Image with proper dimensions
    setMetaTag('og:image', ogImageUrl, true);
    setMetaTag('og:image:secure_url', ogImageUrl, true);
    setMetaTag('og:image:type', 'image/png', true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:image:alt', isRussian
      ? 'LinkMAX - операционная система для микробизнеса'
      : isKazakh
        ? 'LinkMAX - микробизнеске арналған ОЖ'
        : 'LinkMAX - The Micro-Business OS', true);

    // Twitter Cards
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImageUrl);
    setMetaTag('twitter:url', canonicalUrl);
    setMetaTag('twitter:image:alt', isRussian
      ? 'LinkMAX - операционная система для микробизнеса'
      : isKazakh
        ? 'LinkMAX - микробизнеске арналған ОЖ'
        : 'LinkMAX - The Micro-Business OS');
    setMetaTag('twitter:site', '@LinkMAX_app');
    setMetaTag('twitter:creator', '@LinkMAX_app');

    // JSON-LD Structured Data
    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"].seo-schema');
    existingJsonLd.forEach(el => el.remove());

    const pageLanguage = isRussian ? 'ru' : isKazakh ? 'kk' : 'en';

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${domain}/#organization`,
      name: 'LinkMAX',
      alternateName: ['LinkMAX.my', 'The Micro-Business OS'],
      url: `${domain}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${domain}/icon-512.png`,
        width: 512,
        height: 512,
      },
      sameAs: ['https://t.me/LinkMAX_app'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'admin@lnkmx.my',
        availableLanguage: ['ru', 'en', 'kk'],
      },
    };

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${domain}/#website`,
      name: 'LinkMAX - The Micro-Business OS',
      url: `${domain}/`,
      inLanguage: ['ru', 'en', 'kk'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${domain}/{username}`,
        },
        'query-input': 'required name=username',
      },
      publisher: {
        '@id': `${domain}/#organization`,
      },
    };

    // Updated to reflect OS positioning with multiple application categories
    const softwareAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'LinkMAX - The Micro-Business OS',
      url: `${domain}/`,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: [
        'Website Builder',
        'CRM Software',
        'Analytics Platform',
        'Link in Bio Tool',
      ],
      operatingSystem: 'Web',
      inLanguage: pageLanguage,
      description: description,
      featureList: isRussian
        ? [
          'Конструктор страниц для услуг',
          'Мини-CRM для управления заявками',
          'Аналитика кликов и конверсий',
          'Онлайн-бронирование',
          'Telegram-уведомления',
          '25+ готовых блоков',
        ]
        : [
          'Page builder for service businesses',
          'Mini-CRM for lead management',
          'Click and conversion analytics',
          'Online booking system',
          'Telegram notifications',
          '25+ ready-to-use blocks',
        ],
      offers: [
        {
          '@type': 'Offer',
          name: isRussian ? 'Бесплатный план' : isKazakh ? 'Тегін жоспар' : 'Free plan',
          price: '0',
          priceCurrency: 'KZT',
          availability: 'https://schema.org/InStock',
          url: `${domain}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '3045',
          priceCurrency: 'KZT',
          availability: 'https://schema.org/InStock',
          url: `${domain}/pricing`,
        },
      ],
      publisher: {
        '@id': `${domain}/#organization`,
      },
    };

    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${domain}/#homepage`,
      name: title,
      description: description,
      url: canonicalUrl,
      inLanguage: pageLanguage,
      isPartOf: {
        '@id': `${domain}/#website`,
      },
      about: [
        {
          '@type': 'Thing',
          name: isRussian ? 'Конструктор страниц' : 'Page Builder',
        },
        {
          '@type': 'Thing',
          name: isRussian ? 'CRM для малого бизнеса' : 'Small Business CRM',
        },
        {
          '@type': 'Thing',
          name: isRussian ? 'Аналитика сайта' : 'Website Analytics',
        },
      ],
      mainEntity: {
        '@id': `${domain}/#organization`,
      },
    };

    // Service schema to highlight CRM and page builder capabilities
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: isRussian
        ? 'LinkMAX - Операционная система для микробизнеса'
        : 'LinkMAX - The Micro-Business Operating System',
      serviceType: [
        isRussian ? 'Конструктор сайтов' : 'Website Builder',
        isRussian ? 'CRM система' : 'CRM System',
        isRussian ? 'Аналитическая платформа' : 'Analytics Platform',
      ],
      provider: {
        '@id': `${domain}/#organization`,
      },
      description: isRussian
        ? 'Платформа для бизнеса в услугах: конструктор страниц, встроенная CRM для заявок, онлайн-запись, оплата и аналитика.'
        : 'Platform for service businesses: page builder, built-in CRM for leads, online booking, payments, and analytics.',
      areaServed: {
        '@type': 'Place',
        name: 'Worldwide',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: isRussian ? 'Тарифные планы' : 'Pricing Plans',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Free',
            },
            price: '0',
            priceCurrency: 'KZT',
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Pro',
            },
            price: '3045',
            priceCurrency: 'KZT',
          },
        ],
      },
    };

    const faqItems = [
      { question: t('landing.faq.q1.question'), answer: t('landing.faq.q1.answer') },
      { question: t('landing.faq.q2.question'), answer: t('landing.faq.q2.answer') },
      { question: t('landing.faq.q3.question'), answer: t('landing.faq.q3.answer') },
      { question: t('landing.faq.q4.question'), answer: t('landing.faq.q4.answer') },
      { question: t('landing.faq.q5.question'), answer: t('landing.faq.q5.answer') },
      { question: t('landing.faq.q6.question'), answer: t('landing.faq.q6.answer') },
      { question: t('landing.faq.q7.question'), answer: t('landing.faq.q7.answer') },
      { question: t('landing.faq.q8.question'), answer: t('landing.faq.q8.answer') },
      { question: t('landing.faq.q9.question'), answer: t('landing.faq.q9.answer') },
      { question: t('landing.faq.q10.question'), answer: t('landing.faq.q10.answer') },
      { question: t('landing.faq.q11.question'), answer: t('landing.faq.q11.answer') },
      { question: t('landing.faq.q12.question'), answer: t('landing.faq.q12.answer') },
      { question: t('landing.faq.q13.question'), answer: t('landing.faq.q13.answer') },
      { question: t('landing.faq.q14.question'), answer: t('landing.faq.q14.answer') },
    ];

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems
        .filter((item) => item.question && item.answer)
        .map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'LinkMAX',
          item: `${domain}/`,
        },
      ],
    };

    // Insert JSON-LD scripts
    const schemas = [
      organizationSchema,
      websiteSchema,
      softwareAppSchema,
      webPageSchema,
      serviceSchema,
      faqSchema,
      breadcrumbSchema,
    ];
    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'seo-schema';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup
    return () => {
      document.title = 'LinkMAX - The Micro-Business OS';
      const schemasToRemove = document.querySelectorAll('script.seo-schema');
      schemasToRemove.forEach(el => el.remove());
    };
  }, [currentLanguage, t]);

  return null;
}
