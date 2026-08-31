import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBeautyPreset, type RevenueKitDraft } from '@/domain/revenue-kits/beauty-v1';
import {
  applyRevenueKit,
  loadRevenueKitDraft,
  saveRevenueKitDraft,
} from '@/services/revenue-kit';
import { useRevenueKit } from '../useRevenueKit';

vi.mock('@/services/revenue-kit', () => ({
  applyRevenueKit: vi.fn(),
  loadRevenueKitDraft: vi.fn(),
  saveRevenueKitDraft: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useRevenueKit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('resumes at the persisted server step', async () => {
    const draft = createBeautyPreset('lashes');
    vi.mocked(loadRevenueKitDraft).mockResolvedValue({
      ok: true,
      value: { step: 'availability', draft, updatedAt: '2026-08-30T00:00:00Z' },
    });

    const { result } = renderHook(
      () => useRevenueKit({ pageId: 'page-1', initialNiche: 'nails' }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.step).toBe('availability');
    expect(result.current.draft.niche).toBe('lashes');
  });

  it('serializes a complete versioned draft without UI-only fields', async () => {
    const initial = createBeautyPreset('nails');
    vi.mocked(loadRevenueKitDraft).mockResolvedValue({ ok: true, value: null });
    vi.mocked(saveRevenueKitDraft).mockImplementation(async (_pageId, step, draft) => ({
      ok: true,
      value: { step, draft, updatedAt: '2026-08-30T00:01:00Z' },
    }));

    const { result } = renderHook(
      () => useRevenueKit({ pageId: 'page-1', initialNiche: 'nails' }),
      { wrapper: createWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const draftWithUiState = {
      ...initial,
      services: initial.services.map((service) => ({ ...service, uiExpanded: true })),
      uiTransient: 'must-not-persist',
    } as unknown as RevenueKitDraft;

    await act(async () => {
      await result.current.saveStep('services', draftWithUiState);
    });

    expect(saveRevenueKitDraft).toHaveBeenCalledWith(
      'page-1',
      'services',
      expect.objectContaining({ version: 1, kitId: 'beauty-v1' }),
    );
    const savedDraft = vi.mocked(saveRevenueKitDraft).mock.calls[0][2] as RevenueKitDraft & {
      uiTransient?: string;
    };
    expect(savedDraft.uiTransient).toBeUndefined();
    expect(savedDraft.services[0]).not.toHaveProperty('uiExpanded');
  });

  it('invalidates kit, page, and offering queries after apply', async () => {
    const draft = createBeautyPreset('brows');
    vi.mocked(loadRevenueKitDraft).mockResolvedValue({ ok: true, value: null });
    vi.mocked(applyRevenueKit).mockResolvedValue({
      ok: true,
      value: {
        pageId: 'page-1',
        offeringIds: ['offering-1'],
        blockIds: {
          profile: 'profile-1',
          pricing: 'pricing-1',
          booking: 'booking-1',
          messenger: 'messenger-1',
        },
        idempotentReplay: false,
      },
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useRevenueKit({ pageId: 'page-1', initialNiche: 'brows' }),
      { wrapper: createWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.apply('kit-mutation-0001');
    });

    expect(applyRevenueKit).toHaveBeenCalledWith('page-1', draft, 'kit-mutation-0001');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['revenue-kit', 'page-1', 'beauty-v1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['page', 'page-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['service-offerings', 'page-1'] });
  });
});
