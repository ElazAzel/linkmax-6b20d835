-- Webhooks V2 foundation: API scopes, endpoint registry, secrets, queue, deliveries.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_allowed_webhook_event_type(p_event_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
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
    'form.submitted'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.are_allowed_webhook_event_types(p_event_types text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(bool_and(public.is_allowed_webhook_event_type(event_type)), false)
  FROM unnest(p_event_types) AS event_type;
$$;

CREATE OR REPLACE FUNCTION public.are_allowed_api_scopes(p_scopes text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_scopes <@ ARRAY[
      'leads:read',
      'leads:write',
      'bookings:read',
      'bookings:write',
      'pages:read',
      'analytics:read',
      'webhooks:manage'
    ]::text[],
    false
  );
$$;

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS key_prefix text,
  ADD COLUMN IF NOT EXISTS key_hint text,
  ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT ARRAY[
    'leads:read',
    'leads:write',
    'bookings:read',
    'bookings:write',
    'pages:read',
    'analytics:read',
    'webhooks:manage'
  ]::text[],
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS rate_limit_per_minute integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.api_keys
SET
  name = COALESCE(name, 'API key'),
  key_prefix = COALESCE(key_prefix, key_hint, left(key_hash, 16)),
  key_hint = COALESCE(key_hint, key_prefix, left(key_hash, 16)),
  scopes = COALESCE(scopes, ARRAY[
    'leads:read',
    'leads:write',
    'bookings:read',
    'bookings:write',
    'pages:read',
    'analytics:read',
    'webhooks:manage'
  ]::text[])
WHERE name IS NULL OR key_prefix IS NULL OR key_hint IS NULL OR scopes IS NULL;

ALTER TABLE public.api_keys
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN key_prefix SET NOT NULL,
  ALTER COLUMN key_hash SET DATA TYPE text,
  ALTER COLUMN key_hash SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_scopes_allowed_check'
  ) THEN
    ALTER TABLE public.api_keys
      ADD CONSTRAINT api_keys_scopes_allowed_check
      CHECK (public.are_allowed_api_scopes(scopes));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_rate_limit_check'
  ) THEN
    ALTER TABLE public.api_keys
      ADD CONSTRAINT api_keys_rate_limit_check
      CHECK (rate_limit_per_minute BETWEEN 1 AND 600);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash
  ON public.api_keys (key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_active
  ON public.api_keys (user_id, is_active)
  WHERE is_active = true AND revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
CREATE POLICY "Users can view own api keys"
ON public.api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own api keys" ON public.api_keys;
CREATE POLICY "Users can delete own api keys"
ON public.api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_url text NOT NULL,
  event_types text[] NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'rotating_secret')),
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  disabled_at timestamptz,
  disabled_reason text,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_endpoints_target_url_https_check
    CHECK (target_url ~* '^https://'),
  CONSTRAINT webhook_endpoints_event_types_not_empty_check
    CHECK (cardinality(event_types) > 0),
  CONSTRAINT webhook_endpoints_event_types_allowed_check
    CHECK (public.are_allowed_webhook_event_types(event_types))
);

