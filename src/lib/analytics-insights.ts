/**
 * Algorithmic analytics insights — pure heuristics, no LLM.
 * Extracted from InsightsScreen to be testable and reusable.
 */
import type { TFunction } from 'i18next';
import type { Block } from '@/types/page';

export type InsightImpact = 'high' | 'medium' | 'low';
export type InsightType = 'warning' | 'add' | 'optimize' | 'info';

export interface InsightAction {
  type: string;
  blockId?: string;
  data?: Record<string, unknown>;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action: (() => void) | null;
  impact: InsightImpact;
}

export interface InsightsInput {
  blocks: Block[];
  stats: {
    ctr: number;
    views: number;
    bounceRate: number;
    conversions: number;
    topBlocks: Array<{ blockId: string; blockTitle: string; ctr: number }>;
  };
  devicePercentages: { mobile: number; desktop: number; tablet: number };
}

const MAX_INSIGHTS = 4;

export function computeInsights(
  input: InsightsInput,
  t: TFunction,
  onApplyInsight: (action: InsightAction) => void,
): Insight[] {
  const { blocks, stats, devicePercentages } = input;
  const hasPricing = blocks.some((b) => b.type === 'pricing');
  const hasTestimonials = blocks.some((b) => b.type === 'testimonial');
  const hasContactForm = blocks.some((b) => b.type === 'form');

  const suggestions: Insight[] = [];

  if (stats.ctr < 5 && stats.views > 10) {
    suggestions.push({
      id: 'low-ctr',
      type: 'warning',
      title: t('dashboard.insights.lowCtr', 'Низкий CTR'),
      description: t('dashboard.insights.lowCtrDesc', `CTR всего ${stats.ctr.toFixed(1)}%. Добавьте яркие CTA-кнопки`),
      action: () => onApplyInsight({ type: 'add', data: { blockType: 'button' } }),
      impact: 'high',
    });
  }

  if (stats.bounceRate > 70 && stats.views > 10) {
    suggestions.push({
      id: 'high-bounce',
      type: 'warning',
      title: t('dashboard.insights.highBounce', 'Высокий показатель отказов'),
      description: t('dashboard.insights.highBounceDesc', `${stats.bounceRate.toFixed(0)}% посетителей уходят без действий`),
      action: () => onApplyInsight({ type: 'optimize', data: { action: 'improve_engagement' } }),
      impact: 'high',
    });
  }

  if (!hasPricing && blocks.length > 3) {
    suggestions.push({
      id: 'add-pricing',
      type: 'add',
      title: t('dashboard.insights.addPricing', 'Добавьте блок с ценами'),
      description: t('dashboard.insights.addPricingDesc', 'Страницы с прайсом получают на 40% больше заявок'),
      action: () => onApplyInsight({ type: 'add', data: { blockType: 'pricing' } }),
      impact: 'high',
    });
  }

  if (!hasTestimonials && blocks.length > 5) {
    suggestions.push({
      id: 'add-testimonials',
      type: 'add',
      title: t('dashboard.insights.addTestimonials', 'Добавьте отзывы'),
      description: t('dashboard.insights.addTestimonialsDesc', 'Отзывы увеличивают доверие и конверсию на 25%'),
      action: () => onApplyInsight({ type: 'add', data: { blockType: 'testimonial' } }),
      impact: 'medium',
    });
  }

  if (!hasContactForm && stats.views > 50 && stats.conversions === 0) {
    suggestions.push({
      id: 'add-form',
      type: 'add',
      title: t('dashboard.insights.addForm', 'Добавьте форму захвата'),
      description: t('dashboard.insights.addFormDesc', 'Есть трафик, но нет конверсий. Добавьте форму обратной связи'),
      action: () => onApplyInsight({ type: 'add', data: { blockType: 'contact_form' } }),
      impact: 'high',
    });
  }

  const topBlock = stats.topBlocks[0];
  if (topBlock && topBlock.ctr > 15) {
    suggestions.push({
      id: 'duplicate-top',
      type: 'optimize',
      title: t('dashboard.insights.duplicateTop', 'Продублируйте популярную ссылку'),
      description: t(
        'dashboard.insights.duplicateTopDesc',
        `"${topBlock.blockTitle}" получает ${topBlock.ctr.toFixed(0)}% кликов`,
      ),
      action: () => onApplyInsight({ type: 'duplicate', blockId: topBlock.blockId }),
      impact: 'medium',
    });
  }

  if (devicePercentages.mobile > 80) {
    suggestions.push({
      id: 'mobile-first',
      type: 'info',
      title: t('dashboard.insights.mobileFirst', 'Mobile-first аудитория'),
      description: t('dashboard.insights.mobileFirstDesc', `${devicePercentages.mobile}% с мобильных. Оптимизируйте под телефоны`),
      action: null,
      impact: 'low',
    });
  }

  return suggestions.slice(0, MAX_INSIGHTS);
}
