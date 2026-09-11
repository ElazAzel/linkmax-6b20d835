-- Viral growth foundation for published pages.
-- The client never writes attribution or rewards directly: all public writes go
-- through the constrained SECURITY DEFINER functions below.

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS viral_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.page_growth_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  campaign text NOT NULL DEFAULT 'launch-kit',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_growth_links_code_format CHECK (code ~ '^[a-z0-9_-]{8,64}$')
);

CREATE TABLE IF NOT EXISTS public.page_growth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.page_growth_links(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  visitor_key text NOT NULL,
  session_key text,
  dedupe_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.page_growth_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.page_growth_links(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  session_key text,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(link_id, visitor_key)
);

CREATE TABLE IF NOT EXISTS public.page_growth_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.page_growth_links(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reward_amount integer NOT NULL CHECK (reward_amount > 0),
  status text NOT NULL DEFAULT 'granted' CHECK (status IN ('pending', 'granted', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_user_id, referred_user_id, reward_type)
);

CREATE UNIQUE INDEX IF NOT EXISTS page_growth_attributions_first_signup_idx
  ON public.page_growth_attributions (referred_user_id)
  WHERE referred_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS page_growth_links_page_idx
  ON public.page_growth_links (page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_growth_events_page_time_idx
  ON public.page_growth_events (page_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS page_growth_events_name_time_idx
  ON public.page_growth_events (event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS page_growth_events_link_name_time_idx
  ON public.page_growth_events (link_id, event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS page_growth_attributions_page_idx
  ON public.page_growth_attributions (page_id, last_seen_at DESC);

CREATE OR REPLACE FUNCTION public.is_allowed_page_growth_event_name(p_event_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_name = ANY (ARRAY[
    'share_clicked',
    'link_copied',
    'qr_generated',
    'qr_scanned',
    'embed_copied',
    'referral_visit',
    'referral_signup',
    'template_cloned',
    'team_invite_sent',
    'page_published',
    'first_lead_received'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.create_page_growth_link(
  p_page_id uuid,
  p_campaign text DEFAULT 'launch-kit'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_page record;
  v_link record;
  v_code text;
  v_campaign text := COALESCE(NULLIF(trim(p_campaign), ''), 'launch-kit');
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT id, user_id, slug, is_published
    INTO v_page
  FROM public.pages
  WHERE id = p_page_id;

  IF NOT FOUND OR v_page.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'page_not_owned');
  END IF;

  IF NOT COALESCE(v_page.is_published, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'page_not_published');
  END IF;

  SELECT * INTO v_link
  FROM public.page_growth_links
  WHERE page_id = p_page_id
    AND campaign = v_campaign
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'id', v_link.id,
      'code', v_link.code,
      'page_id', v_page.id,
      'slug', v_page.slug,
      'campaign', v_link.campaign
    );
  END IF;

  LOOP
    v_code := lower(encode(gen_random_bytes(9), 'hex'));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.page_growth_links WHERE code = v_code);
  END LOOP;

  INSERT INTO public.page_growth_links (page_id, owner_user_id, code, campaign)
  VALUES (v_page.id, auth.uid(), v_code, v_campaign)
  RETURNING * INTO v_link;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_link.id,
    'code', v_link.code,
    'page_id', v_page.id,
    'slug', v_page.slug,
    'campaign', v_link.campaign
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_page_growth_link(p_code text)
RETURNS TABLE (
  id uuid,
  code text,
  page_id uuid,
  slug text,
  campaign text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT l.id, l.code, l.page_id, p.slug, l.campaign
  FROM public.page_growth_links l
  JOIN public.pages p ON p.id = l.page_id
  WHERE l.code = lower(trim(p_code))
    AND l.is_active = true
    AND COALESCE(p.is_published, false) = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.record_page_growth_event(
  p_code text,
  p_event_name text,
  p_page_id uuid DEFAULT NULL,
  p_visitor_key text DEFAULT NULL,
  p_session_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_link record;
  v_visitor_key text;
  v_dedupe_key text;
  v_inserted boolean := false;
  v_is_self_referral boolean := false;
  v_reward_created boolean := false;
BEGIN
  IF NOT public.is_allowed_page_growth_event_name(p_event_name) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_event_name');
  END IF;

  IF p_metadata IS NOT NULL AND pg_column_size(p_metadata) > 4096 THEN
    RETURN jsonb_build_object('success', false, 'error', 'metadata_too_large');
  END IF;

  v_visitor_key := left(regexp_replace(COALESCE(p_visitor_key, 'anonymous'), '[^A-Za-z0-9_-]', '', 'g'), 128);
  IF length(v_visitor_key) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_visitor_key');
  END IF;

  SELECT l.* INTO v_link
  FROM public.page_growth_links l
  WHERE l.code = lower(trim(p_code))
    AND l.is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_growth_link');
  END IF;

  IF p_event_name IN (
    'share_clicked',
    'link_copied',
    'qr_generated',
    'embed_copied',
    'page_published',
    'team_invite_sent',
    'first_lead_received'
  ) AND (auth.uid() IS NULL OR auth.uid() <> v_link.owner_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'owner_required');
  END IF;

  IF p_event_name = 'template_cloned' AND auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  IF auth.uid() IS NULL AND p_event_name IN ('referral_visit', 'qr_scanned') AND (
    SELECT count(*)
    FROM public.page_growth_events
    WHERE link_id = v_link.id
      AND event_name = p_event_name
      AND occurred_at >= date_trunc('day', now())
  ) >= 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'daily_event_limit_reached');
  END IF;

  IF p_page_id IS NOT NULL AND p_page_id <> v_link.page_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'page_mismatch');
  END IF;

  v_is_self_referral := auth.uid() IS NOT NULL AND auth.uid() = v_link.owner_user_id;
  v_dedupe_key := v_link.id::text || ':' || p_event_name || ':' || v_visitor_key || ':' || to_char(now() AT TIME ZONE 'utc', 'YYYYMMDD');

  INSERT INTO public.page_growth_events (
    link_id, page_id, owner_user_id, event_name, visitor_key, session_key, dedupe_key, metadata
  )
  VALUES (
    v_link.id,
    v_link.page_id,
    v_link.owner_user_id,
    p_event_name,
    v_visitor_key,
    left(p_session_key, 128),
    v_dedupe_key,
    CASE WHEN jsonb_typeof(p_metadata) = 'object' THEN p_metadata ELSE '{}'::jsonb END
  )
  ON CONFLICT (dedupe_key) DO NOTHING;
  v_inserted := FOUND;

  IF p_event_name = 'referral_visit' AND NOT v_is_self_referral THEN
    INSERT INTO public.page_growth_attributions (
      link_id, page_id, owner_user_id, visitor_key, session_key, metadata
    )
    VALUES (
      v_link.id, v_link.page_id, v_link.owner_user_id, v_visitor_key, left(p_session_key, 128),
      CASE WHEN jsonb_typeof(p_metadata) = 'object' THEN p_metadata ELSE '{}'::jsonb END
    )
    ON CONFLICT (link_id, visitor_key)
    DO UPDATE SET last_seen_at = now(), session_key = EXCLUDED.session_key;
  END IF;

  IF p_event_name = 'referral_signup' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'auth_required');
    END IF;
    IF v_is_self_referral THEN
      RETURN jsonb_build_object('success', false, 'error', 'self_referral');
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.page_growth_attributions
      WHERE referred_user_id = auth.uid()
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_attributed');
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.page_growth_attributions
      WHERE link_id = v_link.id
        AND visitor_key = v_visitor_key
        AND referred_user_id IS NOT NULL
        AND referred_user_id <> auth.uid()
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'visitor_already_converted');
    END IF;

    INSERT INTO public.page_growth_attributions AS attribution (
      link_id, page_id, owner_user_id, visitor_key, session_key, referred_user_id, first_seen_at, last_seen_at, converted_at, metadata
    )
    VALUES (
      v_link.id, v_link.page_id, v_link.owner_user_id, v_visitor_key, left(p_session_key, 128), auth.uid(), now(), now(), now(),
      CASE WHEN jsonb_typeof(p_metadata) = 'object' THEN p_metadata ELSE '{}'::jsonb END
    )
    ON CONFLICT (link_id, visitor_key)
    DO UPDATE SET
      last_seen_at = now(),
      converted_at = COALESCE(converted_at, now()),
      referred_user_id = COALESCE(attribution.referred_user_id, EXCLUDED.referred_user_id);

    INSERT INTO public.page_growth_rewards (
      link_id, page_id, owner_user_id, referrer_user_id, referred_user_id, reward_type, reward_amount, status
    )
    VALUES (v_link.id, v_link.page_id, v_link.owner_user_id, v_link.owner_user_id, auth.uid(), 'linkmax_tokens', 50, 'granted')
    ON CONFLICT (referrer_user_id, referred_user_id, reward_type) DO NOTHING;
    v_reward_created := FOUND;

    IF v_reward_created THEN
      INSERT INTO public.user_tokens (user_id, balance, total_earned)
      VALUES (v_link.owner_user_id, 0, 0), (auth.uid(), 0, 0)
      ON CONFLICT (user_id) DO NOTHING;

      UPDATE public.user_tokens
      SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now()
      WHERE user_id IN (v_link.owner_user_id, auth.uid());

      INSERT INTO public.token_transactions (user_id, amount, type, source, description)
      VALUES
        (v_link.owner_user_id, 50, 'earn', 'page_referral', 'Награда за приглашение через страницу'),
        (auth.uid(), 50, 'earn', 'page_referral', 'Бонус за регистрацию по ссылке страницы');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'recorded', v_inserted,
    'reward_created', v_reward_created,
    'self_referral', v_is_self_referral
  );
END;
$$;

ALTER TABLE public.page_growth_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_growth_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_growth_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Page owners can manage growth links" ON public.page_growth_links;
CREATE POLICY "Page owners can view growth links"
ON public.page_growth_links FOR SELECT TO authenticated
USING (auth.uid() = owner_user_id)
;

DROP POLICY IF EXISTS "Page owners can view growth events" ON public.page_growth_events;
CREATE POLICY "Page owners can view growth events"
ON public.page_growth_events FOR SELECT TO authenticated
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Page owners can view growth attributions" ON public.page_growth_attributions;
CREATE POLICY "Page owners can view growth attributions"
ON public.page_growth_attributions FOR SELECT TO authenticated
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can view growth rewards" ON public.page_growth_rewards;
CREATE POLICY "Users can view growth rewards"
ON public.page_growth_rewards FOR SELECT TO authenticated
USING (auth.uid() = owner_user_id OR auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

REVOKE ALL ON FUNCTION public.is_allowed_page_growth_event_name(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_page_growth_link(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_page_growth_link(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_page_growth_event(text, text, uuid, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.resolve_page_growth_link(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_page_growth_link(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_page_growth_event(text, text, uuid, text, text, jsonb) TO anon, authenticated;

COMMENT ON TABLE public.page_growth_events IS 'Server-attributed, deduplicated events for page sharing and referral loops.';
COMMENT ON TABLE public.page_growth_attributions IS 'First-touch page referral attribution with one conversion per referred account.';
COMMENT ON TABLE public.page_growth_rewards IS 'Auditable rewards issued once per referrer/referred pair.';
