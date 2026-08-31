BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(10);

SELECT has_table('public', 'service_offerings', 'service_offerings is normalized');
SELECT has_column('public', 'service_offerings', 'deposit_mode', 'deposit mode is stored');
SELECT has_column('public', 'service_offerings', 'deposit_value', 'deposit value is stored');
SELECT has_column('public', 'service_offerings', 'name_i18n', 'localized name is stored');

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'revenue-owner@example.test',
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'other-owner@example.test',
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pages (id, user_id, slug, title, is_published)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'revenue-offering-published',
    'Published page',
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'revenue-offering-draft',
    'Draft page',
    false
  )
ON CONFLICT (id) DO UPDATE SET is_published = EXCLUDED.is_published;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

SELECT lives_ok(
  $$
    INSERT INTO public.service_offerings (
      id, page_id, owner_id, name_i18n, duration_minutes, price_amount, deposit_mode, deposit_value
    ) VALUES (
      '30000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '{"ru":"Маникюр"}', 60, 7000.00, 'fixed', 2000.00
    )
  $$,
  'the owner can create a valid service offering'
);

SELECT lives_ok(
  $$
    INSERT INTO public.service_offerings (
      id, page_id, owner_id, name_i18n, duration_minutes, price_amount
    ) VALUES (
      '30000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      '{"kk":"Шаш қию"}', 45, 5000.00
    )
  $$,
  'a Kazakh localized name is accepted'
);

SELECT throws_ok(
  $$
    INSERT INTO public.service_offerings (
      page_id, owner_id, name_i18n, duration_minutes, price_amount, deposit_mode, deposit_value
    ) VALUES (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '{"ru":"Маникюр"}', 60, 5000.00, 'fixed', 6000.00
    )
  $$,
  '23514',
  NULL,
  'a fixed deposit cannot exceed the service price'
);

SELECT throws_ok(
  $$
    INSERT INTO public.service_offerings (
      page_id, owner_id, name_i18n, duration_minutes, price_amount
    ) VALUES (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      '{"ru":"Подмена владельца"}', 60, 5000.00
    )
  $$,
  '42501',
  NULL,
  'the page owner cannot be forged'
);

RESET ROLE;
SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*) FROM public.service_offerings),
  1::bigint,
  'anonymous visitors see active offerings only on published pages'
);

SELECT throws_ok(
  $$
    INSERT INTO public.service_offerings (
      page_id, owner_id, name_i18n, duration_minutes, price_amount
    ) VALUES (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '{"ru":"Запрещено"}', 60, 5000.00
    )
  $$,
  '42501',
  NULL,
  'anonymous visitors cannot create offerings'
);

SELECT * FROM finish();
ROLLBACK;
