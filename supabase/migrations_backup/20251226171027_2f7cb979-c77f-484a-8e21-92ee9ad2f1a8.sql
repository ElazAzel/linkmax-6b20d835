-- Create bookings table for booking block functionality
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  
  -- Booking slot data
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  slot_end_time TIME,
  
  -- Booking details
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  cancelled_by TEXT CHECK (cancelled_by IN ('owner', 'client', NULL)),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking slots table for defining available time slots
CREATE TABLE public.booking_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Slot configuration
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Optional specific date override
  specific_date DATE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_bookings_page_block ON public.bookings(page_id, block_id);
CREATE INDEX idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX idx_bookings_slot ON public.bookings(slot_date, slot_time);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_booking_slots_page_block ON public.booking_slots(page_id, block_id);
CREATE INDEX idx_booking_slots_owner ON public.booking_slots(owner_id);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings

-- Anyone can view bookings for a page (to see occupied slots)
CREATE POLICY "Anyone can view bookings for public pages"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = bookings.page_id 
    AND pages.is_published = true
  )
);

-- Owners can view all their bookings
CREATE POLICY "Owners can view all their bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = owner_id);

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can create a booking (for public pages)
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

-- Owners can update all their bookings
CREATE POLICY "Owners can update their bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = owner_id);

-- Users can update their own bookings (only cancel)
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Owners can delete bookings
CREATE POLICY "Owners can delete bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for booking_slots

-- Anyone can view slots for public pages
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

-- Owners can manage their slots
CREATE POLICY "Owners can manage their slots"
ON public.booking_slots
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Update timestamp trigger
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();