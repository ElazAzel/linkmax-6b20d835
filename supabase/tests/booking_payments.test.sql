BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(7);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '12000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'payment-owner@example.test',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES (
  '22000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'booking-payment-test', 'Booking payment test', true
)
ON CONFLICT (id) DO UPDATE SET is_published = true;

INSERT INTO public.bookings (
  id, page_id, block_id, owner_id, slot_date, slot_time, client_name,
  status, total_price_amount, deposit_required_amount, payment_status
)
VALUES (
  '42000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000001', 'booking-payment-block',
  '12000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '12:00',
  'Payment customer', 'confirmed', 7000.00, 2000.00, 'pending'
)
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is(
  (public.record_manual_booking_payment(
    '42000000-0000-0000-0000-000000000001', 'deposit', 2000.00,
    'KZT', 'kaspi_manual', 'ledger-deposit-0001'
  )->>'ok')::boolean,
  true, 'deposit ledger fact succeeds'
);

SELECT is(
  (public.record_manual_booking_payment(
    '42000000-0000-0000-0000-000000000001', 'balance', 5000.00,
    'KZT', 'cash', 'ledger-balance-0001'
  )->>'ok')::boolean,
  true, 'balance ledger fact succeeds'
);

SELECT is(
  (public.record_manual_booking_payment(
    '42000000-0000-0000-0000-000000000001', 'refund', 1000.00,
    'KZT', 'cash', 'ledger-refund-0001'
  )->>'ok')::boolean,
  true, 'refund ledger fact succeeds'
);

SELECT is(
  (SELECT paid_amount FROM public.bookings WHERE id = '42000000-0000-0000-0000-000000000001'),
  7000.00::numeric,
  'succeeded deposit and balance sum into paid amount'
);

SELECT is(
  (SELECT refunded_amount FROM public.bookings WHERE id = '42000000-0000-0000-0000-000000000001'),
  1000.00::numeric,
  'succeeded refund sums separately'
);

SELECT is(
  (SELECT payment_status FROM public.bookings WHERE id = '42000000-0000-0000-0000-000000000001'),
  'partially_refunded',
  'projection reports a partial refund'
);

SELECT throws_ok(
  $$UPDATE public.booking_payments SET amount = 1 WHERE idempotency_key = 'ledger-deposit-0001'$$,
  '42501', NULL, 'ledger rows are immutable'
);

SELECT * FROM finish();
ROLLBACK;
