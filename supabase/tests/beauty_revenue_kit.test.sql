BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '15000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'beauty-kit-owner@example.test',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES (
  '25000000-0000-0000-0000-000000000001',
  '15000000-0000-0000-0000-000000000001',
  'beauty-kit-test', 'Beauty kit test', false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.blocks (id, page_id, type, position, title, content)
VALUES (
  '45000000-0000-0000-0000-000000000001',
  '25000000-0000-0000-0000-000000000001',
  'text', 1, 'Keep me', '{"body":"Unrelated content"}'
)
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE beauty_kit_result (result jsonb);
GRANT SELECT, INSERT, UPDATE ON beauty_kit_result TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

INSERT INTO beauty_kit_result (result)
SELECT public.apply_revenue_kit_v1(
  '25000000-0000-0000-0000-000000000001',
  '{
    "version":1,
    "kitId":"beauty-v1",
    "niche":"nails",
    "identity":{"displayName":"Aru Nails","city":"Almaty","specialization":"nails","avatarUrl":null,"contactChannel":"whatsapp","contactValue":"+77000000000"},
    "services":[
      {"presetId":"nails-gel-manicure","name":{"ru":"Маникюр","kk":"Маникюр","en":"Manicure"},"description":{"ru":"С покрытием","kk":"Жабынды","en":"Gel finish"},"durationMinutes":90,"priceAmount":"7000.00","currency":"KZT","active":true,"displayOrder":0},
      {"presetId":"nails-pedicure","name":{"ru":"Педикюр","kk":"Педикюр","en":"Pedicure"},"description":{"ru":"С покрытием","kk":"Жабынды","en":"Gel finish"},"durationMinutes":120,"priceAmount":"9000.00","currency":"KZT","active":true,"displayOrder":1}
    ],
    "availability":{"weekdays":[1,2,3,4,5,6],"startTime":"09:00","endTime":"18:00","breakStart":null,"breakEnd":null,"timezone":"Asia/Almaty","bookingHorizonDays":30},
    "depositPolicy":{"deposit":{"mode":"fixed","value":"2000.00"},"cancellationWindowHours":24,"paymentInstructions":{"ru":"Kaspi по номеру","kk":"Kaspi нөмірі","en":"Kaspi by phone"}},
    "trust":{"portfolioUrls":[],"policyAccepted":true},
    "distribution":{"publish":true,"channels":["instagram","whatsapp"]}
  }'::jsonb,
  'beauty-kit-apply-0001'
);

SELECT is(
  (SELECT result->>'ok' FROM beauty_kit_result)::boolean,
  true,
  'a valid beauty draft applies successfully'
);

SELECT is(
  (SELECT count(*)::integer FROM public.service_offerings
   WHERE page_id = '25000000-0000-0000-0000-000000000001'
     AND source_kit_id = 'beauty-v1'),
  2,
  'the kit creates normalized service offerings'
);

SELECT is(
  (SELECT count(*)::integer FROM public.blocks
   WHERE page_id = '25000000-0000-0000-0000-000000000001'
     AND content #>> '{revenueKit,kitId}' = 'beauty-v1'
     AND content #>> '{revenueKit,role}' = 'pricing'),
  1,
  'the kit creates one linked pricing block'
);

SELECT is(
  (SELECT count(*)::integer FROM public.blocks
   WHERE page_id = '25000000-0000-0000-0000-000000000001'
     AND content #>> '{revenueKit,kitId}' = 'beauty-v1'
     AND content #>> '{revenueKit,role}' = 'booking'),
  1,
  'the kit creates one linked booking block'
);

SELECT is(
  (SELECT content->'serviceOfferingIds' FROM public.blocks
   WHERE page_id = '25000000-0000-0000-0000-000000000001'
     AND content #>> '{revenueKit,role}' = 'booking'),
  (SELECT jsonb_agg(id ORDER BY display_order) FROM public.service_offerings
   WHERE page_id = '25000000-0000-0000-0000-000000000001'
     AND source_kit_id = 'beauty-v1' AND is_active),
  'the booking block links the authoritative offerings'
);

UPDATE beauty_kit_result
SET result = public.apply_revenue_kit_v1(
  '25000000-0000-0000-0000-000000000001',
  (SELECT draft FROM public.revenue_kit_drafts
   WHERE page_id = '25000000-0000-0000-0000-000000000001'),
  'beauty-kit-apply-0001'
);

SELECT is(
  (SELECT result->>'idempotentReplay' FROM beauty_kit_result)::boolean,
  true,
  'replaying the mutation is idempotent'
);

SELECT is(
  (SELECT count(*)::integer FROM public.blocks
   WHERE page_id = '25000000-0000-0000-0000-000000000001'
     AND id = '45000000-0000-0000-0000-000000000001'
     AND content->>'body' = 'Unrelated content'),
  1,
  'unrelated blocks are preserved unchanged'
);

SELECT is(
  (SELECT count(*)::integer FROM public.product_events
   WHERE event_name = 'revenue_kit_applied'
     AND idempotency_key = 'beauty-kit-apply-0001'),
  1,
  'the server emits the kit-applied event exactly once'
);

SELECT * FROM finish();
ROLLBACK;
