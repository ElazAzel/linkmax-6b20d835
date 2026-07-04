/**
 * GEOEnhancedContent - Visible Semantic Content for GEO/AEO
 * 
 * Unlike CrawlerFriendlyContent (noscript only), this renders
 * visually hidden but DOM-present content for AI crawlers.
 * This ensures content is extractable even when JS is enabled.
 * 
 * Features:
 * - sr-only content for screen readers and AI bots
 * - Semantic HTML5 structure
 * - Schema.org microdata
 * - Stable anchor IDs
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Block, FAQBlock, PricingBlock, EventBlock } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';
import { extractProfileFromBlocks } from '@/lib/seo-utils';
import { getPublicPageUrl } from '@/lib/utils/url-helpers';
import { generateAnswerBlock } from '@/lib/seo/answer-block';
import { generateKeyFacts } from '@/lib/seo/key-facts';
import { generateAutoFAQ, extractFAQContext, hasUserFAQ } from '@/lib/seo/auto-faq';
import { extractEntityLinks } from '@/lib/seo/entity-linking';
import { extractAiCta, AI_CTA_LABELS } from '@/lib/seo/ai-cta-extractor';

interface GEOEnhancedContentProps {
  blocks: Block[];
  slug: string;
}

export function GEOEnhancedContent({ blocks, slug }: GEOEnhancedContentProps) {
  const { i18n } = useTranslation();
  const rawLang = (i18n.language || 'ru').split('-')[0];
  const language = (['ru', 'en', 'kk'].includes(rawLang) ? rawLang : 'ru') as 'ru' | 'en' | 'kk';

  // Guard against undefined/null blocks
  const validBlocks = (blocks || []).filter((b): b is Block => b != null && typeof b === 'object' && 'type' in b);

  // Wrap all SEO processing in try-catch to prevent render crashes
  let profile: ReturnType<typeof extractProfileFromBlocks> = { type: 'Person', sameAs: [] };
  let answerBlock: ReturnType<typeof generateAnswerBlock> = { summary: '', entityType: 'Person', services: [] };
  let keyFacts: ReturnType<typeof generateKeyFacts> = [];
  let entityLinks: ReturnType<typeof extractEntityLinks> = { sameAs: [], knowsAbout: [] };
  let autoFAQItems: Array<{ question: string; answer: string }> = [];
  let pricingBlock: PricingBlock | undefined;
  let faqBlock: FAQBlock | undefined;
  let eventBlocks: EventBlock[] = [];
  let aiCta: ReturnType<typeof extractAiCta> = { contacts: [], hasBooking: false };

  try {
    profile = extractProfileFromBlocks(validBlocks, language);
    answerBlock = generateAnswerBlock(validBlocks, slug, language);
    keyFacts = generateKeyFacts(validBlocks, answerBlock, profile.name, language);
    entityLinks = extractEntityLinks(validBlocks, language);
    aiCta = extractAiCta(validBlocks, slug, language);

    const shouldGenerateAutoFAQ = !hasUserFAQ(validBlocks);
    const faqContext = extractFAQContext(validBlocks, profile.name, answerBlock.niche, answerBlock.location, language);
    autoFAQItems = shouldGenerateAutoFAQ ? generateAutoFAQ(faqContext, language, 3) : [];
    
    pricingBlock = validBlocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
    faqBlock = validBlocks.find(b => b.type === 'faq') as FAQBlock | undefined;
    eventBlocks = validBlocks.filter(b => b.type === 'event') as EventBlock[];
  } catch (err) {
    console.warn('GEO content processing error:', err);
  }

  // Labels
  const labels = {
    ru: {
      about: 'О специалисте',
      keyFacts: 'Ключевые факты',
      services: 'Услуги и цены',
      events: 'Мероприятия',
      faq: 'Часто задаваемые вопросы',
      expertise: 'Экспертиза',
      source: 'Источник',
    },
    en: {
      about: 'About',
      keyFacts: 'Key Facts',
      services: 'Services & Pricing',
      events: 'Events',
      faq: 'Frequently Asked Questions',
      expertise: 'Expertise',
      source: 'Source',
    },
    kk: {
      about: 'Маман туралы',
      keyFacts: 'Негізгі фактілер',
      services: 'Қызметтер мен бағалар',
      events: 'Іс-шаралар',
      faq: 'Жиі қойылатын сұрақтар',
      expertise: 'Сараптама',
      source: 'Дереккөз',
    },
  };
  
  const t = labels[language] || labels.en;

  return (
    <div 
      className="sr-only" 
      aria-hidden="false"
      itemScope 
      itemType={`https://schema.org/${answerBlock.entityType}`}
    >
      {/* Primary Answer Block for AI */}
      <section id="geo-answer" data-geo="answer-block">
        <h2>{t.about}</h2>
        <p itemProp="description" data-ai-summary="true">
          {answerBlock.summary}
        </p>
        
        {/* Entity identification */}
        <meta itemProp="name" content={profile.name || slug} />
        <link itemProp="url" href={getPublicPageUrl(slug)} />
        
        {answerBlock.niche && (
          <meta itemProp="jobTitle" content={answerBlock.niche} />
        )}
        
        {answerBlock.location && (
          <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
            <meta itemProp="addressLocality" content={answerBlock.location} />
          </span>
        )}
        
        {profile.avatar && (
          <meta itemProp="image" content={profile.avatar} />
        )}
        
        {/* sameAs links */}
        {entityLinks.sameAs.map((url, i) => (
          <link key={i} itemProp="sameAs" href={url} />
        ))}
      </section>

      {/* Key Facts for atomic citation */}
      {keyFacts.length > 0 && (
        <section id="geo-facts" data-geo="key-facts">
          <h3>{t.keyFacts}</h3>
          <dl>
            {keyFacts.map((fact, i) => (
              <div key={i} data-fact-category={fact.category}>
                <dt>{fact.label}</dt>
                <dd itemProp={fact.schemaProperty}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* AI-citable CTA: explicit contacts + price range. Critical for ChatGPT/Perplexity citations. */}
      {(aiCta.contacts.length > 0 || aiCta.price) && (
        <section id="geo-cta" data-geo="contact-cta" aria-label={AI_CTA_LABELS[language].contact}>
          <h3>{AI_CTA_LABELS[language].contact}</h3>
          <p data-ai-contact-intro="true">{AI_CTA_LABELS[language].contactIntro}</p>

          {aiCta.contacts.length > 0 && (
            <ul data-geo="contact-list">
              {aiCta.contacts.slice(0, 8).map((c, i) => (
                <li key={`${c.type}-${i}`} data-channel={c.type}>
                  <a
                    href={c.href}
                    rel={c.type === 'web' ? 'noopener noreferrer' : 'noopener noreferrer me'}
                    itemProp={c.type === 'email' || c.type === 'phone' ? 'contactPoint' : 'sameAs'}
                  >
                    <strong>{c.label}:</strong> {c.display}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {aiCta.price?.priceRange && (
            <p data-geo="price-range">
              <strong>{AI_CTA_LABELS[language].pricing}:</strong>{' '}
              <span itemProp="priceRange">
                {AI_CTA_LABELS[language].pricingFrom} {aiCta.price.priceRange}
              </span>
            </p>
          )}

          {aiCta.hasBooking && aiCta.bookingUrl && (
            <p data-geo="booking-cta">
              <a href={aiCta.bookingUrl} itemProp="potentialAction">
                {AI_CTA_LABELS[language].bookingCta}
              </a>
            </p>
          )}
        </section>
      )}

      {/* Expertise/Skills */}
      {entityLinks.knowsAbout.length > 0 && (
        <section id="geo-expertise" data-geo="expertise">
          <h3>{t.expertise}</h3>
          <ul>
            {entityLinks.knowsAbout.map((skill, i) => (
              <li key={i} itemProp="knowsAbout">{skill}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Services with Schema.org */}
      {pricingBlock && pricingBlock.items?.length > 0 && (
        <section id="geo-services" data-geo="services">
          <h3>{t.services}</h3>
          {(pricingBlock.items || []).filter(item => item && typeof item === 'object' && item.name).slice(0, 5).map(item => (
            <article 
              key={item.id}
              itemScope 
              itemType="https://schema.org/Service"
              itemProp="makesOffer"
            >
              <h4 itemProp="name">{getI18nText(item.name, language)}</h4>
              {item.description && (
                <p itemProp="description">{getI18nText(item.description, language)}</p>
              )}
              <span itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <data itemProp="price" value={item.price}>{item.price}</data>
                <meta itemProp="priceCurrency" content={item.currency || pricingBlock.currency || 'KZT'} />
                <link itemProp="availability" href="https://schema.org/InStock" />
              </span>
              <link itemProp="provider" href={`${getPublicPageUrl(slug)}#geo-answer`} />
            </article>
          ))}
        </section>
      )}

      {/* Events */}
      {eventBlocks.length > 0 && (
        <section id="geo-events" data-geo="events">
          <h3>{t.events}</h3>
          {eventBlocks.filter(e => e.status === 'published').slice(0, 3).map(event => (
            <article 
              key={event.id}
              itemScope 
              itemType="https://schema.org/Event"
            >
              <h4 itemProp="name">{getI18nText(event.title, language)}</h4>
              {event.description && (
                <p itemProp="description">{getI18nText(event.description, language)}</p>
              )}
              {event.startAt && (
                <time itemProp="startDate" dateTime={event.startAt}>
                  {new Date(event.startAt).toLocaleDateString(language)}
                </time>
              )}
              {event.locationValue && (
                <span itemProp="location" itemScope itemType={event.locationType === 'online' ? 'https://schema.org/VirtualLocation' : 'https://schema.org/Place'}>
                  <span itemProp={event.locationType === 'online' ? 'url' : 'address'}>{event.locationValue}</span>
                </span>
              )}
              <link itemProp="organizer" href={`${getPublicPageUrl(slug)}#geo-answer`} />
            </article>
          ))}
        </section>
      )}

      {/* FAQ - User or Auto-generated */}
      {(faqBlock?.items?.length || autoFAQItems.length > 0) && (
        <section 
          id="geo-faq" 
          data-geo="faq"
          itemScope 
          itemType="https://schema.org/FAQPage"
        >
          <h3>{t.faq}</h3>
          
          {/* User FAQ */}
          {faqBlock?.items?.map(item => (
            <div 
              key={item.id}
              itemScope 
              itemType="https://schema.org/Question"
              itemProp="mainEntity"
            >
              <h4 itemProp="name">{getI18nText(item.question, language)}</h4>
              <div 
                itemScope 
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p itemProp="text">{getI18nText(item.answer, language)}</p>
              </div>
            </div>
          ))}
          
          {/* Auto FAQ */}
          {autoFAQItems.map((item, i) => (
            <div 
              key={`auto-${i}`}
              itemScope 
              itemType="https://schema.org/Question"
              itemProp="mainEntity"
            >
              <h4 itemProp="name">{item.question}</h4>
              <div 
                itemScope 
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p itemProp="text">{item.answer}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Source attribution */}
      <footer data-geo="source">
        <p>
          {t.source}: <a href={getPublicPageUrl(slug)} itemProp="url">lnkmx.my/{slug}</a>
        </p>
      </footer>
    </div>
  );
}

export default GEOEnhancedContent;
