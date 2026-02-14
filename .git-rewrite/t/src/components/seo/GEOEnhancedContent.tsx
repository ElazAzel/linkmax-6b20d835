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
import { generateAnswerBlock } from '@/lib/seo/answer-block';
import { generateKeyFacts } from '@/lib/seo/key-facts';
import { generateAutoFAQ, extractFAQContext, hasUserFAQ } from '@/lib/seo/auto-faq';
import { extractEntityLinks } from '@/lib/seo/entity-linking';

interface GEOEnhancedContentProps {
  blocks: Block[];
  slug: string;
}

export function GEOEnhancedContent({ blocks, slug }: GEOEnhancedContentProps) {
  const { i18n } = useTranslation();
  const language = i18n.language as 'ru' | 'en' | 'kk';
  
  const profile = extractProfileFromBlocks(blocks, language);
  const answerBlock = generateAnswerBlock(blocks, slug, language);
  const keyFacts = generateKeyFacts(blocks, answerBlock, profile.name, language);
  const entityLinks = extractEntityLinks(blocks, language);
  
  // Auto FAQ if needed
  const shouldGenerateAutoFAQ = !hasUserFAQ(blocks);
  const faqContext = extractFAQContext(blocks, profile.name, answerBlock.niche, answerBlock.location, language);
  const autoFAQItems = shouldGenerateAutoFAQ ? generateAutoFAQ(faqContext, language, 3) : [];
  
  // Extract blocks
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  const faqBlock = blocks.find(b => b.type === 'faq') as FAQBlock | undefined;
  const eventBlocks = blocks.filter(b => b.type === 'event') as EventBlock[];

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
        <link itemProp="url" href={`https://lnkmx.my/${slug}`} />
        
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
      {pricingBlock && pricingBlock.items.length > 0 && (
        <section id="geo-services" data-geo="services">
          <h3>{t.services}</h3>
          {pricingBlock.items.slice(0, 5).map(item => (
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
              <link itemProp="provider" href={`https://lnkmx.my/${slug}#geo-answer`} />
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
              <link itemProp="organizer" href={`https://lnkmx.my/${slug}#geo-answer`} />
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
          {t.source}: <a href={`https://lnkmx.my/${slug}`} itemProp="url">lnkmx.my/{slug}</a>
        </p>
      </footer>
    </div>
  );
}

export default GEOEnhancedContent;
