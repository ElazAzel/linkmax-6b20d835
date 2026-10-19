/**
 * Sample copy a new block starts with. It is there so the owner has something
 * to tap and edit on the canvas; visitors never get it (block-visibility).
 */
export const DEFAULT_TEXT_CONTENT = 'Напишите что-нибудь интересное…';

/** True when the value is still the untouched sample text. */
export function isDefaultTextContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === DEFAULT_TEXT_CONTENT;
  if (value && typeof value === 'object') {
    const filled = Object.values(value).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    return filled.length > 0 && filled.every((v) => v.trim() === DEFAULT_TEXT_CONTENT);
  }
  return false;
}
