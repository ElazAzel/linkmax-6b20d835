import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  language: string;
}

export default function SEOHead({ language }: SEOHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const isRussian = language === 'ru';
    const isKazakh = language === 'kk';
    const locale = isRussian ? 'ru_RU' : isKazakh ? 'kk_KZ' : 'en_US';
    
    // Titles optimized for CTR and clarity
    const titles = {
      ru: 'lnkmx - мини-сайт за 2 минуты | Заявки из одной ссылки',
      en: 'lnkmx - mini-site in 2 minutes | Leads from one link',
      kk: 'lnkmx - 2 минутта мини-сайт | Бір сілтемеден өтінім',
    };
    
    const descriptions = {
      ru: 'Бесплатный AI-конструктор мини-сайтов. Соберите страницу с оффером, прайсом и формой заявки за 2 минуты. Без кода и дизайнера.',
      en: 'Free AI mini-site builder. Create a page with offer, pricing, and lead form in 2 minutes. No code, no designer needed.',
      kk: 'Тегін AI мини-сайт құрастырушы. Оффер, прайс және өтінім формасы бар бетті 2 минутта жасаңыз.',
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

    // Core meta
    setMeta('description', description);
    setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1');
    setMeta('author', 'lnkmx');
    setMeta('theme-color', '#0080ff');

    // Keywords for each language
    const keywords = {
      ru: 'link in bio, линк в био, мини-сайт, страница ссылок, linktree альтернатива, taplink альтернатива, сайт-визитка',
      en: 'link in bio, mini-site, link page, linktree alternative, taplink alternative, digital business card',
      kk: 'link in bio, мини-сайт, сілтемелер беті, linktree баламасы, taplink баламасы',
    };
    setMeta('keywords', keywords[language as keyof typeof keywords] || keywords.ru);

    // Canonical & hreflang
    setLink('canonical', 'https://lnkmx.my/');
    setLink('alternate', 'https://lnkmx.my/?lang=ru', 'ru');
    setLink('alternate', 'https://lnkmx.my/?lang=en', 'en');
    setLink('alternate', 'https://lnkmx.my/?lang=kk', 'kk');
    setLink('alternate', 'https://lnkmx.my/', 'x-default');

    // Update html lang
    document.documentElement.lang = language === 'kk' ? 'kk' : language === 'en' ? 'en' : 'ru';

    // Open Graph
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

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);
    setMeta('twitter:site', '@lnkmx_app');

    // JSON-LD Structured Data
    const existingSchemas = document.querySelectorAll('script.landing-schema');
    existingSchemas.forEach(el => el.remove());

    const schemas = [
      // Organization
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://lnkmx.my/#organization',
        name: 'lnkmx',
        url: 'https://lnkmx.my/',
        logo: 'https://lnkmx.my/favicon.jpg',
        sameAs: ['https://t.me/lnkmx_app'],
      },
      // WebSite with SearchAction
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
      },
      // SoftwareApplication
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'lnkmx',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Link in Bio Tool',
        operatingSystem: 'Web',
        description: description,
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pro', price: '5', priceCurrency: 'USD' },
        ],
      },
    ];

    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'landing-schema';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script.landing-schema').forEach(el => el.remove());
    };
  }, [language, t]);

  return null;
}
