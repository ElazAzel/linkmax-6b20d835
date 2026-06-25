-- 1. Update blocks type check to include 'event'
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type = ANY (ARRAY[
  'profile', 'link', 'button', 'socials', 'text', 'image', 'product', 'video', 
  'carousel', 'search', 'custom_code', 'messenger', 'form', 'download', 
  'newsletter', 'testimonial', 'scratch', 'map', 'avatar', 'separator', 
  'catalog', 'before_after', 'faq', 'countdown', 'pricing', 'shoutout', 
  'booking', 'community', 'event'
]));

-- 2. Create events table for event blocks
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title_i18n_json JSONB NOT NULL DEFAULT '{}',
  description_i18n_json JSONB DEFAULT '{}',
  cover_url TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  timezone TEXT,
  registration_closes_at TIMESTAMPTZ,
  location_type TEXT,
  location_value TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  price_amount NUMERIC,
  currency TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  form_schema_json JSONB DEFAULT '[]',
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies: owners can manage their events
CREATE POLICY "Event owners can manage events"
ON public.events FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Public can view published events
CREATE POLICY "Public can view published events"
ON public.events FOR SELECT
USING (status = 'published');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_owner ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_page ON public.events(page_id);
CREATE INDEX IF NOT EXISTS idx_events_block ON public.events(block_id);

-- 3. Create event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  user_id UUID,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  answers_json JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, attendee_email)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies: owners can view their event registrations
CREATE POLICY "Event owners can manage registrations"
ON public.event_registrations FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Anyone can register for events (insert)
CREATE POLICY "Anyone can register for events"
ON public.event_registrations FOR INSERT
WITH CHECK (true);

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
ON public.event_registrations FOR SELECT
USING (user_id = auth.uid() OR attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_owner ON public.event_registrations(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);

-- 4. Create event_tickets table
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'valid',
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Ticket owners can view tickets"
ON public.event_tickets FOR SELECT
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations 
    WHERE owner_id = auth.uid() OR user_id = auth.uid()
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_event_tickets_registration ON public.event_tickets(registration_id);

-- Function to generate ticket code on registration
CREATE OR REPLACE FUNCTION public.generate_event_ticket()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.event_tickets (registration_id, ticket_code)
    VALUES (NEW.id, 'TKT-' || upper(substring(md5(random()::text) from 1 for 8)))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_ticket ON public.event_registrations;
CREATE TRIGGER trigger_generate_ticket
AFTER INSERT OR UPDATE OF status ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_event_ticket();