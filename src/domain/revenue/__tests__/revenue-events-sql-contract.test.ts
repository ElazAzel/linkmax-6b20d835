import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829123000_revenue_event_taxonomy_v2.sql'),
  'utf8',
);

describe('revenue event SQL contract', () => {
  it('adds v2 fact dimensions and idempotency', () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS taxonomy_version');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS booking_id');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS service_offering_id');
    expect(migration).toContain('idx_product_events_authoritative_idempotency');
  });

  it('blocks authoritative client inserts', () => {
    expect(migration).toContain("AND source = 'client'");
    expect(migration).toContain('NOT public.is_authoritative_product_event_name(event_name)');
  });

  it('projects transitions and immutable payments through a protected emitter', () => {
    expect(migration).toContain('CREATE TRIGGER project_booking_transition_revenue_event');
    expect(migration).toContain('CREATE TRIGGER project_booking_payment_revenue_event');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.emit_revenue_product_event');
    expect(migration).toContain('FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('TO service_role');
  });

  it('allowlists authoritative metadata instead of copying booking PII', () => {
    expect(migration).toContain("'reasonCode'");
    expect(migration).toContain("'visitorId'");
    expect(migration).not.toContain('client_phone');
    expect(migration).not.toContain('client_email');
    expect(migration).not.toContain('accessToken');
  });
});
