-- Add multi-page support columns to pages table
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_primary_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS page_type text DEFAULT 'free';

-- Add constraint to ensure only one primary paid page per user
CREATE OR REPLACE FUNCTION public.check_primary_paid_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary_paid = true THEN
    -- Ensure no other page is primary paid for this user
    IF EXISTS (
      SELECT 1 FROM public.pages 
      WHERE user_id = NEW.user_id 
        AND is_primary_paid = true 
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'User can only have one primary paid page';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_primary_paid_uniqueness ON public.pages;
CREATE TRIGGER enforce_primary_paid_uniqueness
  BEFORE INSERT OR UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_primary_paid_uniqueness();

-- Create function to check page limits based on plan
CREATE OR REPLACE FUNCTION public.check_page_limits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_tier text;
  page_count integer;
  max_pages integer;
  paid_pages integer;
  free_pages integer;
BEGIN
  -- Get user's premium tier
  SELECT COALESCE(premium_tier, 'free') INTO user_tier
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Get current page count
  SELECT COUNT(*) INTO page_count
  FROM public.pages
  WHERE user_id = p_user_id;
  
  -- Get paid/free page counts
  SELECT 
    COUNT(*) FILTER (WHERE is_paid = true),
    COUNT(*) FILTER (WHERE is_paid = false OR is_paid IS NULL)
  INTO paid_pages, free_pages
  FROM public.pages
  WHERE user_id = p_user_id;
  
  -- Set limits based on tier
  IF user_tier = 'free' THEN
    max_pages := 1;
  ELSE -- pro tier
    max_pages := 6; -- 1 primary paid + 5 free pages
  END IF;
  
  RETURN jsonb_build_object(
    'tier', user_tier,
    'current_pages', page_count,
    'max_pages', max_pages,
    'paid_pages', paid_pages,
    'free_pages', free_pages,
    'can_create', page_count < max_pages
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to create a new page with limit enforcement
CREATE OR REPLACE FUNCTION public.create_user_page(
  p_user_id uuid,
  p_title text,
  p_slug text
)
RETURNS jsonb AS $$
DECLARE
  limits jsonb;
  new_page_id uuid;
  validated_slug text;
BEGIN
  -- Check limits
  limits := public.check_page_limits(p_user_id);
  
  IF NOT (limits->>'can_create')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'page_limit_exceeded',
      'limits', limits
    );
  END IF;
  
  -- Validate and generate unique slug
  SELECT public.generate_unique_slug(COALESCE(NULLIF(p_slug, ''), 'page-' || substr(gen_random_uuid()::text, 1, 8)))
  INTO validated_slug;
  
  -- Create the page
  INSERT INTO public.pages (
    user_id,
    title,
    slug,
    is_paid,
    is_primary_paid,
    theme_settings,
    seo_meta,
    editor_mode
  ) VALUES (
    p_user_id,
    COALESCE(p_title, 'My Page'),
    validated_slug,
    false,
    false,
    '{"backgroundColor": "hsl(var(--background))", "textColor": "hsl(var(--foreground))", "buttonStyle": "rounded", "fontFamily": "sans"}'::jsonb,
    '{"title": "My LinkMAX Page", "description": "Check out my links", "keywords": []}'::jsonb,
    'grid'
  )
  RETURNING id INTO new_page_id;
  
  -- Create default profile block for the page
  INSERT INTO public.blocks (
    page_id,
    type,
    position,
    content,
    is_premium
  ) VALUES (
    new_page_id,
    'profile',
    0,
    jsonb_build_object(
      'id', 'profile-' || new_page_id::text,
      'type', 'profile',
      'name', COALESCE(p_title, 'My Page')
    ),
    false
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'page_id', new_page_id,
    'slug', validated_slug,
    'limits', public.check_page_limits(p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get all user pages
CREATE OR REPLACE FUNCTION public.get_user_pages(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  pages_data jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'title', COALESCE(p.title, 'Untitled'),
      'slug', p.slug,
      'is_published', COALESCE(p.is_published, false),
      'is_paid', COALESCE(p.is_paid, false),
      'is_primary_paid', COALESCE(p.is_primary_paid, false),
      'view_count', COALESCE(p.view_count, 0),
      'updated_at', p.updated_at,
      'created_at', p.created_at,
      'preview_url', p.preview_url
    )
    ORDER BY p.created_at DESC
  )
  INTO pages_data
  FROM public.pages p
  WHERE p.user_id = p_user_id;
  
  RETURN COALESCE(pages_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to set primary paid page (only one allowed)
CREATE OR REPLACE FUNCTION public.set_primary_paid_page(
  p_user_id uuid,
  p_page_id uuid
)
RETURNS jsonb AS $$
DECLARE
  user_tier text;
BEGIN
  -- Check user has pro tier
  SELECT COALESCE(premium_tier, 'free') INTO user_tier
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  IF user_tier = 'free' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'pro_required'
    );
  END IF;
  
  -- Verify page belongs to user
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'page_not_found'
    );
  END IF;
  
  -- Clear any existing primary paid
  UPDATE public.pages
  SET is_primary_paid = false
  WHERE user_id = p_user_id AND is_primary_paid = true;
  
  -- Set new primary paid
  UPDATE public.pages
  SET is_primary_paid = true, is_paid = true
  WHERE id = p_page_id AND user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'page_id', p_page_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;