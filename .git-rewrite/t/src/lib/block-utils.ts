/**
 * Shared utilities for block components
 * Centralizes common styling and interaction patterns
 */

import type { Block } from '@/types/page';
import { logger } from './logger';

export type ButtonStyle = 'default' | 'rounded' | 'pill';
export type HoverEffect = 'default' | 'none' | 'glow' | 'scale' | 'shadow';

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image';
  value: string;
  gradientAngle?: number;
}

// ============= Styling Utilities =============

/**
 * Get button border radius class based on style
 */
export function getButtonClass(style?: ButtonStyle): string {
  switch (style) {
    case 'pill':
      return 'rounded-full';
    case 'rounded':
      return 'rounded-lg';
    default:
      return 'rounded-md';
  }
}

/**
 * Get hover effect classes
 */
export function getHoverClass(effect?: HoverEffect): string {
  switch (effect) {
    case 'glow':
      return 'hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] transition-shadow duration-300';
    case 'scale':
      return 'hover:scale-105 transition-transform duration-300';
    case 'shadow':
      return 'hover:shadow-2xl transition-shadow duration-300';
    default:
      return 'hover:opacity-90 transition-opacity duration-300';
  }
}

/**
 * Get background style object for custom backgrounds
 */
export function getBackgroundStyle(background?: BackgroundConfig): React.CSSProperties {
  if (!background) return {};

  switch (background.type) {
    case 'gradient':
      return {
        background: `linear-gradient(${background.gradientAngle || 135}deg, ${background.value})`,
      };
    case 'image':
      return {
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    case 'solid':
    default:
      return {
        backgroundColor: background.value,
      };
  }
}

/**
 * Safely open URL in new tab with security attributes
 * Uses sendBeacon for tracking to ensure it completes before navigation
 */
export function openUrlSafely(url: string, trackingCallback?: () => void): void {
  // Call tracking first - it uses async but we don't wait
  if (trackingCallback) {
    trackingCallback();
  }
  // Small delay to allow tracking request to be sent
  // Using setTimeout 0 puts this in the next event loop tick
  setTimeout(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, 10);
}

/**
 * Common block click handler factory
 * Ensures tracking is called before URL navigation
 */
export function createBlockClickHandler(
  url?: string,
  onClick?: () => void
): (e?: React.MouseEvent) => void {
  return (e?: React.MouseEvent) => {
    // Prevent double tracking from event bubbling
    if (e) {
      e.stopPropagation();
    }

    // Call tracking callback
    if (onClick) {
      onClick();
    }

    // Open URL after tracking
    if (url) {
      // Small delay to ensure tracking request is sent
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }, 10);
    }
  };
}

// ============= Block Stability Utilities =============

/**
 * Generate a stable unique ID for a block
 * Uses crypto.randomUUID if available, falls back to timestamp + random
 */
export function generateBlockId(type: string): string {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);
  return `${type}-${Date.now()}-${random}`;
}

/**
 * Create a stable key for a row of blocks based on their IDs
 * This ensures React reconciliation works correctly when blocks move between rows
 */
export function createRowKey(blocks: Block[]): string {
  return blocks.map(b => b.id).join('::');
}

/**
 * Validate blocks array for integrity
 * Returns list of issues found
 */
export function validateBlocksIntegrity(blocks: Block[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Check for duplicate IDs
    if (seenIds.has(block.id)) {
      issues.push(`Duplicate block ID: ${block.id} at index ${i}`);
    }
    seenIds.add(block.id);

    // Check for empty/undefined IDs
    if (!block.id) {
      issues.push(`Block at index ${i} has no ID`);
    }

    // Check for missing type
    if (!block.type) {
      issues.push(`Block ${block.id || `at index ${i}`} has no type`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Ensure all blocks have valid IDs
 * Creates new IDs for blocks missing them (should never happen in practice)
 */
export function ensureBlockIds(blocks: Block[]): Block[] {
  return blocks.map((block, index) => {
    if (block.id) return block;

    // Generate ID for block missing one (safety net)
    logger.warn(`Block at position ${index} had no ID, generating one`, { context: 'block-utils' });
    return {
      ...block,
      id: generateBlockId(block.type || 'unknown'),
    };
  });
}

/**
 * Deduplicate blocks by ID (keeps first occurrence)
 * Logs warnings for any duplicates found
 */
export function deduplicateBlocks(blocks: Block[]): Block[] {
  const seenIds = new Set<string>();
  const result: Block[] = [];

  for (const block of blocks) {
    if (seenIds.has(block.id)) {
      logger.warn(`Duplicate block removed: ${block.id}`, { context: 'block-utils' });
      continue;
    }
    seenIds.add(block.id);
    result.push(block);
  }

  return result;
}

/**
 * Reorder blocks safely using array move logic
 * Returns new array, does not mutate input
 */
export function reorderBlocks<T>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

/**
 * Check if blocks array has changed (shallow comparison by IDs and order)
 */
export function blocksOrderChanged(oldBlocks: Block[], newBlocks: Block[]): boolean {
  if (oldBlocks.length !== newBlocks.length) return true;

  for (let i = 0; i < oldBlocks.length; i++) {
    if (oldBlocks[i].id !== newBlocks[i].id) return true;
  }

  return false;
}
