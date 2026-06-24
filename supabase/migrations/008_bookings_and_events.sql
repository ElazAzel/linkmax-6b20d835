BEGIN;

-- ==============================================
-- 008: BOOKINGS AND EVENTS
-- ==============================================

-- 1. Bookings tables
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  slot_end_time TIME,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  cancelled_by TEXT CHECK (cancelled_by IN ('owner', 'client')),
  timezone TEXT DEFAULT 'Asia/Almaty',
  staff_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  owner_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  specific_date DATE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  staff_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Events tables
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title_i18n_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_i18n_json JSONB DEFAULT '{}'::jsonb,
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
  form_schema_json JSONB DEFAULT '[]'::jsonb,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  answers_json JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'paid', 'failed', 'refunded')),
  paid_amount NUMERIC,
  currency TEXT,
  provider TEXT,
  provider_payment_id TEXT,
  utm_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, attendee_email)
);

CREATE TABLE IF NOT EXISTS public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  qr_payload TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_page_block ON public.bookings(page_id, block_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON public.bookings(slot_date, slot_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff ON public.bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_page_block ON public.booking_slots(page_id, block_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_owner ON public.booking_slots(owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_staff ON public.booking_slots(staff_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_double_booking
ON public.bookings (page_id, block_id, slot_date, slot_time)
WHERE status NOT IN ('cancelled', 'rejected');
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_block_id ON public.events(block_id);
CREATE INDEX IF NOT EXISTS idx_events_owner ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_page ON public.events(page_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_block ON public.events(block_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_owner ON public.event_registrations(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_owner_id ON public.event_registrations(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_utm ON public.event_registrations USING gin (utm_json);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON public.event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_registration ON public.event_tickets(registration_id);

-- 5. RLS Policies

-- Bookings SELECT
DROP POLICY IF EXISTS "Anyone can view bookings for public pages" ON public.bookings;
DROP POLICY IF EXISTS "Owner or customer can view bookings" ON public.bookings;
CREATE POLICY "Owner or customer can view bookings"
ON public.bookings FOR SELECT
USING (
  owner_id = auth.uid()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Owners can view all their bookings" ON public.bookings;
CREATE POLICY "Owners can view all their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Bookings INSERT
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pages
    WHERE pages.id = page_id
    AND pages.is_published = true
  )
);

-- Bookings UPDATE
DROP POLICY IF EXISTS "Owners can update their bookings" ON public.bookings;
CREATE POLICY "Owners can update their bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Bookings DELETE
DROP POLICY IF EXISTS "Owners can delete bookings" ON public.bookings;
CREATE POLICY "Owners can delete bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = owner_id);

-- booking_slots
DROP POLICY IF EXISTS "Anyone can view booking slots" ON public.booking_slots;
CREATE POLICY "Anyone can view booking slots"
ON public.booking_slots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pages
    WHERE pages.id = booking_slots.page_id
    AND pages.is_published = true
  )
  OR auth.uid() = owner_id
);

DROP POLICY IF EXISTS "Owners can manage their slots" ON public.booking_slots;
CREATE POLICY "Owners can manage their slots"
ON public.booking_slots
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Events SELECT
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
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

-- Events ALL (owner)
DROP POLICY IF EXISTS "Owners manage events" ON public.events;
CREATE POLICY "Owners manage events"
ON public.events
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Event owners can manage events" ON public.events;

-- event_registrations SELECT
DROP POLICY IF EXISTS "Event owners can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Attendees can view own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Owners can manage their event registrations" ON public.event_registrations;

CREATE POLICY "Owners can manage their event registrations"
ON public.event_registrations
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Attendees can view own registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- event_registrations INSERT
DROP POLICY IF EXISTS "Anyone can register for published events" ON public.event_registrations;
CREATE POLICY "Anyone can register for published events"
ON public.event_registrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id
    AND (status = 'published' OR owner_id = auth.uid())
  )
);

-- event_registrations UPDATE
DROP POLICY IF EXISTS "Owners can update registrations" ON public.event_registrations;
CREATE POLICY "Owners can update registrations"
ON public.event_registrations
FOR UPDATE
USING (auth.uid() = owner_id);

-- event_tickets SELECT
DROP POLICY IF EXISTS "Owners can view tickets for their events" ON public.event_tickets;
DROP POLICY IF EXISTS "Event participants can view tickets" ON public.event_tickets;

CREATE POLICY "Owners can view tickets for their events"
ON public.event_tickets
FOR SELECT
TO authenticated
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations
    WHERE owner_id = auth.uid()
  )
);

-- event_tickets UPDATE
DROP POLICY IF EXISTS "Owners can update tickets for their events" ON public.event_tickets;
CREATE POLICY "Owners can update tickets for their events"
ON public.event_tickets
FOR UPDATE
TO authenticated
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  registration_id IN (
    SELECT id FROM public.event_registrations
    WHERE owner_id = auth.uid()
  )
);

-- 6. Functions

-- get_event_registration_count
CREATE OR REPLACE FUNCTION public.get_event_registration_count(p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.event_registrations
  WHERE event_id = p_event_id
    AND status IN ('confirmed', 'pending')
$$;

-- check_email_registered_for_event
CREATE OR REPLACE FUNCTION public.check_email_registered_for_event(
  p_event_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_registrations
    WHERE event_id = p_event_id
      AND attendee_email = p_email
      AND status != 'cancelled'
  )
$$;

-- create_event_ticket (trigger function)
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

-- generate_event_ticket (alternative trigger for status changes)
CREATE OR REPLACE FUNCTION public.generate_event_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status <> 'confirmed') THEN
    INSERT INTO public.event_tickets (registration_id, ticket_code)
    VALUES (NEW.id, 'TKT-' || upper(substring(md5(random()::text) from 1 for 8)))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Triggers

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS create_event_ticket_on_registration ON public.event_registrations;
CREATE TRIGGER create_event_ticket_on_registration
AFTER INSERT ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.create_event_ticket();

DROP TRIGGER IF EXISTS trigger_generate_ticket ON public.event_registrations;
DROP TRIGGER IF EXISTS trg_generate_event_ticket ON public.event_registrations;
CREATE TRIGGER trg_generate_event_ticket
AFTER INSERT OR UPDATE OF status ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_event_ticket();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
