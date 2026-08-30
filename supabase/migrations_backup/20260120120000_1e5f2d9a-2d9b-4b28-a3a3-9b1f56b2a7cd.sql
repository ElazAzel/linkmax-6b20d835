-- Event block core tables
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title_i18n_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_i18n_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_url TEXT,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT,
  registration_closes_at TIMESTAMP WITH TIME ZONE,
  location_type TEXT CHECK (location_type IN ('online', 'offline')),
  location_value TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  price_amount NUMERIC,
  currency TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  form_schema_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_events_block_id ON public.events(block_id);
CREATE INDEX idx_events_owner ON public.events(owner_id);
CREATE INDEX idx_events_page ON public.events(page_id);
CREATE INDEX idx_events_status ON public.events(status);

CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'paid', 'failed', 'refunded')),
  paid_amount NUMERIC,
  currency TEXT,
  provider TEXT,
  provider_payment_id TEXT,
  utm_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, attendee_email)
);

CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_owner ON public.event_registrations(owner_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);

CREATE TABLE public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  qr_payload TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_tickets_event ON public.event_tickets(event_id);
CREATE INDEX idx_event_tickets_registration ON public.event_tickets(registration_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Public can view published events"
ON public.events
FOR SELECT
USING (
  (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = events.page_id
      AND p.is_published = true
    )
  )
  OR auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners manage events"
ON public.events
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Event registrations policies
CREATE POLICY "Owners can view registrations"
ON public.event_registrations
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their registrations"
ON public.event_registrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.pages p ON p.id = e.page_id
    WHERE e.id = event_registrations.event_id
    AND e.status = 'published'
    AND p.is_published = true
    AND (e.registration_closes_at IS NULL OR e.registration_closes_at > now())
    AND e.owner_id = event_registrations.owner_id
    AND e.page_id = event_registrations.page_id
    AND e.block_id = event_registrations.block_id
  )
);

CREATE POLICY "Owners can update registrations"
ON public.event_registrations
FOR UPDATE
USING (auth.uid() = owner_id);

-- Event tickets policies
CREATE POLICY "Owners can view tickets"
ON public.event_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.id = event_tickets.registration_id
    AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view their tickets"
ON public.event_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.id = event_tickets.registration_id
    AND r.user_id = auth.uid()
  )
);

-- Ticket creation trigger
CREATE OR REPLACE FUNCTION public.create_event_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
BEGIN
  INSERT INTO public.event_tickets (registration_id, event_id, ticket_code, status)
  VALUES (NEW.id, NEW.event_id, new_code, 'valid');
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_event_ticket_on_registration
AFTER INSERT ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.create_event_ticket();

-- Update timestamps
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
