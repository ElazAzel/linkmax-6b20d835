import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/platform/supabase/client';
import { getGrowthMetrics, recordGrowthEvent, resetGrowthSchemaState, resolvePageGrowthLink, createPageGrowthLink } from '../viral-growth';

vi.mock('@/platform/supabase/client', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn() },
}));

describe('viral growth service without growth tables', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
    vi.mocked(supabase.from).mockReset();
    resetGrowthSchemaState();
  });

  it('stops calling growth RPCs after the database reports them missing', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'x' } } as never);
    await expect(recordGrowthEvent({ code: 'abcdefgh', eventName: 'referral_visit' })).resolves.toBe(false);
    await expect(recordGrowthEvent({ code: 'abcdefgh', eventName: 'referral_visit' })).resolves.toBe(false);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('marks metrics unavailable instead of reporting zeros', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205', message: 'x' } }),
    } as never);
    await expect(getGrowthMetrics('page-1')).resolves.toMatchObject({ available: false, shares: 0 });
  });
  it('shares missing schema state across resolution, creation and tracking', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'PGRST202' } } as never);
    await expect(resolvePageGrowthLink('abcdefgh')).resolves.toBeNull();
    await expect(resolvePageGrowthLink('ijklmnop')).resolves.toBeNull();
    await expect(createPageGrowthLink('page')).resolves.toBeNull();
    await expect(recordGrowthEvent({ code: 'abcdefgh', eventName: 'referral_visit' })).resolves.toBe(false);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });
  it('does not disable growth after transient errors', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } } as never);
    await resolvePageGrowthLink('abcdefgh');
    await resolvePageGrowthLink('abcdefgh');
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
  });
});
