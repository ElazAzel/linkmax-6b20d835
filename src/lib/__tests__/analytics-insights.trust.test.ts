import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';

import { computeInsights } from '@/lib/analytics-insights';
import type { Block } from '@/types/page';

const t = ((_: string, fallback?: string) => fallback ?? '') as TFunction;

describe('analytics insight claims', () => {
  it('recommends useful actions without inventing universal uplift percentages', () => {
    const blocks = Array.from({ length: 6 }, (_, index) => ({
      id: `block-${index}`,
      type: 'text',
      content: `Block ${index}`,
      blockSize: 'full',
    })) as Block[];

    const insights = computeInsights(
      {
        blocks,
        stats: {
          ctr: 8,
          views: 100,
          bounceRate: 20,
          conversions: 3,
          topBlocks: [],
        },
        devicePercentages: { mobile: 60, desktop: 35, tablet: 5 },
      },
      t,
      vi.fn(),
    );

    expect(insights.map((insight) => insight.id)).toEqual(['add-pricing', 'add-testimonials']);
    expect(insights.map((insight) => insight.description).join(' ')).not.toMatch(/40%|25%/);
  });
});
