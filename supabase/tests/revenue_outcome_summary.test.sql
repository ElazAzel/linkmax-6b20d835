BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(9);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  (
    '16000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'outcome-owner@example.test',
    crypt('test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  ),
  (
    '16000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'outcome-stranger@example.test',
    crypt('test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES (
  '26000000-0000-0000-0000-000000000001',
  '16000000-0000-0000-0000-000000000001',
  'outcome-summary-test', 'Outcome summary test', true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bookings (
  id, page_id, block_id, owner_id, slot_date, slot_time, client_name,
  status, total_price_amount, deposit_required_amount, paid_amount,
  refunded_amount, payment_status, booking_timezone, service_snapshot, attribution
)
VALUES
  (
    '46000000-0000-0000-0000-000000000001',
    '26000000-0000-0000-0000-000000000001', 'outcome-booking-block',
    '16000000-0000-0000-0000-000000000001', CURRENT_DATE, '09:00',
    'Paid customer', 'completed', 6000.00, 2000.00, 6000.00, 0,
    'paid', 'Asia/Almaty',
    '{"name":{"ru":"Маникюр"},"currency":"KZT"}',
    '{"source":"instagram"}'
  ),
  (
    '46000000-0000-0000-0000-000000000002',
    '26000000-0000-0000-0000-000000000001', 'outcome-booking-block',
    '16000000-0000-0000-0000-000000000001', CURRENT_DATE, '10:00',
    'Refunded customer', 'completed', 5000.00, 1000.00, 5000.00, 5000.00,
    'refunded', 'Asia/Almaty',
    '{"name":{"ru":"Брови"},"currency":"KZT"}', '{}'
  ),
  (
    '46000000-0000-0000-0000-000000000003',
    '26000000-0000-0000-0000-000000000001', 'outcome-booking-block',
    '16000000-0000-0000-0000-000000000001', CURRENT_DATE, '11:00',
    'Free customer', 'completed', 0, 0, 0, 0,
    'not_applicable', 'Asia/Almaty',
    '{"name":{"ru":"Консультация"},"currency":"KZT"}', '{}'
  ),
  (
    '46000000-0000-0000-0000-000000000004',
    '26000000-0000-0000-0000-000000000001', 'outcome-booking-block',
    '16000000-0000-0000-0000-000000000001', CURRENT_DATE, '12:00',
    'No show customer', 'no_show', 7000.00, 2000.00, 0, 0,
    'pending', 'Asia/Almaty',
    '{"name":{"ru":"Ресницы"},"currency":"KZT"}', '{}'
  ),
  (
    '46000000-0000-0000-0000-000000000005',
    '26000000-0000-0000-0000-000000000001', 'outcome-booking-block',
    '16000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '13:00',
    'Pending customer', 'pending_payment', 8000.00, 2000.00, 0, 0,
    'pending', 'Asia/Almaty',
    '{"name":{"ru":"Педикюр"},"currency":"KZT"}', '{}'
  )
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE outcome_result (result jsonb);
GRANT SELECT, INSERT, UPDATE, DELETE ON outcome_result TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

INSERT INTO outcome_result (result)
SELECT public.get_revenue_outcome_summary(
  '26000000-0000-0000-0000-000000000001',
  CURRENT_DATE - 1,
  CURRENT_DATE + 1
);

SELECT is((SELECT result->>'ok' FROM outcome_result), 'true', 'owner receives the summary');
SELECT is((SELECT result #>> '{outcome,paidCompletedCount}' FROM outcome_result), '1', 'only non-refunded paid completion counts');
SELECT is((SELECT result #>> '{outcome,freeCompletedCount}' FROM outcome_result), '1', 'free completion counts separately');
SELECT is((SELECT result #>> '{outcome,noShowCount}' FROM outcome_result), '1', 'no-show count is factual');
SELECT is((SELECT result #>> '{outcome,pendingPaymentCount}' FROM outcome_result), '1', 'pending payment count is factual');
SELECT is((SELECT result #>> '{outcome,netCollectedAmount}' FROM outcome_result), '6000.00', 'net collected excludes the full refund');
SELECT is((SELECT result #>> '{outcome,pendingPaymentAmount}' FROM outcome_result), '2000.00', 'outstanding deposit is returned as a decimal string');
SELECT ok(
  (SELECT jsonb_path_exists(result, '$.bySource[*] ? (@.source == "unknown")') FROM outcome_result),
  'missing attribution is grouped as unknown'
);

DELETE FROM outcome_result;
SELECT set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000002', true);

INSERT INTO outcome_result (result)
SELECT public.get_revenue_outcome_summary(
  '26000000-0000-0000-0000-000000000001',
  CURRENT_DATE - 1,
  CURRENT_DATE + 1
);

SELECT is((SELECT result->>'code' FROM outcome_result), 'not_allowed', 'another owner cannot read private outcomes');

SELECT * FROM finish();
ROLLBACK;
