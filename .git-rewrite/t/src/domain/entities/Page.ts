/**
 * Page Entity - Core domain model for user pages
 * Pure business logic, no external dependencies
 */

import type { BaseBlock, BlockType } from './Block';

// ============= Value Objects =============

export type EditorMode = 'grid';

export interface PageTheme {
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  buttonStyle: 'default' | 'rounded' | 'pill' | 'gradient';
  fontFamily: 'sans' | 'serif' | 'mono';
  darkMode?: boolean;
}

export interface PageSeo {
  title: string;
  description: string;
  keywords: string[];
}

export interface PageMetrics {
  googleAnalytics?: string;
  facebookPixel?: string;
  yandexMetrika?: string;
  tiktokPixel?: string;
}

export interface GridConfig {
  columnsDesktop: number;
  columnsMobile: number;
  gapSize: number;
  cellHeight: number;
}

  /**
   * NEW: Page i18n configuration
   * Controls which languages are available on this page and defaults
   */
  export interface PageI18nConfig {
    /** List of active language codes for this page (e.g., ['ru', 'en', 'tr']) */
    languages: string[];
    /** Default/primary language code (must be in languages list) */
    defaultLanguage: string;
    /** Auto-detection mode: if 'auto', use Accept-Language / geo / browser language */
    languageMode?: 'auto' | 'manual';
  }

  // ============= Page Entity =============

export interface Page<TBlock extends BaseBlock = BaseBlock> {
  id: string;
  userId?: string;
  slug?: string;
  blocks: TBlock[];
  theme: PageTheme;
  seo: PageSeo;
  isPremium?: boolean;
  isPublished?: boolean;
  metrics?: PageMetrics;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
    /** NEW: i18n configuration for this page */
    i18n?: PageI18nConfig;
}

// ============= Default Values =============

export const DEFAULT_THEME: PageTheme = {
  backgroundColor: 'hsl(var(--background))',
  textColor: 'hsl(var(--foreground))',
  buttonStyle: 'rounded',
  fontFamily: 'sans',
};

export const DEFAULT_SEO: PageSeo = {
  title: 'My LinkMAX Page',
  description: 'Check out my links',
  keywords: [],
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columnsDesktop: 3,
  columnsMobile: 2,
  gapSize: 16,
  cellHeight: 100,
};

  export const DEFAULT_I18N_CONFIG: PageI18nConfig = {
    languages: ['ru', 'en', 'kk'],
    defaultLanguage: 'ru',
    languageMode: 'auto',
  };

// ============= Factory Functions =============

/**
 * Create a default profile block
 */
function createDefaultProfileBlock(): BaseBlock {
  return {
    id: `profile-${Date.now()}`,
    type: 'profile',
  };
}

/**
 * Create a default page for a user
 */
export function createDefaultPage<TBlock extends BaseBlock = BaseBlock>(
  userId: string,
  profileBlock?: TBlock
): Page<TBlock> {
  return {
    id: '',
    userId,
    blocks: [profileBlock || createDefaultProfileBlock() as unknown as TBlock],
    theme: { ...DEFAULT_THEME },
    seo: { ...DEFAULT_SEO },
    editorMode: 'grid',
    i18n: { ...DEFAULT_I18N_CONFIG },
  };
}

// ============= Domain Logic =============

/**
 * Check if page has premium content
 */
export function hasPremiumContent(page: Page): boolean {
  const PREMIUM_TYPES: BlockType[] = ['video', 'carousel', 'custom_code', 'form', 'newsletter', 'testimonial', 'scratch', 'search', 'catalog', 'countdown'];
  return page.blocks.some(block => PREMIUM_TYPES.includes(block.type));
}

/**
 * Check if page has a profile block
 */
export function hasProfileBlock(page: Page): boolean {
  return page.blocks.some(block => block.type === 'profile');
}

/**
 * Count blocks in page
 */
export function countBlocks(page: Page, excludeProfile: boolean = false): number {
  if (excludeProfile) {
    return page.blocks.filter(block => block.type !== 'profile').length;
  }
  return page.blocks.length;
}

/**
 * Get block count by type
 */
export function getBlockCountByType(page: Page): Record<BlockType, number> {
  const counts = {} as Record<BlockType, number>;
  
  for (const block of page.blocks) {
    counts[block.type] = (counts[block.type] || 0) + 1;
  }
  
  return counts;
}

/**
 * Find block by ID
 */
export function findBlockById<TBlock extends BaseBlock>(
  page: Page<TBlock>,
  blockId: string
): TBlock | undefined {
  return page.blocks.find(block => block.id === blockId);
}

/**
 * Find block index by ID
 */
export function findBlockIndexById(page: Page, blockId: string): number {
  return page.blocks.findIndex(block => block.id === blockId);
}

/**
 * Check if page can be published
 */
export function canPublishPage(page: Page): { canPublish: boolean; reason?: string } {
  if (page.blocks.length === 0) {
    return { canPublish: false, reason: 'Page must have at least one block' };
  }
  
  const hasProfile = page.blocks.some(block => block.type === 'profile');
  if (!hasProfile) {
    return { canPublish: false, reason: 'Page must have a profile block' };
  }
  
  return { canPublish: true };
}

/**
 * Validate page structure
 */
export function validatePage(page: Page): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!page.userId) {
    errors.push('User ID is required');
  }
  
  if (!page.blocks || page.blocks.length === 0) {
    errors.push('Page must have at least one block');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reorder blocks by new order of IDs
 */
export function reorderBlocks<TBlock extends BaseBlock>(
  page: Page<TBlock>,
  newOrder: string[]
): Page<TBlock> {
  const blockMap = new Map(page.blocks.map(block => [block.id, block]));
  const reorderedBlocks: TBlock[] = [];
  
  for (const id of newOrder) {
    const block = blockMap.get(id);
    if (block) {
      reorderedBlocks.push(block);
    }
  }
  
  // Add any blocks not in the new order at the end
  for (const block of page.blocks) {
    if (!newOrder.includes(block.id)) {
      reorderedBlocks.push(block);
    }
  }
  
  return {
    ...page,
    blocks: reorderedBlocks,
  };
}

/**
 * Reorder blocks by moving a block from one index to another
 */
export function reorderBlocksByIndex<TBlock extends BaseBlock>(
  blocks: TBlock[],
  fromIndex: number,
  toIndex: number
): TBlock[] {
  if (fromIndex < 0 || fromIndex >= blocks.length) {
    return blocks;
  }
  if (toIndex < 0 || toIndex >= blocks.length) {
    return blocks;
  }
  
  const result = [...blocks];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  return result;
}
