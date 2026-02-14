/**
 * Unit tests for Page domain entity
 */
import { describe, it, expect } from 'vitest';
import {
  createDefaultPage,
  validatePage,
  countBlocks,
  hasProfileBlock,
  hasPremiumContent,
  reorderBlocks,
  DEFAULT_THEME,
  DEFAULT_SEO,
  type Page,
} from '@/domain/entities/Page';

describe('Page Entity', () => {
  describe('createDefaultPage', () => {
    it('should create page with default profile block', () => {
      const page = createDefaultPage('user-123');
      expect(page.userId).toBe('user-123');
      expect(page.blocks).toHaveLength(1);
      expect(page.blocks[0].type).toBe('profile');
    });

    it('should have default theme settings', () => {
      const page = createDefaultPage('user-123');
      expect(page.theme).toBeDefined();
      expect(page.editorMode).toBe('linear');
    });
  });

  describe('validatePage', () => {
    it('should return valid for correct page', () => {
      const page = createDefaultPage('user-123');
      const result = validatePage(page);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing userId', () => {
      const page = createDefaultPage('');
      const result = validatePage(page);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should return error for missing blocks', () => {
      const page = createDefaultPage('user-123');
      page.blocks = [];
      const result = validatePage(page);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Page must have at least one block');
    });
  });

  describe('countBlocks', () => {
    it('should count all blocks', () => {
      const page = createDefaultPage('user-123');
      expect(countBlocks(page)).toBe(1);
    });

    it('should exclude profile block when flag is set', () => {
      const page = createDefaultPage('user-123');
      expect(countBlocks(page, true)).toBe(0);
    });
  });

  describe('hasProfileBlock', () => {
    it('should return true when profile block exists', () => {
      const page = createDefaultPage('user-123');
      expect(hasProfileBlock(page)).toBe(true);
    });

    it('should return false when no profile block', () => {
      const page: Page<any> = {
        id: 'page-1',
        userId: 'user-123',
        blocks: [{ id: '1', type: 'link' }],
        theme: DEFAULT_THEME,
        seo: DEFAULT_SEO,
        editorMode: 'grid',
      };
      expect(hasProfileBlock(page)).toBe(false);
    });
  });

  describe('hasPremiumContent', () => {
    it('should return false for page with only free blocks', () => {
      const page = createDefaultPage('user-123');
      expect(hasPremiumContent(page)).toBe(false);
    });

    it('should return true when page has premium blocks', () => {
      const page: Page<any> = {
        id: 'page-1',
        userId: 'user-123',
        blocks: [
          { id: '1', type: 'profile' },
          { id: '2', type: 'video' }, // premium
        ],
        theme: DEFAULT_THEME,
        seo: DEFAULT_SEO,
        editorMode: 'grid',
      };
      expect(hasPremiumContent(page)).toBe(true);
    });
  });

  describe('reorderBlocks', () => {
    it('should reorder blocks by new positions', () => {
      const page: Page<any> = {
        id: 'page-1',
        userId: 'user-123',
        blocks: [
          { id: '1', type: 'link' },
          { id: '2', type: 'button' },
          { id: '3', type: 'text' },
        ],
        theme: DEFAULT_THEME,
        seo: DEFAULT_SEO,
        editorMode: 'grid',
      };

      const newOrder = ['3', '1', '2'];
      const reordered = reorderBlocks(page, newOrder);

      expect(reordered.blocks[0].id).toBe('3');
      expect(reordered.blocks[1].id).toBe('1');
      expect(reordered.blocks[2].id).toBe('2');
    });
  });
});
