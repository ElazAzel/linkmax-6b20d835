/**
 * Utilities for fetching and handling favicons
 */

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Get favicon URL from Google's favicon service
 */
export function getGoogleFaviconUrl(domain: string, size: number = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/**
 * Get direct favicon URL from domain
 */
export function getDirectFaviconUrl(domain: string): string {
  return `https://${domain}/favicon.ico`;
}

/**
 * Check if an image URL is valid/loadable
 */
export function checkImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // Set timeout to avoid hanging
    setTimeout(() => resolve(false), 5000);
    img.src = url;
  });
}

/**
 * Get the best available favicon URL for a domain
 * Tries Google first, then direct favicon.ico
 */
export async function getBestFaviconUrl(url: string): Promise<string | null> {
  const domain = extractDomain(url);
  if (!domain) return null;

  // Try Google favicon service first (most reliable)
  const googleUrl = getGoogleFaviconUrl(domain);
  const googleWorks = await checkImageUrl(googleUrl);
  if (googleWorks) return googleUrl;

  // Fallback to direct favicon.ico
  const directUrl = getDirectFaviconUrl(domain);
  const directWorks = await checkImageUrl(directUrl);
  if (directWorks) return directUrl;

  return null;
}
