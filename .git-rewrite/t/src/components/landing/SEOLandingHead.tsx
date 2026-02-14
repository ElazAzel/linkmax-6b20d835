import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOLandingHeadProps {
  currentLanguage: string;
}

export function SEOLandingHead({ currentLanguage }: SEOLandingHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const isRussian = currentLanguage === 'ru' || currentLanguage === 'kk';
    
    // Title
    const title = isRussian
      ? 'LinkMAX — AI-конструктор link-in-bio | Страница ссылок за 2 минуты'
      : 'LinkMAX — AI-Powered Link-in-Bio Builder | Create Your Bio Page in 2 Minutes';
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

    // Meta description
    const description = isRussian
      ? 'Создайте профессиональную страницу ссылок (link-in-bio) за 2 минуты с помощью AI. Линк в био для Instagram, TikTok, Telegram. Аналог Linktree и Taplink без комиссий. 20+ блоков, аналитика, CRM.'
      : 'Create a professional link-in-bio page in 2 minutes with AI. Bio link for Instagram, TikTok, Telegram. Linktree & Taplink alternative with 0% commission. 20+ blocks, analytics, CRM.';
    setMetaTag('description', description);

    // Keywords
    const keywords = isRussian
      ? 'link in bio, страница ссылок, линк в био, linktree альтернатива, taplink аналог, мини-лендинг, мультиссылка, ссылка в профиле, конструктор визиток, лендинг для эксперта'
      : 'link in bio, bio link, linktree alternative, taplink alternative, mini landing page, multilink, profile link, business card builder, landing page for experts';
    setMetaTag('keywords', keywords);

    // Robots
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Canonical
    setLinkTag('canonical', 'https://lnkmx.my/');

    // Hreflang tags
    setLinkTag('alternate', 'https://lnkmx.my/', 'ru');
    setLinkTag('alternate', 'https://lnkmx.my/', 'en');
    setLinkTag('alternate', 'https://lnkmx.my/', 'x-default');

    // Update html lang attribute
    document.documentElement.lang = currentLanguage === 'kk' ? 'kk' : currentLanguage === 'en' ? 'en' : 'ru';

    // Open Graph
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', 'https://lnkmx.my/', true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:site_name', 'LinkMAX', true);
    setMetaTag('og:locale', isRussian ? 'ru_RU' : 'en_US', true);
    setMetaTag('og:locale:alternate', isRussian ? 'en_US' : 'ru_RU', true);

    // Twitter
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:site', '@LinkMAX');

    // JSON-LD Structured Data
    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"].seo-schema');
    existingJsonLd.forEach(el => el.remove());

    // SoftwareApplication Schema
    const softwareAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'LinkMAX',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: isRussian
        ? 'AI-конструктор страниц link-in-bio для экспертов, фрилансеров и бизнеса'
        : 'AI-powered link-in-bio page builder for experts, freelancers, and businesses',
      url: 'https://lnkmx.my/',
      offers: [
        {
          '@type': 'Offer',
          name: 'Basic',
          price: '0',
          priceCurrency: 'USD',
          description: isRussian ? 'Бесплатный тариф навсегда' : 'Free forever plan'
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '3.15',
          priceCurrency: 'USD',
          billingIncrement: 'P1M',
          description: isRussian ? 'Для профессионалов' : 'For professionals'
        },
        {
          '@type': 'Offer',
          name: 'Business',
          price: '7.50',
          priceCurrency: 'USD',
          billingIncrement: 'P1M',
          description: isRussian ? 'Для команд и бизнеса' : 'For teams and businesses'
        }
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '1250',
        bestRating: '5'
      },
      featureList: isRussian
        ? ['AI-генерация контента', 'Аналитика кликов', 'CRM', '20+ типов блоков', 'Кастомные домены']
        : ['AI content generation', 'Click analytics', 'CRM', '20+ block types', 'Custom domains']
    };

    // Organization Schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LinkMAX',
      url: 'https://lnkmx.my/',
      logo: 'https://lnkmx.my/favicon.jpg',
      sameAs: [
        'https://twitter.com/LinkMAX',
        'https://t.me/linkmax'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['Russian', 'English', 'Kazakh']
      }
    };

    // WebSite Schema with SearchAction
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LinkMAX',
      url: 'https://lnkmx.my/',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://lnkmx.my/{username}'
        },
        'query-input': 'required name=username'
      }
    };

    // FAQPage Schema
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: t('landing.faq.q1.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q1.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q2.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q2.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q3.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q3.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q4.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q4.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q5.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q5.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q6.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q6.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q7.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q7.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q8.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q8.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q9.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q9.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q10.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q10.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q11.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q11.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q12.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q12.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q13.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q13.answer') }
        },
        {
          '@type': 'Question',
          name: t('landing.faq.q14.question'),
          acceptedAnswer: { '@type': 'Answer', text: t('landing.faq.q14.answer') }
        }
      ]
    };

    // Insert JSON-LD scripts
    const schemas = [softwareAppSchema, organizationSchema, websiteSchema, faqSchema];
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'seo-schema';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup
    return () => {
      document.title = 'LinkMAX - AI-Powered Link-in-Bio Platform';
      const schemasToRemove = document.querySelectorAll('script.seo-schema');
      schemasToRemove.forEach(el => el.remove());
    };
  }, [currentLanguage, t]);

  return null;
}
