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

export function slugifyTitle(value: string): string {
  return sanitizeSlug(value);
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
