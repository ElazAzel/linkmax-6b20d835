-- Disallow anonymous like spam: remove the anon insert branch.
DROP POLICY IF EXISTS "Users can like pages" ON public.page_likes;

CREATE POLICY "Users can like pages"
  ON public.page_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Deduplicate likes per (page, user) and per (page, ip_hash) to prevent inflation.
DELETE FROM public.page_likes a
USING public.page_likes b
WHERE a.ctid < b.ctid
  AND a.page_id = b.page_id
  AND a.user_id IS NOT NULL
  AND a.user_id = b.user_id;

DELETE FROM public.page_likes a
USING public.page_likes b
WHERE a.ctid < b.ctid
  AND a.page_id = b.page_id
  AND a.user_id IS NULL
  AND b.user_id IS NULL
  AND a.ip_hash IS NOT NULL
  AND a.ip_hash = b.ip_hash;

CREATE UNIQUE INDEX IF NOT EXISTS page_likes_unique_user
  ON public.page_likes (page_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS page_likes_unique_ip
  ON public.page_likes (page_id, ip_hash)
  WHERE user_id IS NULL AND ip_hash IS NOT NULL;