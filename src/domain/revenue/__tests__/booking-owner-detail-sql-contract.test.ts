import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(resolve(
  process.cwd(),
  'supabase/migrations/20260830103000_booking_owner_detail.sql',
), 'utf8');

describe('booking owner detail SQL contract', () => {
  it('authorizes through the shared booking manager predicate', () => {
    expect(sql).toContain('public.can_manage_booking(p_booking_id, auth.uid())');
    expect(sql).toContain("'not_allowed'");
  });

  it('returns safe lifecycle and delivery facts', () => {
    expect(sql).toContain("'transitions'");
    expect(sql).toContain("'notifications'");
    expect(sql).toContain("'facts'");
    expect(sql).not.toContain("'providerReference'");
    expect(sql).not.toContain("'accessToken'");
    expect(sql).not.toContain("'payload'");
  });
});
