import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function readMigration(name: string): string {
  return readFileSync(resolve(process.cwd(), 'supabase/migrations', name), 'utf8');
}

function compact(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

const lifecycle = compact(readMigration('20260829121000_booking_lifecycle_and_payment_ledger.sql'));
const publicAccess = compact(readMigration('20260829122000_booking_public_access_hardening.sql'));
const kit = compact(readMigration('20260829124000_beauty_revenue_kit_rpc_and_flags.sql'));
const notifications = compact(readMigration('20260830102000_durable_booking_notifications.sql'));
const ownerDetail = compact(readMigration('20260830103000_booking_owner_detail.sql'));
const outcomes = compact(readMigration('20260830104000_revenue_outcome_summary.sql'));

describe('Revenue Core SQL security matrix', () => {
  it('keeps anonymous users away from raw booking PII and private ledger tables', () => {
    expect(publicAccess).toContain(
      'REVOKE SELECT, INSERT, UPDATE, DELETE ON public.bookings FROM anon',
    );
    expect(publicAccess).toContain(
      'REVOKE ALL ON public.booking_access_tokens FROM PUBLIC, anon, authenticated',
    );
    expect(lifecycle).toContain(
      'REVOKE ALL ON public.booking_payments FROM PUBLIC, anon, authenticated',
    );
    expect(lifecycle).toContain(
      'REVOKE ALL ON public.booking_status_transitions FROM PUBLIC, anon, authenticated',
    );
  });

  it('grants owner mutation and outcome RPCs only to authenticated or service roles', () => {
    for (const signature of [
      'public.record_manual_booking_payment(uuid, text, numeric, text, text, text)',
      'public.transition_booking( uuid, text, integer, text, text, numeric, text, text, boolean, boolean, text )',
      'public.auto_complete_past_bookings(uuid)',
    ]) {
      expect(lifecycle).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon`);
    }
    expect(ownerDetail).toContain(
      'REVOKE ALL ON FUNCTION public.get_booking_owner_detail(uuid) FROM PUBLIC, anon',
    );
    expect(ownerDetail).toContain(
      'GRANT EXECUTE ON FUNCTION public.get_booking_owner_detail(uuid) TO authenticated',
    );
    expect(outcomes).toContain(
      'REVOKE ALL ON FUNCTION public.get_revenue_outcome_summary(uuid, date, date) FROM PUBLIC, anon',
    );
    expect(outcomes).toContain(
      'GRANT EXECUTE ON FUNCTION public.get_revenue_outcome_summary(uuid, date, date) TO authenticated',
    );
  });

  it('keeps kit state owner-scoped and notification delivery service-only', () => {
    expect(kit).toContain('ALTER TABLE public.revenue_kit_drafts ENABLE ROW LEVEL SECURITY');
    expect(kit).toContain('auth.uid() = user_id');
    expect(kit).toContain(
      'REVOKE ALL ON public.revenue_kit_drafts FROM PUBLIC, anon',
    );
    expect(kit).toContain(
      'REVOKE ALL ON FUNCTION public.apply_revenue_kit_v1(uuid, jsonb, text) FROM PUBLIC',
    );
    expect(kit).toContain(
      'GRANT EXECUTE ON FUNCTION public.apply_revenue_kit_v1(uuid, jsonb, text) TO authenticated',
    );
    expect(notifications).toContain(
      'REVOKE SELECT, INSERT, UPDATE, DELETE ON public.notification_delivery_events FROM PUBLIC, anon, authenticated',
    );
    expect(notifications).toContain(
      'GRANT EXECUTE ON FUNCTION public.claim_notification_batch(integer) TO service_role',
    );
  });
});
