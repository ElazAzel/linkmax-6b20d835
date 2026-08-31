-- Media Reference Tracking Logic

-- 1. Function to extract Supabase Storage URLs from JSON content
CREATE OR REPLACE FUNCTION public.extract_storage_urls(content jsonb)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    urls text[];
    content_text text;
BEGIN
    content_text := content::text;
    -- Matches Supabase storage URLs (adjust pattern if needed for your specific bucket/project structure)
    -- Example: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    -- We look for /storage/v1/object/public/
    SELECT ARRAY_AGG(DISTINCT matches[1])
    INTO urls
    FROM (
        SELECT regexp_matches(content_text, '"(https?://[^"]+/storage/v1/object/public/[^"]+)"', 'g') as matches
    ) s;
    
    RETURN COALESCE(urls, ARRAY[]::text[]);
END;
$$;

-- 2. Function to update media references for a block
CREATE OR REPLACE FUNCTION public.sync_block_media_references()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_urls text[];
    url text;
    asset_id uuid;
BEGIN
    -- Extract URLs from new block content
    found_urls := public.extract_storage_urls(NEW.content);
    
    -- a. Remove references that are no longer in the block
    DELETE FROM public.media_references
    WHERE block_id = NEW.id
    AND media_asset_id NOT IN (
        SELECT id FROM public.media_assets WHERE url = ANY(found_urls)
    );
    
    -- b. Add new references
    FOREACH url IN ARRAY found_urls
    LOOP
        -- Ensure asset exists
        INSERT INTO public.media_assets (url)
        VALUES (url)
        ON CONFLICT (url) DO UPDATE SET updated_at = now()
        RETURNING id INTO asset_id;
        
        -- Create reference if not exists
        INSERT INTO public.media_references (block_id, media_asset_id)
        VALUES (NEW.id, asset_id)
        ON CONFLICT (block_id, media_asset_id) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- 3. Trigger on blocks table
DROP TRIGGER IF EXISTS on_block_media_sync ON public.blocks;
CREATE TRIGGER on_block_media_sync
    AFTER INSERT OR UPDATE ON public.blocks
    FOR EACH ROW
    WHEN (NEW.content IS NOT NULL)
    EXECUTE FUNCTION public.sync_block_media_references();

-- 4. Automatically update reference_count in media_assets
CREATE OR REPLACE FUNCTION public.update_media_asset_ref_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.media_assets 
        SET reference_count = reference_count + 1,
            deleted_at = NULL
        WHERE id = NEW.media_asset_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.media_assets 
        SET reference_count = GREATEST(0, reference_count - 1),
            deleted_at = CASE WHEN reference_count - 1 <= 0 THEN now() ELSE NULL END
        WHERE id = OLD.media_asset_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_media_ref_change ON public.media_references;
CREATE TRIGGER on_media_ref_change
    AFTER INSERT OR DELETE ON public.media_references
    FOR EACH ROW
    EXECUTE FUNCTION public.update_media_asset_ref_count();
