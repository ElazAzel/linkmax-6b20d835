import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829120000_revenue_service_offerings.sql'),
  'utf8',
);

describe('service offerings SQL contract', () => {
  it('enforces normalized service and deposit facts', () => {
    expect(migration).toContain('CREATE TABLE public.service_offerings');
    expect(migration).toContain('duration_minutes BETWEEN 5 AND 720');
    expect(migration).toContain("WHEN 'fixed' THEN p_deposit_value >= 0 AND p_deposit_value <= p_price_amount");
    expect(migration).toContain("WHEN 'percent' THEN p_deposit_value BETWEEN 1 AND 100");
    expect(migration).toContain('service_offerings_configuration_check');
  });

  it('binds every offering to the page owner', () => {
    expect(migration).toContain('CREATE TRIGGER enforce_service_offering_page_owner');
    expect(migration).toContain("RAISE EXCEPTION 'service_offering_owner_mismatch'");
    expect(migration).toContain("RAISE EXCEPTION 'service_offering_ownership_immutable'");
  });

  it('keeps anonymous access read-only and limited to published active services', () => {
    expect(migration).toContain('TO anon, authenticated');
    expect(migration).toContain('is_active');
    expect(migration).toContain('page.is_published = true');
    expect(migration).toContain('GRANT SELECT ON public.service_offerings TO anon, authenticated');
    expect(migration).not.toContain('GRANT INSERT ON public.service_offerings TO anon');
  });
});
