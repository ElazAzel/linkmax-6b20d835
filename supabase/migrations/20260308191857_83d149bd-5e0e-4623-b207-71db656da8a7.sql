
-- ============================================================
-- P2-A: Indexing submissions log + server diagnostics RPC
-- ============================================================

-- 1. Indexing submissions log table
CREATE TABLE IF NOT EXISTS public.indexing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  target_url text NOT NULL,
  child_type text, -- null for profile, 'service', 'event'
  action_type text NOT NULL DEFAULT 'publish', -- publish, update, unpublish, delete
  provider text NOT NULL, -- 'bing', 'yandex'
  submission_status text NOT NULL DEFAULT 'pending', -- pending, sent, failed, skipped
  skip_reason text, -- throttled, not_indexable, no_slug, low_score
  http_status integer,
  batch_id text, -- correlate multiple URLs in one submission
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for admin queries
CREATE INDEX idx_indexing_submissions_page_id ON public.indexing_submissions(page_id);
CREATE INDEX idx_indexing_submissions_created_at ON public.indexing_submissions(created_at DESC);
CREATE INDEX idx_indexing_submissions_status ON public.indexing_submissions(submission_status);

-- RLS: admin-only read, service-role write (edge function)
ALTER TABLE public.indexing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view indexing submissions"
  ON public.indexing_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Server-authoritative diagnostics RPC
CREATE OR REPLACE FUNCTION public.get_page_search_diagnostics(p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page record;
  v_last_submission record;
  v_recent_submissions jsonb;
  v_child_count integer;
BEGIN
  -- Get page diagnostics fields
  SELECT
    id, slug, is_published, quality_score, quality_breakdown,
    index_exclusion_reasons, last_indexnow_at, service_slugs,
    city, profession, entity_type, niche, updated_at
  INTO v_page
  FROM public.pages
  WHERE id = p_page_id;

  IF v_page IS NULL THEN
    RETURN jsonb_build_object('error', 'page_not_found');
  END IF;

  -- Count child pages from service_slugs
  v_child_count := COALESCE(
    (SELECT count(*) FROM jsonb_object_keys(COALESCE(v_page.service_slugs, '{}'::jsonb))),
    0
  );

  -- Last 5 indexing submissions
  SELECT jsonb_agg(sub ORDER BY sub.created_at DESC)
  INTO v_recent_submissions
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'target_url', s.target_url,
      'provider', s.provider,
      'action_type', s.action_type,
      'status', s.submission_status,
      'skip_reason', s.skip_reason,
      'http_status', s.http_status,
      'created_at', s.created_at
    ) as sub, s.created_at
    FROM public.indexing_submissions s
    WHERE s.page_id = p_page_id
    ORDER BY s.created_at DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'page_id', v_page.id,
    'slug', v_page.slug,
    'is_published', v_page.is_published,
    'quality_score', COALESCE(v_page.quality_score, 0),
    'quality_breakdown', v_page.quality_breakdown,
    'index_exclusion_reasons', v_page.index_exclusion_reasons,
    'is_indexable', (v_page.is_published AND COALESCE(v_page.quality_score, 0) >= 40),
    'included_in_sitemap', (v_page.is_published AND COALESCE(v_page.quality_score, 0) >= 40),
    'last_indexnow_at', v_page.last_indexnow_at,
    'service_slugs', v_page.service_slugs,
    'child_page_count', v_child_count,
    'canonical_url', 'https://lnkmx.my/' || v_page.slug,
    'recent_submissions', COALESCE(v_recent_submissions, '[]'::jsonb),
    'diagnostics_at', now()
  );
END;
$$;
