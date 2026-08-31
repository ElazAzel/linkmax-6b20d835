import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migration = read('supabase/migrations/20260829122000_booking_public_access_hardening.sql');
const submitBooking = read('supabase/functions/submit-booking/index.ts');
const bookingBlock = read('src/components/blocks/BookingBlock.tsx');

describe('public booking access contract', () => {
  it('removes anonymous raw booking access', () => {
    expect(migration).toContain('REVOKE SELECT, INSERT, UPDATE, DELETE ON public.bookings FROM anon');
    expect(migration).toContain('DROP POLICY IF EXISTS "Anyone can create bookings on published pages"');
    expect(migration).toContain('REVOKE INSERT ON public.bookings FROM authenticated');
  });

  it('exposes only public-safe availability columns', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_public_availability');
    expect(migration).toContain('slot_date date,\n  slot_time time,\n  slot_end_time time,\n  available boolean');
    expect(migration).not.toContain('RETURNS TABLE (\n  client_phone');
  });

  it('derives owner, service, deposit and immutable snapshot on the server', () => {
    expect(migration).toContain('v_page.user_id');
    expect(migration).toContain('v_offering.price_amount');
    expect(migration).toContain("WHEN 'percent' THEN round");
    expect(migration).toContain("'depositRequiredAmount'");
    expect(migration).toContain('creation_idempotency_key');
  });

  it('stores token hashes and allowlisted attribution without raw URLs', () => {
    expect(migration).toContain("encode(digest(p_token, 'sha256'), 'hex')");
    expect(migration).toContain('CREATE TABLE public.booking_access_tokens');
    expect(migration).not.toContain("p_attribution->>'rawUrl'");
    expect(migration).not.toContain("p_attribution->>'queryString'");
    expect(migration).not.toContain("p_attribution->>'ip'");
  });

  it('serializes competing slot creation and maps conflicts to slot_unavailable', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('idx_bookings_unique_staff_slot');
    expect(migration).toContain("'slot_unavailable'");
  });

  it('routes both edge and browser flows through safe RPCs', () => {
    expect(submitBooking).toContain("bookingRpcClient.rpc('create_public_booking'");
    expect(submitBooking).not.toContain(".from('bookings')\n      .insert");
    expect(bookingBlock).toContain("supabase.rpc(\n        'get_public_availability'");
    expect(bookingBlock).not.toContain(".from('bookings')");
    expect(bookingBlock).not.toContain('recordPendingIncome');
  });
});
