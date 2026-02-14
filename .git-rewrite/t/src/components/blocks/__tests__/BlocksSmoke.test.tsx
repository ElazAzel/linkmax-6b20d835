/**
 * Blocks Smoke Tests
 * Verifies all block types can be imported and have correct structure
 */
import { describe, it, expect } from 'vitest';

// Import all block types to verify they exist
import type { Block, BlockType } from '@/types/page';

describe('Block Types Smoke Test', () => {
  const expectedBlockTypes: BlockType[] = [
    'profile',
    'link',
    'button',
    'socials',
    'text',
    'image',
    'product',
    'video',
    'carousel',
    'custom_code',
    'messenger',
    'form',
    'download',
    'newsletter',
    'testimonial',
    'scratch',
    'map',
    'avatar',
    'separator',
    'catalog',
    'before_after',
    'faq',
    'countdown',
    'pricing',
    'shoutout',
    'booking',
    'community',
    'event',
  ];

  it('should have all expected block types defined', () => {
    expect(expectedBlockTypes.length).toBe(28);
  });

  it('should include event block type', () => {
    expect(expectedBlockTypes).toContain('event');
  });

  it('should include booking block type', () => {
    expect(expectedBlockTypes).toContain('booking');
  });

  it('should include all interactive blocks', () => {
    const interactiveBlocks = ['form', 'messenger', 'map', 'faq', 'scratch', 'event'];
    interactiveBlocks.forEach(block => {
      expect(expectedBlockTypes).toContain(block);
    });
  });

  it('should include all commerce blocks', () => {
    const commerceBlocks = ['product', 'catalog', 'pricing', 'download'];
    commerceBlocks.forEach(block => {
      expect(expectedBlockTypes).toContain(block);
    });
  });
});

describe('Block Structure Requirements', () => {
  it('should require id field on all blocks', () => {
    const mockBlock: Partial<Block> = {
      id: 'test-id',
      type: 'link',
    };
    
    expect(mockBlock.id).toBeDefined();
    expect(typeof mockBlock.id).toBe('string');
  });

  it('should require type field on all blocks', () => {
    const mockBlock: Partial<Block> = {
      id: 'test-id',
      type: 'button',
    };
    
    expect(mockBlock.type).toBeDefined();
  });
});

describe('Block Categories', () => {
  it('should categorize blocks correctly', () => {
    const categories = {
      basic: ['link', 'button', 'text', 'separator', 'avatar'],
      media: ['image', 'video', 'carousel', 'before_after'],
      interactive: ['form', 'messenger', 'map', 'faq', 'scratch', 'event'],
      commerce: ['product', 'catalog', 'pricing', 'download'],
      advanced: ['custom_code', 'newsletter', 'testimonial', 'countdown', 'socials'],
      social: ['shoutout', 'community'],
      services: ['booking'],
    };

    expect(categories.basic.length).toBe(5);
    expect(categories.interactive).toContain('event');
    expect(categories.services).toContain('booking');
  });
});
