-- ==========================================
-- SOCIAL ENGAGEMENT TABLES FOR BUSINESS GROWTH
-- ==========================================

-- 1. Page Boosts (Monetization) - платное продвижение страниц
CREATE TABLE public.page_boosts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  boost_type text NOT NULL DEFAULT 'standard', -- standard, premium, super
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boosts"
  ON public.page_boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own boosts"
  ON public.page_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_page_boosts_active ON public.page_boosts(is_active, ends_at) WHERE is_active = true;
CREATE INDEX idx_page_boosts_page ON public.page_boosts(page_id);

-- 2. Premium Gifts (Monetization) - подарок премиума другу
CREATE TABLE public.premium_gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  days_gifted integer NOT NULL DEFAULT 7,
  message text,
  is_claimed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  claimed_at timestamp with time zone
);

ALTER TABLE public.premium_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gifts they sent or received"
  ON public.premium_gifts FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create gifts"
  ON public.premium_gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update to claim"
  ON public.premium_gifts FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE INDEX idx_premium_gifts_recipient ON public.premium_gifts(recipient_id, is_claimed);

-- 3. Weekly Challenges (Retention) - еженедельные вызовы
CREATE TABLE public.weekly_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_count integer NOT NULL DEFAULT 1,
  reward_hours integer NOT NULL DEFAULT 12,
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(challenge_key, week_start)
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON public.weekly_challenges FOR SELECT
  USING (is_active = true);

-- 4. Challenge Progress (Retention) - прогресс по вызовам
CREATE TABLE public.challenge_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_count integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_challenge_progress_user ON public.challenge_progress(user_id);

-- 5. Friend Activities (Retention) - лента активности друзей
CREATE TABLE public.friend_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_type text NOT NULL, -- 'page_published', 'new_block', 'achievement', 'streak_milestone', 'challenge_completed'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;

-- Users can see activities of their friends
CREATE POLICY "Users can view friends activities"
  ON public.friend_activities FOR SELECT
  USING (
    user_id IN (
      SELECT friend_id FROM public.friendships WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM public.friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create own activities"
  ON public.friend_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_friend_activities_user ON public.friend_activities(user_id, created_at DESC);
CREATE INDEX idx_friend_activities_type ON public.friend_activities(activity_type);

-- 6. RPC: Claim Premium Gift
CREATE OR REPLACE FUNCTION public.claim_premium_gift(p_gift_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_gift record;
BEGIN
  -- Get gift
  SELECT * INTO v_gift FROM public.premium_gifts 
  WHERE id = p_gift_id AND recipient_id = auth.uid() AND is_claimed = false;
  
  IF v_gift IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'gift_not_found');
  END IF;
  
  -- Mark as claimed
  UPDATE public.premium_gifts SET is_claimed = true, claimed_at = now() WHERE id = p_gift_id;
  
  -- Extend recipient's trial
  UPDATE public.user_profiles
  SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + (v_gift.days_gifted || ' days')::interval
  WHERE id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'days', v_gift.days_gifted);
END;
$$;

-- 7. RPC: Complete Weekly Challenge
CREATE OR REPLACE FUNCTION public.complete_weekly_challenge(p_challenge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_progress record;
  v_challenge record;
BEGIN
  -- Get challenge and progress
  SELECT * INTO v_challenge FROM public.weekly_challenges WHERE id = p_challenge_id;
  SELECT * INTO v_progress FROM public.challenge_progress 
  WHERE challenge_id = p_challenge_id AND user_id = auth.uid();
  
  IF v_challenge IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'challenge_not_found');
  END IF;
  
  IF v_progress IS NULL OR NOT v_progress.is_completed OR v_progress.reward_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_eligible');
  END IF;
  
  -- Mark as claimed
  UPDATE public.challenge_progress SET reward_claimed = true WHERE id = v_progress.id;
  
  -- Extend trial
  UPDATE public.user_profiles
  SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + (v_challenge.reward_hours || ' hours')::interval
  WHERE id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'hours', v_challenge.reward_hours);
END;
$$;

-- 8. RPC: Increment Challenge Progress
CREATE OR REPLACE FUNCTION public.increment_challenge_progress(p_challenge_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_challenge record;
BEGIN
  -- Find active challenge for this week
  SELECT * INTO v_challenge FROM public.weekly_challenges 
  WHERE challenge_key = p_challenge_key 
    AND week_start = date_trunc('week', CURRENT_DATE)::date
    AND is_active = true;
  
  IF v_challenge IS NULL THEN RETURN; END IF;
  
  -- Upsert progress
  INSERT INTO public.challenge_progress (user_id, challenge_id, current_count)
  VALUES (auth.uid(), v_challenge.id, 1)
  ON CONFLICT (user_id, challenge_id) DO UPDATE
  SET current_count = challenge_progress.current_count + 1,
      is_completed = CASE WHEN challenge_progress.current_count + 1 >= v_challenge.target_count THEN true ELSE challenge_progress.is_completed END,
      completed_at = CASE WHEN challenge_progress.current_count + 1 >= v_challenge.target_count AND challenge_progress.completed_at IS NULL THEN now() ELSE challenge_progress.completed_at END;
END;
$$;

-- 9. Insert default weekly challenges
INSERT INTO public.weekly_challenges (challenge_key, title, description, target_count, reward_hours) VALUES
('invite_friends', 'Пригласи 3 друзей', 'Пригласите 3 новых пользователей по реферальной ссылке', 3, 24),
('add_blocks', 'Добавь 10 блоков', 'Добавьте 10 новых блоков на вашу страницу', 10, 12),
('get_views', 'Набери 50 просмотров', 'Получите 50 просмотров вашей страницы', 50, 12),
('like_pages', 'Поставь 5 лайков', 'Поставьте лайки 5 страницам в галерее', 5, 6),
('share_page', 'Поделись 3 раза', 'Поделитесь своей страницей 3 раза', 3, 8);