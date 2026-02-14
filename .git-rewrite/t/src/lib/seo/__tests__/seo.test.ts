/**
 * SEO Library Tests
 * Tests for AEO/GEO functionality
 */

import { describe, it, expect } from 'vitest';
import { generateAnswerBlock } from '@/lib/seo/answer-block';
import { generateAutoFAQ, extractFAQContext, hasUserFAQ } from '@/lib/seo/auto-faq';
import { generateGEOSchemas } from '@/lib/seo/geo-schemas';
import { generateKeyFacts } from '@/lib/seo/key-facts';
import type { Block, ProfileBlock, PricingBlock, FAQBlock, SocialsBlock, BookingBlock } from '@/types/page';

// Mock blocks for testing
const createProfileBlock = (name: string, bio: string): ProfileBlock => ({
  id: 'profile-1',
  type: 'profile',
  name: { ru: name, en: name, kk: name },
  bio: { ru: bio, en: bio, kk: bio },
});

const createPricingBlock = (items: Array<{ name: string; price: number }>): PricingBlock => ({
  id: 'pricing-1',
  type: 'pricing',
  currency: 'KZT',
  items: items.map((item, i) => ({
    id: `item-${i}`,
    name: { ru: item.name, en: item.name, kk: item.name },
    price: item.price,
  })),
});

const createFAQBlock = (items: Array<{ question: string; answer: string }>): FAQBlock => ({
  id: 'faq-1',
  type: 'faq',
  items: items.map((item, i) => ({
    id: `faq-${i}`,
    question: { ru: item.question, en: item.question, kk: item.question },
    answer: { ru: item.answer, en: item.answer, kk: item.answer },
  })),
});

const createSocialsBlock = (): SocialsBlock => ({
  id: 'socials-1',
  type: 'socials',
  platforms: [
    { name: 'Instagram', url: 'https://instagram.com/test', icon: 'instagram' },
    { name: 'Telegram', url: 'https://t.me/test', icon: 'telegram' },
  ],
});

const createBookingBlock = (): BookingBlock => ({
  id: 'booking-1',
  type: 'booking',
  title: { ru: 'Записаться', en: 'Book', kk: 'Жазылу' },
  isPremium: true,
});

describe('Answer Block Generator', () => {
  it('should generate summary for profile with services', () => {
    const blocks: Block[] = [
      createProfileBlock('Анна', 'Психолог из Алматы'),
      createPricingBlock([
        { name: 'Консультация', price: 15000 },
        { name: 'Терапия', price: 25000 },
      ]),
    ];

    const result = generateAnswerBlock(blocks, 'anna', 'ru');

    expect(result.summary).toContain('Анна');
    expect(result.services).toHaveLength(2);
    expect(result.entityType).toBe('Person');
  });

  it('should detect niche from bio', () => {
    const blocks: Block[] = [
      createProfileBlock('Иван', 'Фитнес-тренер, помогаю достичь целей'),
    ];

    const result = generateAnswerBlock(blocks, 'ivan', 'ru');

    expect(result.niche).toBe('Фитнес-тренер');
  });

  it('should detect organization type for business names', () => {
    const blocks: Block[] = [
      createProfileBlock('Студия красоты "Элегант"', 'Салон красоты в Астане'),
      createBookingBlock(),
    ];

    const result = generateAnswerBlock(blocks, 'elegant', 'ru');

    expect(result.entityType).toBe('LocalBusiness');
  });
});

