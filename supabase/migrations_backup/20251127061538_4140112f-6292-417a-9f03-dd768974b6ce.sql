-- Fix search_path security warnings for functions

-- Update increment_view_count function
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

-- Update increment_block_clicks function
CREATE OR REPLACE FUNCTION public.increment_block_clicks(block_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blocks
  SET click_count = click_count + 1
  WHERE id = block_uuid;
END;
$$;

-- Update update_updated_at_column function
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

-- Update generate_unique_slug function
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