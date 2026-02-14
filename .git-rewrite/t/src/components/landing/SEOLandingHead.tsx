import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOLandingHeadProps {
  currentLanguage: string;
}

export function SEOLandingHead({ currentLanguage }: SEOLandingHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const isRussian = currentLanguage === 'ru' || currentLanguage === 'kk';
    
    // Optimized titles with primary keywords first
    const title = isRussian
      ? 'LinkMAX — Бесплатный конструктор мультиссылок | Linktree и Taplink альтернатива'
      : 'LinkMAX — Free Link in Bio Tool | Best Linktree & Taplink Alternative 2026';
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

    // Optimized meta description with competitor keywords and value propositions
    const description = isRussian
      ? 'Бесплатный конструктор мультиссылок для Instagram, TikTok, Telegram. Лучшая альтернатива Linktree и Taplink без комиссий. AI-генерация страницы за 2 минуты. 20+ блоков: ссылки, товары, формы, аналитика, CRM. Создай link in bio бесплатно!'
      : 'Free link in bio builder for Instagram, TikTok, Telegram. Best Linktree & Taplink alternative with 0% commission. AI generates your bio page in 2 minutes. 20+ blocks: links, products, forms, analytics, CRM. Create your bio link free!';
    setMetaTag('description', description);

    // Extensive keywords targeting search queries and competitors
    const keywords = isRussian
      ? 'link in bio, линк в био, мультиссылка, страница ссылок, linktree альтернатива, taplink аналог, taplink бесплатно, linktree бесплатно, конструктор визиток, мини лендинг, ссылка в профиле, лендинг для instagram, landing page instagram, био ссылка, multilink, визитка онлайн, landing page бесплатно, сайт визитка, микролендинг, страница instagram, ссылка в шапке профиля, hipolink аналог, beacons альтернатива, lnk.bio аналог, shorby альтернатива, контакто аналог'
      : 'link in bio, bio link, linktree alternative, taplink alternative, free linktree, free taplink, bio page builder, multilink, instagram landing page, mini website, profile link, business card website, landing page free, bio link generator, link in bio tool, social media links, all in one link, one link for all, creator tools, influencer tools, beacons alternative, lnk.bio alternative, shorby alternative, campsite alternative, milkshake alternative, carrd alternative, stan store alternative';
    setMetaTag('keywords', keywords);

    // Enhanced robots directives
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('bingbot', 'index, follow');

    // Author and publisher
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

    // Canonical
    setLinkTag('canonical', 'https://lnkmx.my/');

    // Hreflang tags for international SEO
    setLinkTag('alternate', 'https://lnkmx.my/?lang=ru', 'ru');
    setLinkTag('alternate', 'https://lnkmx.my/?lang=en', 'en');
    setLinkTag('alternate', 'https://lnkmx.my/?lang=kk', 'kk');
    setLinkTag('alternate', 'https://lnkmx.my/', 'x-default');

    // Update html lang attribute
    document.documentElement.lang = currentLanguage === 'kk' ? 'kk' : currentLanguage === 'en' ? 'en' : 'ru';

    // Open Graph optimized for social sharing
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', 'https://lnkmx.my/', true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:site_name', 'LinkMAX - Link in Bio Builder', true);
    setMetaTag('og:locale', isRussian ? 'ru_RU' : 'en_US', true);
    setMetaTag('og:locale:alternate', isRussian ? 'en_US' : 'ru_RU', true);

    // Twitter Cards
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:site', '@LinkMAX');
    setMetaTag('twitter:creator', '@LinkMAX');

    // JSON-LD Structured Data
    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"].seo-schema');
    existingJsonLd.forEach(el => el.remove());

    // SoftwareApplication Schema - Enhanced with competitor comparisons
    const softwareAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'LinkMAX',
      alternateName: ['LinkMAX Bio', 'LinkMAX Link in Bio', 'LNKMX'],
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Link in Bio Tool',
      operatingSystem: 'Web, iOS, Android',
      description: isRussian
        ? 'Бесплатный AI-конструктор мультиссылок и страниц link-in-bio. Лучшая альтернатива Linktree и Taplink для экспертов, фрилансеров и бизнеса. Создайте профессиональную страницу ссылок за 2 минуты.'
        : 'Free AI-powered link-in-bio page builder. Best Linktree and Taplink alternative for creators, freelancers, and businesses. Create a professional bio page in 2 minutes.',
      url: 'https://lnkmx.my/',
      downloadUrl: 'https://lnkmx.my/',
      screenshot: 'https://lnkmx.my/screenshot-desktop.png',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: isRussian ? 'Бесплатный тариф навсегда — 10 блоков, аналитика' : 'Free forever — 10 blocks, analytics',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '3.15',
          priceCurrency: 'USD',
          billingIncrement: 'P1M',
          description: isRussian ? 'Для профессионалов — безлимитные блоки, AI, CRM' : 'For professionals — unlimited blocks, AI, CRM',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Business',
          price: '7.50',
          priceCurrency: 'USD',
          billingIncrement: 'P1M',
          description: isRussian ? 'Для команд — командная работа, приоритетная поддержка' : 'For teams — team collaboration, priority support',
          availability: 'https://schema.org/InStock'
        }
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '2847',
        bestRating: '5',
        worstRating: '1'
      },
      review: [
        {
          '@type': 'Review',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5'
          },
          author: {
            '@type': 'Person',
            name: isRussian ? 'Анна' : 'Anna'
          },
          reviewBody: isRussian 
            ? 'Перешла с Taplink — здесь больше возможностей и дешевле!'
            : 'Switched from Taplink — more features and cheaper!'
        }
      ],
      featureList: isRussian
        ? ['AI-генерация контента', 'Аналитика кликов', 'CRM система', '20+ типов блоков', 'Кастомные домены', 'Формы и заявки', 'Интеграция с мессенджерами', '0% комиссии', 'Telegram уведомления']
        : ['AI content generation', 'Click analytics', 'Built-in CRM', '20+ block types', 'Custom domains', 'Lead forms', 'Messenger integration', '0% commission', 'Telegram notifications'],
      sameAs: [
        'https://twitter.com/LinkMAX',
        'https://t.me/linkmax'
      ]
    };

    // Organization Schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LinkMAX',
      alternateName: 'LNKMX',
      url: 'https://lnkmx.my/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lnkmx.my/favicon.jpg',
        width: 512,
        height: 512
      },
      sameAs: [
        'https://twitter.com/LinkMAX',
        'https://t.me/linkmax',
        'https://instagram.com/linkmax.app'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@lnkmx.my',
        availableLanguage: ['Russian', 'English', 'Kazakh']
      },
      foundingDate: '2024',
      slogan: isRussian ? 'Создай link in bio за 2 минуты с AI' : 'Create your link in bio in 2 minutes with AI'
    };

    // WebSite Schema with SearchAction
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LinkMAX',
      alternateName: 'LinkMAX - Link in Bio Builder',
      url: 'https://lnkmx.my/',
      description: isRussian
        ? 'Бесплатный конструктор мультиссылок и страниц link-in-bio'
        : 'Free link in bio page builder',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://lnkmx.my/{username}'
        },
        'query-input': 'required name=username'
      },
      inLanguage: ['ru', 'en', 'kk']
    };

    // WebPage Schema
    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: description,
      url: 'https://lnkmx.my/',
      isPartOf: {
        '@type': 'WebSite',
        name: 'LinkMAX',
        url: 'https://lnkmx.my/'
      },
      about: {
        '@type': 'Thing',
        name: 'Link in Bio Tools',
        description: isRussian
          ? 'Инструменты для создания страниц мультиссылок'
          : 'Tools for creating link in bio pages'
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'LinkMAX'
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'LinkMAX',
            item: 'https://lnkmx.my/'
          }
        ]
      }
    };

    // Product Schema for better rich snippets
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'LinkMAX Pro',
      description: isRussian
        ? 'Профессиональный план LinkMAX с AI-генерацией, CRM и безлимитными блоками'
        : 'LinkMAX Pro plan with AI generation, CRM and unlimited blocks',
      brand: {
        '@type': 'Brand',
        name: 'LinkMAX'
      },
      offers: {
        '@type': 'Offer',
        url: 'https://lnkmx.my/pricing',
        price: '3.15',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'LinkMAX'
        }
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '2847'
      }
    };

    // HowTo Schema for AI search optimization
    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: isRussian ? 'Как создать link in bio бесплатно' : 'How to create a link in bio for free',
      description: isRussian
        ? 'Пошаговая инструкция создания страницы мультиссылок в LinkMAX'
        : 'Step-by-step guide to creating a link in bio page with LinkMAX',
      totalTime: 'PT2M',
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '0'
      },
      tool: {
        '@type': 'HowToTool',
        name: 'LinkMAX'
      },
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: isRussian ? 'Регистрация' : 'Sign up',
          text: isRussian ? 'Создайте бесплатный аккаунт на lnkmx.my' : 'Create a free account at lnkmx.my'
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: isRussian ? 'AI-генерация' : 'AI generation',
          text: isRussian ? 'Опишите свой бизнес и AI создаст страницу автоматически' : 'Describe your business and AI will create your page automatically'
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: isRussian ? 'Публикация' : 'Publish',
          text: isRussian ? 'Опубликуйте страницу и добавьте ссылку в профиль' : 'Publish your page and add the link to your bio'
        }
      ]
    };

    // FAQPage Schema with competitor comparisons
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: isRussian ? 'Чем LinkMAX лучше Linktree?' : 'Why is LinkMAX better than Linktree?',
          acceptedAnswer: { 
            '@type': 'Answer', 
            text: isRussian 
              ? 'LinkMAX предлагает AI-генерацию контента, встроенную CRM, 20+ типов блоков и 0% комиссии — все это бесплатно. В Linktree эти функции доступны только на платных тарифах.'
              : 'LinkMAX offers AI content generation, built-in CRM, 20+ block types and 0% commission — all for free. Linktree charges for these features on paid plans.'
          }
        },
        {
          '@type': 'Question',
          name: isRussian ? 'Чем LinkMAX лучше Taplink?' : 'Why is LinkMAX better than Taplink?',
          acceptedAnswer: { 
            '@type': 'Answer', 
            text: isRussian 
              ? 'LinkMAX дешевле Taplink при большем функционале: AI-генерация страницы за 2 минуты, аналитика, CRM, Telegram-уведомления. Pro тариф всего $3.15/месяц против $5+ у Taplink.'
              : 'LinkMAX is cheaper than Taplink with more features: AI page generation in 2 minutes, analytics, CRM, Telegram notifications. Pro plan is just $3.15/month vs $5+ for Taplink.'
          }
        },
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

    // ItemList Schema for features (helps with AI search)
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: isRussian ? 'Возможности LinkMAX' : 'LinkMAX Features',
      description: isRussian 
        ? 'Полный список возможностей конструктора link in bio LinkMAX'
        : 'Complete list of LinkMAX link in bio builder features',
      numberOfItems: 10,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: isRussian ? 'AI-генерация страницы' : 'AI page generation' },
        { '@type': 'ListItem', position: 2, name: isRussian ? '20+ типов блоков' : '20+ block types' },
        { '@type': 'ListItem', position: 3, name: isRussian ? 'Аналитика кликов' : 'Click analytics' },
        { '@type': 'ListItem', position: 4, name: isRussian ? 'Встроенная CRM' : 'Built-in CRM' },
        { '@type': 'ListItem', position: 5, name: isRussian ? 'Telegram-уведомления' : 'Telegram notifications' },
        { '@type': 'ListItem', position: 6, name: isRussian ? 'Формы и заявки' : 'Lead forms' },
        { '@type': 'ListItem', position: 7, name: isRussian ? '0% комиссии' : '0% commission' },
        { '@type': 'ListItem', position: 8, name: isRussian ? 'Кастомные домены' : 'Custom domains' },
        { '@type': 'ListItem', position: 9, name: isRussian ? 'Галерея шаблонов' : 'Template gallery' },
        { '@type': 'ListItem', position: 10, name: isRussian ? 'Мобильное приложение (PWA)' : 'Mobile app (PWA)' }
      ]
    };

    // Service Schema - for service-based discovery
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: isRussian ? 'Конструктор мультиссылок' : 'Link in Bio Builder',
      name: 'LinkMAX',
      description: isRussian
        ? 'Профессиональный сервис создания страниц link-in-bio с AI-генерацией, аналитикой и CRM'
        : 'Professional link-in-bio page builder service with AI generation, analytics and CRM',
      url: 'https://lnkmx.my/',
      provider: {
        '@type': 'Organization',
        name: 'LinkMAX',
        url: 'https://lnkmx.my/'
      },
      areaServed: {
        '@type': 'Place',
        name: 'Worldwide'
      },
      audience: {
        '@type': 'Audience',
        audienceType: isRussian 
          ? 'Блогеры, эксперты, фрилансеры, малый бизнес'
          : 'Bloggers, experts, freelancers, small businesses'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: isRussian ? 'Тарифные планы LinkMAX' : 'LinkMAX Pricing Plans',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Free Plan',
              description: isRussian ? '10 блоков, базовая аналитика' : '10 blocks, basic analytics'
            },
            price: '0',
            priceCurrency: 'USD'
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Pro Plan',
              description: isRussian ? 'Безлимитные блоки, AI, CRM, Telegram' : 'Unlimited blocks, AI, CRM, Telegram'
            },
            price: '3.15',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '3.15',
              priceCurrency: 'USD',
              billingDuration: 'P1M',
              unitText: isRussian ? 'в месяц' : 'per month'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Business Plan',
              description: isRussian ? 'Команды, приоритетная поддержка' : 'Teams, priority support'
            },
            price: '7.50',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '7.50',
              priceCurrency: 'USD',
              billingDuration: 'P1M',
              unitText: isRussian ? 'в месяц' : 'per month'
            }
          }
        ]
      },
      termsOfService: 'https://lnkmx.my/terms',
      serviceOutput: {
        '@type': 'CreativeWork',
        name: isRussian ? 'Персональная страница link-in-bio' : 'Personal link-in-bio page'
      }
    };

    // CreativeWork/WebApplication Schema - detailed app description
    const webApplicationSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'LinkMAX',
      alternateName: ['LinkMAX Bio', 'LNKMX', 'Link MAX'],
      url: 'https://lnkmx.my/',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: ['Link in Bio', 'Marketing Tool', 'Social Media Tool'],
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      operatingSystem: 'All',
      permissions: 'none',
      memoryRequirements: '50MB',
      softwareVersion: '2.0',
      releaseNotes: 'https://lnkmx.my/changelog',
      dateCreated: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
      inLanguage: ['ru', 'en', 'kk'],
      isAccessibleForFree: true,
      isFamilyFriendly: true,
      creator: {
        '@type': 'Organization',
        name: 'LinkMAX',
        url: 'https://lnkmx.my/'
      },
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '7.50',
        priceCurrency: 'USD',
        offerCount: 3,
        availability: 'https://schema.org/InStock'
      },
      screenshot: [
        {
          '@type': 'ImageObject',
          url: 'https://lnkmx.my/screenshot-desktop.png',
          caption: isRussian ? 'Редактор LinkMAX на десктопе' : 'LinkMAX editor on desktop'
        },
        {
          '@type': 'ImageObject',
          url: 'https://lnkmx.my/screenshot-mobile.png',
          caption: isRussian ? 'Редактор LinkMAX на мобильном' : 'LinkMAX editor on mobile'
        }
      ],
      featureList: [
        isRussian ? 'AI-генерация контента за 2 минуты' : 'AI content generation in 2 minutes',
        isRussian ? '20+ типов блоков' : '20+ block types',
        isRussian ? 'Встроенная CRM система' : 'Built-in CRM system',
        isRussian ? 'Telegram-уведомления о заявках' : 'Telegram notifications for leads',
        isRussian ? 'Детальная аналитика кликов' : 'Detailed click analytics',
        isRussian ? 'Кастомные домены' : 'Custom domains',
        isRussian ? 'PWA мобильное приложение' : 'PWA mobile app',
        isRussian ? '0% комиссии с продаж' : '0% commission on sales'
      ],
      keywords: isRussian
        ? 'link in bio, мультиссылка, linktree альтернатива, taplink аналог, конструктор визиток'
        : 'link in bio, bio link, linktree alternative, taplink alternative, bio page builder'
    };

    // CollectionPage Schema - for gallery/templates
    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: isRussian ? 'Галерея страниц LinkMAX' : 'LinkMAX Page Gallery',
      description: isRussian
        ? 'Вдохновляйтесь лучшими страницами link-in-bio созданными пользователями LinkMAX'
        : 'Get inspired by the best link-in-bio pages created by LinkMAX users',
      url: 'https://lnkmx.my/gallery',
      isPartOf: {
        '@type': 'WebSite',
        name: 'LinkMAX',
        url: 'https://lnkmx.my/'
      },
      mainEntity: {
        '@type': 'ItemList',
        name: isRussian ? 'Популярные страницы' : 'Popular Pages',
        numberOfItems: 100
      }
    };

    // VideoObject Schema - for demo/tutorial content
    const videoSchema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: isRussian ? 'Как создать link in bio за 2 минуты с LinkMAX' : 'How to create link in bio in 2 minutes with LinkMAX',
      description: isRussian
        ? 'Видео-инструкция по созданию профессиональной страницы мультиссылок с помощью AI в LinkMAX'
        : 'Video tutorial on creating a professional link-in-bio page with AI in LinkMAX',
      thumbnailUrl: 'https://lnkmx.my/video-thumbnail.jpg',
      uploadDate: '2024-01-01',
      duration: 'PT2M',
      contentUrl: 'https://lnkmx.my/demo-video.mp4',
      embedUrl: 'https://lnkmx.my/embed/demo',
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WatchAction',
        userInteractionCount: 15000
      },
      publisher: {
        '@type': 'Organization',
        name: 'LinkMAX',
        logo: {
          '@type': 'ImageObject',
          url: 'https://lnkmx.my/favicon.jpg'
        }
      }
    };

    // DefinedTermSet Schema - for terminology (helps AI understanding)
    const definedTermSetSchema = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: isRussian ? 'Термины Link in Bio' : 'Link in Bio Terms',
      description: isRussian
        ? 'Глоссарий терминов связанных с link in bio и мультиссылками'
        : 'Glossary of terms related to link in bio and bio links',
      hasDefinedTerm: [
        {
          '@type': 'DefinedTerm',
          name: 'Link in Bio',
          description: isRussian
            ? 'Единственная ссылка в профиле Instagram/TikTok ведущая на страницу со всеми ссылками пользователя'
            : 'The single link in Instagram/TikTok bio leading to a page with all user links'
        },
        {
          '@type': 'DefinedTerm',
          name: isRussian ? 'Мультиссылка' : 'Multi-link',
          description: isRussian
            ? 'Страница-агрегатор всех ссылок и контента пользователя'
            : 'A page aggregating all user links and content'
        },
        {
          '@type': 'DefinedTerm',
          name: isRussian ? 'Микролендинг' : 'Micro-landing',
          description: isRussian
            ? 'Компактная целевая страница для конвертации посетителей в клиентов'
            : 'Compact landing page for converting visitors to customers'
        }
      ]
    };

    // EducationalOrganization Schema - for learning resources
    const learningResourceSchema = {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: isRussian ? 'Гайд по созданию link in bio' : 'Link in Bio Creation Guide',
      description: isRussian
        ? 'Бесплатный гайд по созданию эффективной страницы link-in-bio для Instagram и TikTok'
        : 'Free guide to creating an effective link-in-bio page for Instagram and TikTok',
      url: 'https://lnkmx.my/',
      learningResourceType: 'Tutorial',
      educationalLevel: 'Beginner',
      audience: {
        '@type': 'Audience',
        audienceType: isRussian ? 'Блогеры и предприниматели' : 'Bloggers and entrepreneurs'
      },
      teaches: [
        isRussian ? 'Создание страницы link in bio' : 'Creating a link in bio page',
        isRussian ? 'Оптимизация конверсии' : 'Conversion optimization',
        isRussian ? 'Аналитика и отслеживание' : 'Analytics and tracking'
      ],
      competencyRequired: 'None',
      timeRequired: 'PT2M',
      isAccessibleForFree: true
    };

    // Action Schema - for primary site action
    const actionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CreateAction',
      name: isRussian ? 'Создать страницу link in bio' : 'Create link in bio page',
      description: isRussian
        ? 'Создайте бесплатную страницу link-in-bio с помощью AI за 2 минуты'
        : 'Create a free link-in-bio page with AI in 2 minutes',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://lnkmx.my/auth',
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
          'https://schema.org/IOSPlatform',
          'https://schema.org/AndroidPlatform'
        ]
      },
      result: {
        '@type': 'WebPage',
        name: isRussian ? 'Персональная страница link in bio' : 'Personal link in bio page'
      },
      agent: {
        '@type': 'Organization',
        name: 'LinkMAX'
      }
    };

    // SpeakableSpecification for voice search
    const speakableSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', 'h2', '.hero-text', '.feature-title']
      },
      url: 'https://lnkmx.my/'
    };

    // Comparison Schema - for competitor comparison
    const comparisonSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: isRussian ? 'Сравнение LinkMAX vs Linktree vs Taplink' : 'LinkMAX vs Linktree vs Taplink Comparison',
      description: isRussian
        ? 'Детальное сравнение LinkMAX с конкурентами Linktree и Taplink'
        : 'Detailed comparison of LinkMAX with competitors Linktree and Taplink',
      url: 'https://lnkmx.my/alternatives',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'SoftwareApplication',
            name: 'LinkMAX',
            applicationCategory: 'Link in Bio',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '2847' }
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'SoftwareApplication',
            name: 'Linktree',
            applicationCategory: 'Link in Bio'
          }
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'SoftwareApplication',
            name: 'Taplink',
            applicationCategory: 'Link in Bio'
          }
        }
      ]
    };

    // BreadcrumbList for navigation
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'LinkMAX',
          item: 'https://lnkmx.my/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isRussian ? 'Создать страницу' : 'Create Page',
          item: 'https://lnkmx.my/auth'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: isRussian ? 'Тарифы' : 'Pricing',
          item: 'https://lnkmx.my/pricing'
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: isRussian ? 'Галерея' : 'Gallery',
          item: 'https://lnkmx.my/gallery'
        }
      ]
    };

    // Insert JSON-LD scripts
    const schemas = [
      softwareAppSchema, 
      organizationSchema, 
      websiteSchema, 
      webPageSchema,
      productSchema,
      howToSchema,
      faqSchema,
      itemListSchema,
      serviceSchema,
      webApplicationSchema,
      collectionPageSchema,
      videoSchema,
      definedTermSetSchema,
      learningResourceSchema,
      actionSchema,
      speakableSchema,
      comparisonSchema,
      breadcrumbSchema
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
      document.title = 'LinkMAX - AI-Powered Link-in-Bio Platform';
      const schemasToRemove = document.querySelectorAll('script.seo-schema');
      schemasToRemove.forEach(el => el.remove());
    };
  }, [currentLanguage, t]);

  return null;
}
