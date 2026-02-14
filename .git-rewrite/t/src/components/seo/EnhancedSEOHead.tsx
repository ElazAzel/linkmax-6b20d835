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
import {
  evaluateQualityGate,
  extractProfileFromBlocks,
  generatePageMeta,
} from '@/lib/seo-utils';
import { extractEntityLinks } from '@/lib/seo/entity-linking';
import { generateSectionAnchors } from '@/lib/seo/anchors';
import { generateAnswerBlock } from '@/lib/seo/answer-block';
import { generateEnhancedKeyFacts } from '@/lib/seo';
import { generateGEOSchemas, generateJsonLdGraph } from '@/lib/seo/geo-schemas';
import { generateAutoFAQ, extractFAQContext, hasUserFAQ } from '@/lib/seo/auto-faq';

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
  updatedAt,
  isNewAccount = false,
}: EnhancedSEOHeadProps) {
  const { i18n } = useTranslation();
  const language = i18n.language as 'ru' | 'en' | 'kk';
  const slug = pageData.slug || '';

  // Memoize all SEO computations
  const seoData = useMemo(() => {
    const profile = extractProfileFromBlocks(pageData.blocks, language);
    const qualityGate = evaluateQualityGate(
      pageData.blocks,
      profile.name,
      profile.bio,
      isNewAccount
    );
    const meta = generatePageMeta(profile, pageData.blocks, slug, qualityGate, language);
    
    // Generate Answer Block for AEO
    const answerBlock = generateAnswerBlock(pageData.blocks, slug, language);
    
    // Generate enhanced Key Facts
    const keyFacts = generateEnhancedKeyFacts(pageData.blocks, answerBlock, profile.name, language);
    
    // Generate GEO Schemas with combined graph
    const geoSchemas = generateGEOSchemas(pageData.blocks, {
      slug,
      name: profile.name || '',
      bio: profile.bio,
      avatar: profile.avatar,
      answerBlock,
      sameAs: profile.sameAs,
      language,
    });
    
    // Generate auto FAQ if needed
    const shouldGenerateAutoFAQ = !hasUserFAQ(pageData.blocks);
    const faqContext = extractFAQContext(pageData.blocks, profile.name, answerBlock.niche, answerBlock.location, language);
    const autoFAQ = shouldGenerateAutoFAQ ? generateAutoFAQ(faqContext, language, 5) : [];
    
    // Entity links for structured data
    const entityLinks = extractEntityLinks(pageData.blocks, language);

    return {
      profile,
      qualityGate,
      meta,
      answerBlock,
      keyFacts,
      geoSchemas,
      autoFAQ,
      entityLinks,
    };
  }, [pageData.blocks, slug, language, updatedAt, isNewAccount]);

  useEffect(() => {
    const { meta, geoSchemas, qualityGate, answerBlock } = seoData;

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
    setMetaTag('og:site_name', 'lnkmx', true);
    
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
    setMetaTag('twitter:site', '@lnkmx_app');

    // Canonical URL
    setLinkTag('canonical', meta.canonical);

    // Hreflang tags
    setLinkTag('alternate', `${meta.canonical}?lang=ru`, 'ru');
    setLinkTag('alternate', `${meta.canonical}?lang=en`, 'en');
    setLinkTag('alternate', `${meta.canonical}?lang=kk`, 'kk');
    setLinkTag('alternate', meta.canonical, 'x-default');

    // Add combined JSON-LD graph (all schemas in one)
    addJsonLd('schema-graph', generateJsonLdGraph(geoSchemas));

    // Page quality indicator (for internal use)
    setMetaTag('page-quality-score', String(qualityGate.score));
    
    // Answer block summary for AI crawlers
    setMetaTag('ai-summary', answerBlock.summary);

    // Cleanup on unmount
    return () => {
      document.title = 'lnkmx - AI Bio Page Builder';
      
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
