/**
 * A link target an owner typed into a block, or undefined when it is not one
 * a visitor can safely follow (javascript:, data:, relative junk, blanks).
 * "example.com" without a scheme is treated as https.
 */
export function getSafeHref(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  if (/^(mailto|tel):/i.test(raw)) return raw;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The public address of a social profile. web.telegram.org deep links
 * ("https://web.telegram.org/#@name", "/k/#@name") only open for people who
 * are logged in to Telegram Web; t.me works in every app and for crawlers.
 */
export function canonicalSocialUrl(url: string): string {
  const raw = url.trim();
  const tgWeb = raw.match(/^(?:https?:\/\/)?web\.telegram\.org\/[^#]*#@?([A-Za-z0-9_]{3,})\/?$/i);
  return tgWeb ? `https://t.me/${tgWeb[1]}` : raw;
}

/** Alt texts left over from templates; they describe nothing on a real page. */
export const PLACEHOLDER_ALTS = new Set(['beautiful workspace', 'image', 'photo', 'cover', 'изображение', 'фото']);

/**
 * Alt text worth showing to screen readers and crawlers. A template
 * placeholder falls back to the domain the image links to; an image with
 * neither is decorative and gets an empty alt.
 */
export function imageAltText(alt: string | undefined, link?: string): string {
  const value = (alt ?? '').trim();
  if (value && !PLACEHOLDER_ALTS.has(value.toLowerCase())) return value;
  const href = getSafeHref(link);
  if (!href) return '';
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Open an owner-typed link in a new tab. "instagram.com/x" without a scheme
 * used to resolve against the page and land on a 404; unsafe schemes are
 * dropped. Opens synchronously so mobile popup blockers see the user's tap.
 */
export function openExternal(value: unknown): boolean {
  const href = getSafeHref(value);
  if (!href || typeof window === 'undefined') return false;
  // Keep a valid link exactly as the owner typed it (no added trailing slash).
  const raw = String(value).trim();
  window.open(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : href, '_blank', 'noopener,noreferrer');
  return true;
}

const URL_FIELDS = ['url', 'link', 'buyLink', 'fileUrl', 'telegramLink'] as const;
const BARE_DOMAIN = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:[/?#]\S*)?$/i;

/**
 * "dikidi.net/glow" → "https://dikidi.net/glow" for the link fields of a
 * block, the way Korner and Taplink accept links typed without a scheme.
 * Returns only the fields that changed.
 */
export function withUrlSchemes(block: Record<string, unknown>): Record<string, string> {
  const updates: Record<string, string> = {};
  for (const key of URL_FIELDS) {
    const value = block[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (BARE_DOMAIN.test(trimmed)) updates[key] = `https://${trimmed}`;
  }
  return updates;
}
