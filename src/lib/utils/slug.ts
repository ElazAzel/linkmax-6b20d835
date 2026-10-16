const SLUG_REGEX = /^[a-z0-9-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 30;

export interface SlugValidationResult {
  valid: boolean;
  error?: 'invalid_slug';
}

export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH);
}

// Russian + Kazakh letters → Latin, so «Мастер маникюра» becomes a readable,
// search-friendly address instead of being dropped.
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ә: 'a', ғ: 'g', қ: 'q', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
};

export function transliterate(value: string): string {
  return Array.from(value.toLowerCase(), (ch) => TRANSLIT[ch] ?? ch).join('');
}

/** Live input version of sanitizeSlug: keeps a trailing hyphen so it can be typed. */
export function slugWhileTyping(value: string): string {
  return transliterate(value)
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .slice(0, MAX_SLUG_LENGTH);
}

export function slugifyTitle(value: string): string {
  return sanitizeSlug(transliterate(value).replace(/[_.]+/g, '-'));
}

export function validateSlug(slug: string): SlugValidationResult {
  if (!SLUG_REGEX.test(slug)) {
    return { valid: false, error: 'invalid_slug' };
  }

  if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) {
    return { valid: false, error: 'invalid_slug' };
  }

  return { valid: true };
}

export const SLUG_LIMITS = {
  min: MIN_SLUG_LENGTH,
  max: MAX_SLUG_LENGTH,
} as const;
