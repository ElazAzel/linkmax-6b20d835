
-- ============================================
-- P1 SmartLink (Growth OS) + P2 Offers & Signatures (Money/Trust OS)
-- OSS Benchmark Strategy 2026
-- ============================================

-- ---------- P1: SmartLink ----------
CREATE TABLE IF NOT EXISTS public.smart_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  block_id uuid,
  slug text NOT NULL UNIQUE,
  target_url text NOT NULL,
  goal_event text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  downstream_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  conversion_count integer NOT NULL DEFAULT 0,
  last_click_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_links TO authenticated;
GRANT SELECT ON public.smart_links TO anon;
GRANT ALL ON public.smart_links TO service_role;

ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their smart links"
  ON public.smart_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read active smart links"
  ON public.smart_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS smart_links_user_idx ON public.smart_links(user_id);
CREATE INDEX IF NOT EXISTS smart_links_page_idx ON public.smart_links(page_id);
CREATE INDEX IF NOT EXISTS smart_links_slug_active_idx ON public.smart_links(slug) WHERE is_active = true;

CREATE TRIGGER smart_links_set_updated_at
  BEFORE UPDATE ON public.smart_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic click increment (used by redirect edge function)
CREATE OR REPLACE FUNCTION public.increment_smart_link_click(_slug text)
RETURNS TABLE (id uuid, target_url text, user_id uuid, page_id uuid, downstream_action jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.smart_links sl
     SET click_count = sl.click_count + 1,
         last_click_at = now()
   WHERE sl.slug = _slug AND sl.is_active = true
   RETURNING sl.id, sl.target_url, sl.user_id, sl.page_id, sl.downstream_action;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_smart_link_click(text) TO anon, authenticated, service_role;

-- ---------- P2: Offers (Money OS) ----------
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  offer_type text NOT NULL DEFAULT 'one_time' CHECK (offer_type IN ('one_time','subscription','usage','hybrid','donation')),
  price_cents bigint NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'KZT',
  billing_interval text CHECK (billing_interval IN ('day','week','month','year')),
  usage_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT SELECT ON public.offers TO anon;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their offers"
  ON public.offers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read active offers"
  ON public.offers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS offers_user_idx ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS offers_page_idx ON public.offers(page_id);

CREATE TRIGGER offers_set_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- P2: Document signatures (Trust OS) ----------
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.zone_documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_email text NOT NULL,
  signer_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','viewed','signed','declined','expired')),
  signature_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_signatures TO authenticated;
GRANT ALL ON public.document_signatures TO service_role;

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signers read their signatures"
  ON public.document_signatures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Document owners manage signatures"
  ON public.document_signatures FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.zone_documents zd
    WHERE zd.id = document_signatures.document_id
      AND zd.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.zone_documents zd
    WHERE zd.id = document_signatures.document_id
      AND zd.created_by = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS document_signatures_document_idx ON public.document_signatures(document_id);
CREATE INDEX IF NOT EXISTS document_signatures_user_idx ON public.document_signatures(user_id);

CREATE TRIGGER document_signatures_set_updated_at
  BEFORE UPDATE ON public.document_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
