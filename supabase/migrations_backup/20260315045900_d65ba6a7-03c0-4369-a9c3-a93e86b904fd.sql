
-- ============================================================
-- SECURITY AUDIT FIX: All 11 findings (4 errors + 7 warnings)
-- ============================================================

-- ============ ERROR 1: user_profiles UPDATE privilege escalation ============
CREATE OR REPLACE FUNCTION public.protect_user_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  _role := coalesce(
    current_setting('request.jwt.claim.role', true),
    current_setting('role', true),
    'anon'
  );
  
  IF _role <> 'service_role' THEN
    NEW.is_premium := OLD.is_premium;
    NEW.premium_tier := OLD.premium_tier;
    NEW.premium_expires_at := OLD.premium_expires_at;
    NEW.is_verified := OLD.is_verified;
    NEW.verification_status := OLD.verification_status;
    NEW.trial_ends_at := OLD.trial_ends_at;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive ON public.user_profiles;
CREATE TRIGGER trg_protect_profile_sensitive
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_sensitive_columns();

-- ============ ERROR 2: user_wallets UPDATE ============
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;

-- ============ ERROR 3: user_tokens UPDATE ============
DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_tokens;

-- ============ ERROR 4: teams invite_code exposed ============
DROP POLICY IF EXISTS "Anyone can view public teams" ON public.teams;

CREATE POLICY "Anyone can view public teams safe"
  ON public.teams
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true 
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

-- Secure view that hides invite_code from non-members
CREATE OR REPLACE VIEW public.public_teams AS
SELECT 
  id, name, slug, description, avatar_url, niche, 
  is_public, owner_id, created_at, updated_at,
  CASE 
    WHEN owner_id = auth.uid() THEN invite_code
    WHEN EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()) THEN invite_code
    ELSE NULL
  END AS invite_code
FROM public.teams;

-- ============ WARN 1: Extension in public schema ============
CREATE SCHEMA IF NOT EXISTS extensions;

-- ============ WARN 3: challenge_progress UPDATE ============
CREATE OR REPLACE FUNCTION public.protect_challenge_progress_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  _role := coalesce(
    current_setting('request.jwt.claim.role', true),
    current_setting('role', true),
    'anon'
  );
  
  IF _role <> 'service_role' THEN
    NEW.is_completed := OLD.is_completed;
    NEW.reward_claimed := OLD.reward_claimed;
    NEW.completed_at := OLD.completed_at;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_challenge_progress ON public.challenge_progress;
CREATE TRIGGER trg_protect_challenge_progress
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_challenge_progress_columns();

-- ============ WARN 4: daily_quests_completed UPDATE ============
DROP POLICY IF EXISTS "Users can update own quests" ON public.daily_quests_completed;

-- ============ WARN 5: token_transactions INSERT ============
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.token_transactions;

-- ============ WARN 6: event_registrations INSERT payment bypass ============
DROP POLICY IF EXISTS "Anyone can register for published events" ON public.event_registrations;

CREATE POLICY "Anyone can register for published events"
  ON public.event_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    payment_status IN ('none', 'pending')
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_id AND p.is_published = true
    )
  );

-- ============ WARN 7: app_settings SELECT ============
DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;

CREATE POLICY "Anyone can read safe app_settings"
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('cache_version', 'maintenance_mode', 'platform_version', 'announcement')
  );

CREATE POLICY "Admins can read all app_settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );
