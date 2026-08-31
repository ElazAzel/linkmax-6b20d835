-- Revenue Core v1: resumable Beauty Revenue Kit and atomic application RPC.

ALTER TABLE public.service_offerings
  ADD COLUMN IF NOT EXISTS source_kit_id text,
  ADD COLUMN IF NOT EXISTS source_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_offerings_kit_source
  ON public.service_offerings (page_id, source_kit_id, source_key)
  WHERE source_kit_id IS NOT NULL AND source_key IS NOT NULL;

CREATE TABLE public.revenue_kit_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  kit_id text NOT NULL CHECK (kit_id = 'beauty-v1'),
  current_step text NOT NULL CHECK (current_step IN (
    'identity', 'services', 'availability', 'deposit-policy',
    'trust-preview', 'publish-distribute'
  )),
  draft jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_id, kit_id)
);

CREATE TABLE public.revenue_kit_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  kit_id text NOT NULL CHECK (kit_id = 'beauty-v1'),
  mutation_id text NOT NULL UNIQUE,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_kit_drafts_user_updated
  ON public.revenue_kit_drafts (user_id, updated_at DESC);

ALTER TABLE public.revenue_kit_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_kit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage revenue kit drafts"
ON public.revenue_kit_drafts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can read revenue kit applications"
ON public.revenue_kit_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_valid_beauty_revenue_kit_draft(p_draft jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_service jsonb;
  v_active_count integer := 0;
  v_deposit_mode text;
  v_deposit_value numeric;
BEGIN
  IF jsonb_typeof(p_draft) IS DISTINCT FROM 'object'
    OR COALESCE(p_draft->>'kitId', '') <> 'beauty-v1'
    OR COALESCE(p_draft->>'version', '') <> '1'
    OR COALESCE(p_draft->>'niche', '') NOT IN ('nails', 'lashes', 'brows')
    OR jsonb_typeof(p_draft->'identity') IS DISTINCT FROM 'object'
    OR char_length(btrim(COALESCE(p_draft #>> '{identity,displayName}', ''))) NOT BETWEEN 1 AND 120
    OR jsonb_typeof(p_draft->'services') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_draft->'services') = 0
    OR jsonb_typeof(p_draft->'availability') IS DISTINCT FROM 'object'
    OR COALESCE(p_draft #>> '{availability,timezone}', '') <> 'Asia/Almaty'
    OR COALESCE(p_draft #>> '{availability,startTime}', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    OR COALESCE(p_draft #>> '{availability,endTime}', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    OR (p_draft #>> '{availability,startTime}')::time >= (p_draft #>> '{availability,endTime}')::time
    OR jsonb_typeof(p_draft #> '{availability,weekdays}') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_draft #> '{availability,weekdays}') = 0
  THEN
    RETURN false;
  END IF;

  IF (
    SELECT count(*) <> count(DISTINCT service.value->>'presetId')
    FROM jsonb_array_elements(p_draft->'services') AS service(value)
  ) THEN
    RETURN false;
  END IF;

  v_deposit_mode := COALESCE(p_draft #>> '{depositPolicy,deposit,mode}', '');
  IF v_deposit_mode NOT IN ('none', 'fixed', 'percent')
    OR COALESCE(p_draft #>> '{depositPolicy,deposit,value}', '') !~ '^\d+(\.\d{1,2})?$'
  THEN
    RETURN false;
  END IF;

  v_deposit_value := (p_draft #>> '{depositPolicy,deposit,value}')::numeric;
  IF (v_deposit_mode = 'none' AND v_deposit_value <> 0)
    OR (v_deposit_mode = 'percent' AND (v_deposit_value < 1 OR v_deposit_value > 100))
    OR (
      v_deposit_mode <> 'none'
      AND char_length(btrim(COALESCE(p_draft #>> '{depositPolicy,paymentInstructions,ru}', ''))) = 0
      AND char_length(btrim(COALESCE(p_draft #>> '{depositPolicy,paymentInstructions,kk}', ''))) = 0
    )
  THEN
    RETURN false;
  END IF;

  FOR v_service IN SELECT value FROM jsonb_array_elements(p_draft->'services')
  LOOP
    IF jsonb_typeof(v_service) IS DISTINCT FROM 'object'
      OR char_length(COALESCE(v_service->>'presetId', '')) NOT BETWEEN 1 AND 100
      OR COALESCE(v_service->>'currency', '') <> 'KZT'
      OR COALESCE(v_service->>'priceAmount', '') !~ '^\d+(\.\d{1,2})?$'
      OR COALESCE(v_service->>'durationMinutes', '') !~ '^\d+$'
      OR (v_service->>'durationMinutes')::integer NOT BETWEEN 5 AND 720
      OR (
        char_length(btrim(COALESCE(v_service #>> '{name,ru}', ''))) = 0
        AND char_length(btrim(COALESCE(v_service #>> '{name,kk}', ''))) = 0
      )
    THEN
      RETURN false;
    END IF;

    IF COALESCE((v_service->>'active')::boolean, false) THEN
      v_active_count := v_active_count + 1;
      IF v_deposit_mode = 'fixed' AND v_deposit_value > (v_service->>'priceAmount')::numeric THEN
        RETURN false;
      END IF;
    END IF;
  END LOOP;

  RETURN v_active_count > 0;
EXCEPTION
  WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_kit_draft(
  p_page_id uuid,
  p_kit_id text DEFAULT 'beauty-v1'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN jsonb_build_object('ok', false, 'code', 'not_allowed')
    ELSE (
      SELECT jsonb_build_object(
        'ok', true,
        'step', draft.current_step,
        'draft', draft.draft,
        'updatedAt', draft.updated_at
      )
      FROM public.revenue_kit_drafts draft
      WHERE draft.user_id = auth.uid()
        AND draft.page_id = p_page_id
        AND draft.kit_id = p_kit_id
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.save_revenue_kit_draft(
  p_page_id uuid,
  p_kit_id text,
  p_step text,
  p_draft jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated_at timestamptz;
BEGIN
  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.pages page
    WHERE page.id = p_page_id AND page.user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed');
  END IF;

  IF p_kit_id <> 'beauty-v1'
    OR p_step NOT IN (
      'identity', 'services', 'availability', 'deposit-policy',
      'trust-preview', 'publish-distribute'
    )
    OR jsonb_typeof(p_draft) IS DISTINCT FROM 'object'
    OR COALESCE(p_draft->>'kitId', '') <> p_kit_id
    OR COALESCE(p_draft->>'version', '') <> '1'
    OR COALESCE(p_draft->>'niche', '') NOT IN ('nails', 'lashes', 'brows')
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input');
  END IF;

  INSERT INTO public.revenue_kit_drafts (
    user_id, page_id, kit_id, current_step, draft
  )
  VALUES (v_user_id, p_page_id, p_kit_id, p_step, p_draft)
  ON CONFLICT (user_id, page_id, kit_id) DO UPDATE
  SET current_step = EXCLUDED.current_step,
      draft = EXCLUDED.draft,
      updated_at = now()
  RETURNING updated_at INTO v_updated_at;

  RETURN jsonb_build_object(
    'ok', true,
    'step', p_step,
    'draft', p_draft,
    'updatedAt', v_updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_revenue_kit_block(
  p_page_id uuid,
  p_role text,
  p_type text,
  p_title text,
  p_content jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_block_id uuid;
  v_position integer;
BEGIN
  SELECT id INTO v_block_id
  FROM public.blocks
  WHERE page_id = p_page_id
    AND content #>> '{revenueKit,kitId}' = 'beauty-v1'
    AND content #>> '{revenueKit,role}' = p_role
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.blocks
    SET type = p_type,
        title = p_title,
        content = p_content
    WHERE id = v_block_id;
  ELSE
    SELECT COALESCE(max(position), 0) + 1 INTO v_position
    FROM public.blocks
    WHERE page_id = p_page_id;

    INSERT INTO public.blocks (page_id, type, position, title, content)
    VALUES (p_page_id, p_type, v_position, p_title, p_content)
    RETURNING id INTO v_block_id;
  END IF;

  RETURN v_block_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_revenue_kit_v1(
  p_page_id uuid,
  p_draft jsonb,
  p_mutation_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.revenue_kit_applications%ROWTYPE;
  v_service jsonb;
  v_offering_id uuid;
  v_offering_ids uuid[] := ARRAY[]::uuid[];
  v_active_source_keys text[] := ARRAY[]::text[];
  v_pricing_items jsonb := '[]'::jsonb;
  v_profile_id uuid;
  v_pricing_id uuid;
  v_booking_id uuid;
  v_messenger_id uuid;
  v_result jsonb;
  v_deposit_mode text;
  v_deposit_value numeric;
  v_disabled_weekdays jsonb;
  v_publish boolean;
BEGIN
  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.pages page
    WHERE page.id = p_page_id AND page.user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed');
  END IF;

  SELECT * INTO v_existing
  FROM public.revenue_kit_applications
  WHERE mutation_id = p_mutation_id;

  IF FOUND THEN
    IF v_existing.page_id IS DISTINCT FROM p_page_id THEN
      RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict');
    END IF;
    RETURN v_existing.result || jsonb_build_object('idempotentReplay', true);
  END IF;

  IF char_length(COALESCE(p_mutation_id, '')) NOT BETWEEN 8 AND 200
    OR NOT public.is_valid_beauty_revenue_kit_draft(p_draft)
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('beauty-kit:' || p_page_id::text, 0));

  v_deposit_mode := p_draft #>> '{depositPolicy,deposit,mode}';
  v_deposit_value := (p_draft #>> '{depositPolicy,deposit,value}')::numeric;

  FOR v_service IN
    SELECT value
    FROM jsonb_array_elements(p_draft->'services')
    ORDER BY COALESCE((value->>'displayOrder')::integer, 0), value->>'presetId'
  LOOP
    v_active_source_keys := array_append(v_active_source_keys, v_service->>'presetId');

    INSERT INTO public.service_offerings (
      page_id, owner_id, name_i18n, description_i18n, duration_minutes,
      price_amount, currency, deposit_mode, deposit_value,
      cancellation_window_hours, is_active, display_order,
      source_kit_id, source_key
    )
    VALUES (
      p_page_id,
      v_user_id,
      v_service->'name',
      COALESCE(v_service->'description', '{}'::jsonb),
      (v_service->>'durationMinutes')::integer,
      (v_service->>'priceAmount')::numeric(12, 2),
      'KZT',
      v_deposit_mode,
      v_deposit_value,
      COALESCE((p_draft #>> '{depositPolicy,cancellationWindowHours}')::integer, 24),
      COALESCE((v_service->>'active')::boolean, false),
      COALESCE((v_service->>'displayOrder')::integer, 0),
      'beauty-v1',
      v_service->>'presetId'
    )
    ON CONFLICT (page_id, source_kit_id, source_key)
      WHERE source_kit_id IS NOT NULL AND source_key IS NOT NULL
    DO UPDATE SET
      name_i18n = EXCLUDED.name_i18n,
      description_i18n = EXCLUDED.description_i18n,
      duration_minutes = EXCLUDED.duration_minutes,
      price_amount = EXCLUDED.price_amount,
      currency = EXCLUDED.currency,
      deposit_mode = EXCLUDED.deposit_mode,
      deposit_value = EXCLUDED.deposit_value,
      cancellation_window_hours = EXCLUDED.cancellation_window_hours,
      is_active = EXCLUDED.is_active,
      display_order = EXCLUDED.display_order,
      updated_at = now()
    RETURNING id INTO v_offering_id;

    IF COALESCE((v_service->>'active')::boolean, false) THEN
      v_offering_ids := array_append(v_offering_ids, v_offering_id);
      v_pricing_items := v_pricing_items || jsonb_build_array(jsonb_build_object(
        'id', v_service->>'presetId',
        'serviceOfferingId', v_offering_id,
        'name', v_service->'name',
        'description', v_service->'description',
        'price', (v_service->>'priceAmount')::numeric,
        'currency', 'KZT',
        'duration', (v_service->>'durationMinutes')::integer,
        'isBookable', true
      ));
    END IF;
  END LOOP;

  UPDATE public.service_offerings
  SET is_active = false,
      updated_at = now()
  WHERE page_id = p_page_id
    AND source_kit_id = 'beauty-v1'
    AND NOT (source_key = ANY(v_active_source_keys));

  v_profile_id := public.upsert_revenue_kit_block(
    p_page_id,
    'profile',
    'profile',
    p_draft #>> '{identity,displayName}',
    jsonb_build_object(
      'name', p_draft #>> '{identity,displayName}',
      'bio', jsonb_build_object(
        'ru', concat_ws(' · ', p_draft #>> '{identity,specialization}', p_draft #>> '{identity,city}'),
        'kk', concat_ws(' · ', p_draft #>> '{identity,specialization}', p_draft #>> '{identity,city}'),
        'en', concat_ws(' · ', p_draft #>> '{identity,specialization}', p_draft #>> '{identity,city}')
      ),
      'avatar', p_draft #> '{identity,avatarUrl}',
      'revenueKit', jsonb_build_object('kitId', 'beauty-v1', 'role', 'profile')
    )
  );

  v_pricing_id := public.upsert_revenue_kit_block(
    p_page_id,
    'pricing',
    'pricing',
    'Услуги и цены',
    jsonb_build_object(
      'title', jsonb_build_object('ru', 'Услуги и цены', 'kk', 'Қызметтер мен бағалар', 'en', 'Services and prices'),
      'items', v_pricing_items,
      'currency', 'KZT',
      'revenueKit', jsonb_build_object('kitId', 'beauty-v1', 'role', 'pricing')
    )
  );

  SELECT COALESCE(jsonb_agg(day), '[]'::jsonb)
  INTO v_disabled_weekdays
  FROM generate_series(0, 6) day
  WHERE NOT (p_draft #> '{availability,weekdays}') @> to_jsonb(ARRAY[day]);

  v_booking_id := public.upsert_revenue_kit_block(
    p_page_id,
    'booking',
    'booking',
    'Записаться',
    jsonb_build_object(
      'title', jsonb_build_object('ru', 'Записаться', 'kk', 'Жазылу', 'en', 'Book an appointment'),
      'description', jsonb_build_object('ru', 'Выберите услугу и время', 'kk', 'Қызмет пен уақытты таңдаңыз', 'en', 'Choose a service and time'),
      'workingHoursStart', split_part(p_draft #>> '{availability,startTime}', ':', 1)::integer,
      'workingHoursEnd', split_part(p_draft #>> '{availability,endTime}', ':', 1)::integer,
      'maxBookingDays', (p_draft #>> '{availability,bookingHorizonDays}')::integer,
      'disabledWeekdays', v_disabled_weekdays,
      'timezone', 'Asia/Almaty',
      'serviceOfferingIds', to_jsonb(v_offering_ids),
      'requirePrepayment', v_deposit_mode <> 'none',
      'prepaymentAmount', CASE WHEN v_deposit_mode = 'fixed' THEN v_deposit_value ELSE NULL END,
      'prepaymentCurrency', 'KZT',
      'revenueKit', jsonb_build_object('kitId', 'beauty-v1', 'role', 'booking')
    )
  );

  v_messenger_id := public.upsert_revenue_kit_block(
    p_page_id,
    'messenger',
    'messenger',
    'Связаться',
    jsonb_build_object(
      'title', jsonb_build_object('ru', 'Связаться', 'kk', 'Байланысу', 'en', 'Contact'),
      'messengers', jsonb_build_array(jsonb_build_object(
        'platform', p_draft #>> '{identity,contactChannel}',
        'username', p_draft #>> '{identity,contactValue}',
        'message', 'Здравствуйте! Хочу записаться.'
      )),
      'revenueKit', jsonb_build_object('kitId', 'beauty-v1', 'role', 'messenger')
    )
  );

  v_publish := COALESCE((p_draft #>> '{distribution,publish}')::boolean, false);
  UPDATE public.pages
  SET title = p_draft #>> '{identity,displayName}',
      is_published = CASE WHEN v_publish THEN true ELSE is_published END,
      updated_at = now()
  WHERE id = p_page_id;

  INSERT INTO public.revenue_kit_drafts (
    user_id, page_id, kit_id, current_step, draft
  )
  VALUES (v_user_id, p_page_id, 'beauty-v1', 'publish-distribute', p_draft)
  ON CONFLICT (user_id, page_id, kit_id) DO UPDATE
  SET current_step = EXCLUDED.current_step,
      draft = EXCLUDED.draft,
      updated_at = now();

  v_result := jsonb_build_object(
    'ok', true,
    'pageId', p_page_id,
    'offeringIds', to_jsonb(v_offering_ids),
    'blockIds', jsonb_build_object(
      'profile', v_profile_id,
      'pricing', v_pricing_id,
      'booking', v_booking_id,
      'messenger', v_messenger_id
    ),
    'idempotentReplay', false
  );

  INSERT INTO public.revenue_kit_applications (
    user_id, page_id, kit_id, mutation_id, result
  )
  VALUES (v_user_id, p_page_id, 'beauty-v1', p_mutation_id, v_result);

  INSERT INTO public.product_events (
    user_id, page_id, event_name, source, metadata, taxonomy_version,
    actor_type, idempotency_key
  )
  VALUES (
    v_user_id,
    p_page_id,
    'revenue_kit_applied',
    'system',
    jsonb_build_object('kitId', 'beauty-v1', 'niche', p_draft->>'niche'),
    2,
    'creator',
    p_mutation_id
  )
  ON CONFLICT (event_name, idempotency_key) WHERE idempotency_key IS NOT NULL
  DO NOTHING;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.revenue_kit_applications
    WHERE mutation_id = p_mutation_id;
    IF FOUND AND v_existing.page_id IS NOT DISTINCT FROM p_page_id THEN
      RETURN v_existing.result || jsonb_build_object('idempotentReplay', true);
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict');
END;
$$;

INSERT INTO public.feature_flags (
  key, name, description, is_enabled, default_enabled, rollout_percentage
)
VALUES
  ('revenue_core_v1', 'Revenue Core v1', 'Server-authoritative booking and revenue foundation.', false, false, 0),
  ('beauty_revenue_kit_v1', 'Beauty Revenue Kit v1', 'Guided setup for nails, lashes, and brows cohorts.', false, false, 0),
  ('outcome_home_v1', 'Outcome Home v1', 'Revenue outcome summary and deterministic next action.', false, false, 0),
  ('booking_self_service_v1', 'Booking Self Service v1', 'Token-scoped visitor booking management.', false, false, 0)
ON CONFLICT (key) DO NOTHING;

REVOKE ALL ON public.revenue_kit_drafts FROM PUBLIC, anon;
REVOKE ALL ON public.revenue_kit_applications FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_kit_drafts TO authenticated;
GRANT SELECT ON public.revenue_kit_applications TO authenticated;
GRANT ALL ON public.revenue_kit_drafts, public.revenue_kit_applications TO service_role;

REVOKE ALL ON FUNCTION public.is_valid_beauty_revenue_kit_draft(jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_revenue_kit_block(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_revenue_kit_draft(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_revenue_kit_draft(uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_revenue_kit_v1(uuid, jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_revenue_kit_draft(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_revenue_kit_draft(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_revenue_kit_v1(uuid, jsonb, text) TO authenticated;

COMMENT ON FUNCTION public.apply_revenue_kit_v1 IS
  'Atomically applies Beauty Revenue Kit v1 while preserving unrelated blocks and historical offerings.';
