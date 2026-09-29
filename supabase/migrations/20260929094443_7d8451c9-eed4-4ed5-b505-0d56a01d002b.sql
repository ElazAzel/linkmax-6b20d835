ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.zone_staff(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.zone_resources(id) ON DELETE SET NULL;
ALTER TABLE public.zone_resources ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.zone_resources ADD COLUMN IF NOT EXISTS description text;
CREATE INDEX IF NOT EXISTS idx_bookings_staff_slot ON public.bookings(page_id, slot_date, slot_time, staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_slot ON public.bookings(slot_date, slot_time, resource_id);