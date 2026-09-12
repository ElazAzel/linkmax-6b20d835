-- Phase 47: Verified reviews foundation.
-- Adds post-service reviews tied to real bookings/orders without replacing testimonial blocks.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    'review.created',
    'review.published'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_review_status(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_status = ANY (ARRAY['pending', 'published', 'hidden', 'rejected', 'flagged']::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_review_source(p_source text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_source = ANY (ARRAY['booking', 'order', 'owner_import', 'manual']::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_review_verification_status(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_status = ANY (ARRAY['verified_booking', 'verified_order', 'owner_imported', 'unverified']::text[]);
$$;

CREATE OR REPLACE FUNCTION public.hash_review_contact(p_contact text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_contact IS NULL OR btrim(p_contact) = '' THEN NULL
    ELSE encode(digest(lower(btrim(p_contact)), 'sha256'), 'hex')
  END;
$$;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.zone_staff(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text CHECK (title IS NULL OR char_length(title) <= 160),
  body text CHECK (body IS NULL OR char_length(body) <= 2000),
  reviewer_display_name text NOT NULL CHECK (char_length(reviewer_display_name) BETWEEN 1 AND 120),
  reviewer_contact_hash text,
  source text NOT NULL DEFAULT 'booking' CHECK (public.is_allowed_review_source(source)),
  status text NOT NULL DEFAULT 'pending' CHECK (public.is_allowed_review_status(status)),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (public.is_allowed_review_verification_status(verification_status)),
  moderation_reason text CHECK (moderation_reason IS NULL OR char_length(moderation_reason) <= 500),
  is_featured boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_fact_reference_check CHECK (booking_id IS NOT NULL OR order_id IS NOT NULL OR source IN ('owner_import', 'manual'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_booking
  ON public.reviews (booking_id)
  WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_order
  ON public.reviews (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_page_status_created
  ON public.reviews (page_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_owner_status_created
  ON public.reviews (owner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_org_status_created
  ON public.reviews (organization_id, status, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_zone_status_created
  ON public.reviews (zone_id, status, created_at DESC)
  WHERE zone_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.page_review_summaries (
  page_id uuid PRIMARY KEY REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  published_count integer NOT NULL DEFAULT 0 CHECK (published_count >= 0),
  average_rating numeric(3, 2) CHECK (average_rating IS NULL OR (average_rating >= 1 AND average_rating <= 5)),
  rating_breakdown jsonb NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb,
  last_review_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_review_summaries_owner
  ON public.page_review_summaries (owner_id);

CREATE INDEX IF NOT EXISTS idx_page_review_summaries_rating
  ON public.page_review_summaries (average_rating DESC NULLS LAST, published_count DESC);

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_review_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
CREATE POLICY "Public can view published reviews"
ON public.reviews
FOR SELECT
USING (
  status = 'published'
  AND EXISTS (
    SELECT 1
    FROM public.pages page
    WHERE page.id = reviews.page_id
      AND page.is_published = true
  )
);

DROP POLICY IF EXISTS "Owners and workspace members can view reviews" ON public.reviews;
CREATE POLICY "Owners and workspace members can view reviews"
ON public.reviews
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
      WHERE member.org_id = reviews.organization_id
        AND member.user_id = auth.uid()
        AND member.role IN ('owner', 'admin', 'editor')
    )
  )
  OR (
    zone_id IS NOT NULL
    AND public.is_zone_member(zone_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Public can view review summaries" ON public.page_review_summaries;
CREATE POLICY "Public can view review summaries"
ON public.page_review_summaries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.pages page
    WHERE page.id = page_review_summaries.page_id
      AND page.is_published = true
  )
);

DROP POLICY IF EXISTS "Owners and workspace members can view review summaries" ON public.page_review_summaries;
CREATE POLICY "Owners and workspace members can view review summaries"
ON public.page_review_summaries
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
      WHERE member.org_id = page_review_summaries.organization_id
        AND member.user_id = auth.uid()
        AND member.role IN ('owner', 'admin', 'editor')
    )
  )
  OR (
    zone_id IS NOT NULL
    AND public.is_zone_member(zone_id, auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.resolve_page_zone_id(p_page_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_candidate uuid;
BEGIN
  SELECT organization_id INTO v_candidate
  FROM public.pages
  WHERE id = p_page_id;

  IF v_candidate IS NOT NULL AND EXISTS (SELECT 1 FROM public.zones WHERE id = v_candidate) THEN
    RETURN v_candidate;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_page_review_summary(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page public.pages%ROWTYPE;
  v_zone_id uuid;
  v_count integer;
  v_average numeric(3, 2);
  v_last_review_at timestamptz;
  v_breakdown jsonb;
BEGIN
  SELECT * INTO v_page
  FROM public.pages
  WHERE id = p_page_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_zone_id := public.resolve_page_zone_id(p_page_id);

  SELECT
    COUNT(*)::integer,
    ROUND(AVG(rating)::numeric, 2)::numeric(3, 2),
    MAX(published_at),
    jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    )
  INTO v_count, v_average, v_last_review_at, v_breakdown
  FROM public.reviews
  WHERE page_id = p_page_id
    AND status = 'published';

  INSERT INTO public.page_review_summaries (
    page_id,
    owner_id,
    organization_id,
    zone_id,
    published_count,
    average_rating,
    rating_breakdown,
    last_review_at,
    updated_at
  )
  VALUES (
    v_page.id,
    v_page.user_id,
    v_page.organization_id,
    v_zone_id,
    COALESCE(v_count, 0),
    v_average,
    COALESCE(v_breakdown, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb),
    v_last_review_at,
    now()
  )
  ON CONFLICT (page_id) DO UPDATE
  SET owner_id = EXCLUDED.owner_id,
      organization_id = EXCLUDED.organization_id,
      zone_id = EXCLUDED.zone_id,
      published_count = EXCLUDED.published_count,
      average_rating = EXCLUDED.average_rating,
      rating_breakdown = EXCLUDED.rating_breakdown,
      last_review_at = EXCLUDED.last_review_at,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_review_summary_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_page_review_summary(NEW.page_id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM public.refresh_page_review_summary(NEW.page_id);

    IF OLD.page_id IS DISTINCT FROM NEW.page_id THEN
      PERFORM public.refresh_page_review_summary(OLD.page_id);
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_page_review_summary(OLD.page_id);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_refresh_summary ON public.reviews;
CREATE TRIGGER reviews_refresh_summary
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_review_summary_refresh();

CREATE OR REPLACE FUNCTION public.enqueue_review_webhook_event(p_event_type text, p_review public.reviews)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'id', p_review.id,
    'page_id', p_review.page_id,
    'booking_id', p_review.booking_id,
    'order_id', p_review.order_id,
    'rating', p_review.rating,
    'status', p_review.status,
    'verification_status', p_review.verification_status,
    'published_at', p_review.published_at,
    'created_at', p_review.created_at
  );

  PERFORM public.enqueue_webhook_event(
    p_event_type,
    p_review.owner_id,
    p_review.zone_id,
    'reviews',
    p_review.id,
    v_payload,
    p_event_type || ':' || p_review.id::text
  );
EXCEPTION
  WHEN undefined_function OR insufficient_privilege THEN
    RETURN;
  WHEN others THEN
    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.emit_review_product_event(p_event_name text, p_review public.reviews)
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
    p_review.owner_id,
    p_review.page_id,
    p_event_name,
    'system',
    jsonb_build_object(
      'review_id', p_review.id,
      'rating', p_review.rating,
      'status', p_review.status,
      'verification_status', p_review.verification_status,
      'booking_id', p_review.booking_id,
      'order_id', p_review.order_id
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

CREATE OR REPLACE FUNCTION public.handle_review_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.emit_review_product_event('review_created', NEW);
    PERFORM public.enqueue_review_webhook_event('review.created', NEW);
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'published'
  THEN
    PERFORM public.emit_review_product_event('review_published', NEW);
    PERFORM public.enqueue_review_webhook_event('review.published', NEW);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_emit_events ON public.reviews;
CREATE TRIGGER reviews_emit_events
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_review_events();

CREATE OR REPLACE FUNCTION public.can_moderate_review(p_review_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reviews review
    WHERE review.id = p_review_id
      AND (
        review.owner_id = p_user_id
        OR public.is_admin(p_user_id)
        OR (
          review.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.organization_members member
            WHERE member.org_id = review.organization_id
              AND member.user_id = p_user_id
              AND member.role IN ('owner', 'admin', 'editor')
          )
        )
        OR (
          review.zone_id IS NOT NULL
          AND public.is_zone_admin(review.zone_id, p_user_id)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.create_review_for_booking(
  p_booking_id uuid,
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
  v_user_id uuid := auth.uid();
  v_booking record;
  v_review_id uuid;
  v_reviewer_name text;
  v_body text;
  v_title text;
  v_contact text;
  v_zone_id uuid;
  v_contact_email text;
  v_contact_phone text;
  v_booking_email text;
  v_booking_phone text;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_rating');
  END IF;

  SELECT
    booking.id,
    booking.page_id,
    booking.owner_id,
    booking.user_id,
    booking.staff_id,
    booking.status,
    booking.completed_at,
    booking.client_name,
    booking.client_email,
    booking.client_phone,
    page.organization_id,
    page.is_published
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

  v_contact_email := lower(NULLIF(btrim(COALESCE(p_reviewer_contact, '')), ''));
  v_contact_phone := NULLIF(regexp_replace(COALESCE(p_reviewer_contact, ''), '[^0-9]+', '', 'g'), '');
  v_booking_email := lower(NULLIF(btrim(COALESCE(v_booking.client_email, '')), ''));
  v_booking_phone := NULLIF(regexp_replace(COALESCE(v_booking.client_phone, ''), '[^0-9]+', '', 'g'), '');

  IF v_user_id IS NULL OR v_booking.user_id IS DISTINCT FROM v_user_id THEN
    IF (
      v_contact_email IS NULL
      OR v_booking_email IS NULL
      OR v_contact_email <> v_booking_email
    )
    AND (
      v_contact_phone IS NULL
      OR v_booking_phone IS NULL
      OR v_contact_phone <> v_booking_phone
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'contact_verification_required');
    END IF;
  END IF;

  v_reviewer_name := NULLIF(btrim(COALESCE(p_reviewer_display_name, v_booking.client_name)), '');
  v_body := NULLIF(btrim(COALESCE(p_body, '')), '');
  v_title := NULLIF(btrim(COALESCE(p_title, '')), '');
  v_contact := COALESCE(p_reviewer_contact, v_booking.client_email, v_booking.client_phone);
  v_zone_id := public.resolve_page_zone_id(v_booking.page_id);

  IF v_reviewer_name IS NULL OR char_length(v_reviewer_name) > 120 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_reviewer_name');
  END IF;

  IF v_body IS NOT NULL AND char_length(v_body) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'body_too_long');
  END IF;

  IF v_title IS NOT NULL AND char_length(v_title) > 160 THEN
    RETURN jsonb_build_object('success', false, 'error', 'title_too_long');
  END IF;

  INSERT INTO public.reviews (
    page_id,
    owner_id,
    organization_id,
    zone_id,
    booking_id,
    staff_id,
    rating,
    title,
    body,
    reviewer_display_name,
    reviewer_contact_hash,
    source,
    verification_status,
    metadata
  )
  VALUES (
    v_booking.page_id,
    v_booking.owner_id,
    v_booking.organization_id,
    v_zone_id,
    v_booking.id,
    v_booking.staff_id,
    p_rating,
    v_title,
    v_body,
    v_reviewer_name,
    public.hash_review_contact(v_contact),
    'booking',
    'verified_booking',
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_review_id;

  RETURN jsonb_build_object(
    'success', true,
    'review', jsonb_build_object(
      'id', v_review_id,
      'status', 'pending',
      'rating', p_rating,
      'verification_status', 'verified_booking'
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'review_already_exists');
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_review(
  p_review_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_review public.reviews%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  IF p_status NOT IN ('published', 'hidden', 'rejected', 'flagged') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  IF NOT public.can_moderate_review(p_review_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_allowed');
  END IF;

  UPDATE public.reviews
  SET status = p_status,
      moderation_reason = NULLIF(btrim(COALESCE(p_reason, '')), ''),
      published_at = CASE
        WHEN p_status = 'published' THEN COALESCE(published_at, now())
        ELSE published_at
      END,
      hidden_at = CASE
        WHEN p_status IN ('hidden', 'rejected', 'flagged') THEN now()
        ELSE hidden_at
      END,
      updated_at = now()
  WHERE id = p_review_id
  RETURNING * INTO v_review;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'review_not_found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'review', jsonb_build_object(
      'id', v_review.id,
      'status', v_review.status,
      'published_at', v_review.published_at,
      'hidden_at', v_review.hidden_at
    )
  );
END;
$$;

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.page_review_summaries TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_review_for_booking(uuid, integer, text, text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_review(uuid, text, text) TO authenticated;

COMMENT ON TABLE public.reviews IS 'Verified post-service reviews tied to real bookings/orders; static testimonial blocks remain separate editable content.';
COMMENT ON TABLE public.page_review_summaries IS 'Public-safe aggregate rating summaries for pages and expert discovery.';
COMMENT ON FUNCTION public.create_review_for_booking IS 'Creates one pending verified review for a completed booking after authenticated customer ownership or booking contact proof.';
COMMENT ON FUNCTION public.moderate_review IS 'Moderates review publication for page owners and workspace admins.';
