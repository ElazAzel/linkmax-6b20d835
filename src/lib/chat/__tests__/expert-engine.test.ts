import { describe, expect, it } from 'vitest';
import { ExpertEngine } from '@/lib/chat/expert-engine';
import type { Block } from '@/types/blocks';

describe('ExpertEngine', () => {
  const blocks = [
    {
      type: 'pricing',
      content: {
        plans: [{ title: 'Консультация', price: 10000, currency: '₸' }],
      },
    },
    {
      type: 'messenger',
      content: {},
    },
  ] as unknown as Block[];

  const engine = new ExpertEngine(blocks, {
    title: 'Айгуль — Психолог',
    description: 'Я психолог с 10-летним опытом.',
  });

  it('should detect pricing intent from long natural query', () => {
    const result = engine.getResponse('Здравствуйте, подскажите пожалуйста сколько стоит консультация?');

    expect(result.hasMatch).toBe(true);
    expect(result.intent).toBe('commercial');
    expect(result.message.source).toBe('pricing');
  });

  it('should keep unicode letters when matching multilingual input', () => {
    const result = engine.getResponse('Телеграм арқылы қалай байланысамыз?');

    expect(result.intent).toBe('commercial');
    expect(result.hasMatch).toBe(true);
  });
});

describe('ExpertEngine page RAG', () => {
  const blocks = [
    { id: '1', type: 'profile', name: 'Айгуль', bio: 'Психолог, работаю с тревожностью и выгоранием' },
    { id: '2', type: 'faq', items: [{ question: 'Работаете онлайн?', answer: 'Да, сессии проходят в Zoom.' }] },
    { id: '3', type: 'pricing', currency: 'KZT', items: [{ name: 'Сессия', price: 15000 }] },
    { id: '4', type: 'messenger', messengers: [{ platform: 'whatsapp', username: '+7 701 000 00 00' }] },
  ] as unknown as Block[];
  const engine = new ExpertEngine(blocks, { title: 'Айгуль', description: '' });

  it('answers FAQ from flat blocks', () => {
    expect(engine.getResponse('можно ли онлайн?').message.content).toContain('Zoom');
  });
  it('answers price from pricing items', () => {
    expect(engine.getResponse('сколько стоит сессия').message.content).toContain('15000');
  });
  it('returns real contacts', () => {
    expect(engine.getResponse('как написать в ватсап').message.content).toContain('wa.me/77010000000');
  });
  it('finds bio topics', () => {
    expect(engine.getResponse('помогаете с выгоранием?').message.content).toContain('выгоранием');
  });
});
