import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBeautyPreset } from '@/domain/revenue-kits/beauty-v1';
import { supabase } from '@/platform/supabase/client';
import {
  applyRevenueKit,
  loadRevenueKitDraft,
  saveRevenueKitDraft,
} from '../revenue-kit';

vi.mock('@/platform/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

describe('revenue kit service', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
  });

  it('applies the complete draft with exact RPC fields and typed IDs', async () => {
    const draft = createBeautyPreset('nails');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        ok: true,
        pageId: '23000000-0000-0000-0000-000000000001',
        offeringIds: ['33000000-0000-0000-0000-000000000001'],
        blockIds: {
          profile: '43000000-0000-0000-0000-000000000001',
          pricing: '43000000-0000-0000-0000-000000000002',
          booking: '43000000-0000-0000-0000-000000000003',
          messenger: '43000000-0000-0000-0000-000000000004',
        },
        idempotentReplay: false,
      },
      error: null,
    } as never);

    const result = await applyRevenueKit(
      '23000000-0000-0000-0000-000000000001',
      draft,
      'kit-apply-mutation-0001',
    );

    expect(supabase.rpc).toHaveBeenCalledWith('apply_revenue_kit_v1', {
      p_page_id: '23000000-0000-0000-0000-000000000001',
      p_draft: draft,
      p_mutation_id: 'kit-apply-mutation-0001',
    });
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        offeringIds: ['33000000-0000-0000-0000-000000000001'],
        blockIds: expect.objectContaining({ booking: expect.any(String) }),
      }),
    });
  });

  it('rejects malformed apply responses at the adapter boundary', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { ok: true }, error: null } as never);

    await expect(applyRevenueKit(
      '23000000-0000-0000-0000-000000000001',
      createBeautyPreset('nails'),
      'kit-apply-mutation-0002',
    )).resolves.toEqual({ ok: false, error: 'invalid_response' });
  });

  it('loads and saves resumable server drafts', async () => {
    const draft = createBeautyPreset('brows');
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({
        data: { ok: true, step: 'availability', draft, updatedAt: '2026-08-30T00:00:00Z' },
        error: null,
      } as never)
      .mockResolvedValueOnce({
        data: { ok: true, step: 'services', draft, updatedAt: '2026-08-30T00:01:00Z' },
        error: null,
      } as never);

    const loaded = await loadRevenueKitDraft('23000000-0000-0000-0000-000000000001');
    const saved = await saveRevenueKitDraft(
      '23000000-0000-0000-0000-000000000001',
      'services',
      draft,
    );

    expect(loaded).toEqual({
      ok: true,
      value: expect.objectContaining({ step: 'availability', draft }),
    });
    expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'save_revenue_kit_draft', {
      p_page_id: '23000000-0000-0000-0000-000000000001',
      p_kit_id: 'beauty-v1',
      p_step: 'services',
      p_draft: draft,
    });
    expect(saved.ok).toBe(true);
  });
});
