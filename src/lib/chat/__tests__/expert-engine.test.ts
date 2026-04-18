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
