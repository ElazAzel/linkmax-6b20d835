/**
 * Sample copy a new block starts with. It is there so the owner has something
 * to tap and edit on the canvas; visitors never get it (block-visibility).
 */
export const DEFAULT_TEXT_CONTENT = 'Напишите что-нибудь интересное…';

const isSample = (v: unknown) => typeof v === 'string' && v.trim() === DEFAULT_TEXT_CONTENT;

/**
 * The value with the untouched sample removed, per language: a block whose
 * Russian text is still the sample but has a real English one keeps only the
 * English (the sample would otherwise be what Russian visitors get).
 */
export function withoutDefaultText<T>(value: T): T | '' {
  if (isSample(value)) return '';
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, isSample(v) ? '' : v])) as T;
  }
  return value;
}

/** True when nothing but the untouched sample text is in the value. */
export function isDefaultTextContent(value: unknown): boolean {
  if (isSample(value)) return true;
  if (value && typeof value === 'object') {
    const filled = Object.values(value).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    return filled.length > 0 && filled.every(isSample);
  }
  return false;
}
