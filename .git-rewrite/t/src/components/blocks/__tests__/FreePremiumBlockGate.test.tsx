/**
 * FreePremiumBlockGate Tests - v1.2
 */
import { describe, it, expect } from 'vitest';
import { FREE_BLOCK_TYPES, PREMIUM_BLOCK_TYPES, FreeBlockType, PremiumBlockType } from '../FreePremiumBlockGate';

describe('FreePremiumBlockGate', () => {
  it('defines free block types', () => {
    expect(FREE_BLOCK_TYPES).toContain('link');
    expect(FREE_BLOCK_TYPES).toContain('button');
    expect(FREE_BLOCK_TYPES).toContain('text');
    expect(FREE_BLOCK_TYPES).toContain('image');
    expect(FREE_BLOCK_TYPES).toContain('socials');
    expect(FREE_BLOCK_TYPES).toContain('separator');
    expect(FREE_BLOCK_TYPES).toContain('faq');
  });

  it('defines premium block types including event', () => {
    expect(PREMIUM_BLOCK_TYPES).toContain('event');
  });

  it('defines premium block types', () => {
    expect(PREMIUM_BLOCK_TYPES).toContain('booking');
    expect(PREMIUM_BLOCK_TYPES).toContain('catalog');
    expect(PREMIUM_BLOCK_TYPES).toContain('product');
    expect(PREMIUM_BLOCK_TYPES).toContain('form');
    expect(PREMIUM_BLOCK_TYPES).toContain('pricing');
    expect(PREMIUM_BLOCK_TYPES).toContain('newsletter');
  });

  it('has no overlap between free and premium blocks', () => {
    const freeSet = new Set<string>(FREE_BLOCK_TYPES);
    const premiumSet = new Set<string>(PREMIUM_BLOCK_TYPES);
    
    freeSet.forEach(type => {
      expect(premiumSet.has(type)).toBe(false);
    });
  });
});
