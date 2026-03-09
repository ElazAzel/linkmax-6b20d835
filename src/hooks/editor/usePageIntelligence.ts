/**
 * usePageIntelligence — memoized composition of all intelligence engines.
 * Runs on every pageData/niche change. Pure computation, <1ms, zero API calls.
 */

import { useMemo } from 'react';
import type { PageData } from '@/types/page';
import type { PageIntelligence } from '@/lib/intelligence/types';
import { analyzeComposition } from '@/lib/intelligence/composition-analyzer';
import { evaluateAllBlocks } from '@/lib/intelligence/block-quality-evaluator';
import { detectAntiPatterns } from '@/lib/intelligence/structural-repair';
import {
  checkPublishReadiness,
  checkActivationReadiness,
  checkConversionReadiness,
} from '@/lib/intelligence/readiness-engines';
import { getNextBestActions } from '@/lib/intelligence/next-best-action';

export function usePageIntelligence(
  pageData: PageData | null,
  niche?: string
): PageIntelligence | null {
  return useMemo(() => {
    if (!pageData) return null;

    const composition = analyzeComposition(pageData.blocks, niche, pageData);
    const blockQuality = evaluateAllBlocks(pageData.blocks);
    const structural = detectAntiPatterns(pageData.blocks, niche);
    const publishReady = checkPublishReadiness(pageData);
    const activationReady = checkActivationReadiness(pageData, niche);
    const conversionReady = checkConversionReadiness(pageData, niche);
    const nextActions = getNextBestActions(pageData, niche);

    return {
      composition,
      blockQuality,
      structural,
      publishReady,
      activationReady,
      conversionReady,
      nextActions,
    };
  }, [pageData, niche]);
}
