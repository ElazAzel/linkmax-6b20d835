BEGIN;

-- ============================================================================
-- 001_initial_schema.sql — Core tables, functions, triggers & RLS policies
-- Merged from ~50 original migrations covering user_profiles, pages, blocks,
-- analytics, plus all ALTER TABLE ADD COLUMN operations, type constraints,
-- and supporting functions.
-- ============================================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLES (final state)
-- ============================================================================

-- 1a. user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='email_notifications_enabled') THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='telegram_notifications_enabled') THEN
    ALTER TABLE public.user_profiles ADD COLUMN telegram_notifications_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='telegram_chat_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN telegram_chat_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='push_subscription') THEN
    ALTER TABLE public.user_profiles ADD COLUMN push_subscription jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='push_notifications_enabled') THEN
    ALTER TABLE public.user_profiles ADD COLUMN push_notifications_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='current_streak') THEN
    ALTER TABLE public.user_profiles ADD COLUMN current_streak integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='longest_streak') THEN
    ALTER TABLE public.user_profiles ADD COLUMN longest_streak integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_active_date') THEN
    ALTER TABLE public.user_profiles ADD COLUMN last_active_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='streak_bonus_days') THEN
    ALTER TABLE public.user_profiles ADD COLUMN streak_bonus_days integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='friends_count') THEN
    ALTER TABLE public.user_profiles ADD COLUMN friends_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='telegram_language') THEN
    ALTER TABLE public.user_profiles ADD COLUMN telegram_language VARCHAR(2) DEFAULT 'ru';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='kaspi_widget_enabled') THEN
    ALTER TABLE public.user_profiles ADD COLUMN kaspi_widget_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='premium_tier') THEN
    ALTER TABLE public.user_profiles ADD COLUMN premium_tier text DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='premium_expires_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN premium_expires_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='gcal_sync_enabled') THEN
    ALTER TABLE public.user_profiles ADD COLUMN gcal_sync_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='trial_started_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN trial_started_at timestamptz;
  END IF;
END $$;

-- 1b. pages
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  avatar_url TEXT,
  avatar_style JSONB DEFAULT '{"type": "default", "color": "#000000"}'::jsonb,
  theme_settings JSONB DEFAULT '{"backgroundColor": "hsl(var(--background))", "textColor": "hsl(var(--foreground))", "buttonStyle": "rounded", "fontFamily": "sans"}'::jsonb,
  seo_meta JSONB DEFAULT '{"title": "My LinkMAX Page", "description": "Check out my links", "keywords": []}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='editor_mode') THEN
    ALTER TABLE public.pages ADD COLUMN editor_mode text NOT NULL DEFAULT 'linear';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='grid_config') THEN
    ALTER TABLE public.pages ADD COLUMN grid_config jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='niche') THEN
    ALTER TABLE public.pages ADD COLUMN niche text DEFAULT 'other';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='preview_url') THEN
    ALTER TABLE public.pages ADD COLUMN preview_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='chatbot_context') THEN
    ALTER TABLE public.pages ADD COLUMN chatbot_context text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='integrations') THEN
    ALTER TABLE public.pages ADD COLUMN integrations jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='custom_domain') THEN
    ALTER TABLE public.pages ADD COLUMN custom_domain text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='favicon_url') THEN
    ALTER TABLE public.pages ADD COLUMN favicon_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='hide_branding') THEN
    ALTER TABLE public.pages ADD COLUMN hide_branding boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='is_in_gallery') THEN
    ALTER TABLE public.pages ADD COLUMN is_in_gallery boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='gallery_featured_at') THEN
    ALTER TABLE public.pages ADD COLUMN gallery_featured_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='gallery_likes') THEN
    ALTER TABLE public.pages ADD COLUMN gallery_likes integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='organization_id') THEN
    ALTER TABLE public.pages ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- 1c. blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  position INTEGER NOT NULL,
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  style JSONB DEFAULT '{}'::jsonb,
  is_premium BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'profile','link','button','socials','text','image','product','video',
  'carousel','search','custom_code','messenger','form','download',
  'newsletter','testimonial','scratch','map','avatar','separator',
  'catalog','before_after','faq','countdown','pricing','shoutout',
  'booking','community','event'
));

ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS schedule jsonb;

-- 1d. analytics
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pages_user_id ON public.pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON public.pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_user_published ON public.pages(user_id, is_published);
CREATE INDEX IF NOT EXISTS idx_pages_niche ON public.pages(niche);
CREATE INDEX IF NOT EXISTS idx_pages_preview_url ON public.pages(preview_url) WHERE preview_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pages_custom_domain ON public.pages(custom_domain);
CREATE INDEX IF NOT EXISTS idx_pages_gallery ON public.pages(is_in_gallery, gallery_featured_at DESC) WHERE is_in_gallery = true;

CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON public.blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page_position ON public.blocks(page_id, position);

CREATE INDEX IF NOT EXISTS idx_analytics_page_id ON public.analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_streak ON public.user_profiles(current_streak DESC) WHERE current_streak > 0;

