import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOLandingHeadProps {
  currentLanguage: string;
}

export function SEOLandingHead({ currentLanguage }: SEOLandingHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const isRussian = currentLanguage === 'ru';
    const isKazakh = currentLanguage === 'kk';
    const locale = isRussian ? 'ru_RU' : isKazakh ? 'kk_KZ' : 'en_US';
    
    // New positioning: Micro-Business OS - page builder + CRM + analytics
    const title = t(
      'seo.landing.title',
      isRussian
        ? 'lnkmx - операционная система для микробизнеса | Конструктор страниц + CRM'
        : isKazakh
          ? 'lnkmx - микробизнеске арналған операциялық жүйе | Бет конструкторы + CRM'
          : 'lnkmx - The Micro-Business OS | Page Builder + CRM + Analytics'
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
        ? 'lnkmx - операционная система для микробизнеса. Конструктор страниц, мини-CRM, аналитика и AI-генерация. Создайте сайт, принимайте заявки и управляйте клиентами в одном месте.'
        : isKazakh
          ? 'lnkmx - микробизнеске арналған операциялық жүйе. Бет конструкторы, мини-CRM, аналитика және AI. Сайт жасаңыз, өтінімдер алыңыз және клиенттерді бір жерде басқарыңыз.'
          : 'lnkmx - The Micro-Business OS. Page builder, mini-CRM, analytics, and AI generation. Build your site, capture leads, and manage clients in one place.'
    );
    setMetaTag('description', description);

    // Keywords: OS, CRM, page builder, analytics + link-in-bio for discoverability
    const keywords = t(
      'seo.landing.keywords',
      isRussian
        ? 'операционная система для бизнеса, конструктор страниц, мини-CRM, CRM для малого бизнеса, аналитика сайта, AI конструктор, link in bio, мини-сайт, linktree альтернатива, taplink альтернатива, сайт визитка'
        : isKazakh
          ? 'бизнеске арналған ОЖ, бет конструкторы, мини-CRM, шағын бизнес CRM, сайт аналитикасы, AI конструктор, link in bio, мини-сайт, linktree баламасы'
          : 'micro-business OS, page builder, mini-CRM, small business CRM, website analytics, AI builder, link in bio, mini-site, linktree alternative, taplink alternative, business card website'
    );
    setMetaTag('keywords', keywords);

    // Enhanced robots directives
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('bingbot', 'index, follow');

    // Author and publisher - use lnkmx branding
    setMetaTag('author', 'lnkmx');
    setMetaTag('publisher', 'lnkmx');
    setMetaTag('application-name', 'lnkmx');
    
    // Additional SEO meta tags
    setMetaTag('theme-color', '#0080ff');
    setMetaTag('format-detection', 'telephone=no');
    setMetaTag('mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    setMetaTag('apple-mobile-web-app-title', 'lnkmx');

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

    // Canonical
    setLinkTag('canonical', 'https://lnkmx.my/');

    // Hreflang tags for international SEO
    setLinkTag('alternate', 'https://lnkmx.my/?lang=ru', 'ru');
    setLinkTag('alternate', 'https://lnkmx.my/?lang=en', 'en');
    setLinkTag('alternate', 'https://lnkmx.my/?lang=kk', 'kk');
    setLinkTag('alternate', 'https://lnkmx.my/', 'x-default');

    // Update html lang attribute
    document.documentElement.lang = currentLanguage === 'kk' ? 'kk' : currentLanguage === 'en' ? 'en' : 'ru';

    // OG Image
    const ogImageUrl = 'https://lnkmx.my/og-image.png';
    
    // Open Graph optimized for social sharing
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', 'https://lnkmx.my/', true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:site_name', 'lnkmx', true);
    setMetaTag('og:locale', locale, true);
    setMetaTag('og:locale:alternate', isRussian ? 'en_US' : 'ru_RU', true);
    
    // OG Image with proper dimensions
    setMetaTag('og:image', ogImageUrl, true);
    setMetaTag('og:image:secure_url', ogImageUrl, true);
    setMetaTag('og:image:type', 'image/png', true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:image:alt', isRussian 
      ? 'lnkmx - операционная система для микробизнеса' 
      : isKazakh 
        ? 'lnkmx - микробизнеске арналған ОЖ'
        : 'lnkmx - The Micro-Business OS', true);

    // Twitter Cards
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImageUrl);
    setMetaTag('twitter:image:alt', isRussian 
      ? 'lnkmx - операционная система для микробизнеса' 
      : isKazakh 
        ? 'lnkmx - микробизнеске арналған ОЖ'
        : 'lnkmx - The Micro-Business OS');
    setMetaTag('twitter:site', '@lnkmx_app');
    setMetaTag('twitter:creator', '@lnkmx_app');

    // JSON-LD Structured Data
    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"].seo-schema');
    existingJsonLd.forEach(el => el.remove());

    const pageLanguage = isRussian ? 'ru' : isKazakh ? 'kk' : 'en';

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://lnkmx.my/#organization',
      name: 'lnkmx',
      alternateName: ['lnkmx.my', 'The Micro-Business OS'],
      url: 'https://lnkmx.my/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lnkmx.my/favicon.jpg',
        width: 512,
        height: 512,
      },
      sameAs: ['https://t.me/lnkmx_app'],
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
      '@id': 'https://lnkmx.my/#website',
      name: 'lnkmx - The Micro-Business OS',
      url: 'https://lnkmx.my/',
      inLanguage: ['ru', 'en', 'kk'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://lnkmx.my/{username}',
        },
        'query-input': 'required name=username',
      },
      publisher: {
        '@id': 'https://lnkmx.my/#organization',
      },
    };

    // Updated to reflect OS positioning with multiple application categories
    const softwareAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'lnkmx - The Micro-Business OS',
      url: 'https://lnkmx.my/',
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
            'Конструктор страниц с AI',
            'Мини-CRM для управления заявками',
            'Аналитика кликов и конверсий',
            'Онлайн-бронирование',
            'Telegram-уведомления',
            '25+ готовых блоков',
          ]
        : [
            'AI-powered page builder',
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
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://lnkmx.my/pricing',
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '2.61',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://lnkmx.my/pricing',
        },
      ],
      publisher: {
        '@id': 'https://lnkmx.my/#organization',
      },
    };

    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://lnkmx.my/#homepage',
      name: title,
      description: description,
      url: 'https://lnkmx.my/',
      inLanguage: pageLanguage,
      isPartOf: {
        '@id': 'https://lnkmx.my/#website',
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
        '@id': 'https://lnkmx.my/#organization',
      },
    };

    // Service schema to highlight CRM and page builder capabilities
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: isRussian 
        ? 'lnkmx - Операционная система для микробизнеса'
        : 'lnkmx - The Micro-Business Operating System',
      serviceType: [
        isRussian ? 'Конструктор сайтов' : 'Website Builder',
        isRussian ? 'CRM система' : 'CRM System',
        isRussian ? 'Аналитическая платформа' : 'Analytics Platform',
      ],
      provider: {
        '@id': 'https://lnkmx.my/#organization',
      },
      description: isRussian
        ? 'Полноценная платформа для микробизнеса: конструктор страниц с AI, встроенная CRM для управления заявками, аналитика и автоматизация.'
        : 'Complete platform for micro-businesses: AI page builder, built-in CRM for lead management, analytics, and automation.',
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
            price: '2900',
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
          name: 'lnkmx',
          item: 'https://lnkmx.my/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isRussian ? 'Тарифы' : isKazakh ? 'Тарифтер' : 'Pricing',
          item: 'https://lnkmx.my/pricing',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: isRussian ? 'Галерея' : isKazakh ? 'Галерея' : 'Gallery',
          item: 'https://lnkmx.my/gallery',
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
      document.title = 'lnkmx - The Micro-Business OS';
      const schemasToRemove = document.querySelectorAll('script.seo-schema');
      schemasToRemove.forEach(el => el.remove());
    };
  }, [currentLanguage, t]);

  return null;
}
