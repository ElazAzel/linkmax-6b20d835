
-- Function to accept a zone invitation
CREATE OR REPLACE FUNCTION public.accept_zone_invite(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_user_id uuid := auth.uid();
  v_zone_id uuid;
BEGIN
  -- 1. Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 2. Find the invite
  SELECT * INTO v_invite
  FROM public.zone_invites
  WHERE token = p_token AND status = 'pending' AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  v_zone_id := v_invite.zone_id;

  -- 3. Check if already a member
  IF EXISTS (SELECT 1 FROM public.zone_members WHERE zone_id = v_zone_id AND user_id = v_user_id) THEN
    -- If already a member, just mark invite as accepted
    UPDATE public.zone_invites SET status = 'accepted' WHERE id = v_invite.id;
    RETURN json_build_object('success', true, 'zone_id', v_zone_id, 'message', 'Already a member');
  END IF;

  -- 4. Create membership
  INSERT INTO public.zone_members (zone_id, user_id, role, status)
  VALUES (v_zone_id, v_user_id, v_invite.role, 'active');

  -- 5. Mark invite as accepted
  UPDATE public.zone_invites SET status = 'accepted' WHERE id = v_invite.id;

  -- 6. Log activity
  INSERT INTO public.zone_audit_log (zone_id, actor_user_id, action, entity_type, entity_id, metadata_json)
  VALUES (v_zone_id, v_user_id, 'invite_accepted', 'member', v_user_id, json_build_object('email', v_invite.email));

  RETURN json_build_object('success', true, 'zone_id', v_zone_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
