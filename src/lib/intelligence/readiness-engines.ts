/**
 * Readiness Engines — Publish / Activation / Conversion
 * Deterministic readiness checks with explainable blockers.
 */

import type { PageData, Block } from '@/types/page';
import type { ReadinessResult } from './types';
import { getNichePack } from './niche-packs';

const CTA_TYPES = new Set(['button', 'messenger', 'form', 'newsletter', 'booking']);
const OFFER_TYPES = new Set(['pricing', 'product', 'catalog', 'booking']);
const TRUST_TYPES = new Set(['testimonial', 'before_after', 'community']);
const CONTACT_TYPES = new Set(['messenger', 'form', 'booking', 'map']);

function hasType(blocks: Block[], type: string): boolean {
  return blocks.some((b) => b.type === type);
}
function hasAnyType(blocks: Block[], set: Set<string>): boolean {
  return blocks.some((b) => set.has(b.type));
}

// ── Publish Readiness ──

export function checkPublishReadiness(pageData: PageData): ReadinessResult {
  const blocks = pageData.blocks;
  const blockers: string[] = [];
  const improvements: string[] = [];

  const nonProfile = blocks.filter((b) => b.type !== 'profile');
  if (nonProfile.length === 0) blockers.push('readiness.publish.noContent');
  if (!hasType(blocks, 'profile')) blockers.push('readiness.publish.noProfile');

  // Check for any completely empty blocks (crude: blocks that are just type + id)
  if (!hasAnyType(blocks, CTA_TYPES)) improvements.push('readiness.publish.noCta');
  if (!pageData.seo?.title) improvements.push('readiness.publish.noSeoTitle');

  const score = blockers.length > 0 ? 0 : Math.min(100, 50 + (5 - improvements.length) * 10);

  return {
    ready: blockers.length === 0 && nonProfile.length >= 1,
    score: Math.max(0, score),
    blockers,
    improvements,
  };
}

// ── Activation Readiness ──

export function checkActivationReadiness(pageData: PageData, niche?: string): ReadinessResult {
  const blocks = pageData.blocks;
  const blockers: string[] = [];
  const improvements: string[] = [];

  // Must be published
  if (!pageData.isPublished) blockers.push('readiness.activation.notPublished');

  // Shareable = has identity + some content
  if (!hasType(blocks, 'profile')) blockers.push('readiness.activation.noProfile');
  const nonProfile = blocks.filter((b) => b.type !== 'profile');
  if (nonProfile.length < 2) blockers.push('readiness.activation.thinContent');

  // Has CTA
  if (!hasAnyType(blocks, CTA_TYPES)) improvements.push('readiness.activation.noCta');

  // Has contact
  const hasContact = hasAnyType(blocks, CONTACT_TYPES) ||
    !!(pageData.contact_email || pageData.contact_phone || pageData.contact_whatsapp);
  if (!hasContact) improvements.push('readiness.activation.noContact');

  // Offer clarity
  if (!hasAnyType(blocks, OFFER_TYPES)) improvements.push('readiness.activation.noOffer');

  let score = 100;
  score -= blockers.length * 30;
  score -= improvements.length * 10;

  return {
    ready: blockers.length === 0,
    score: Math.max(0, Math.min(100, score)),
    blockers,
    improvements,
  };
}

// ── Conversion Readiness ──

export function checkConversionReadiness(pageData: PageData, niche?: string): ReadinessResult {
  const blocks = pageData.blocks;
  const blockers: string[] = [];
  const improvements: string[] = [];
  const pack = getNichePack(niche);

  // Offer clarity
  if (!hasAnyType(blocks, OFFER_TYPES)) blockers.push('readiness.conversion.noOffer');

  // CTA path
  if (!hasAnyType(blocks, CTA_TYPES)) blockers.push('readiness.conversion.noCta');

  // Trust
  if (!hasAnyType(blocks, TRUST_TYPES)) improvements.push('readiness.conversion.noTrust');

  // FAQ for objection handling (if has booking/pricing)
  if ((hasType(blocks, 'booking') || hasType(blocks, 'pricing')) && !hasType(blocks, 'faq')) {
    improvements.push('readiness.conversion.noFaq');
  }

  // Contact redundancy (multiple paths = better)
  const contactCount = blocks.filter((b) => CONTACT_TYPES.has(b.type)).length;
  if (contactCount < 2 && !pageData.contact_whatsapp) {
    improvements.push('readiness.conversion.singleContactPath');
  }

  // Niche critical blocks missing
  for (const critical of pack.criticalBlocks) {
    if (!hasType(blocks, critical)) {
      improvements.push(`readiness.conversion.missing_${critical}`);
    }
  }

  let score = 100;
  score -= blockers.length * 25;
  score -= improvements.length * 8;

  return {
    ready: blockers.length === 0,
    score: Math.max(0, Math.min(100, score)),
    blockers,
    improvements,
  };
}
