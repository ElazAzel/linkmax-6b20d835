import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260830100000_service_payment_instructions.sql'),
  'utf8',
);

describe('service payment instructions SQL contract', () => {
  it('stores localized instructions with normalized service offerings', () => {
    expect(migration).toContain('payment_instructions_i18n jsonb');
    expect(migration).toContain("draft #> '{depositPolicy,paymentInstructions}'");
    expect(migration).toContain('sync_revenue_kit_payment_instructions');
  });

  it('exposes instructions only through the public booking context', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_public_booking_context');
    expect(migration).toContain("'paymentInstructions', offering.payment_instructions_i18n");
    expect(migration).toContain('page.is_published = true');
    expect(migration).toContain('offering.is_active = true');
  });

  it('keeps the function executable by public booking clients', () => {
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.get_public_booking_context(uuid) FROM PUBLIC');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.get_public_booking_context(uuid) TO anon, authenticated');
  });
});
