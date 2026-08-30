import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260830104000_revenue_outcome_summary.sql',
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
    expect(sql).toContain('booking.paid_amount - booking.refunded_amount');
    expect(sql).toContain("'unknown'");
    expect(sql).not.toContain('posthog');
  });

  it('keeps funnel booking stages on one created-at cohort', () => {
    const funnelStart = sql.indexOf("'serviceViewed'");
    const funnelSection = sql.slice(funnelStart, sql.indexOf('INTO v_funnel', funnelStart));
    expect(funnelSection.match(/booking\.created_at >= v_start_at/g)).toHaveLength(3);
    expect(funnelSection).not.toContain('booking.slot_date BETWEEN p_from AND p_to');
  });

  it('returns the outcome, operations, readiness, funnel and source sections', () => {
    for (const key of ['outcome', 'operations', 'readiness', 'funnel', 'bySource', 'metadata']) {
      expect(sql).toContain(`'${key}'`);
    }
  });
});
