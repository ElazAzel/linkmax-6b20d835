-- Phase 47.2: Wire review request links into existing CRM automations.
-- Extends current automation logs and existing review request RPC for server-side workers.

ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.automation_logs
  ALTER COLUMN lead_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'automation_logs_target_check'
      AND conrelid = 'public.automation_logs'::regclass
  ) THEN
    ALTER TABLE public.automation_logs
      ADD CONSTRAINT automation_logs_target_check
      CHECK (lead_id IS NOT NULL OR booking_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_logs_booking_id
  ON public.automation_logs(booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_booking
  ON public.automation_logs(automation_id, booking_id)
  WHERE booking_id IS NOT NULL;

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
  v_caller_role text := COALESCE(auth.role(), current_setting('request.jwt.claim.role', true), '');
  v_booking record;
  v_request public.review_requests%ROWTYPE;
  v_raw_token text;
  v_token_hash text;
  v_expires_at timestamptz;
  v_zone_id uuid;
BEGIN
  IF v_user_id IS NULL AND v_caller_role <> 'service_role' THEN
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

  IF v_caller_role <> 'service_role' AND NOT public.can_manage_page_review_requests(v_booking.page_id, v_user_id) THEN
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

GRANT EXECUTE ON FUNCTION public.create_booking_review_request(uuid, interval, jsonb) TO authenticated, service_role;

COMMENT ON COLUMN public.automation_logs.booking_id IS 'Optional booking target for booking-based CRM automations such as verified review request links.';
COMMENT ON FUNCTION public.create_booking_review_request IS 'Creates or rotates a pending review request token for a completed booking; callable by owners and service-role automation workers.';
