import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  fetchRevenueOutcomeSummary,
  type RevenueOutcomeSummary,
} from '@/services/revenue-outcomes';

export const revenueOutcomeKeys = {
  all: ['revenue-outcome-summary'] as const,
  page: (pageId: string) => [...revenueOutcomeKeys.all, pageId] as const,
  summary: (pageId: string, from: string, to: string) => (
    [...revenueOutcomeKeys.page(pageId), from, to] as const
  ),
};

interface UseRevenueOutcomeSummaryOptions {
  pageId?: string;
  from: string;
  to: string;
}

export function useRevenueOutcomeSummary({
  pageId,
  from,
  to,
}: UseRevenueOutcomeSummaryOptions) {
  const safePageId = pageId ?? '';

  return useQuery<RevenueOutcomeSummary>({
    queryKey: revenueOutcomeKeys.summary(safePageId, from, to),
    enabled: safePageId.length > 0,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await fetchRevenueOutcomeSummary(safePageId, from, to);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
  });
}
