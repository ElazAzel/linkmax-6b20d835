-- Staff roster tables (were referenced by the app but missing) with scoped access
CREATE TABLE IF NOT EXISTS public.zone_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  avatar_url text,
  bio text,
  specialization text,
  is_active boolean NOT NULL DEFAULT true,
  gcal_sync_enabled boolean NOT NULL DEFAULT false,
  gcal_calendar_id text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zone_staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.zone_staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_zone_staff_zone ON public.zone_staff(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_staff_availability_staff ON public.zone_staff_availability(staff_id);

GRANT SELECT ON public.zone_staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_staff TO authenticated;
GRANT ALL ON public.zone_staff TO service_role;
GRANT SELECT ON public.zone_staff_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_staff_availability TO authenticated;
GRANT ALL ON public.zone_staff_availability TO service_role;

ALTER TABLE public.zone_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_staff_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view staff for public bookings" ON public.zone_staff;
DROP POLICY IF EXISTS "Anyone can view availability" ON public.zone_staff_availability;

-- Public visibility only for active staff of zones that have a published page
CREATE POLICY "Public can view active staff of published pages"
ON public.zone_staff FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.organization_id = zone_staff.zone_id
      AND p.is_published = true
  )
);

CREATE POLICY "Zone members can view staff"
ON public.zone_staff FOR SELECT
TO authenticated
USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can manage staff"
ON public.zone_staff FOR ALL
TO authenticated
USING (public.is_zone_admin(zone_id, auth.uid()))
WITH CHECK (public.is_zone_admin(zone_id, auth.uid()));

CREATE POLICY "Public can view availability of published staff"
ON public.zone_staff_availability FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.zone_staff s
    JOIN public.pages p ON p.organization_id = s.zone_id AND p.is_published = true
    WHERE s.id = zone_staff_availability.staff_id AND s.is_active = true
  )
);

CREATE POLICY "Zone admins can manage availability"
ON public.zone_staff_availability FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.zone_staff s WHERE s.id = zone_staff_availability.staff_id AND public.is_zone_admin(s.zone_id, auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.zone_staff s WHERE s.id = zone_staff_availability.staff_id AND public.is_zone_admin(s.zone_id, auth.uid())));

DROP TRIGGER IF EXISTS update_zone_staff_updated_at ON public.zone_staff;
CREATE TRIGGER update_zone_staff_updated_at
BEFORE UPDATE ON public.zone_staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();