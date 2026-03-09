/**
 * Next-Best-Action Engine
 * Consumes all other engines, produces a ranked list of suggestions.
 * Deterministic scoring. Zero AI calls.
 */

import type { PageData, Block } from '@/types/page';
import type { BlockType } from '@/types/blocks/base';
import type { Suggestion, SuggestionPriority, SuggestionEffort } from './types';
import { analyzeComposition } from './composition-analyzer';
import { evaluateAllBlocks } from './block-quality-evaluator';
import { detectAntiPatterns } from './structural-repair';
import { checkPublishReadiness, checkActivationReadiness, checkConversionReadiness } from './readiness-engines';
import { getNichePack } from './niche-packs';

function priority(score: number): SuggestionPriority {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getNextBestActions(
  pageData: PageData,
  niche: string | undefined,
  options?: { maxResults?: number; isPremium?: boolean }
): Suggestion[] {
  const max = options?.maxResults ?? 5;
  const candidates: Suggestion[] = [];
  const blocks = pageData.blocks;
  const pack = getNichePack(niche);
  const typeSet = new Set(blocks.map((b) => b.type));

  // ── 1. Composition gaps → add_block suggestions ──
  const comp = analyzeComposition(blocks, niche, pageData);

  if (!comp.coverage.hasCTA) {
    const ctaType = pack.ctaBlocks.find((t) => !typeSet.has(t)) || 'messenger';
    candidates.push({
      id: `add_cta_${ctaType}`,
      titleKey: 'nba.addCta',
      reasonKey: 'nba.reason.noCta',
      priority: 'critical',
      effort: 'quick',
      category: 'add_block',
      impactScore: 85,
      targetBlockType: ctaType as BlockType,
      actionType: `insert_${ctaType}`,
    });
  }

  if (!comp.coverage.hasOffer) {
    candidates.push({
      id: 'add_offer',
      titleKey: 'nba.addOffer',
      reasonKey: 'nba.reason.noOffer',
      priority: 'high',
      effort: 'quick',
      category: 'add_block',
      impactScore: 75,
      targetBlockType: 'pricing',
      actionType: 'insert_pricing',
    });
  }

  if (!comp.coverage.hasTrust && comp.coverage.hasOffer) {
    candidates.push({
      id: 'add_trust',
      titleKey: 'nba.addTrust',
      reasonKey: 'nba.reason.noTrust',
      priority: 'medium',
      effort: 'moderate',
      category: 'add_block',
      impactScore: 55,
      targetBlockType: 'testimonial',
      actionType: 'insert_testimonial',
    });
  }

  // Missing niche-critical blocks
  for (const critical of pack.criticalBlocks) {
    if (!typeSet.has(critical)) {
      const weight = pack.blockWeights[critical] || 1;
      const existing = candidates.find((c) => c.actionType === `insert_${critical}`);
      if (!existing) {
        candidates.push({
          id: `add_niche_${critical}`,
          titleKey: `nba.add_${critical}`,
          reasonKey: `nba.reason.niche_missing_${critical}`,
          priority: priority(70 * weight),
          effort: 'quick',
          category: 'add_block',
          impactScore: Math.round(70 * weight),
          targetBlockType: critical as BlockType,
          actionType: `insert_${critical}`,
        });
      }
    }
  }

  // ── 2. Block quality issues → fix_block suggestions ──
  const quality = evaluateAllBlocks(blocks);
  for (const report of quality) {
    if (report.issues.length === 0) continue;
    const hasError = report.issues.some((i) => i.severity === 'error');
    if (hasError) {
      candidates.push({
        id: `fix_${report.blockId}`,
        titleKey: 'nba.fixBlock',
        reasonKey: report.issues[0].messageKey,
        priority: 'high',
        effort: 'instant',
        category: 'fix_block',
        impactScore: 70,
        targetBlockId: report.blockId,
        targetBlockType: report.blockType as BlockType,
        actionType: 'edit_block',
      });
    } else if (report.issues.some((i) => i.severity === 'warning')) {
      candidates.push({
        id: `improve_${report.blockId}`,
        titleKey: 'nba.improveBlock',
        reasonKey: report.issues[0].messageKey,
        priority: 'medium',
        effort: 'instant',
        category: 'fix_block',
        impactScore: 40,
        targetBlockId: report.blockId,
        targetBlockType: report.blockType as BlockType,
        actionType: 'edit_block',
      });
    }
  }

  // ── 3. Structural issues → reorder suggestions ──
  const structural = detectAntiPatterns(blocks, niche);
  for (const s of structural) {
    candidates.push({
      id: `reorder_${s.id}`,
      titleKey: 'nba.fixStructure',
      reasonKey: s.messageKey,
      priority: s.severity === 'error' ? 'high' : 'medium',
      effort: 'instant',
      category: 'reorder',
      impactScore: 60,
      targetBlockId: s.targetBlockId,
      actionType: 'reorder',
      meta: { fromIndex: s.fromIndex, toIndex: s.toIndex },
    });
  }

  // ── 4. Readiness blockers ──
  const pub = checkPublishReadiness(pageData);
  const act = checkActivationReadiness(pageData, niche);

  // Publish prompt
  if (pub.ready && !pageData.isPublished) {
    candidates.push({
      id: 'publish_page',
      titleKey: 'nba.publish',
      reasonKey: 'nba.reason.readyToPublish',
      priority: 'critical',
      effort: 'instant',
      category: 'publish',
      impactScore: 90,
      actionType: 'publish',
    });
  }

  // Share prompt
  if (pageData.isPublished && act.ready) {
    candidates.push({
      id: 'share_page',
      titleKey: 'nba.share',
      reasonKey: 'nba.reason.readyToShare',
      priority: 'high',
      effort: 'instant',
      category: 'share',
      impactScore: 85,
      actionType: 'share',
    });
  }

  // Settings suggestions
  if (!pageData.niche || pageData.niche === 'other') {
    candidates.push({
      id: 'set_niche',
      titleKey: 'nba.setNiche',
      reasonKey: 'nba.reason.noNiche',
      priority: 'medium',
      effort: 'instant',
      category: 'settings',
      impactScore: 50,
      actionType: 'settings_niche',
    });
  }

  if (!pageData.city) {
    candidates.push({
      id: 'set_city',
      titleKey: 'nba.setCity',
      reasonKey: 'nba.reason.noCity',
      priority: 'low',
      effort: 'instant',
      category: 'settings',
      impactScore: 35,
      actionType: 'settings_city',
    });
  }

  // ── 5. Deduplicate & rank ──
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const key = `${c.actionType}_${c.targetBlockId || c.targetBlockType || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => b.impactScore - a.impactScore);
  return unique.slice(0, max);
}
