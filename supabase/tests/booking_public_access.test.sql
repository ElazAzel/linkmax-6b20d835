BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(11);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '13000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'public-booking-owner@example.test',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES (
  '23000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001',
  'public-booking-access-test', 'Public booking access test', true
)
ON CONFLICT (id) DO UPDATE SET is_published = true;

INSERT INTO public.blocks (id, page_id, type, position, title, content)
VALUES (
  '33000000-0000-0000-0000-000000000001',
  '23000000-0000-0000-0000-000000000001',
  'booking', 1, 'Маникюр',
  '{"workingHoursStart":9,"workingHoursEnd":18,"slotDuration":60}'
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

INSERT INTO public.service_offerings (
  id, page_id, owner_id, name_i18n, duration_minutes, price_amount,
  deposit_mode, deposit_value
)
VALUES (
  '33000000-0000-0000-0000-000000000002',
  '23000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001',
  '{"ru":"Маникюр"}', 60, 7000.00, 'fixed', 2000.00
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_slots (
  page_id, block_id, owner_id, day_of_week, start_time, end_time,
  specific_date, is_available
)
VALUES (
  '23000000-0000-0000-0000-000000000001',
  '33000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001',
  EXTRACT(DOW FROM CURRENT_DATE + 1)::integer,
  '10:00', '11:00', CURRENT_DATE + 1, true
);

CREATE TEMP TABLE public_booking_test_result (result jsonb);
GRANT SELECT, INSERT ON public_booking_test_result TO anon;

SET LOCAL ROLE anon;

SELECT throws_ok(
  $$SELECT client_phone FROM public.bookings LIMIT 1$$,
  '42501', NULL, 'anonymous visitors cannot read raw booking PII'
);

SELECT set_eq(
  $$
    SELECT key
    FROM public.get_public_availability(
      '23000000-0000-0000-0000-000000000001',
      '33000000-0000-0000-0000-000000000001',
      CURRENT_DATE + 1,
      CURRENT_DATE + 1,
      NULL
    ) availability,
    LATERAL jsonb_object_keys(to_jsonb(availability)) key
  $$,
  $$VALUES ('slot_date'), ('slot_time'), ('slot_end_time'), ('available')$$,
  'public availability exposes only slot fields'
);

SELECT is(
  (public.get_public_booking_context('23000000-0000-0000-0000-000000000001')->>'ok')::boolean,
  true,
  'published booking context is available without raw booking rows'
);

INSERT INTO public_booking_test_result (result)
SELECT public.create_public_booking(
  '23000000-0000-0000-0000-000000000001',
  '33000000-0000-0000-0000-000000000001',
  '33000000-0000-0000-0000-000000000002',
  CURRENT_DATE + 1,
  '10:00',
  NULL,
  'Public customer',
  '+7 700 000 00 00',
  'customer@example.test',
  'Без комментариев',
  'Asia/Almaty',
  '{"visitorId":"visitor-1","source":"instagram","rawUrl":"https://example.test/?secret=1"}',
  'public-create-mutation-0001'
);

SELECT is(
  (SELECT result->>'status' FROM public_booking_test_result),
  'pending_payment',
  'server-derived deposit keeps the booking pending payment'
);

SELECT ok(
  length((SELECT result->>'accessToken' FROM public_booking_test_result)) >= 64,
  'a high-entropy access token is returned once'
);

RESET ROLE;

SELECT isnt(
  (SELECT result->>'accessToken' FROM public_booking_test_result),
  (
    SELECT token_hash
    FROM public.booking_access_tokens
    WHERE booking_id = (SELECT (result->>'bookingId')::uuid FROM public_booking_test_result)
  ),
  'the raw access token is never stored'
);

SELECT is(
  (SELECT attribution ? 'rawUrl' FROM public.bookings
   WHERE id = (SELECT (result->>'bookingId')::uuid FROM public_booking_test_result)),
  false,
  'raw URLs are removed from attribution facts'
);

SET LOCAL ROLE anon;

SELECT is(
  (public.get_booking_by_access_token(
    (SELECT result->>'accessToken' FROM public_booking_test_result)
  )->>'ok')::boolean,
  true,
  'a valid access token returns public-safe booking context'
);

SELECT is(
  (public.get_booking_by_access_token(repeat('0', 64))->>'code'),
  'token_invalid',
  'an invalid token has a stable error code'
);

SELECT throws_ok(
  $$
    INSERT INTO public.bookings (
      page_id, block_id, owner_id, slot_date, slot_time, client_name
    ) VALUES (
      '23000000-0000-0000-0000-000000000001',
      '33000000-0000-0000-0000-000000000001',
      '13000000-0000-0000-0000-000000000001',
      CURRENT_DATE + 2, '10:00', 'Policy bypass'
    )
  $$,
  '42501', NULL, 'anonymous visitors cannot bypass create_public_booking'
);

RESET ROLE;

UPDATE public.booking_access_tokens
SET expires_at = now() - interval '1 minute'
WHERE booking_id = (SELECT (result->>'bookingId')::uuid FROM public_booking_test_result);

SET LOCAL ROLE anon;
SELECT is(
  (public.get_booking_by_access_token(
    (SELECT result->>'accessToken' FROM public_booking_test_result)
  )->>'code'),
  'token_expired',
  'expired tokens have a stable error code'
);

SELECT * FROM finish();
ROLLBACK;
