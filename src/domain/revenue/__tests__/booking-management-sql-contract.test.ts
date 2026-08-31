import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260830101000_tokenized_booking_management.sql'),
  'utf8',
);

describe('tokenized booking management SQL contract', () => {
  it('returns only an allowlisted public booking projection', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_booking_by_access_token');
    expect(migration).toContain("'allowedActions', to_jsonb(v_allowed_actions)");
    expect(migration).not.toContain("'ownerId'");
    expect(migration).not.toContain("'clientNotes'");
    expect(migration).not.toContain("'providerPayload'");
  });

  it('loads reschedule availability without exposing internal page or staff identifiers', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_booking_management_availability');
    expect(migration).toContain('public.hash_booking_access_token(p_token)');
    expect(migration).toContain("'reschedule' = ANY(v_access.scopes)");
  });

  it('requires an optimistic booking version for every management mutation', () => {
    expect(migration).toContain('p_expected_version integer');
    expect(migration).toContain("'version_conflict'");
    expect(migration).toContain("'currentVersion', v_booking.version");
  });
});
