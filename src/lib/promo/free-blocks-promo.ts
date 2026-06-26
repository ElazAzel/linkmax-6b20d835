/**
 * Promo: All blocks are free for everyone until 2027-01-01 UTC.
 * After that date, the regular premium gating is restored.
 *
 * Auto-translation of blocks remains a paid-only feature regardless of this promo
 * (see LanguageContext).
 */
export const BLOCKS_FREE_PROMO_UNTIL = new Date('2027-01-01T00:00:00Z');

export function isBlocksFreePromoActive(now: Date = new Date()): boolean {
  return now.getTime() < BLOCKS_FREE_PROMO_UNTIL.getTime();
}
