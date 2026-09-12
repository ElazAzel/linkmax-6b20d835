-- EPIC: Phase 19 - Advanced Booking & Multi-Staff Support

-- 1. Create Specialist Profiles table
CREATE TABLE IF NOT EXISTS public.zone_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    specialization TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Google Calendar Integration (per staff)
    gcal_sync_enabled BOOLEAN NOT NULL DEFAULT false,
    gcal_calendar_id TEXT NOT NULL DEFAULT 'primary',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Staff Availability table
CREATE TABLE IF NOT EXISTS public.zone_staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.zone_staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_id, day_of_week, start_time)
);

-- 3. Update bookings and slots
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.zone_staff(id) ON DELETE SET NULL;
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.zone_staff(id) ON DELETE CASCADE;

-- 4. Migration Helper: Create default staff for existing zones and link existing bookings
DO $$
DECLARE
    z RECORD;
    new_staff_id UUID;
    owner_profile RECORD;
BEGIN
    FOR z IN SELECT id, owner_id FROM public.organizations LOOP
        -- Fetch owner name from user_metadata or profiles
        SELECT raw_user_meta_data->>'display_name' as name, raw_user_meta_data->>'avatar_url' as avatar 
        INTO owner_profile 
        FROM auth.users 
        WHERE id = z.owner_id;

        -- Create staff entry
        INSERT INTO public.zone_staff (zone_id, user_id, name, avatar_url, is_active)
        VALUES (z.id, z.owner_id, COALESCE(owner_profile.name, 'Default Specialist'), owner_profile.avatar, true)
        RETURNING id INTO new_staff_id;

        -- Link existing bookings for pages in this zone
        UPDATE public.bookings
        SET staff_id = new_staff_id
        WHERE page_id IN (SELECT id FROM public.pages WHERE organization_id = z.id)
        AND staff_id IS NULL;

        -- Link existing slots
        UPDATE public.booking_slots
        SET staff_id = new_staff_id
        WHERE page_id IN (SELECT id FROM public.pages WHERE organization_id = z.id)
        AND staff_id IS NULL;
    END LOOP;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_zone_staff_zone ON public.zone_staff(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_staff_user ON public.zone_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_zone_staff_availability_staff ON public.zone_staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff ON public.bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_staff ON public.booking_slots(staff_id);

-- 6. RLS Policies

-- Zone Staff
ALTER TABLE public.zone_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staff for public bookings"
ON public.zone_staff FOR SELECT
USING (true); -- Publicly visible to allow selection during booking

CREATE POLICY "Admins can manage zone staff"
ON public.zone_staff FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE org_id = public.zone_staff.zone_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
);

-- Staff Availability
ALTER TABLE public.zone_staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
ON public.zone_staff_availability FOR SELECT
USING (true);

CREATE POLICY "Admins can manage availability"
ON public.zone_staff_availability FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.zone_staff
        JOIN public.organization_members ON organization_members.org_id = zone_staff.zone_id
        WHERE zone_staff.id = public.zone_staff_availability.staff_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin', 'editor')
    )
);

-- 7. Triggers for updated_at
CREATE TRIGGER update_zone_staff_updated_at
BEFORE UPDATE ON public.zone_staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
