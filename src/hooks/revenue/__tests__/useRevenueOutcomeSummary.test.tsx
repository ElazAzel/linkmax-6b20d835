import type { PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchRevenueOutcomeSummary } from '@/services/revenue-outcomes';
import {
  revenueOutcomeKeys,
  useRevenueOutcomeSummary,
} from '../useRevenueOutcomeSummary';

vi.mock('@/services/revenue-outcomes', () => ({
  fetchRevenueOutcomeSummary: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useRevenueOutcomeSummary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('does not query until a page is selected', () => {
    const { result } = renderHook(
      () => useRevenueOutcomeSummary({
        pageId: undefined,
        from: '2026-08-01',
        to: '2026-08-30',
      }),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRevenueOutcomeSummary).not.toHaveBeenCalled();
  });

  it('uses a literal page and period query key', async () => {
    vi.mocked(fetchRevenueOutcomeSummary).mockResolvedValue({
      ok: false,
      error: 'not_allowed',
    });

    renderHook(
      () => useRevenueOutcomeSummary({
        pageId: 'page-1',
        from: '2026-08-01',
        to: '2026-08-30',
      }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(fetchRevenueOutcomeSummary).toHaveBeenCalledTimes(1));
    expect(queryClient.getQueryState(
      revenueOutcomeKeys.summary('page-1', '2026-08-01', '2026-08-30'),
    )).toBeDefined();
    expect(fetchRevenueOutcomeSummary).toHaveBeenCalledWith(
      'page-1',
      '2026-08-01',
      '2026-08-30',
    );
  });
});
