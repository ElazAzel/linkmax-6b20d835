-- Create table for tracking completed daily quests
CREATE TABLE public.daily_quests_completed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_key TEXT NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_key, completed_date)
);

-- Enable RLS
ALTER TABLE public.daily_quests_completed ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own quests"
ON public.daily_quests_completed
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests"
ON public.daily_quests_completed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
ON public.daily_quests_completed
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_daily_quests_user_date ON public.daily_quests_completed(user_id, completed_date);

-- Create function to complete quest and add bonus trial days
CREATE OR REPLACE FUNCTION public.complete_daily_quest(
  p_user_id UUID,
  p_quest_key TEXT,
  p_bonus_hours INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_completed BOOLEAN;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Check if already completed today
  SELECT EXISTS(
    SELECT 1 FROM public.daily_quests_completed 
    WHERE user_id = p_user_id 
    AND quest_key = p_quest_key 
    AND completed_date = v_today
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_completed');
  END IF;

  -- Insert completion record
  INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date, reward_claimed)
  VALUES (p_user_id, p_quest_key, v_today, true);

  -- Add bonus trial hours if specified
  IF p_bonus_hours > 0 THEN
    UPDATE public.user_profiles
    SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + (p_bonus_hours || ' hours')::interval
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'bonus_hours', p_bonus_hours);
END;
$$;