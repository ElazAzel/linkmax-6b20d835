-- Phase 13: Platform Audit Hardening (Security Remediation)
-- Target: blocks, user_wallets, wallet_transactions, media_assets

-- ==============================================
-- 1. BLOCKS TABLE HARDENING
-- ==============================================

-- Ensure RLS is enabled
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they are loose or redundant
DROP POLICY IF EXISTS "Anyone can view blocks of published pages" ON public.blocks;
DROP POLICY IF EXISTS "Users can manage blocks on own pages" ON public.blocks;

-- Tight Policy: PUBLIC SELECT for published pages
CREATE POLICY "Anyone can view blocks of published pages"
ON public.blocks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = blocks.page_id
    AND (pages.is_published = true OR pages.user_id = auth.uid())
  )
);

-- Tight Policy: MANAGE (ALL) for owner only
CREATE POLICY "Users can manage blocks on own pages"
ON public.blocks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = blocks.page_id
    AND pages.user_id = auth.uid()
  )
);


-- ==============================================
-- 2. FINTECH (WALLETS & TRANSACTIONS) HARDENING
-- ==============================================

-- user_wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
ON public.user_wallets FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all wallets
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
CREATE POLICY "Admins can view all wallets"
ON public.user_wallets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));


-- wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));


-- ==============================================
-- 3. MEDIA ASSETS HARDENING
-- ==============================================

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own media assets" ON public.media_assets;
CREATE POLICY "Users can view own media assets"
ON public.media_assets FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own media assets" ON public.media_assets;
CREATE POLICY "Users can manage own media assets"
ON public.media_assets FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- media_references (Join table)
ALTER TABLE public.media_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own media references" ON public.media_references;
CREATE POLICY "Users can view own media references"
ON public.media_references FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.media_assets
    WHERE media_assets.id = media_references.asset_id
      AND media_assets.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own media references" ON public.media_references;
CREATE POLICY "Users can manage own media references"
ON public.media_references FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.media_assets
    WHERE media_assets.id = media_references.asset_id
      AND media_assets.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.media_assets
    WHERE media_assets.id = media_references.asset_id
      AND media_assets.owner_id = auth.uid()
  )
);

-- The original media lifecycle migration used a different column contract.
-- Replace its functions before any block trigger can execute them.
CREATE UNIQUE INDEX IF NOT EXISTS media_references_block_asset_unique
  ON public.media_references (block_id, asset_id);

CREATE OR REPLACE FUNCTION public.sync_block_media_references()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_urls text[];
  asset_id uuid;
  storage_url text;
  bucket_name text;
  storage_key text;
  page_owner_id uuid;
BEGIN
  found_urls := public.extract_storage_urls(NEW.content);

  SELECT p.user_id
  INTO page_owner_id
  FROM public.pages p
  WHERE p.id = NEW.page_id;

  DELETE FROM public.media_references mr
  WHERE mr.block_id = NEW.id
    AND NOT EXISTS (
      SELECT 1
      FROM public.media_assets ma
      JOIN unnest(found_urls) AS url ON
        ma.bucket_id = split_part(regexp_replace(url, '^.*/storage/v1/object/public/', ''), '/', 1)
        AND ma.storage_path = regexp_replace(url, '^.*/storage/v1/object/public/[^/]+/', '')
      WHERE ma.id = mr.asset_id
    );

  FOREACH storage_url IN ARRAY found_urls
  LOOP
    IF storage_url !~ '/storage/v1/object/public/[^/]+/.+' THEN
      CONTINUE;
    END IF;

    bucket_name := split_part(regexp_replace(storage_url, '^.*/storage/v1/object/public/', ''), '/', 1);
    storage_key := regexp_replace(storage_url, '^.*/storage/v1/object/public/[^/]+/', '');

    INSERT INTO public.media_assets (storage_path, bucket_id, owner_id, last_referenced_at)
    VALUES (storage_key, bucket_name, page_owner_id, now())
    ON CONFLICT (storage_path) DO UPDATE
      SET last_referenced_at = now(),
          owner_id = COALESCE(public.media_assets.owner_id, EXCLUDED.owner_id)
    RETURNING id INTO asset_id;

    INSERT INTO public.media_references (block_id, page_id, asset_id)
    VALUES (NEW.id, NEW.page_id, asset_id)
    ON CONFLICT (block_id, asset_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_media_asset_ref_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.media_assets
    SET reference_count = reference_count + 1,
        last_referenced_at = now()
    WHERE id = NEW.asset_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.media_assets
    SET reference_count = GREATEST(0, reference_count - 1)
    WHERE id = OLD.asset_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_block_media_sync ON public.blocks;
CREATE TRIGGER on_block_media_sync
  AFTER INSERT OR UPDATE OF content ON public.blocks
  FOR EACH ROW
  WHEN (NEW.content IS NOT NULL)
  EXECUTE FUNCTION public.sync_block_media_references();

DROP TRIGGER IF EXISTS on_media_ref_change ON public.media_references;
CREATE TRIGGER on_media_ref_change
  AFTER INSERT OR DELETE ON public.media_references
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_asset_ref_count();