describe('Auto-FAQ Generator', () => {
  it('should generate FAQs based on context', () => {
    const context = {
      name: 'Мария',
      niche: 'Психолог',
      services: ['Консультация', 'Терапия'],
      minPrice: 10000,
      currency: 'KZT',
      hasBooking: true,
    };

    const faqs = generateAutoFAQ(context, 'ru', 5);

    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs.length).toBeLessThanOrEqual(5);
    expect(faqs[0].question).toContain('Мария');
  });

  it('should detect existing user FAQ', () => {
    const blocksWithFAQ: Block[] = [
      createFAQBlock([
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
        { question: 'Q3', answer: 'A3' },
      ]),
    ];

    const blocksWithoutFAQ: Block[] = [
      createProfileBlock('Test', 'Bio'),
    ];

    expect(hasUserFAQ(blocksWithFAQ)).toBe(true);
    expect(hasUserFAQ(blocksWithoutFAQ)).toBe(false);
  });
});

describe('GEO Schemas Generator', () => {
  it('should generate combined schema graph', () => {
    const blocks: Block[] = [
      createProfileBlock('Алексей', 'Разработчик'),
      createPricingBlock([{ name: 'Разработка сайта', price: 50000 }]),
      createSocialsBlock(),
    ];

    const answerBlock = generateAnswerBlock(blocks, 'alexey', 'ru');
    
    const schemas = generateGEOSchemas(blocks, {
      slug: 'alexey',
      name: 'Алексей',
      bio: 'Разработчик',
      answerBlock,
      sameAs: ['https://github.com/alexey'],
      language: 'ru',
    });

    expect(schemas.graph.length).toBeGreaterThan(0);
    expect(schemas.mainEntity).toBeDefined();
    expect(schemas.webPage).toBeDefined();
    expect(schemas.breadcrumb).toBeDefined();
    expect(schemas.services).toBeDefined();
  });

  it('should include HowTo schema when booking exists', () => {
    const blocks: Block[] = [
      createProfileBlock('Тест', 'Тест'),
      createBookingBlock(),
    ];

    const answerBlock = generateAnswerBlock(blocks, 'test', 'ru');
    
    const schemas = generateGEOSchemas(blocks, {
      slug: 'test',
      name: 'Тест',
      answerBlock,
      sameAs: [],
      language: 'ru',
    });

    expect(schemas.howTo).toBeDefined();
  });
});

describe('Key Facts Generator', () => {
  it('should extract key facts from blocks', () => {
    const blocks: Block[] = [
      createProfileBlock('Сара', 'Коуч'),
      createPricingBlock([
        { name: 'Сессия', price: 20000 },
        { name: 'Программа', price: 100000 },
      ]),
      createSocialsBlock(),
      createBookingBlock(),
    ];

    const answerBlock = generateAnswerBlock(blocks, 'sara', 'ru');
    const facts = generateKeyFacts(blocks, answerBlock, 'Сара', 'ru');

    expect(facts.length).toBeGreaterThan(0);
    
    // Check for identity facts
    const nameFact = facts.find(f => f.category === 'identity' && f.label === 'Имя');
    expect(nameFact?.value).toBe('Сара');
    
    // Check for services facts
    const servicesFact = facts.find(f => f.category === 'services');
    expect(servicesFact).toBeDefined();
    
    // Check for booking fact
    const bookingFact = facts.find(f => f.label === 'Онлайн-запись');
    expect(bookingFact?.value).toBe('Доступна');
  });
});

describe('Multi-language Support', () => {
  it('should generate content in English', () => {
    const blocks: Block[] = [
      createProfileBlock('John', 'Developer from Almaty'),
      createPricingBlock([{ name: 'Consulting', price: 50000 }]),
    ];

    const result = generateAnswerBlock(blocks, 'john', 'en');
    
    expect(result.summary).toContain('John');
    expect(result.services).toContain('Consulting');
  });

  it('should generate content in Kazakh', () => {
    const blocks: Block[] = [
      createProfileBlock('Айдана', 'Маман'),
    ];

    const facts = generateKeyFacts(
      blocks, 
      generateAnswerBlock(blocks, 'aidana', 'kk'),
      'Айдана',
      'kk'
    );

    const nameFact = facts.find(f => f.category === 'identity');
    expect(nameFact?.label).toBe('Аты');
  });
});
