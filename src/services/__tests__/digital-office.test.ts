import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadOfficeBookings } from '../digital-office';
import { supabase } from '@/platform/supabase/client';

vi.mock('@/platform/supabase/client', () => ({ supabase: { from: vi.fn() } }));

describe('digital office query boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires an owner before issuing any query', async () => {
    await expect(loadOfficeBookings('')).rejects.toThrow('not_allowed');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('loads all pages of owner-filtered records without access tokens', async () => {
    const queries: Array<{ fields?: string; owner?: string; ranges: number[] }> = [];
    const first = Array.from({ length: 500 }, (_, i) => ({ id: `booking-${i}` }));
    vi.mocked(supabase.from).mockImplementation(() => {
      const capture = { ranges: [] } as { fields?: string; owner?: string; ranges: number[] };
      queries.push(capture);
      const query = {
        select(fields: string) { capture.fields = fields; return this; },
        eq(column: string, value: string) { if (column === 'owner_id') capture.owner = value; return this; },
        lte: () => query, order: () => query,
        range(start: number, end: number) { capture.ranges = [start, end]; return this; },
        then(resolve: (result: unknown) => unknown) { return Promise.resolve(resolve({ data: queries.length === 1 ? first : [{ id: 'last' }], error: null })); },
      };
      return query as unknown as ReturnType<typeof supabase.from>;
    });
    const result = await loadOfficeBookings('owner-a');
    expect(result).toHaveLength(501);
    expect(result[500].id).toBe('last');
    expect(queries.map((query) => query.owner)).toEqual(['owner-a', 'owner-a']);
    expect(queries.map((query) => query.ranges)).toEqual([[0, 499], [500, 999]]);
    expect(queries[0].fields).not.toMatch(/token|provider_payload|\*/);
  });

  it.each([
    ['42703', 'feature_unavailable'], ['PGRST205', 'feature_unavailable'], ['42501', 'request_failed'],
  ])('does not hide a %s error as an empty business', async (code, expected) => {
    const query = { select: () => query, eq: () => query, lte: () => query, order: () => query, range: () => query,
      then: (resolve: (result: unknown) => unknown) => Promise.resolve(resolve({ data: null, error: { code } })),
    };
    vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);
    await expect(loadOfficeBookings('owner-a')).rejects.toThrow(expected);
  });
});
