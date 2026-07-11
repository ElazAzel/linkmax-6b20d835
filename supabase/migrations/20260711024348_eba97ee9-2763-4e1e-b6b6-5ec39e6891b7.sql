CREATE OR REPLACE FUNCTION public.get_zone_automations_admin(p_zone_id uuid)
RETURNS TABLE (
  id uuid,
  zone_id uuid,
  trigger_type text,
  action_type text,
  is_active boolean,
  name text,
  config jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_zone_admin(p_zone_id, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT a.id, a.zone_id, a.trigger_type, a.action_type, a.is_active,
         a.name, a.config, a.created_at, a.updated_at
  FROM public.zone_automations a
  WHERE a.zone_id = p_zone_id
  ORDER BY a.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_automations_admin(uuid) TO authenticated;

-- Allow zone admins to update name/config through the Data API by extending
-- column-level privileges. RLS still restricts to admins via existing policies.
GRANT UPDATE (name, config, trigger_type, action_type, is_active) ON public.zone_automations TO authenticated;
GRANT INSERT (zone_id, name, config, trigger_type, action_type, is_active) ON public.zone_automations TO authenticated;