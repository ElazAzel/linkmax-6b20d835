-- Function to get top referrers with their referral counts
CREATE OR REPLACE FUNCTION public.get_top_referrers(p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  referrals_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    COUNT(r.id) as referrals_count
  FROM public.user_profiles up
  INNER JOIN public.referral_codes rc ON rc.user_id = up.id
  INNER JOIN public.referrals r ON r.referral_code_id = rc.id
  GROUP BY up.id, up.username, up.display_name, up.avatar_url
  HAVING COUNT(r.id) > 0
  ORDER BY referrals_count DESC
  LIMIT p_limit;
END;
$$;