/**
 * Unit tests for Block domain entity
 */
import { describe, it, expect } from 'vitest';
import {
  isPremiumBlockType,
  getBlockCategory,
  isBlockScheduledVisible,
  generateBlockId,
  validateBlock,
  type BlockType,
  type BaseBlock,
} from '@/domain/entities/Block';

describe('Block Entity', () => {
  describe('isPremiumBlockType', () => {
    it('should return true for premium block types', () => {
      const premiumTypes: BlockType[] = ['video', 'carousel', 'custom_code', 'form', 'newsletter'];
      premiumTypes.forEach((type) => {
        expect(isPremiumBlockType(type)).toBe(true);
      });
    });

    it('should return false for non-premium block types', () => {
      const freeTypes: BlockType[] = ['link', 'button', 'text', 'image', 'separator'];
      freeTypes.forEach((type) => {
        expect(isPremiumBlockType(type)).toBe(false);
      });
    });
  });

  describe('getBlockCategory', () => {
    it('should return correct category for basic blocks', () => {
      expect(getBlockCategory('link')).toBe('basic');
      expect(getBlockCategory('button')).toBe('basic');
      expect(getBlockCategory('text')).toBe('basic');
    });

    it('should return correct category for media blocks', () => {
      expect(getBlockCategory('image')).toBe('media');
      expect(getBlockCategory('video')).toBe('media');
      expect(getBlockCategory('carousel')).toBe('media');
    });

    it('should return correct category for interactive blocks', () => {
      expect(getBlockCategory('form')).toBe('interactive');
      expect(getBlockCategory('messenger')).toBe('interactive');
      expect(getBlockCategory('map')).toBe('interactive');
    });

    it('should return correct category for commerce blocks', () => {
      expect(getBlockCategory('product')).toBe('commerce');
      expect(getBlockCategory('catalog')).toBe('commerce');
      expect(getBlockCategory('pricing')).toBe('commerce');
    });
  });

  describe('isBlockScheduledVisible', () => {
    it('should return true when no schedule is set', () => {
      const block: BaseBlock = { id: '1', type: 'link' };
      expect(isBlockScheduledVisible(block)).toBe(true);
    });

    it('should return false when start date is in the future', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      const block: BaseBlock = {
        id: '1',
        type: 'link',
        schedule: { startDate: futureDate },
      };
      expect(isBlockScheduledVisible(block)).toBe(false);
    });

    it('should return false when end date is in the past', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
      const block: BaseBlock = {
        id: '1',
        type: 'link',
        schedule: { endDate: pastDate },
      };
      expect(isBlockScheduledVisible(block)).toBe(false);
    });

    it('should return true when current time is within schedule range', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const block: BaseBlock = {
        id: '1',
        type: 'link',
        schedule: { startDate: pastDate, endDate: futureDate },
      };
      expect(isBlockScheduledVisible(block)).toBe(true);
    });
  });

  describe('generateBlockId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateBlockId('link');
      const id2 = generateBlockId('link');
      expect(id1).not.toBe(id2);
    });

    it('should include block type in ID', () => {
      const id = generateBlockId('button');
      expect(id.startsWith('button-')).toBe(true);
    });
  });

  describe('validateBlock', () => {
    it('should return valid for correct block', () => {
      const block: BaseBlock = { id: '1', type: 'link' };
      const result = validateBlock(block);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing id', () => {
      const block = { type: 'link' } as BaseBlock;
      const result = validateBlock(block);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Block ID is required');
    });

    it('should return error for missing type', () => {
      const block = { id: '1' } as BaseBlock;
      const result = validateBlock(block);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Block type is required');
    });
  });
});
