import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/platform/supabase/client';
import { getGrowthMetrics, recordGrowthEvent, resetGrowthSchemaState } from '../viral-growth';

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
});
