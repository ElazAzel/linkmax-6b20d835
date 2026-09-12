
-- Create accept_zone_invite RPC function
CREATE OR REPLACE FUNCTION public.accept_zone_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite RECORD;
  v_user_id uuid := auth.uid();
  v_existing BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Find the invite
  SELECT * INTO v_invite FROM public.zone_invites
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invite_not_found_or_expired');
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM public.zone_members WHERE zone_id = v_invite.zone_id AND user_id = v_user_id
  ) INTO v_existing;

  IF v_existing THEN
    -- Update invite status anyway
    UPDATE public.zone_invites SET status = 'accepted' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', true, 'already_member', true);
  END IF;

  -- Check member limit
  DECLARE
    v_current_count INTEGER;
    v_limit INTEGER;
    v_plan_code TEXT;
  BEGIN
    SELECT plan_code INTO v_plan_code FROM public.zones WHERE id = v_invite.zone_id;
    v_limit := public.get_zone_member_limit(v_plan_code);
    SELECT COUNT(*) INTO v_current_count FROM public.zone_members WHERE zone_id = v_invite.zone_id AND status = 'active';
    
    IF v_current_count >= v_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'member_limit_reached');
    END IF;
  END;

  -- Add member
  INSERT INTO public.zone_members (zone_id, user_id, role, status)
  VALUES (v_invite.zone_id, v_user_id, v_invite.role, 'active');

  -- Update invite status
  UPDATE public.zone_invites SET status = 'accepted' WHERE id = v_invite.id;

  -- Audit log
  INSERT INTO public.zone_audit_log (zone_id, actor_user_id, action, entity_type, entity_id)
  VALUES (v_invite.zone_id, v_user_id, 'member_joined', 'zone_member', v_user_id);

  RETURN jsonb_build_object('success', true, 'zone_id', v_invite.zone_id);
END;
$$;

-- Create leave_zone function
CREATE OR REPLACE FUNCTION public.leave_zone(p_zone_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_member RECORD;
BEGIN
  SELECT * INTO v_member FROM public.zone_members
  WHERE zone_id = p_zone_id AND user_id = v_user_id AND status = 'active';

  IF v_member IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_member');
  END IF;

  IF v_member.role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'owner_cannot_leave');
  END IF;

  DELETE FROM public.zone_members WHERE id = v_member.id;

  INSERT INTO public.zone_audit_log (zone_id, actor_user_id, action, entity_type, entity_id)
  VALUES (p_zone_id, v_user_id, 'member_left', 'zone_member', v_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create remove_zone_member function
CREATE OR REPLACE FUNCTION public.remove_zone_member(p_zone_id uuid, p_member_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_target RECORD;
BEGIN
  -- Check actor is admin
  IF NOT public.is_zone_admin(p_zone_id, v_actor_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;

  SELECT * INTO v_target FROM public.zone_members
  WHERE zone_id = p_zone_id AND user_id = p_member_user_id AND status = 'active';

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'member_not_found');
  END IF;

  IF v_target.role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_remove_owner');
  END IF;

  DELETE FROM public.zone_members WHERE id = v_target.id;

  INSERT INTO public.zone_audit_log (zone_id, actor_user_id, action, entity_type, entity_id)
  VALUES (p_zone_id, v_actor_id, 'member_removed', 'zone_member', p_member_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create update_zone_member_role function
CREATE OR REPLACE FUNCTION public.update_zone_member_role(p_zone_id uuid, p_member_user_id uuid, p_new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
BEGIN
  IF NOT public.is_zone_admin(p_zone_id, v_actor_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;

  IF p_new_role NOT IN ('admin', 'member', 'viewer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_role');
  END IF;

  -- Cannot change owner's role
  IF EXISTS (SELECT 1 FROM public.zone_members WHERE zone_id = p_zone_id AND user_id = p_member_user_id AND role = 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_change_owner_role');
  END IF;

  UPDATE public.zone_members SET role = p_new_role WHERE zone_id = p_zone_id AND user_id = p_member_user_id AND status = 'active';

  RETURN jsonb_build_object('success', true);
END;
$$;
