
-- Fix 1: Replace overly permissive zone_invites SELECT policy
DROP POLICY IF EXISTS "Anyone can read invites by token" ON public.zone_invites;

-- Restricted: zone admins can list invites, authenticated users can see invites for their email
CREATE POLICY "Zone admins can view invites"
ON public.zone_invites FOR SELECT
TO authenticated
USING (public.is_zone_admin(zone_id, auth.uid()));

CREATE POLICY "Users can view invites for their email"
ON public.zone_invites FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = email);

-- RPC for public invite lookup by token (used on AcceptInvite page before auth)
CREATE OR REPLACE FUNCTION public.get_zone_invite_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
BEGIN
  SELECT zi.id, zi.zone_id, zi.email, zi.role, zi.status, zi.expires_at,
         z.name as zone_name, z.logo_url as zone_logo_url
  INTO v_invite
  FROM public.zone_invites zi
  JOIN public.zones z ON z.id = zi.zone_id
  WHERE zi.token = p_token
    AND zi.status = 'pending'
    AND zi.expires_at > now();

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_invite.id,
    'zone_id', v_invite.zone_id,
    'email', v_invite.email,
    'role', v_invite.role,
    'status', v_invite.status,
    'expires_at', v_invite.expires_at,
    'zones', jsonb_build_object(
      'name', v_invite.zone_name,
      'logo_url', v_invite.zone_logo_url
    )
  );
END;
$$;
