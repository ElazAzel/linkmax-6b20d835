/**
 * Design Health (Phase 6 of the art-direction hierarchy).
 *
 * Deterministic, LLM-free audit of a page's art direction. It answers the
 * question a designer would answer in 5 seconds: "why does this page look
 * like a stack of identical cards, and what is the single next fix?"
 *
 * Every issue carries an optional one-click `fix(blocks) => Block[]` that only
 * touches design fields (`sectionId` / `composition` / `designVariant`) or
 * ordering — never block content, never block types.
 */

import type { Block } from '@/types/blocks';
import { getBlockMeta, type BusinessIntent } from '@/lib/blocks/block-meta';
import { applyArtDirection } from '@/lib/design/art-direction';
import { getComposition } from '@/lib/design/composition';

export type DesignIssueSeverity = 'critical' | 'warning' | 'hint';

export interface DesignIssue {
  id: string;
  severity: DesignIssueSeverity;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
  /** Weight subtracted from the 0..100 score. */
  weight: number;
  /** Optional deterministic auto-fix. */
  fix?: (blocks: Block[]) => Block[];
  fixLabelKey?: string;
  fixLabelFallback?: string;
}

export interface DesignHealthReport {
  score: number; // 0..100
  issues: DesignIssue[];
  sectionCount: number;
  designedRatio: number; // share of content blocks that belong to a section
}

const MEDIA_TYPES = new Set(['image', 'gallery', 'carousel', 'video', 'before_after']);
const ACTION_INTENTS: BusinessIntent[] = ['book', 'capture', 'contact'];

function intents(block: Block): BusinessIntent[] {
  return getBlockMeta(block.type)?.intents ?? [];
}

function contentBlocks(blocks: Block[]): Block[] {
  return (blocks || []).filter((b) => b.type !== 'profile');
}

/** Number of distinct section runs implied by `sectionId`. */
function countSections(blocks: Block[]): number {
  const ids = new Set<string>();
  contentBlocks(blocks).forEach((b) => {
    if (b.sectionId) ids.add(b.sectionId);
  });
  return ids.size;
}

/** Longest run of adjacent blocks that share the same (or no) composition. */
function longestMonotoneRun(blocks: Block[]): number {
  const content = contentBlocks(blocks);
  let best = 0;
  let current = 0;
  let currentSection: string | undefined;
  content.forEach((b) => {
    const key = b.sectionId ?? '__none__';
    if (key === currentSection) {
      current += 1;
    } else {
      currentSection = key;
      current = 1;
    }
    best = Math.max(best, current);
  });
  return best;
}

