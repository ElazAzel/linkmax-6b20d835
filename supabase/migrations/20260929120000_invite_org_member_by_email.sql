-- Team invites looked the invitee up with user_profiles.username = <email>,
-- which never matches (usernames are handles, not emails), so every invite
-- failed with "user not found". Emails live in auth.users, which clients
-- cannot read; this function resolves the email server-side after checking
-- that the caller owns (or administers) the organization.
CREATE OR REPLACE FUNCTION public.invite_org_member_by_email(
  p_org_id uuid,
  p_email text,
  p_role text DEFAULT 'viewer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_user_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = p_org_id AND o.owner_id = v_caller
  ) AND NOT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.org_id = p_org_id AND m.user_id = v_caller AND m.role IN ('owner', 'admin')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.org_id = p_org_id AND m.user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_member');
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (p_org_id, v_user_id, p_role);

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.invite_org_member_by_email(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_org_member_by_email(uuid, text, text) TO authenticated;
