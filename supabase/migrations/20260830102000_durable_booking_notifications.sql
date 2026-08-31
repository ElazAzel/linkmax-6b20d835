-- Durable notification outbox for booking lifecycle messages.

ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_notification_queue_due
  ON public.notification_queue (scheduled_at, created_at)
  WHERE status IN ('pending', 'processing');

CREATE TABLE public.notification_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES public.notification_queue(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('delivered', 'failed')),
  recipient_role text NOT NULL CHECK (recipient_role IN ('owner', 'staff', 'customer')),
  channel text NOT NULL CHECK (channel IN ('telegram', 'email')),
  template_key text NOT NULL,
  error_code text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (queue_id, event_kind)
);

ALTER TABLE public.notification_delivery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages notification delivery events"
ON public.notification_delivery_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.claim_notification_batch(p_limit integer DEFAULT 10)
RETURNS SETOF public.notification_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_revenue_service_role() THEN
    RAISE EXCEPTION 'notification_claim_not_allowed' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT queue.id
    FROM public.notification_queue queue
    WHERE queue.scheduled_at <= now()
      AND (
        queue.status = 'pending'
        OR (
          queue.status = 'processing'
          AND queue.locked_at < now() - interval '10 minutes'
        )
      )
    ORDER BY queue.scheduled_at, queue.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50)
  )
  UPDATE public.notification_queue queue
  SET status = 'processing',
      locked_at = now()
  FROM due
  WHERE queue.id = due.id
  RETURNING queue.*;
END;
$$;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.notification_delivery_events
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.notification_delivery_events TO service_role;

REVOKE ALL ON FUNCTION public.claim_notification_batch(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_batch(integer) TO service_role;