-- ============================================================================
-- 3. FUNCTIONS (final versions)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', SPLIT_PART(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.pages WHERE slug = new_slug) LOOP
    new_slug := base_slug || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  RETURN new_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_view_count(page_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pages
  SET view_count = view_count + 1
  WHERE slug = page_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_block_clicks(block_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blocks
  SET click_count = click_count + 1
  WHERE id::text = block_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_page_blocks(
  p_page_id uuid,
  p_blocks jsonb,
  p_is_premium boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not own this page';
  END IF;
  DELETE FROM public.blocks WHERE page_id = p_page_id;
  INSERT INTO public.blocks (page_id, type, position, title, content, style, is_premium, schedule, click_count)
  SELECT
    p_page_id,
    (block->>'type')::text,
    (block->>'position')::integer,
    block->>'title',
    block->'content',
    COALESCE(block->'style', '{}'::jsonb),
    p_is_premium,
    block->'schedule',
    0
  FROM jsonb_array_elements(p_blocks) AS block;
END;
$$;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can search other profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view public profile data" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles view" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.user_profiles;

CREATE POLICY "Users can view public profile data"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- pages policies
DROP POLICY IF EXISTS "Anyone can view published pages" ON public.pages;
DROP POLICY IF EXISTS "Anyone can view gallery pages" ON public.pages;
DROP POLICY IF EXISTS "Users can view own pages" ON public.pages;
DROP POLICY IF EXISTS "Users can view pages in their organizations" ON public.pages;
DROP POLICY IF EXISTS "Users can update own pages" ON public.pages;
DROP POLICY IF EXISTS "Users can update pages in their organizations" ON public.pages;

CREATE POLICY "Anyone can view published pages"
  ON public.pages FOR SELECT
  USING (is_published = true OR auth.uid() = user_id OR is_in_gallery = true);

CREATE POLICY "Users can view pages in their organizations"
  ON public.pages FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own pages"
  ON public.pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update pages in their organizations"
  ON public.pages FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can delete own pages"
  ON public.pages FOR DELETE
  USING (auth.uid() = user_id);

-- blocks policies
DROP POLICY IF EXISTS "Anyone can view blocks of published pages" ON public.blocks;
DROP POLICY IF EXISTS "Users can manage blocks on own pages" ON public.blocks;
DROP POLICY IF EXISTS "Only premium users can create premium blocks" ON public.blocks;
DROP POLICY IF EXISTS "Only premium users can update blocks to premium" ON public.blocks;

CREATE POLICY "Anyone can view blocks of published pages"
  ON public.blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id
      AND (pages.is_published = true OR pages.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage blocks on own pages"
  ON public.blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Only premium users can create premium blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (
    (is_premium IS NULL OR is_premium = false)
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (is_premium = true OR (trial_ends_at IS NOT NULL AND trial_ends_at > now()))
    )
  );

CREATE POLICY "Only premium users can update blocks to premium"
  ON public.blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  )
  WITH CHECK (
    (is_premium IS NULL OR is_premium = false)
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (is_premium = true OR (trial_ends_at IS NOT NULL AND trial_ends_at > now()))
    )
  );

-- analytics policies
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics;
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can view analytics for own pages" ON public.analytics;
DROP POLICY IF EXISTS "Users can view analytics for their pages" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;
DROP POLICY IF EXISTS "Allow analytics insert" ON public.analytics;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.analytics;

CREATE POLICY "Anyone can insert analytics"
  ON public.analytics FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view analytics for own pages"
  ON public.analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = analytics.page_id
      AND pages.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. PUBLIC VIEWS
-- ============================================================================

DROP VIEW IF EXISTS public.public_pages;
CREATE VIEW public.public_pages
WITH (security_invoker = true) AS
SELECT
  id, slug, title, description, avatar_url, avatar_style,
  theme_settings, seo_meta, is_published, view_count,
  created_at, updated_at
FROM public.pages
WHERE is_published = true;

GRANT SELECT ON public.public_pages TO anon;
GRANT SELECT ON public.public_pages TO authenticated;

DROP VIEW IF EXISTS public.public_user_profiles;
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT
  id, username, display_name, avatar_url, bio,
  current_streak, longest_streak, friends_count,
  is_premium, created_at
FROM public.user_profiles;

GRANT SELECT ON public.public_user_profiles TO authenticated;
GRANT SELECT ON public.public_user_profiles TO anon;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.blocks.is_premium IS 'Indicates if this block requires premium subscription';
COMMENT ON COLUMN public.pages.integrations IS 'Integration settings for the page';
COMMENT ON COLUMN public.pages.custom_domain IS 'User-provided custom domain for this page';
COMMENT ON COLUMN public.pages.favicon_url IS 'Custom favicon URL for white-label';
COMMENT ON COLUMN public.pages.hide_branding IS 'Hide LinkMAX branding for white-label';
COMMENT ON VIEW public.public_pages IS 'Public view of published pages excluding user_id';
COMMENT ON VIEW public.public_user_profiles IS 'Public view of user profiles excluding sensitive fields';

COMMIT;
