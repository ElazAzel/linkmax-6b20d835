-- Phase 47.1: Review request links.
-- Adds tokenized post-booking review requests on top of verified reviews.

CREATE OR REPLACE FUNCTION public.is_allowed_product_event_name(p_event_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_name = ANY (ARRAY[
    'signup_completed',
    'onboarding_started',
    'onboarding_step_completed',
    'onboarding_completed',
    'ai_page_generated',
    'block_added',
    'block_edited',
    'page_published',
    'telegram_connected',
    'first_lead_received',
    'lead_viewed',
    'lead_status_changed',
    'booking_created',
    'invoice_created',
    'payment_completed',
    'review_request_created',
    'review_request_used',
    'review_created',
    'review_published',
    'upgrade_clicked',
    'upgrade_completed',
    'dashboard_returned'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_webhook_event_type(p_event_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_type = ANY (ARRAY[
    'lead.created',
    'lead.updated',
    'booking.created',
    'booking.cancelled',
    'event.registration_created',
    'invoice.created',
    'invoice.paid',
    'page.published',
    'form.submitted',
    'review_request.created',
    'review_request.used',
    'review.created',
    'review.published'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_review_request_status(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_status = ANY (ARRAY['pending', 'used', 'expired', 'revoked']::text[]);
$$;

CREATE OR REPLACE FUNCTION public.hash_review_request_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_token IS NULL OR btrim(p_token) = '' THEN NULL
    ELSE encode(digest(btrim(p_token), 'sha256'), 'hex')
  END;
$$;

CREATE TABLE IF NOT EXISTS public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
  request_token_hash text NOT NULL UNIQUE,
  recipient_contact_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (public.is_allowed_review_request_status(status)),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  sent_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_requests_fact_reference_check CHECK (booking_id IS NOT NULL OR order_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_requests_one_per_booking
  ON public.review_requests (booking_id)
  WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_requests_one_per_order
  ON public.review_requests (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_review_requests_owner_status_created
  ON public.review_requests (owner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_requests_page_status_created
  ON public.review_requests (page_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_requests_expires
  ON public.review_requests (expires_at)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS update_review_requests_updated_at ON public.review_requests;
CREATE TRIGGER update_review_requests_updated_at
BEFORE UPDATE ON public.review_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and workspace members can view review requests" ON public.review_requests;
CREATE POLICY "Owners and workspace members can view review requests"
ON public.review_requests
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_members member
      WHERE member.org_id = review_requests.organization_id
        AND member.user_id = auth.uid()
        AND member.role IN ('owner', 'admin', 'editor')
    )
  )
  OR (
    zone_id IS NOT NULL
    AND public.is_zone_member(zone_id, auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.can_manage_page_review_requests(p_page_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pages page
    WHERE page.id = p_page_id
      AND (
        page.user_id = p_user_id
        OR public.is_admin(p_user_id)
        OR (
          page.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.organization_members member
            WHERE member.org_id = page.organization_id
              AND member.user_id = p_user_id
              AND member.role IN ('owner', 'admin', 'editor')
          )
        )
        OR (
          public.resolve_page_zone_id(page.id) IS NOT NULL
          AND public.is_zone_admin(public.resolve_page_zone_id(page.id), p_user_id)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.emit_review_request_product_event(
  p_event_name text,
  p_request public.review_requests
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.product_events (
    user_id,
    page_id,
    event_name,
    source,
    metadata,
    occurred_at
  )
  VALUES (
    p_request.owner_id,
    p_request.page_id,
    p_event_name,
    'system',
    jsonb_build_object(
      'review_request_id', p_request.id,
      'booking_id', p_request.booking_id,
      'order_id', p_request.order_id,
      'review_id', p_request.review_id,
      'status', p_request.status
    ),
    now()
  );
EXCEPTION
  WHEN undefined_table OR check_violation OR insufficient_privilege THEN
    RETURN;
  WHEN others THEN
    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_review_request_webhook_event(
  p_event_type text,
  p_request public.review_requests
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'id', p_request.id,
    'page_id', p_request.page_id,
    'booking_id', p_request.booking_id,
    'order_id', p_request.order_id,
    'review_id', p_request.review_id,
    'status', p_request.status,
    'expires_at', p_request.expires_at,
    'used_at', p_request.used_at,
    'created_at', p_request.created_at
  );

  PERFORM public.enqueue_webhook_event(
    p_event_type,
    p_request.owner_id,
    p_request.zone_id,
    'review_requests',
    p_request.id,
    v_payload,
    p_event_type || ':' || p_request.id::text || ':' || COALESCE(p_request.used_at::text, p_request.updated_at::text)
  );
EXCEPTION
  WHEN undefined_function OR insufficient_privilege THEN
    RETURN;
  WHEN others THEN
    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_review_request_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
    OR (
      TG_OP = 'UPDATE'
      AND NEW.status = 'pending'
      AND (
        OLD.status IS DISTINCT FROM NEW.status
        OR OLD.request_token_hash IS DISTINCT FROM NEW.request_token_hash
      )
    )
  THEN
    PERFORM public.emit_review_request_product_event('review_request_created', NEW);
    PERFORM public.enqueue_review_request_webhook_event('review_request.created', NEW);
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'used'
  THEN
    PERFORM public.emit_review_request_product_event('review_request_used', NEW);
    PERFORM public.enqueue_review_request_webhook_event('review_request.used', NEW);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_requests_emit_events ON public.review_requests;
CREATE TRIGGER review_requests_emit_events
AFTER INSERT OR UPDATE ON public.review_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_review_request_events();

CREATE OR REPLACE FUNCTION public.create_booking_review_request(
  p_booking_id uuid,
  p_expires_in interval DEFAULT interval '14 days',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking record;
  v_request public.review_requests%ROWTYPE;
  v_raw_token text;
  v_token_hash text;
  v_expires_at timestamptz;
  v_zone_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  IF p_expires_in IS NULL OR p_expires_in <= interval '0 seconds' OR p_expires_in > interval '90 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_expiry_window');
  END IF;

  SELECT
    booking.id,
    booking.page_id,
    booking.owner_id,
    booking.status,
    booking.completed_at,
    booking.client_email,
    booking.client_phone,
    page.organization_id
  INTO v_booking
  FROM public.bookings booking
  JOIN public.pages page ON page.id = booking.page_id
  WHERE booking.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  IF v_booking.status <> 'completed' AND v_booking.completed_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_completed');
  END IF;

  IF NOT public.can_manage_page_review_requests(v_booking.page_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_allowed');
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews WHERE booking_id = p_booking_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'review_already_exists');
  END IF;

  v_raw_token := 'rv_' || encode(gen_random_bytes(32), 'hex');
  v_token_hash := public.hash_review_request_token(v_raw_token);
  v_expires_at := now() + p_expires_in;
  v_zone_id := public.resolve_page_zone_id(v_booking.page_id);

  SELECT * INTO v_request
  FROM public.review_requests
  WHERE booking_id = p_booking_id
  FOR UPDATE;

  IF FOUND AND v_request.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'review_request_already_used',
      'review_request', jsonb_build_object(
        'id', v_request.id,
        'status', v_request.status,
        'review_id', v_request.review_id
      )
    );
  END IF;

  IF FOUND THEN
    UPDATE public.review_requests
    SET request_token_hash = v_token_hash,
        status = 'pending',
        expires_at = v_expires_at,
        revoked_at = NULL,
        metadata = COALESCE(p_metadata, '{}'::jsonb),
        updated_at = now()
    WHERE id = v_request.id
    RETURNING * INTO v_request;
  ELSE
    INSERT INTO public.review_requests (
      page_id,
      owner_id,
      organization_id,
      zone_id,
      booking_id,
      request_token_hash,
      recipient_contact_hash,
      expires_at,
      metadata
    )
    VALUES (
      v_booking.page_id,
      v_booking.owner_id,
      v_booking.organization_id,
      v_zone_id,
      v_booking.id,
      v_token_hash,
      public.hash_review_contact(COALESCE(v_booking.client_email, v_booking.client_phone)),
      v_expires_at,
      COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING * INTO v_request;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'review_request', jsonb_build_object(
      'id', v_request.id,
      'status', v_request.status,
      'booking_id', v_request.booking_id,
      'expires_at', v_request.expires_at,
      'token', v_raw_token,
      'path', '/review/request/' || v_raw_token
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_review_request_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash text := public.hash_review_request_token(p_token);
  v_request public.review_requests%ROWTYPE;
  v_booking record;
  v_page record;
BEGIN
  IF v_token_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  SELECT * INTO v_request
  FROM public.review_requests
  WHERE request_token_hash = v_token_hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'review_request_not_found');
  END IF;

  IF v_request.status = 'pending' AND v_request.expires_at <= now() THEN
    UPDATE public.review_requests
    SET status = 'expired', updated_at = now()
    WHERE id = v_request.id
    RETURNING * INTO v_request;
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'review_request_' || v_request.status,
      'review_request', jsonb_build_object(
        'id', v_request.id,
        'status', v_request.status,
        'review_id', v_request.review_id
      )
    );
  END IF;

  SELECT id, slug, title, avatar_url, niche, city INTO v_page
  FROM public.pages
  WHERE id = v_request.page_id;

  SELECT id, client_name, slot_date, slot_time, slot_end_time INTO v_booking
  FROM public.bookings
  WHERE id = v_request.booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_request', jsonb_build_object(
      'id', v_request.id,
      'status', v_request.status,
      'expires_at', v_request.expires_at,
      'booking_id', v_request.booking_id,
      'default_reviewer_display_name', v_booking.client_name
    ),
    'page', jsonb_build_object(
      'id', v_page.id,
      'slug', v_page.slug,
      'title', v_page.title,
      'avatar_url', v_page.avatar_url,
      'niche', v_page.niche,
      'city', v_page.city
    ),
    'booking', jsonb_build_object(
      'id', v_booking.id,
      'slot_date', v_booking.slot_date,
      'slot_time', v_booking.slot_time,
      'slot_end_time', v_booking.slot_end_time
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_review_request(
  p_token text,
  p_rating integer,
  p_body text DEFAULT NULL,
  p_reviewer_display_name text DEFAULT NULL,
  p_reviewer_contact text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash text := public.hash_review_request_token(p_token);
  v_request public.review_requests%ROWTYPE;
  v_booking record;
  v_result jsonb;
  v_review_id uuid;
BEGIN
  IF v_token_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  SELECT * INTO v_request
  FROM public.review_requests
  WHERE request_token_hash = v_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'review_request_not_found');
  END IF;

  IF v_request.status = 'pending' AND v_request.expires_at <= now() THEN
    UPDATE public.review_requests
    SET status = 'expired', updated_at = now()
    WHERE id = v_request.id;

    RETURN jsonb_build_object('success', false, 'error', 'review_request_expired');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'review_request_' || v_request.status,
      'review_request', jsonb_build_object(
        'id', v_request.id,
        'status', v_request.status,
        'review_id', v_request.review_id
      )
    );
  END IF;

  SELECT id, client_email, client_phone INTO v_booking
  FROM public.bookings
  WHERE id = v_request.booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  v_result := public.create_review_for_booking(
    v_request.booking_id,
    p_rating,
    p_body,
    p_reviewer_display_name,
    COALESCE(p_reviewer_contact, v_booking.client_email, v_booking.client_phone),
    p_title,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('review_request_id', v_request.id)
  );

  IF (v_result->>'success')::boolean IS TRUE THEN
    v_review_id := NULLIF(v_result #>> '{review,id}', '')::uuid;

    UPDATE public.review_requests
    SET status = 'used',
        used_at = now(),
        review_id = v_review_id,
        updated_at = now()
    WHERE id = v_request.id
    RETURNING * INTO v_request;

    RETURN v_result || jsonb_build_object(
      'review_request', jsonb_build_object(
        'id', v_request.id,
        'status', v_request.status,
        'used_at', v_request.used_at,
        'review_id', v_request.review_id
      )
    );
  END IF;

  IF v_result->>'error' = 'review_already_exists' THEN
    SELECT id INTO v_review_id
    FROM public.reviews
    WHERE booking_id = v_request.booking_id
    LIMIT 1;

    UPDATE public.review_requests
    SET status = 'used',
        used_at = now(),
        review_id = v_review_id,
        updated_at = now()
    WHERE id = v_request.id
    RETURNING * INTO v_request;

    RETURN jsonb_build_object(
      'success', true,
      'already_submitted', true,
      'review', jsonb_build_object('id', v_review_id),
      'review_request', jsonb_build_object(
        'id', v_request.id,
        'status', v_request.status,
        'used_at', v_request.used_at,
        'review_id', v_request.review_id
      )
    );
  END IF;

  RETURN v_result;
END;
$$;

GRANT SELECT ON public.review_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_review_request(uuid, interval, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review_request(text, integer, text, text, text, text, jsonb) TO anon, authenticated;

COMMENT ON TABLE public.review_requests IS 'Tokenized post-booking/order review requests; raw tokens are returned once and only token hashes are stored.';
COMMENT ON FUNCTION public.create_booking_review_request IS 'Creates or rotates a pending review request token for a completed booking.';
COMMENT ON FUNCTION public.get_review_request_by_token IS 'Returns public-safe review request context for a token holder.';
COMMENT ON FUNCTION public.submit_review_request IS 'Consumes a review request token and creates a pending verified review.';
