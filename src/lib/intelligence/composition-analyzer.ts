/**
 * Page Composition Analyzer
 * Deterministic analysis of page structure: coverage, gaps, roles, structural score.
 * Zero AI calls. Pure function.
 */

import type { Block, PageData } from '@/types/page';
import type { BlockType } from '@/types/blocks/base';
import type { CompositionReport, CompositionCoverage, BlockRole } from './types';
import { getNichePack } from './niche-packs';

// ── Block Role Classification ──

const ROLE_MAP: Record<string, BlockRole> = {
  profile: 'identity',
  avatar: 'identity',
  pricing: 'offer',
  product: 'offer',
  catalog: 'offer',
  booking: 'offer', // also contact/cta
  testimonial: 'trust',
  before_after: 'trust',
  community: 'trust',
  button: 'cta',
  messenger: 'cta', // also contact
  form: 'cta', // also contact
  newsletter: 'cta',
  map: 'contact',
  text: 'content',
  image: 'content',
  video: 'content',
  carousel: 'content',
  faq: 'content',
  event: 'content',
  countdown: 'content',
  separator: 'filler',
  socials: 'filler',
  link: 'filler',
  download: 'filler',
  shoutout: 'filler',
  scratch: 'filler',
  custom_code: 'filler',
};

// Secondary roles (blocks that serve multiple purposes)
const CONTACT_TYPES = new Set<string>(['messenger', 'form', 'booking', 'map']);
const CTA_TYPES = new Set<string>(['button', 'messenger', 'form', 'newsletter', 'booking']);
const OFFER_TYPES = new Set<string>(['pricing', 'product', 'catalog', 'booking']);
const TRUST_TYPES = new Set<string>(['testimonial', 'before_after', 'community']);

export function getBlockRole(type: string): BlockRole {
  return ROLE_MAP[type] || 'filler';
}

export function analyzeComposition(
  blocks: Block[],
  niche: string | undefined,
  pageData: PageData
): CompositionReport {
  const types = blocks.map((b) => b.type);
  const typeSet = new Set(types);

  // Coverage
  const coverage: CompositionCoverage = {
    hasIdentity: types.some((t) => t === 'profile' || t === 'avatar'),
    hasOffer: types.some((t) => OFFER_TYPES.has(t)),
    hasTrust: types.some((t) => TRUST_TYPES.has(t)),
    hasCTA: types.some((t) => CTA_TYPES.has(t)),
    hasContact: types.some((t) => CONTACT_TYPES.has(t)) ||
      !!(pageData.contact_email || pageData.contact_phone || pageData.contact_whatsapp),
    hasContent: types.some((t) => t === 'text' || t === 'image' || t === 'video' || t === 'faq'),
  };

  // Build role map
  const blockRoles = new Map<string, BlockRole>();
  for (const b of blocks) {
    blockRoles.set(b.id, getBlockRole(b.type));
  }

  // Missing essentials
  const missingEssentials: string[] = [];
  if (!coverage.hasIdentity) missingEssentials.push('identity');
  if (!coverage.hasCTA) missingEssentials.push('cta');
  if (!coverage.hasContact) missingEssentials.push('contact');

  // Niche-specific critical blocks
  const pack = getNichePack(niche);
  for (const critical of pack.criticalBlocks) {
    if (!typeSet.has(critical)) {
      missingEssentials.push(`block:${critical}`);
    }
  }

  // Weak spots
  const weakSpots: string[] = [];

  // Offer without CTA
  if (coverage.hasOffer && !coverage.hasCTA) weakSpots.push('offer_no_cta');
  // CTA without context
  if (coverage.hasCTA && !coverage.hasOffer && !coverage.hasContent) weakSpots.push('cta_no_context');
  // No trust with offer
  if (coverage.hasOffer && !coverage.hasTrust) weakSpots.push('offer_no_trust');
  // Pricing without action path
  if (typeSet.has('pricing') && !typeSet.has('booking') && !typeSet.has('messenger') && !typeSet.has('form'))
    weakSpots.push('pricing_no_action');
  // Booking without FAQ
  if (typeSet.has('booking') && !typeSet.has('faq')) weakSpots.push('booking_no_faq');
  // Too many text blocks without action
  const textCount = types.filter((t) => t === 'text').length;
  const actionCount = types.filter((t) => CTA_TYPES.has(t)).length;
  if (textCount >= 3 && actionCount === 0) weakSpots.push('text_heavy_no_action');
  // Content thinness
  const nonProfileBlocks = blocks.filter((b) => b.type !== 'profile');
  if (nonProfileBlocks.length < 2) weakSpots.push('thin_content');
  // Redundant blocks
  if (types.filter((t) => t === 'messenger').length > 1) weakSpots.push('duplicate_messenger');
  if (types.filter((t) => t === 'booking').length > 1) weakSpots.push('duplicate_booking');

  // Structural score (0-100)
  const coverageCount = Object.values(coverage).filter(Boolean).length;
  const coverageScore = (coverageCount / 6) * 50; // max 50
  const weakPenalty = Math.min(weakSpots.length * 8, 30);
  const missingPenalty = Math.min(missingEssentials.length * 10, 30);
  const structuralScore = Math.max(0, Math.round(coverageScore + 50 - weakPenalty - missingPenalty));

  // Conversion readiness (simplified 0-100)
  let convScore = 0;
  if (coverage.hasOffer) convScore += 25;
  if (coverage.hasTrust) convScore += 20;
  if (coverage.hasCTA) convScore += 25;
  if (coverage.hasContact) convScore += 15;
  if (coverage.hasContent) convScore += 15;
  if (weakSpots.includes('offer_no_cta')) convScore -= 15;
  if (weakSpots.includes('pricing_no_action')) convScore -= 10;

  return {
    coverage,
    missingEssentials,
    weakSpots,
    structuralScore,
    conversionReadiness: Math.max(0, Math.min(100, convScore)),
    blockRoles,
  };
}