CREATE TABLE IF NOT EXISTS public.webhook_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  secret text NOT NULL,
  secret_hint text NOT NULL,
  status text NOT NULL DEFAULT 'current'
    CHECK (status IN ('current', 'previous', 'revoked')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_event_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (public.is_allowed_webhook_event_type(event_type)),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.zones(id) ON DELETE CASCADE,
  source_table text,
  source_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL UNIQUE,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_queue_id uuid NOT NULL REFERENCES public.webhook_event_queue(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  request_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status integer,
  response_body_preview text,
  error_message text,
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_active
  ON public.webhook_endpoints (user_id, is_active, status);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_zone_active
  ON public.webhook_endpoints (zone_id, is_active, status)
  WHERE zone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_event_types
  ON public.webhook_endpoints USING gin (event_types);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_secrets_current
  ON public.webhook_secrets (endpoint_id)
  WHERE status = 'current';

CREATE INDEX IF NOT EXISTS idx_webhook_event_queue_pending
  ON public.webhook_event_queue (status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_webhook_event_queue_user_time
  ON public.webhook_event_queue (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint_time
  ON public.webhook_deliveries (endpoint_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_queue_time
  ON public.webhook_deliveries (event_queue_id, created_at DESC);

DROP TRIGGER IF EXISTS update_webhook_endpoints_updated_at ON public.webhook_endpoints;
CREATE TRIGGER update_webhook_endpoints_updated_at
BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_event_queue_updated_at ON public.webhook_event_queue;
CREATE TRIGGER update_webhook_event_queue_updated_at
BEFORE UPDATE ON public.webhook_event_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own webhook endpoints" ON public.webhook_endpoints;
CREATE POLICY "Users can view own webhook endpoints"
ON public.webhook_endpoints
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (zone_id IS NOT NULL AND public.is_zone_admin(zone_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can manage own webhook endpoints" ON public.webhook_endpoints;
CREATE POLICY "Users can manage own webhook endpoints"
ON public.webhook_endpoints
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR (zone_id IS NOT NULL AND public.is_zone_admin(zone_id, auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
  AND (zone_id IS NULL OR public.is_zone_admin(zone_id, auth.uid()))
);

DROP POLICY IF EXISTS "Service role manages webhook secrets" ON public.webhook_secrets;
CREATE POLICY "Service role manages webhook secrets"
ON public.webhook_secrets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own webhook queue" ON public.webhook_event_queue;
CREATE POLICY "Users can view own webhook queue"
ON public.webhook_event_queue
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (zone_id IS NOT NULL AND public.is_zone_admin(zone_id, auth.uid()))
);

DROP POLICY IF EXISTS "Service role manages webhook queue" ON public.webhook_event_queue;
CREATE POLICY "Service role manages webhook queue"
ON public.webhook_event_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Users can view own webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.webhook_endpoints endpoint
    WHERE endpoint.id = webhook_deliveries.endpoint_id
      AND (
        endpoint.user_id = auth.uid()
        OR (
          endpoint.zone_id IS NOT NULL
          AND public.is_zone_admin(endpoint.zone_id, auth.uid())
        )
      )
  )
);

DROP POLICY IF EXISTS "Service role manages webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Service role manages webhook deliveries"
ON public.webhook_deliveries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.generate_user_api_key(
  key_name text,
  requested_scopes text[] DEFAULT ARRAY[
    'leads:read',
    'leads:write',
    'bookings:read',
    'bookings:write',
    'pages:read',
    'analytics:read',
    'webhooks:manage'
  ]::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_raw_key text;
  v_key_hash text;
  v_key_prefix text;
  v_key_row public.api_keys%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF key_name IS NULL OR length(trim(key_name)) < 2 THEN
    RAISE EXCEPTION 'API key name is required';
  END IF;

  IF NOT public.are_allowed_api_scopes(requested_scopes) THEN
    RAISE EXCEPTION 'Invalid API key scope';
  END IF;

  IF (
    SELECT count(*)
    FROM public.api_keys
    WHERE user_id = v_user_id
      AND is_active = true
      AND revoked_at IS NULL
  ) >= 10 THEN
    RAISE EXCEPTION 'API key limit reached';
  END IF;

  v_raw_key := 'lk_live_' || encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');
  v_key_prefix := left(v_raw_key, 16);

  INSERT INTO public.api_keys (
    user_id,
    name,
    key_prefix,
    key_hint,
    key_hash,
    scopes
  )
  VALUES (
    v_user_id,
    trim(key_name),
    v_key_prefix,
    v_key_prefix,
    v_key_hash,
    requested_scopes
  )
  RETURNING * INTO v_key_row;

  RETURN jsonb_build_object(
    'key', v_raw_key,
    'details', jsonb_build_object(
      'id', v_key_row.id,
      'user_id', v_key_row.user_id,
      'name', v_key_row.name,
      'key_prefix', v_key_row.key_prefix,
      'created_at', v_key_row.created_at,
      'last_used_at', v_key_row.last_used_at,
      'expires_at', v_key_row.expires_at,
      'scopes', v_key_row.scopes
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user_api_key(
  p_api_key text,
  p_required_scope text DEFAULT NULL
)
RETURNS TABLE (
  key_id uuid,
  user_id uuid,
  scopes text[],
  rate_limit_per_minute integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_hash text;
  v_key public.api_keys%ROWTYPE;
BEGIN
  IF p_api_key IS NULL OR p_api_key !~ '^lk_live_[a-f0-9]{64}$' THEN
    RETURN;
  END IF;

  IF p_required_scope IS NOT NULL
    AND NOT public.are_allowed_api_scopes(ARRAY[p_required_scope]::text[]) THEN
    RETURN;
  END IF;

  v_hash := encode(digest(p_api_key, 'sha256'), 'hex');

  SELECT *
  INTO v_key
  FROM public.api_keys candidate
  WHERE candidate.key_hash = v_hash
    AND candidate.is_active = true
    AND candidate.revoked_at IS NULL
    AND (candidate.expires_at IS NULL OR candidate.expires_at > now())
  LIMIT 1;

  IF v_key.id IS NULL THEN
    RETURN;
  END IF;

  IF p_required_scope IS NOT NULL AND NOT (p_required_scope = ANY(v_key.scopes)) THEN
    RETURN;
  END IF;

  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE id = v_key.id;

  RETURN QUERY
  SELECT
    v_key.id,
    v_key.user_id,
    v_key.scopes,
    v_key.rate_limit_per_minute;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_webhook_endpoint(
  p_name text,
  p_target_url text,
  p_event_types text[],
  p_zone_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_endpoint public.webhook_endpoints%ROWTYPE;
  v_secret text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_zone_id IS NOT NULL AND NOT public.is_zone_admin(p_zone_id, v_user_id) THEN
    RAISE EXCEPTION 'Only zone admins can create zone webhooks';
  END IF;

  v_secret := 'whsec_' || encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.webhook_endpoints (
    user_id,
    zone_id,
    name,
    target_url,
    event_types
  )
  VALUES (
    v_user_id,
    p_zone_id,
    trim(p_name),
    trim(p_target_url),
    p_event_types
  )
  RETURNING * INTO v_endpoint;

  INSERT INTO public.webhook_secrets (
    endpoint_id,
    secret,
    secret_hint,
    status,
    created_by
  )
  VALUES (
    v_endpoint.id,
    v_secret,
    right(v_secret, 8),
    'current',
    v_user_id
  );

  RETURN jsonb_build_object(
    'endpoint', to_jsonb(v_endpoint),
    'signing_secret', v_secret
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_webhook_secret(p_endpoint_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_endpoint public.webhook_endpoints%ROWTYPE;
  v_secret text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_endpoint
  FROM public.webhook_endpoints endpoint
  WHERE endpoint.id = p_endpoint_id
    AND (
      endpoint.user_id = v_user_id
      OR (
        endpoint.zone_id IS NOT NULL
        AND public.is_zone_admin(endpoint.zone_id, v_user_id)
      )
    );

  IF v_endpoint.id IS NULL THEN
    RAISE EXCEPTION 'Webhook endpoint not found';
  END IF;

  v_secret := 'whsec_' || encode(gen_random_bytes(32), 'hex');

  UPDATE public.webhook_secrets
  SET status = 'previous', expires_at = now() + interval '30 days'
  WHERE endpoint_id = p_endpoint_id
    AND status = 'current';

  INSERT INTO public.webhook_secrets (
    endpoint_id,
    secret,
    secret_hint,
    status,
    created_by
  )
  VALUES (
    p_endpoint_id,
    v_secret,
    right(v_secret, 8),
    'current',
    v_user_id
  );

  UPDATE public.webhook_endpoints
  SET status = 'rotating_secret'
  WHERE id = p_endpoint_id;

  RETURN jsonb_build_object(
    'endpoint_id', p_endpoint_id,
    'signing_secret', v_secret
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_webhook_event(
  p_event_type text,
  p_user_id uuid,
  p_zone_id uuid DEFAULT NULL,
  p_source_table text DEFAULT NULL,
  p_source_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_idempotency_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_queue_id uuid;
  v_idempotency_key text;
BEGIN
  IF NOT public.is_allowed_webhook_event_type(p_event_type) THEN
    RAISE EXCEPTION 'Invalid webhook event type';
  END IF;

  v_idempotency_key := COALESCE(
    p_idempotency_key,
    p_event_type || ':' || COALESCE(p_source_table, 'system') || ':' || COALESCE(p_source_id::text, gen_random_uuid()::text)
  );

  INSERT INTO public.webhook_event_queue (
    event_type,
    user_id,
    zone_id,
    source_table,
    source_id,
    payload,
    idempotency_key
  )
  VALUES (
    p_event_type,
    p_user_id,
    p_zone_id,
    p_source_table,
    p_source_id,
    COALESCE(p_payload, '{}'::jsonb),
    v_idempotency_key
  )
  ON CONFLICT (idempotency_key) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_user_api_key(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_user_api_key(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_webhook_endpoint(text, text, text[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rotate_webhook_secret(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_webhook_event(text, uuid, uuid, text, uuid, jsonb, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.generate_user_api_key(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_api_key(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_webhook_endpoint(text, text, text[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_webhook_secret(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_webhook_event(text, uuid, uuid, text, uuid, jsonb, text) TO service_role;

COMMENT ON TABLE public.webhook_endpoints IS 'Webhooks V2 endpoint registry for account and zone-scoped outgoing product events.';
COMMENT ON TABLE public.webhook_secrets IS 'Generated HMAC signing secrets for Webhooks V2 endpoints. Ordinary clients receive secrets through create/rotate RPC responses.';
COMMENT ON TABLE public.webhook_event_queue IS 'Durable outbox queue for outgoing Webhooks V2 event delivery.';
COMMENT ON TABLE public.webhook_deliveries IS 'Per-endpoint delivery attempt log for outgoing Webhooks V2 events.';
COMMENT ON FUNCTION public.verify_user_api_key(text, text) IS 'Validates lk_live API keys by SHA-256 hash, checks optional scope, and updates last_used_at.';
