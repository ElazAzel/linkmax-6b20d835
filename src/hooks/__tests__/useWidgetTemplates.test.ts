import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWidgetTemplates, resetWidgetTemplatesSchemaState } from '../useWidgetTemplates';

const { from, order } = vi.hoisted(() => ({ from: vi.fn(), order: vi.fn() }));
vi.mock('@/platform/supabase/client', () => ({ supabase: { from } }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryFn: () => Promise<unknown> }) => options }));

const load = () => (useWidgetTemplates() as unknown as { queryFn: () => Promise<unknown> }).queryFn();

describe('optional widget templates schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWidgetTemplatesSchemaState();
    from.mockReturnValue({ select: () => ({ order }) });
  });

  it('remembers absent templates across query instances and preserves bundled fallback', async () => {
    order.mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
    await expect(load()).resolves.toEqual([]);
    await expect(load()).resolves.toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('keeps transient failures retryable', async () => {
    const error = { message: 'Failed to fetch' };
    order.mockResolvedValue({ data: null, error });
    await expect(load()).rejects.toEqual(error);
    await expect(load()).rejects.toEqual(error);
    expect(from).toHaveBeenCalledTimes(2);
  });
});
