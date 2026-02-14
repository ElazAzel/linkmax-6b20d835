-- Add streak fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date,
ADD COLUMN IF NOT EXISTS streak_bonus_days integer DEFAULT 0;

-- Function to update streak on login
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_active date;
  v_current_streak integer;
  v_longest_streak integer;
  v_today date := current_date;
  v_bonus_days integer := 0;
  v_streak_milestone boolean := false;
BEGIN
  -- Get current streak data
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- If already active today, no update needed
  IF v_last_active = v_today THEN
    RETURN jsonb_build_object(
      'updated', false,
      'current_streak', COALESCE(v_current_streak, 0),
      'longest_streak', COALESCE(v_longest_streak, 0),
      'bonus_days', 0,
      'milestone', false
    );
  END IF;

  -- Calculate new streak
  IF v_last_active = v_today - 1 THEN
    -- Consecutive day - increment streak
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSIF v_last_active IS NULL OR v_last_active < v_today - 1 THEN
    -- Streak broken or first login - reset to 1
    v_current_streak := 1;
  END IF;

  -- Update longest streak if needed
  IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Calculate bonus days for milestones
  IF v_current_streak = 7 THEN
    v_bonus_days := 1;
    v_streak_milestone := true;
  ELSIF v_current_streak = 14 THEN
    v_bonus_days := 2;
    v_streak_milestone := true;
  ELSIF v_current_streak = 30 THEN
    v_bonus_days := 3;
    v_streak_milestone := true;
  ELSIF v_current_streak = 60 THEN
    v_bonus_days := 5;
    v_streak_milestone := true;
  ELSIF v_current_streak = 100 THEN
    v_bonus_days := 7;
    v_streak_milestone := true;
  END IF;

  -- Update user profile
  UPDATE public.user_profiles
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_active_date = v_today,
    streak_bonus_days = COALESCE(streak_bonus_days, 0) + v_bonus_days,
    trial_ends_at = CASE 
      WHEN v_bonus_days > 0 THEN GREATEST(COALESCE(trial_ends_at, now()), now()) + (v_bonus_days || ' days')::interval
      ELSE trial_ends_at
    END
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'updated', true,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'bonus_days', v_bonus_days,
    'milestone', v_streak_milestone
  );
END;
$$;

-- Create index for streak queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_streak ON public.user_profiles(current_streak DESC) WHERE current_streak > 0;