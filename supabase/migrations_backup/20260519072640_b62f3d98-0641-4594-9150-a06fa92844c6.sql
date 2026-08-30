
CREATE OR REPLACE FUNCTION public.get_admin_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  now_ts timestamptz := now();
BEGIN
  -- Admin guard
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers',             (SELECT count(*) FROM public.user_profiles),
    'premiumUsers',           (SELECT count(*) FROM public.user_profiles WHERE is_premium = true),
    'activeTrials',           (SELECT count(*) FROM public.user_profiles WHERE trial_ends_at > now_ts),
    'usersWithStreak',        (SELECT count(*) FROM public.user_profiles WHERE current_streak > 0),
    'totalPages',             (SELECT count(*) FROM public.pages),
    'publishedPages',         (SELECT count(*) FROM public.pages WHERE is_published = true),
    'galleryPages',           (SELECT count(*) FROM public.pages WHERE is_in_gallery = true),
    'totalViews',             (SELECT coalesce(sum(view_count), 0) FROM public.pages),
    'totalClicks',            (SELECT count(*) FROM public.analytics WHERE event_type = 'click'),
    'totalShares',            (SELECT count(*) FROM public.analytics WHERE event_type = 'share'),
    'totalBlocks',            (SELECT count(*) FROM public.blocks),
    'totalFriendships',       (SELECT count(*) FROM public.friendships),
    'acceptedFriendships',    (SELECT count(*) FROM public.friendships WHERE status = 'accepted'),
    'pendingFriendships',     (SELECT count(*) FROM public.friendships WHERE status = 'pending'),
    'totalCollaborations',    (SELECT count(*) FROM public.collaborations),
    'acceptedCollaborations', (SELECT count(*) FROM public.collaborations WHERE status = 'accepted'),
    'totalTeams',             (SELECT count(*) FROM public.teams),
    'totalTeamMembers',       (SELECT count(*) FROM public.team_members),
    'totalLeads',             (SELECT count(*) FROM public.leads),
    'totalReferrals',         (SELECT count(*) FROM public.referrals),
    'totalAchievements',      (SELECT count(*) FROM public.user_achievements),
    'totalShoutouts',         (SELECT count(*) FROM public.shoutouts)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_platform_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_platform_stats() TO authenticated;
