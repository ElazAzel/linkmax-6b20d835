DROP POLICY IF EXISTS "Public can view active staff of published pages" ON public.zone_staff;

CREATE OR REPLACE FUNCTION public.get_public_zone_staff(p_zone_id uuid)
RETURNS TABLE (
  id uuid,
  zone_id uuid,
  name text,
  avatar_url text,
  bio text,
  specialization text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.zone_id, s.name, s.avatar_url, s.bio, s.specialization, s.is_active
  FROM public.zone_staff s
  WHERE s.zone_id = p_zone_id
    AND s.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.organization_id = s.zone_id
        AND p.is_published = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_zone_staff(uuid) TO anon, authenticated;