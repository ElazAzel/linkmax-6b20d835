ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS organizer_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS attendee_email_sent_at timestamptz;