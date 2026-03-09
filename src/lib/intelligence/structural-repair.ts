/**
 * Structural Repair Engine
 * Detects anti-patterns in block ordering and suggests reorder fixes.
 * Pure rules, zero AI.
 */

import type { Block } from '@/types/page';
import type { StructuralSuggestion } from './types';
import { getNichePack } from './niche-packs';

// Sets for role checking
const OFFER_TYPES: Set<string> = new Set(['pricing', 'product', 'catalog', 'booking']);
const CTA_TYPES: Set<string> = new Set(['button', 'messenger', 'form', 'newsletter', 'booking']);
const TRUST_TYPES: Set<string> = new Set(['testimonial', 'before_after', 'community']);
const FILLER_TYPES: Set<string> = new Set(['separator', 'socials', 'link', 'download', 'shoutout', 'scratch']);

// Cast helper — avoids TS strict nominal checks on BlockType vs string
const inSet = (set: Set<string>, val: string) => set.has(val);

export function detectAntiPatterns(blocks: Block[], niche?: string): StructuralSuggestion[] {
  const suggestions: StructuralSuggestion[] = [];
  if (blocks.length < 2) return suggestions;

  const types = blocks.map((b) => b.type);
  const len = types.length;

  // Helper: first index of any type in set
  const firstIndex = (set: Set<string>) => types.findIndex((t) => set.has(t));
  const firstOfType = (t: string) => types.indexOf(t);

  // 1. booking_too_low — booking in bottom 30%
  const bookingIdx = firstOfType('booking');
  if (bookingIdx >= 0 && bookingIdx > len * 0.7) {
    suggestions.push({
      id: 'booking_too_low',
      pattern: 'booking_too_low',
      severity: 'warning',
      messageKey: 'structural.bookingTooLow',
      targetBlockId: blocks[bookingIdx].id,
      fromIndex: bookingIdx,
      toIndex: Math.max(1, Math.floor(len * 0.4)),
    });
  }

  // 2. trust_before_offer — testimonial before any offer block
  const firstTrust = firstIndex(TRUST_TYPES);
  const firstOffer = firstIndex(OFFER_TYPES);
  if (firstTrust >= 0 && firstOffer >= 0 && firstTrust < firstOffer) {
    suggestions.push({
      id: 'trust_before_offer',
      pattern: 'trust_before_offer',
      severity: 'warning',
      messageKey: 'structural.trustBeforeOffer',
      targetBlockId: blocks[firstTrust].id,
      fromIndex: firstTrust,
      toIndex: firstOffer + 1,
    });
  }

  // 3. cta_without_context — CTA in first 2 positions with no content/offer above
  const firstCTA = firstIndex(CTA_TYPES);
  if (firstCTA >= 0 && firstCTA <= 1) {
    const hasContextAbove = types.slice(0, firstCTA).some(
      (t) => OFFER_TYPES.has(t) || t === 'text' || t === 'image' || t === 'video'
    );
    if (!hasContextAbove) {
      suggestions.push({
        id: 'cta_without_context',
        pattern: 'cta_without_context',
        severity: 'warning',
        messageKey: 'structural.ctaWithoutContext',
        targetBlockId: blocks[firstCTA].id,
      });
    }
  }

  // 4. pricing_after_faq — FAQ appears before pricing
  const faqIdx = firstOfType('faq');
  const pricingIdx = firstOfType('pricing');
  if (faqIdx >= 0 && pricingIdx >= 0 && faqIdx < pricingIdx) {
    suggestions.push({
      id: 'pricing_after_faq',
      pattern: 'pricing_after_faq',
      severity: 'warning',
      messageKey: 'structural.pricingAfterFaq',
      fromIndex: pricingIdx,
      toIndex: faqIdx,
    });
  }

  // 5. consecutive_text_blocks — 3+ text blocks in a row
  let consecutiveText = 0;
  for (let i = 0; i < len; i++) {
    if (types[i] === 'text') {
      consecutiveText++;
      if (consecutiveText >= 3) {
        suggestions.push({
          id: `consecutive_text_at_${i}`,
          pattern: 'consecutive_text_blocks',
          severity: 'info' as any, // downgrade to warning if needed
          messageKey: 'structural.consecutiveText',
          targetBlockId: blocks[i].id,
        });
        break; // only report once
      }
    } else {
      consecutiveText = 0;
    }
  }

  // 6. socials_above_cta — socials higher than primary CTA
  const socialsIdx = firstOfType('socials');
  if (socialsIdx >= 0 && firstCTA >= 0 && socialsIdx < firstCTA) {
    suggestions.push({
      id: 'socials_above_cta',
      pattern: 'socials_above_cta',
      severity: 'warning',
      messageKey: 'structural.socialsAboveCta',
      targetBlockId: blocks[socialsIdx].id,
      fromIndex: socialsIdx,
      toIndex: firstCTA + 1,
    });
  }

  // 7. missing_hero — first non-profile block is filler
  const firstNonProfile = types.findIndex((t) => t !== 'profile');
  if (firstNonProfile >= 0 && FILLER_TYPES.has(types[firstNonProfile])) {
    suggestions.push({
      id: 'missing_hero',
      pattern: 'missing_hero',
      severity: 'warning',
      messageKey: 'structural.missingHero',
      targetBlockId: blocks[firstNonProfile].id,
    });
  }

  return suggestions;
}