export function analyzeDesignHealth(blocks: Block[]): DesignHealthReport {
  const content = contentBlocks(blocks);
  const issues: DesignIssue[] = [];
  const sectionCount = countSections(blocks);
  const designed = content.filter((b) => !!b.sectionId).length;
  const designedRatio = content.length ? designed / content.length : 0;

  if (content.length === 0) {
    return { score: 0, issues, sectionCount: 0, designedRatio: 0 };
  }

  // 1. No art direction applied at all.
  if (designedRatio < 0.5) {
    issues.push({
      id: 'no-art-direction',
      severity: 'critical',
      weight: 35,
      titleKey: 'editor.designHealth.issue.noArtDirection.title',
      titleFallback: 'Страница без арт-дирекшена',
      descKey: 'editor.designHealth.issue.noArtDirection.desc',
      descFallback:
        'Блоки идут одинаковыми карточками. Примените рецепт дизайна — секции получат ритм, акценты и типографику.',
      fixLabelKey: 'editor.designHealth.fix.applyRecipe',
      fixLabelFallback: 'Применить дизайн',
      fix: (b) => applyArtDirection(b, { seed: 'health', preserveExisting: true }).blocks,
    });
  }

  // 2. Hero section missing a strong opener.
  const first = content[0];
  const firstComposition = getComposition(first?.composition);
  if (!firstComposition || firstComposition.rhythm === 'stack') {
    issues.push({
      id: 'weak-hero',
      severity: 'warning',
      weight: 15,
      titleKey: 'editor.designHealth.issue.weakHero.title',
      titleFallback: 'Слабое первое впечатление',
      descKey: 'editor.designHealth.issue.weakHero.desc',
      descFallback:
        'Первая секция выглядит как обычная стопка. Герой должен быть крупным: split, редакционный или медиа во всю ширину.',
      fixLabelKey: 'editor.designHealth.fix.upgradeHero',
      fixLabelFallback: 'Усилить героя',
      fix: (b) => {
        const list = [...(b || [])];
        const idx = list.findIndex((x) => x.type !== 'profile');
        if (idx < 0) return list;
        const target = list[idx];
        const hasMedia = MEDIA_TYPES.has(list[idx + 1]?.type ?? '');
        list[idx] = {
          ...target,
          sectionId: target.sectionId ?? `sec-hero-${Date.now().toString(36)}`,
          composition: hasMedia ? 'split-hero' : 'editorial-hero',
          designVariant:
            target.type === 'text' ? target.designVariant ?? 'display-oversized' : target.designVariant,
        };
        if (hasMedia && list[idx + 1]) {
          list[idx + 1] = { ...list[idx + 1], sectionId: list[idx].sectionId };
        }
        return list;
      },
    });
  }

  // 3. Monotony: a long unbroken run of blocks in one section.
  const monotone = longestMonotoneRun(blocks);
  if (content.length >= 5 && monotone >= 5) {
    issues.push({
      id: 'monotone-rhythm',
      severity: 'warning',
      weight: 15,
      titleKey: 'editor.designHealth.issue.monotone.title',
      titleFallback: 'Однообразный ритм',
      descKey: 'editor.designHealth.issue.monotone.desc',
      descFallback:
        'Пять и более блоков идут в одном ритме подряд — глаз устаёт. Разбейте страницу на секции с разной вёрсткой.',
      fixLabelKey: 'editor.designHealth.fix.rebalance',
      fixLabelFallback: 'Разбить на секции',
      fix: (b) => applyArtDirection(b, { seed: 'rebalance' }).blocks,
    });
  }

  // 4. No media at all — page reads as a wall of text.
  const hasMedia = content.some((b) => MEDIA_TYPES.has(b.type));
  if (!hasMedia && content.length >= 3) {
    issues.push({
      id: 'no-visual',
      severity: 'warning',
      weight: 12,
      titleKey: 'editor.designHealth.issue.noVisual.title',
      titleFallback: 'Нет визуала',
      descKey: 'editor.designHealth.issue.noVisual.desc',
      descFallback:
        'На странице только текст и кнопки. Добавьте фото работ, галерею или видео — это главный аргумент для клиента.',
    });
  }

  // 5. No closing action section.
  const lastThird = content.slice(Math.max(0, content.length - 3));
  const hasClosingAction = lastThird.some((b) =>
    intents(b).some((i) => ACTION_INTENTS.includes(i)),
  );
  if (!hasClosingAction) {
    issues.push({
      id: 'no-closing-cta',
      severity: 'critical',
      weight: 20,
      titleKey: 'editor.designHealth.issue.noClosingCta.title',
      titleFallback: 'Нет финального шага',
      descKey: 'editor.designHealth.issue.noClosingCta.desc',
      descFallback:
        'В конце страницы нет записи, формы или контактов. Клиент дочитал — и ему некуда нажать.',
    });
  }

  // 6. Action blocks exist but are visually quiet in the closing section.
  const closingAction = [...content].reverse().find((b) =>
    intents(b).some((i) => ACTION_INTENTS.includes(i)),
  );
  if (closingAction) {
    const comp = getComposition(closingAction.composition);
    const isLoud = comp?.rhythm === 'full-bleed' || comp?.rhythm === 'spotlight';
    if (!isLoud) {
      issues.push({
        id: 'quiet-cta',
        severity: 'hint',
        weight: 8,
        titleKey: 'editor.designHealth.issue.quietCta.title',
        titleFallback: 'Тихий призыв к действию',
        descKey: 'editor.designHealth.issue.quietCta.desc',
        descFallback:
          'Финальный блок с записью или контактами выглядит как остальные. Сделайте его секцией на весь экран.',
        fixLabelKey: 'editor.designHealth.fix.loudCta',
        fixLabelFallback: 'Выделить призыв',
        fix: (b) => {
          const list = [...(b || [])];
          const idx = list.findIndex((x) => x.id === closingAction.id);
          if (idx < 0) return list;
          list[idx] = {
            ...list[idx],
            sectionId: `sec-cta-${Date.now().toString(36)}`,
            composition: 'fullscreen-contact',
            designVariant: list[idx].type === 'button' ? 'button-solid-bold' : list[idx].designVariant,
          };
          return list;
        },
      });
    }
  }

  // 7. Too many sections for a short page — over-designed.
  if (content.length >= 4 && sectionCount > 0 && sectionCount >= content.length) {
    issues.push({
      id: 'too-many-sections',
      severity: 'hint',
      weight: 6,
      titleKey: 'editor.designHealth.issue.tooManySections.title',
      titleFallback: 'Слишком много секций',
      descKey: 'editor.designHealth.issue.tooManySections.desc',
      descFallback:
        'Почти каждый блок — отдельная секция. Страница дробится, вёрстка не читается как целое.',
      fixLabelKey: 'editor.designHealth.fix.regroup',
      fixLabelFallback: 'Сгруппировать',
      fix: (b) => applyArtDirection(b, { seed: 'regroup' }).blocks,
    });
  }

  const penalty = issues.reduce((sum, i) => sum + i.weight, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return { score, issues, sectionCount, designedRatio };
}

export function healthTone(score: number): 'good' | 'ok' | 'poor' {
  if (score >= 80) return 'good';
  if (score >= 50) return 'ok';
  return 'poor';
}
