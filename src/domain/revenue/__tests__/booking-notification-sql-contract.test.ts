import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260830102000_durable_booking_notifications.sql'),
  'utf8',
);

describe('durable booking notification SQL contract', () => {
  it('claims only due queue rows with skip-locked concurrency', () => {
    expect(migration).toContain('scheduled_at timestamptz');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.claim_notification_batch');
    expect(migration).toContain('FOR UPDATE SKIP LOCKED');
    expect(migration).toContain("status = 'processing'");
  });

  it('stores allowlisted terminal delivery facts without destinations or payloads', () => {
    expect(migration).toContain('CREATE TABLE public.notification_delivery_events');
    expect(migration).toContain('error_code text');
    expect(migration).not.toContain('recipient_email');
    expect(migration).not.toContain('recipient_phone');
    expect(migration).not.toContain('management_token');
  });
});
