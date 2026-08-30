BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(9);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '14000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'revenue-events-owner@example.test',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES (
  '24000000-0000-0000-0000-000000000001',
  '14000000-0000-0000-0000-000000000001',
  'revenue-events-test', 'Revenue events test', true
)
ON CONFLICT (id) DO UPDATE SET is_published = true;

INSERT INTO public.bookings (
  id, page_id, block_id, owner_id, slot_date, slot_time, client_name,
  status, total_price_amount, deposit_required_amount, payment_status,
  attribution
)
VALUES (
  '44000000-0000-0000-0000-000000000001',
  '24000000-0000-0000-0000-000000000001', 'revenue-events-block',
  '14000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, '12:00',
  'Revenue customer', 'confirmed', 7000.00, 0, 'pending',
  '{"visitorId":"visitor-pseudonym","source":"instagram","phone":"must-not-project"}'
)
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT throws_ok(
  $$
    INSERT INTO public.product_events (
      user_id, page_id, event_name, source, taxonomy_version, booking_id,
      actor_type, idempotency_key
    ) VALUES (
      '14000000-0000-0000-0000-000000000001',
      '24000000-0000-0000-0000-000000000001',
      'booking_completed', 'client', 2,
      '44000000-0000-0000-0000-000000000001', 'creator', 'forged-completion-0001'
    )
  $$,
  '42501', NULL,
  'authenticated clients cannot forge authoritative booking outcomes'
);

SELECT lives_ok(
  $$
    INSERT INTO public.product_events (
      user_id, page_id, event_name, source, taxonomy_version, actor_type
    ) VALUES (
      '14000000-0000-0000-0000-000000000001',
      '24000000-0000-0000-0000-000000000001',
      'booking_started', 'client', 2, 'creator'
    )
  $$,
  'authenticated clients can record allowlisted intent events'
);

SELECT is(
  (public.transition_booking(
    '44000000-0000-0000-0000-000000000001', 'completed', 1,
    'visit_completed', 'event-transition-complete-0001', 7000.00, 'cash',
    'event-payment-balance-0001'
  )->>'status'),
  'completed',
  'owner completion succeeds'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.product_events
    WHERE event_name = 'booking_completed'
      AND booking_id = '44000000-0000-0000-0000-000000000001'
      AND idempotency_key = 'event-transition-complete-0001'
  ),
  1,
  'the completed transition emits exactly one authoritative event'
);

SELECT is(
  (public.transition_booking(
    '44000000-0000-0000-0000-000000000001', 'completed', 1,
    'duplicate_replay', 'event-transition-complete-0001'
  )->>'idempotentReplay')::boolean,
  true,
  'a duplicate transition returns its original result'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.product_events
    WHERE event_name = 'booking_completed'
      AND booking_id = '44000000-0000-0000-0000-000000000001'
      AND idempotency_key = 'event-transition-complete-0001'
  ),
  1,
  'a duplicate transition does not duplicate its authoritative event'
);

SELECT is(
  (
    SELECT event_name
    FROM public.product_events
    WHERE booking_id = '44000000-0000-0000-0000-000000000001'
      AND idempotency_key = 'event-payment-balance-0001'
  ),
  'booking_payment_recorded',
  'the succeeded balance ledger fact emits a payment event'
);

SELECT is(
  (
    SELECT metadata ?| ARRAY['phone', 'email', 'accessToken', 'token', 'clientName']
    FROM public.product_events
    WHERE event_name = 'booking_completed'
      AND booking_id = '44000000-0000-0000-0000-000000000001'
  ),
  false,
  'authoritative event metadata contains no direct customer identifiers'
);

RESET ROLE;

SELECT is(
  has_function_privilege(
    'anon',
    'public.emit_revenue_product_event(uuid,text,text,text,jsonb)',
    'EXECUTE'
  ),
  false,
  'anonymous visitors cannot invoke the authoritative emitter'
);

SELECT * FROM finish();
ROLLBACK;
