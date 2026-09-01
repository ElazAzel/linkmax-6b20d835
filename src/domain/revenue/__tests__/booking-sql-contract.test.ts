import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829121000_booking_lifecycle_and_payment_ledger.sql'),
  'utf8',
).replace(/\r\n/g, '\n');

describe('booking lifecycle SQL contract', () => {
  it('makes payments and transitions immutable authoritative facts', () => {
    expect(migration).toContain('CREATE TABLE public.booking_payments');
    expect(migration).toContain('CREATE TABLE public.booking_status_transitions');
    expect(migration).toContain('CREATE TRIGGER protect_booking_payments_immutability');
    expect(migration).toContain('CREATE TRIGGER protect_booking_transitions_immutability');
    expect(migration).toContain("RAISE EXCEPTION 'booking_ledger_rows_are_immutable'");
  });

  it('requires state-machine and ledger writes for booking revenue facts', () => {
    expect(migration).toContain("RAISE EXCEPTION 'booking_transition_rpc_required'");
    expect(migration).toContain("RAISE EXCEPTION 'booking_payment_ledger_required'");
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.transition_booking');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.record_manual_booking_payment');
  });

  it('uses optimistic versions and global idempotency keys', () => {
    expect(migration).toContain('p_expected_version IS DISTINCT FROM v_booking.version');
    expect(migration).toContain('idempotency_key text NOT NULL UNIQUE');
    expect(migration).toContain("'idempotentReplay', true");
  });

  it('does not mix external manual payments into the LinkMAX wallet', () => {
    expect(migration).toContain("'external_manual'");
    expect(migration).not.toContain('wallet_transactions');
  });

  it('gives provider callbacks a service-role-only ledger path', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.record_platform_booking_payment');
    expect(migration).toContain("'platform'");
    expect(migration).toContain('FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('TO service_role');
  });

  it('disables silent completion of past appointments', () => {
    expect(migration).toContain("RAISE EXCEPTION 'automatic_booking_completion_disabled'");
  });

  it('fixes the search path and limits mutation RPC grants', () => {
    expect(migration).toContain('SECURITY DEFINER\nSET search_path = public');
    expect(migration).toContain('FROM PUBLIC, anon');
    expect(migration).toContain('TO authenticated, service_role');
  });
});
