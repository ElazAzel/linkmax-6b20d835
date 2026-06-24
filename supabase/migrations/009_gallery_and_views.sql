BEGIN;

-- ==============================================
-- 009: GALLERY AND VIEWS
-- ==============================================

-- 1. Gallery fields on pages
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS is_in_gallery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gallery_featured_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS gallery_likes integer DEFAULT 0;

-- 2. Page likes tracking table
CREATE TABLE IF NOT EXISTS public.page_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid,
  ip_hash text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id),
  UNIQUE(page_id, ip_hash)
);

-- 3. User achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- 4. Enable RLS
ALTER TABLE public.page_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_pages_gallery ON public.pages(is_in_gallery, gallery_featured_at DESC) WHERE is_in_gallery = true;
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_key ON public.user_achievements(achievement_key);

-- 6. RLS Policies

-- page_likes
DROP POLICY IF EXISTS "Users can view their own likes" ON public.page_likes;
CREATE POLICY "Users can view their own likes"
ON public.page_likes
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can like pages" ON public.page_likes;
CREATE POLICY "Users can like pages"
ON public.page_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND ip_hash IS NOT NULL));

DROP POLICY IF EXISTS "Users can unlike pages" ON public.page_likes;
CREATE POLICY "Users can unlike pages"
ON public.page_likes
FOR DELETE
USING (auth.uid() = user_id);

-- user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. Views

-- public_pages (security_invoker)
DROP VIEW IF EXISTS public.public_pages;
CREATE VIEW public.public_pages
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  title,
  description,
  avatar_url,
  avatar_style,
  theme_settings,
  seo_meta,
  is_published,
  view_count,
  created_at,
  updated_at
FROM public.pages
WHERE is_published = true;

GRANT SELECT ON public.public_pages TO anon;
GRANT SELECT ON public.public_pages TO authenticated;

COMMENT ON VIEW public.public_pages IS 'Public view of published pages that excludes user_id to prevent user enumeration';

-- public_user_profiles (security_invoker)
DROP VIEW IF EXISTS public.public_user_profiles;
CREATE VIEW public.public_user_profiles
WITH (security_invoker = true)
AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  bio,
  current_streak,
  longest_streak,
  friends_count,
  is_premium,
  created_at
FROM public.user_profiles;

GRANT SELECT ON public.public_user_profiles TO authenticated;
GRANT SELECT ON public.public_user_profiles TO anon;

-- 8. Functions

-- like_gallery_page (with page_likes tracking)
CREATE OR REPLACE FUNCTION public.like_gallery_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  INSERT INTO public.page_likes (page_id, user_id)
  VALUES (p_page_id, v_user_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.pages
  SET gallery_likes = (
    SELECT COUNT(*) FROM public.page_likes WHERE page_id = p_page_id
  )
  WHERE id = p_page_id AND is_in_gallery = true;
END;
$$;

-- unlike_gallery_page (with page_likes tracking)
CREATE OR REPLACE FUNCTION public.unlike_gallery_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  DELETE FROM public.page_likes
  WHERE page_id = p_page_id AND user_id = v_user_id;

  UPDATE public.pages
  SET gallery_likes = (
    SELECT COUNT(*) FROM public.page_likes WHERE page_id = p_page_id
  )
  WHERE id = p_page_id;
END;
$$;

-- toggle_gallery_status (with ownership check)
CREATE OR REPLACE FUNCTION public.toggle_gallery_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status boolean;
  v_new_status boolean;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only toggle your own gallery status';
  END IF;

  SELECT is_in_gallery INTO v_current_status
  FROM public.pages
  WHERE user_id = p_user_id;

  v_new_status := NOT COALESCE(v_current_status, false);

  UPDATE public.pages
  SET
    is_in_gallery = v_new_status,
    gallery_featured_at = CASE WHEN v_new_status THEN now() ELSE NULL END
  WHERE user_id = p_user_id;

  RETURN v_new_status;
END;
$$;

COMMIT;
