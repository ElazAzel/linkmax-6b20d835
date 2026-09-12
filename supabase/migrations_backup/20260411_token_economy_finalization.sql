-- ==============================================
-- LinkMAX Token Economy Finalization — 2026-04-11
-- Refactors rewards from "bonus_hours" to "tokens"
-- ==============================================

-- complete_daily_quest: only self
-- Refactored to use p_tokens instead of p_bonus_hours multiplier
CREATE OR REPLACE FUNCTION public.complete_daily_quest(
    p_user_id uuid, 
    p_quest_key text, 
    p_tokens integer DEFAULT NULL,
    p_bonus_hours integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
    v_today DATE := CURRENT_DATE; 
    v_already_completed BOOLEAN; 
    v_token_amount INTEGER;
BEGIN
    -- Security check: only own quests
    IF p_user_id != auth.uid() THEN
        RETURN json_build_object('success', false, 'error', 'unauthorized');
    END IF;

    -- Check if already completed today
    SELECT EXISTS(
        SELECT 1 FROM public.daily_quests_completed 
        WHERE user_id = p_user_id 
        AND quest_key = p_quest_key 
        AND completed_date = v_today
    ) INTO v_already_completed;

    IF v_already_completed THEN 
        RETURN json_build_object('success', false, 'reason', 'already_completed'); 
    END IF;

    -- Determine token amount
    -- If p_tokens is provided, use it. 
    -- Otherwise fallback to legacy p_bonus_hours conversion (x5)
    IF p_tokens IS NOT NULL THEN
        v_token_amount := p_tokens;
    ELSIF p_bonus_hours IS NOT NULL THEN
        v_token_amount := GREATEST(p_bonus_hours * 5, 5);
    ELSE
        -- Default reward if nothing is provided
        v_token_amount := 5; 
    END IF;

    -- Record completion
    INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date) 
    VALUES (p_user_id, p_quest_key, v_today);

    -- Award tokens using the existing robust function
    PERFORM public.add_linkkon_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);

    RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END;
$$;

-- Ensure comments are updated for developers
COMMENT ON FUNCTION public.complete_daily_quest IS 'Completes a daily quest and awards tokens. p_tokens is preferred over legacy p_bonus_hours.';
