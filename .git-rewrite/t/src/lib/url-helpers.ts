/**
 * URL helper functions for generating and managing page URLs
 */

import { logger } from './logger';

/**
 * Get the base URL of the application
 */
export function getBaseUrl(): string {
  return window.location.origin;
}

/**
 * Generate a public page URL from a slug
 */
export function getPublicPageUrl(slug: string): string {
  return `https://lnkmx.my/${slug}`;
}

/**
 * Generate a preview URL for a page
 */
export function getPreviewUrl(slug: string): string {
  return `/${slug}`;
}

/**
 * Copy URL to clipboard and return success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error('Failed to copy to clipboard', error, { context: 'url-helpers' });
    return false;
  }
}
