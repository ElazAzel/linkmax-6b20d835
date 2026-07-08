ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS staff_id UUID NULL;
CREATE INDEX IF NOT EXISTS idx_booking_slots_staff_id ON public.booking_slots(staff_id);