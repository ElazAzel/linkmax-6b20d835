-- ==============================================
-- GDPR Compliance Functions — 2026-02-18
-- Data Export & Account Deletion
-- ==============================================

-- ==============================================
-- 1. Data Export: Returns all user data as JSONB
-- Called by user to get a full dump of their data
-- ==============================================
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- SECURITY: Only the user themselves can export their data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', p_user_id,

    'profile', (
      SELECT row_to_json(p)
      FROM user_profiles p
      WHERE p.id = p_user_id
    ),

    'pages', (
      SELECT COALESCE(jsonb_agg(row_to_json(pg)), '[]'::jsonb)
      FROM pages pg
      WHERE pg.user_id = p_user_id
    ),

    'blocks', (
      SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
      FROM blocks b
      JOIN pages pg ON pg.id = b.page_id
      WHERE pg.user_id = p_user_id
    ),

    'leads', (
      SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb)
      FROM leads l
      WHERE l.user_id = p_user_id
    ),

    'lead_interactions', (
      SELECT COALESCE(jsonb_agg(row_to_json(li)), '[]'::jsonb)
      FROM lead_interactions li
      WHERE li.user_id = p_user_id
    ),

    'bookings', (
      SELECT COALESCE(jsonb_agg(row_to_json(bk)), '[]'::jsonb)
      FROM bookings bk
      WHERE bk.owner_id = p_user_id
    ),

    'tokens', (
      SELECT row_to_json(t)
      FROM user_tokens t
      WHERE t.user_id = p_user_id
    ),

    'token_transactions', (
      SELECT COALESCE(jsonb_agg(row_to_json(tt)), '[]'::jsonb)
      FROM token_transactions tt
      WHERE tt.user_id = p_user_id
    ),

    'referral_codes', (
      SELECT COALESCE(jsonb_agg(row_to_json(rc)), '[]'::jsonb)
      FROM referral_codes rc
      WHERE rc.user_id = p_user_id
    ),

    'referrals', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      FROM referrals r
      WHERE r.referrer_id = p_user_id OR r.referred_id = p_user_id
    ),

    'withdrawals', (
      SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb)
      FROM token_withdrawals w
      WHERE w.user_id = p_user_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ==============================================
-- 2. Account Deletion: Cascading delete of all user data
-- Deletes everything and removes the auth user
-- ==============================================
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pages_deleted INTEGER;
  v_leads_deleted INTEGER;
BEGIN
  -- SECURITY: Only the user themselves can delete their account
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  -- Count for confirmation
  SELECT COUNT(*) INTO v_pages_deleted FROM pages WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_leads_deleted FROM leads WHERE user_id = p_user_id;

  -- Delete in dependency order (child tables first)
  -- Most tables have ON DELETE CASCADE from auth.users, but we delete explicitly
  -- to handle any tables without proper FK cascading

  -- Delete analytics events
  DELETE FROM page_events WHERE page_id IN (SELECT id FROM pages WHERE user_id = p_user_id);

  -- Delete blocks (related to pages)
  DELETE FROM blocks WHERE page_id IN (SELECT id FROM pages WHERE user_id = p_user_id);

  -- Delete booking slots and bookings
  DELETE FROM booking_slots WHERE block_id IN (
    SELECT b.id FROM blocks b JOIN pages p ON b.page_id = p.id WHERE p.user_id = p_user_id
  );
  DELETE FROM bookings WHERE owner_id = p_user_id;

  -- Delete leads and interactions
  DELETE FROM lead_interactions WHERE user_id = p_user_id;
  DELETE FROM leads WHERE user_id = p_user_id;

  -- Delete pages
  DELETE FROM pages WHERE user_id = p_user_id;

  -- Delete token data
  DELETE FROM token_transactions WHERE user_id = p_user_id;
  DELETE FROM daily_token_limits WHERE user_id = p_user_id;
  DELETE FROM token_withdrawals WHERE user_id = p_user_id;
  DELETE FROM user_tokens WHERE user_id = p_user_id;

  -- Delete referral data
  DELETE FROM referrals WHERE referrer_id = p_user_id OR referred_id = p_user_id;
  DELETE FROM referral_codes WHERE user_id = p_user_id;

  -- Delete social data (if tables exist)
  BEGIN
    DELETE FROM collaborations WHERE user_id = p_user_id OR collaborator_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM friendships WHERE user_id = p_user_id OR friend_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- Delete rate limit entries
  BEGIN
    DELETE FROM rate_limits WHERE ip_address IN (
      SELECT DISTINCT ip_address FROM rate_limits WHERE endpoint LIKE '%' || p_user_id::text || '%'
    );
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- Delete user roles
  DELETE FROM user_roles WHERE user_id = p_user_id;

  -- Delete profile (should cascade from auth.users, but explicit is safer)
  DELETE FROM user_profiles WHERE id = p_user_id;

  -- NOTE: We do NOT delete from auth.users here because SECURITY DEFINER
  -- functions cannot call auth.admin.deleteUser(). The frontend must call
  -- supabase.auth.admin.deleteUser() separately after this function succeeds,
  -- or the user can be cleaned up by a scheduled job.

  RETURN jsonb_build_object(
    'success', true,
    'pages_deleted', v_pages_deleted,
    'leads_deleted', v_leads_deleted,
    'message', 'All user data deleted. Auth account must be removed separately.'
  );
END;
$$;
