import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829124000_beauty_revenue_kit_rpc_and_flags.sql'),
  'utf8',
);

describe('Beauty Revenue Kit SQL contract', () => {
  it('persists resumable owner-scoped drafts', () => {
    expect(migration).toContain('CREATE TABLE public.revenue_kit_drafts');
    expect(migration).toContain('UNIQUE (user_id, page_id, kit_id)');
    expect(migration).toContain('auth.uid() = user_id');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.save_revenue_kit_draft');
  });

  it('serializes and idempotently applies one kit per page mutation', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('mutation_id text NOT NULL UNIQUE');
    expect(migration).toContain("'idempotentReplay', true");
  });

  it('upserts stable kit offerings without deleting historical rows', () => {
    expect(migration).toContain('idx_service_offerings_kit_source');
    expect(migration).toContain('SET is_active = false');
    expect(migration).not.toContain('DELETE FROM public.service_offerings');
  });

  it('links pricing and booking blocks while preserving unrelated blocks', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.upsert_revenue_kit_block');
    expect(migration).toContain("'serviceOfferingIds'");
    expect(migration).not.toContain('DELETE FROM public.blocks');
  });

  it('ships all Revenue Core rollout flags disabled by default', () => {
    for (const flag of [
      'revenue_core_v1',
      'beauty_revenue_kit_v1',
      'outcome_home_v1',
      'booking_self_service_v1',
    ]) {
      expect(migration).toContain(`('${flag}'`);
    }
  });
});
