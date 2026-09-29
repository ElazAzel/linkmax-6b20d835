import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/platform/supabase/client';
import { resetProductAnalyticsSchemaState, trackCurrentUserProductEvent } from '../product-analytics';

vi.mock('@/platform/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('product analytics without the product_events table', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as never);
    resetProductAnalyticsSchemaState();
  });

  it('stops writing events after the table is reported missing', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: 'PGRST205', message: 'missing' } });
    vi.mocked(supabase.from).mockReturnValue({ insert } as never);

    await trackCurrentUserProductEvent('page_published');
    await trackCurrentUserProductEvent('page_published');

    expect(insert).toHaveBeenCalledTimes(1);
    // creator_activation_state / creator_health_scores are not touched either
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('keeps writing after a transient error', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '08006', message: 'connection' } });
    vi.mocked(supabase.from).mockReturnValue({ insert } as never);

    await trackCurrentUserProductEvent('page_published');
    await trackCurrentUserProductEvent('page_published');

    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('sends one probe when a burst of events starts before the answer', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: 'PGRST205', message: 'missing' } });
    vi.mocked(supabase.from).mockReturnValue({ insert } as never);

    await Promise.all([
      trackCurrentUserProductEvent('page_published'),
      trackCurrentUserProductEvent('page_published'),
      trackCurrentUserProductEvent('page_published'),
    ]);

    expect(insert).toHaveBeenCalledTimes(1);
  });
});
