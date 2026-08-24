import { describe, expect, it } from 'vitest';
import { refineGeneratedBlocks, isMeaningfulBlock, orderBlocks } from '../builder-quality';
import { createBlock } from '../block-factory';
import type { Block } from '@/types/page';

const info = {
  name: 'Айгуль',
  bio: 'Мастер маникюра в Алматы',
  contacts: '+77001234567',
  services: 'Маникюр - 5000 тг\nПедикюр - 7000 тг',
  socials: 'instagram.com/aigul',
};

describe('builder-quality', () => {
  it('drops empty blocks', () => {
    const empty = createBlock('text') as Block;
    expect(isMeaningfulBlock(empty)).toBe(false);
  });

  it('always produces a profile and a contact path', () => {
    const blocks = refineGeneratedBlocks([], info);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].type).toBe('profile');
    expect(blocks.some((b) => ['messenger', 'form', 'socials', 'booking'].includes(b.type))).toBe(true);
  });

  it('hydrates services into a catalog', () => {
    const blocks = refineGeneratedBlocks([], info);
    const catalog = blocks.find((b) => b.type === 'catalog') as unknown as { items?: unknown[] };
    expect(catalog?.items?.length).toBe(2);
  });

  it('orders profile first and socials last', () => {
    const ordered = orderBlocks([
      createBlock('socials') as Block,
      createBlock('messenger') as Block,
      createBlock('profile') as Block,
    ]);
    expect(ordered[0].type).toBe('profile');
    expect(ordered[ordered.length - 1].type).toBe('socials');
  });

  it('produces unique ids', () => {
    const blocks = refineGeneratedBlocks([], info);
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
  });
});
