/**
 * EnhancedSEOHead - Comprehensive Auto-SEO for User Pages
 * 
 * AEO/GEO Features:
 * - Answer Block for AI extraction
 * - Auto meta tags generation
 * - Schema.org JSON-LD (Person/Organization, FAQ, Event, Service, HowTo)
 * - Quality gate for indexation
 * - Source context for AI citability
 * - Version tracking for stable URLs
 */

import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PageData } from '@/types/page';
import { computePublicPageSeo } from '@/lib/seo/public-page-seo';

interface EnhancedSEOHeadProps {
  pageData: PageData;
  pageUrl: string;
  updatedAt?: string;
  isNewAccount?: boolean;
}

// Helper to set/update meta tag
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

// Helper to set/update link tag
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

// Helper to set/update favicon
const DEFAULT_FAVICON = '/favicon.png';

const setFavicon = (url?: string) => {
  const normalized = url?.trim() || DEFAULT_FAVICON;
  setLinkTag('icon', normalized);
  setLinkTag('shortcut icon', normalized);
  setLinkTag('apple-touch-icon', normalized);
};

// Helper to add JSON-LD schema
const addJsonLd = (id: string, data: object | string) => {
  let script = document.querySelector(`script#${id}`) as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = typeof data === 'string' ? data : JSON.stringify(data);
};

export function EnhancedSEOHead({
  pageData,
  pageUrl,
  isNewAccount = false,
}: EnhancedSEOHeadProps) {
  const { i18n } = useTranslation();
  const rawLang = (i18n.language || 'ru').split('-')[0];
  const language = (['ru', 'en', 'kk'].includes(rawLang) ? rawLang : 'ru') as 'ru' | 'en' | 'kk';

  // Same computation as the SSR route head, so the browser never disagrees with crawlers.
  const seoData = useMemo(() => {
    try {
      return computePublicPageSeo(pageData, { language, pageUrl, isNewAccount });
    } catch (err) {
      console.warn('SEO computation error, using fallback:', err);
      return null;
    }
  }, [pageData, language, pageUrl, isNewAccount]);

  useEffect(() => {
    if (!seoData) return;
    const { meta, qualityGate, answerBlock, jsonLd } = seoData;

    // Set document title
    document.title = meta.title;

    // Set lang attribute
    document.documentElement.lang = language;

    // Basic meta tags
    setMetaTag('description', meta.description);
    setMetaTag('robots', meta.robots);
    setMetaTag('googlebot', meta.robots);

    // Open Graph tags
    setMetaTag('og:type', 'profile', true);
    setMetaTag('og:title', meta.title, true);
    setMetaTag('og:description', meta.description, true);
    setMetaTag('og:url', meta.canonical, true);
    setMetaTag('og:site_name', 'LinkMAX', true);

    if (meta.ogImage) {
      setMetaTag('og:image', meta.ogImage, true);
      setMetaTag('og:image:alt', `${seoData.profile.name || 'User'} profile`, true);
    }

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', meta.title);
    setMetaTag('twitter:description', meta.description);
    if (meta.ogImage) {
      setMetaTag('twitter:image', meta.ogImage);
    }
    setMetaTag('twitter:site', '@LinkMAX_app');

    // Canonical URL
    setLinkTag('canonical', meta.canonical);

    // Favicon (White-label)
    setFavicon(pageData.favicon_url);

    // Hreflang tags
    setLinkTag('alternate', `${meta.canonical}?lang=ru`, 'ru');
    setLinkTag('alternate', `${meta.canonical}?lang=en`, 'en');
    setLinkTag('alternate', `${meta.canonical}?lang=kk`, 'kk');
    setLinkTag('alternate', meta.canonical, 'x-default');

    // Add combined JSON-LD graph (all schemas in one)
    addJsonLd('schema-graph', jsonLd);

    // Page quality indicator (for internal use)
    setMetaTag('page-quality-score', String(qualityGate.score));

    // Answer block summary for AI crawlers
    setMetaTag('ai-summary', answerBlock.summary);

    // Cleanup on unmount
    return () => {
      document.title = 'LinkMAX - AI Bio Page Builder';
      setFavicon();

      // Remove page-specific tags
      const tagsToRemove = [
        'meta[property="og:type"]',
        'meta[property="og:url"]',
        'meta[property="og:site_name"]',
        'meta[property="og:image:alt"]',
        'meta[name="page-quality-score"]',
        'meta[name="ai-summary"]',
        'link[rel="canonical"]',
        'link[rel="alternate"]',
        'script#schema-graph',
      ];

      tagsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
    };
  }, [seoData, language]);

  return null;
}

export default EnhancedSEOHead;
