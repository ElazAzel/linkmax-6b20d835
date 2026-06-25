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
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own media assets" ON public.media_assets;
CREATE POLICY "Users can manage own media assets"
ON public.media_assets FOR ALL
USING (auth.uid() = user_id);

-- media_references (Join table)
ALTER TABLE public.media_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own media references" ON public.media_references;
CREATE POLICY "Users can view own media references"
ON public.media_references FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own media references" ON public.media_references;
CREATE POLICY "Users can manage own media references"
ON public.media_references FOR ALL
USING (auth.uid() = user_id);
