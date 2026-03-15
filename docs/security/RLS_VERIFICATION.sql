-- RLS VERIFICATION SCRIPT FOR FINTECH
-- Run this in the Supabase SQL Editor to verify data isolation.

-- 1. SETUP: Create test users (simulated)
-- Assumes you have some IDs or will use temporary ones.

DO $$
DECLARE
  user_a UUID := '00000000-0000-0000-0000-00000000000a';
  user_b UUID := '00000000-0000-0000-0000-00000000000b';
  admin_user UUID := '00000000-0000-0000-0000-00000000000c';
BEGIN
  -- Insert test data (if not exists)
  -- Note: This requires bypassing RLS or being superuser (which typically SQL Editor is)
  INSERT INTO public.user_wallets (user_id, balance) VALUES (user_a, 100.00) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_wallets (user_id, balance) VALUES (user_b, 200.00) ON CONFLICT (user_id) DO NOTHING;
  
  -- VERIFICATION 1: User A cannot see User B's wallet
  -- Simulate User A context
  EXECUTE 'SET request.jwt.claims = ' || quote_literal(json_build_object('sub', user_a, 'role', 'authenticated')::text);
  
  IF EXISTS (SELECT 1 FROM public.user_wallets WHERE user_id = user_b) THEN
    RAISE EXCEPTION 'SECURITY BREACH: User A can see User B wallet';
  ELSE
    RAISE NOTICE 'SUCCESS: User A cannot see User B wallet';
  END IF;

  -- VERIFICATION 2: User A can see own wallet
  IF EXISTS (SELECT 1 FROM public.user_wallets WHERE user_id = user_a) THEN
    RAISE NOTICE 'SUCCESS: User A can see own wallet';
  ELSE
    RAISE EXCEPTION 'FAILURE: User A cannot see own wallet';
  END IF;

  -- VERIFICATION 3: Trigger Guard on user_profiles (is_premium)
  -- Try to escalate privileges
  UPDATE public.user_profiles SET is_premium = true WHERE id = user_a;
  
  IF (SELECT is_premium FROM public.user_profiles WHERE id = user_a) = true THEN
    RAISE EXCEPTION 'SECURITY BREACH: Trigger Guard failed to revert is_premium';
  ELSE
    RAISE NOTICE 'SUCCESS: Trigger Guard reverted illegal is_premium update';
  END IF;

  -- VERIFICATION 4: Invite code masking in public_teams
  -- Insert a team with an invite code as owner
  INSERT INTO public.teams (id, name, owner_id, invite_code) 
  VALUES ('00000000-0000-0000-0000-000000000001', 'Test Team', admin_user, 'SECRET123')
  ON CONFLICT DO NOTHING;

  -- Verification as User A (non-member)
  IF (SELECT invite_code FROM public.public_teams WHERE id = '00000000-0000-0000-0000-000000000001') IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY BREACH: invite_code exposed in public_teams for non-member';
  ELSE
    RAISE NOTICE 'SUCCESS: invite_code masked in public_teams';
  END IF;

  -- Reset context
  SET request.jwt.claims = '';
  
  RAISE NOTICE 'RLS & Trigger Verification completed successfully';
END $$;
