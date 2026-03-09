/**
 * Block Quality Evaluator
 * Per-block weakness detection via a registry of type-specific evaluators.
 * Returns scored quality reports with actionable issues. No AI.
 */

import type { Block } from '@/types/page';
import type { BlockQualityReport, BlockIssue } from './types';

type Evaluator = (block: any) => BlockIssue[];

// ── Weak label detection ──
const WEAK_LABELS = new Set([
  'click here', 'нажми', 'кнопка', 'button', 'link', 'ссылка',
  'click', 'press', 'tap', 'go', 'submit', 'send',
]);

function isWeakLabel(label?: string): boolean {
  if (!label) return true;
  return WEAK_LABELS.has(label.toLowerCase().trim());
}

function textLength(val: unknown): number {
  if (typeof val === 'string') return val.trim().length;
  if (val && typeof val === 'object' && 'ru' in (val as any)) {
    return Math.max(...Object.values(val as Record<string, string>).map(v => (v || '').trim().length));
  }
  return 0;
}

// ── Evaluator Registry ──

const EVALUATORS: Partial<Record<string, Evaluator>> = {
  text: (b) => {
    const issues: BlockIssue[] = [];
    const len = textLength(b.content || b.text);
    if (len === 0) issues.push({ key: 'empty', severity: 'error', messageKey: 'quality.text.empty' });
    else if (len < 20) issues.push({ key: 'too_short', severity: 'warning', messageKey: 'quality.text.tooShort' });
    else if (len > 500) issues.push({ key: 'wall_of_text', severity: 'warning', messageKey: 'quality.text.wallOfText' });
    return issues;
  },

  pricing: (b) => {
    const issues: BlockIssue[] = [];
    const items = b.items || [];
    if (items.length === 0) issues.push({ key: 'no_items', severity: 'error', messageKey: 'quality.pricing.noItems' });
    else {
      const noPrice = items.filter((i: any) => !i.price && i.price !== 0);
      if (noPrice.length > 0) issues.push({ key: 'missing_price', severity: 'warning', messageKey: 'quality.pricing.missingPrice' });
      if (items.length > 10) issues.push({ key: 'too_many', severity: 'info', messageKey: 'quality.pricing.tooMany' });
    }
    return issues;
  },

  button: (b) => {
    const issues: BlockIssue[] = [];
    if (!b.url && !b.action) issues.push({ key: 'no_url', severity: 'error', messageKey: 'quality.button.noUrl' });
    if (isWeakLabel(b.label)) issues.push({ key: 'weak_label', severity: 'warning', messageKey: 'quality.button.weakLabel' });
    return issues;
  },

  messenger: (b) => {
    const issues: BlockIssue[] = [];
    if (!b.username && !b.phone && !b.url) issues.push({ key: 'no_contact', severity: 'error', messageKey: 'quality.messenger.noContact' });
    return issues;
  },

  booking: (b) => {
    const issues: BlockIssue[] = [];
    if (!b.title && !b.label) issues.push({ key: 'no_title', severity: 'warning', messageKey: 'quality.booking.noTitle' });
    return issues;
  },

  faq: (b) => {
    const issues: BlockIssue[] = [];
    const items = b.items || [];
    if (items.length === 0) issues.push({ key: 'no_items', severity: 'error', messageKey: 'quality.faq.noItems' });
    else if (items.length < 2) issues.push({ key: 'too_few', severity: 'warning', messageKey: 'quality.faq.tooFew' });
    return issues;
  },

  testimonial: (b) => {
    const issues: BlockIssue[] = [];
    const items = b.items || [];
    if (items.length === 0) issues.push({ key: 'no_items', severity: 'error', messageKey: 'quality.testimonial.noItems' });
    else {
      const weak = items.filter((i: any) => textLength(i.text) < 15);
      if (weak.length > 0) issues.push({ key: 'too_short', severity: 'warning', messageKey: 'quality.testimonial.tooShort' });
    }
    return issues;
  },

  form: (b) => {
    const issues: BlockIssue[] = [];
    const fields = b.fields || [];
    if (fields.length > 6) issues.push({ key: 'too_many_fields', severity: 'warning', messageKey: 'quality.form.tooManyFields' });
    if (fields.length === 0) issues.push({ key: 'no_fields', severity: 'error', messageKey: 'quality.form.noFields' });
    return issues;
  },

  profile: (b) => {
    const issues: BlockIssue[] = [];
    const bioLen = textLength(b.bio);
    if (!b.name && !b.title) issues.push({ key: 'no_name', severity: 'warning', messageKey: 'quality.profile.noName' });
    if (bioLen < 30 && bioLen > 0) issues.push({ key: 'short_bio', severity: 'info', messageKey: 'quality.profile.shortBio' });
    if (bioLen === 0) issues.push({ key: 'no_bio', severity: 'warning', messageKey: 'quality.profile.noBio' });
    if (!b.avatar) issues.push({ key: 'no_avatar', severity: 'warning', messageKey: 'quality.profile.noAvatar' });
    return issues;
  },

  link: (b) => {
    const issues: BlockIssue[] = [];
    if (!b.url) issues.push({ key: 'no_url', severity: 'error', messageKey: 'quality.link.noUrl' });
    if (isWeakLabel(b.title || b.label)) issues.push({ key: 'weak_label', severity: 'warning', messageKey: 'quality.link.weakLabel' });
    return issues;
  },

  image: (b) => {
    const issues: BlockIssue[] = [];
    if (!b.url && !b.src && !b.imageUrl) issues.push({ key: 'no_image', severity: 'error', messageKey: 'quality.image.noImage' });
    return issues;
  },

  socials: (b) => {
    const issues: BlockIssue[] = [];
    const links = b.links || [];
    if (links.length === 0) issues.push({ key: 'no_links', severity: 'error', messageKey: 'quality.socials.noLinks' });
    else {
      const empty = links.filter((l: any) => !l.url || l.url === 'https://instagram.com/' || l.url === 'https://tiktok.com/@');
      if (empty.length > 0) issues.push({ key: 'unfilled_links', severity: 'warning', messageKey: 'quality.socials.unfilledLinks' });
    }
    return issues;
  },

  newsletter: (b) => {
    const issues: BlockIssue[] = [];
    if (!b.title) issues.push({ key: 'no_title', severity: 'warning', messageKey: 'quality.newsletter.noTitle' });
    return issues;
  },
};

// ── Public API ──

export function evaluateBlock(block: Block): BlockQualityReport {
  const evaluator = EVALUATORS[block.type];
  const issues = evaluator ? evaluator(block) : [];

  // Score: 100 minus penalties
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'error') score -= 30;
    else if (issue.severity === 'warning') score -= 15;
    else score -= 5;
  }

  return {
    blockId: block.id,
    blockType: block.type,
    score: Math.max(0, score),
    issues,
  };
}

export function evaluateAllBlocks(blocks: Block[]): BlockQualityReport[] {
  return blocks.map(evaluateBlock);
}
