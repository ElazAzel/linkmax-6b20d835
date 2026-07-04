/**
 * useInsights — memoized algorithmic insights derived from analytics + blocks.
 * Pure heuristics (no LLM). See `src/lib/analytics-insights.ts`.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  computeInsights,
  type Insight,
  type InsightAction,
  type InsightsInput,
} from '@/lib/analytics-insights';

export function useInsights(
  input: InsightsInput,
  onApplyInsight: (action: InsightAction) => void,
): Insight[] {
  const { t } = useTranslation();
  return useMemo(
    () => computeInsights(input, t, onApplyInsight),
    [input, t, onApplyInsight],
  );
}

export type { Insight, InsightAction, InsightsInput };
