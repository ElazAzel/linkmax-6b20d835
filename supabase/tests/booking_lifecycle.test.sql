BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '11000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'booking-owner@example.test',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES (
  '21000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  'booking-lifecycle-test', 'Booking lifecycle test', true
)
ON CONFLICT (id) DO UPDATE SET is_published = true;

INSERT INTO public.service_offerings (
  id, page_id, owner_id, name_i18n, duration_minutes, price_amount,
  deposit_mode, deposit_value
)
VALUES (
  '31000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '{"ru":"Маникюр"}', 60, 7000.00, 'fixed', 2000.00
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bookings (
  id, page_id, block_id, owner_id, slot_date, slot_time, slot_end_time,
  client_name, status, service_offering_id, service_snapshot,
  total_price_amount, deposit_required_amount, payment_status
)
VALUES (
  '41000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'booking-lifecycle-block',
  '11000000-0000-0000-0000-000000000001',
  CURRENT_DATE - 1, '10:00', '11:00', 'Lifecycle customer',
  'pending_payment',
  '31000000-0000-0000-0000-000000000001',
  '{"name":"Маникюр","priceAmount":"7000.00","currency":"KZT"}',
  7000.00, 2000.00, 'pending'
)
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT throws_ok(
  $$UPDATE public.bookings SET status = 'completed' WHERE id = '41000000-0000-0000-0000-000000000001'$$,
  '42501', NULL, 'direct status updates are rejected'
);

SELECT is(
  (public.transition_booking(
    '41000000-0000-0000-0000-000000000001', 'confirmed', 1,
    'owner_confirmed', 'transition-confirm-without-payment'
  )->>'ok')::boolean,
  false,
  'a required-deposit booking cannot be confirmed without payment or waiver'
);

SELECT is(
  (public.record_manual_booking_payment(
    '41000000-0000-0000-0000-000000000001', 'deposit', 2000.00,
    'KZT', 'kaspi_manual', 'payment-deposit-0001'
  )->>'ok')::boolean,
  true,
  'the owner can record a succeeded external deposit'
);

SELECT is(
  (public.transition_booking(
    '41000000-0000-0000-0000-000000000001', 'confirmed', 1,
    'deposit_received', 'transition-confirm-0001'
  )->>'status'),
  'confirmed',
  'paid deposit permits confirmation'
);

SELECT is(
  (public.transition_booking(
    '41000000-0000-0000-0000-000000000001', 'completed', 2,
    'visit_completed', 'transition-complete-0001', 5000.00, 'cash',
    'payment-balance-0001'
  )->>'status'),
  'completed',
  'completion and balance payment are recorded atomically'
);

SELECT is(
  (public.transition_booking(
    '41000000-0000-0000-0000-000000000001', 'completed', 1,
    'duplicate_replay', 'transition-complete-0001'
  )->>'version')::integer,
  3,
  'duplicate idempotency returns the first transition result'
);

SELECT is(
  (public.transition_booking(
    '41000000-0000-0000-0000-000000000001', 'confirmed', 2,
    'stale_mutation', 'transition-stale-0001', NULL, NULL, NULL, false, true
  )->>'ok')::boolean,
  false,
  'stale expected_version is rejected'
);

SELECT throws_ok(
  $$SELECT public.auto_complete_past_bookings('11000000-0000-0000-0000-000000000001')$$,
  'P0001', 'automatic_booking_completion_disabled',
  'past bookings cannot be auto-completed'
);

SELECT * FROM finish();
ROLLBACK;
