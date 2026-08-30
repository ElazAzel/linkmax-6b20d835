import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260829125000_revenue_outcome_summary.sql',
);

describe('revenue outcome summary SQL contract', () => {
  const sql = readFileSync(migrationPath, 'utf8');

  it('authorizes the page before reading private outcome facts', () => {
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain("'not_allowed'");
    expect(sql).toContain('organization_members');
    expect(sql).toContain('SECURITY DEFINER');
  });

  it('uses page-local booking dates and decimal strings', () => {
    expect(sql).toContain('booking_timezone');
    expect(sql).toContain('slot_date BETWEEN p_from AND p_to');
    expect(sql).toContain("to_char(COALESCE(");
    expect(sql).toContain("'provisionalCompletionDays', 7");
  });

  it('keeps money authoritative and missing attribution honest', () => {
    expect(sql).toContain('paid_amount');
    expect(sql).toContain('refunded_amount');
    expect(sql).toContain("'unknown'");
    expect(sql).not.toContain('posthog');
  });

  it('returns the outcome, operations, readiness, funnel and source sections', () => {
    for (const key of ['outcome', 'operations', 'readiness', 'funnel', 'bySource', 'metadata']) {
      expect(sql).toContain(`'${key}'`);
    }
  });
});
