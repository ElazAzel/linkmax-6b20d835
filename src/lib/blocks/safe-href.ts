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
