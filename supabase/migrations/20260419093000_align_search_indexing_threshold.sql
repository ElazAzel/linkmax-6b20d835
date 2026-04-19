-- Align search indexability with the SEO edge layer.
-- Profiles become indexable at 25 points unless explicitly hidden.

CREATE OR REPLACE FUNCTION public.normalize_page_search_exclusions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.index_exclusion_reasons := COALESCE(NEW.index_exclusion_reasons, '{}'::text[]);

  IF COALESCE(NEW.quality_score, 0) >= 25 THEN
    NEW.index_exclusion_reasons := array_remove(NEW.index_exclusion_reasons, 'low_quality_score');
  ELSIF NOT ('low_quality_score' = ANY(NEW.index_exclusion_reasons)) THEN
    NEW.index_exclusion_reasons := array_append(NEW.index_exclusion_reasons, 'low_quality_score');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_page_search_exclusions ON public.pages;

CREATE TRIGGER trg_normalize_page_search_exclusions
BEFORE INSERT OR UPDATE OF quality_score, index_exclusion_reasons
ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.normalize_page_search_exclusions();

UPDATE public.pages
SET index_exclusion_reasons = CASE
  WHEN COALESCE(quality_score, 0) >= 25 THEN
    array_remove(COALESCE(index_exclusion_reasons, '{}'::text[]), 'low_quality_score')
  WHEN NOT ('low_quality_score' = ANY(COALESCE(index_exclusion_reasons, '{}'::text[]))) THEN
    array_append(COALESCE(index_exclusion_reasons, '{}'::text[]), 'low_quality_score')
  ELSE
    COALESCE(index_exclusion_reasons, '{}'::text[])
END;

CREATE OR REPLACE FUNCTION public.get_page_search_diagnostics(p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page record;
  v_recent_submissions jsonb;
  v_child_total integer := 0;
  v_child_eligible integer := 0;
  v_child_excluded_thin integer := 0;
  v_child_removed integer := 0;
  v_child_details jsonb := '[]'::jsonb;
  v_entry_key text;
  v_entry_val jsonb;
  v_svc_slug text;
  v_svc_state text;
  v_svc_title text;
  v_is_indexable boolean;
  v_child_last_indexnow timestamptz;
  v_child_last_status text;
BEGIN
  SELECT
    id, slug, is_published, is_indexable, quality_score, quality_breakdown,
    index_exclusion_reasons, last_indexnow_at, service_slugs,
    city, profession, entity_type, niche, updated_at
  INTO v_page
  FROM public.pages
  WHERE id = p_page_id;

  IF v_page IS NULL THEN
    RETURN jsonb_build_object('error', 'page_not_found');
  END IF;

  v_is_indexable :=
    v_page.is_published
    AND COALESCE(v_page.is_indexable, true)
    AND COALESCE(v_page.quality_score, 0) >= 25;

  FOR v_entry_key, v_entry_val IN
    SELECT * FROM jsonb_each(COALESCE(v_page.service_slugs, '{}'::jsonb))
  LOOP
    IF jsonb_typeof(v_entry_val) != 'object' THEN CONTINUE; END IF;

    v_child_total := v_child_total + 1;
    v_svc_slug := v_entry_val->>'slug';
    v_svc_state := v_entry_val->>'state';
    v_svc_title := COALESCE(v_entry_val->>'title', v_entry_key);

    SELECT created_at, submission_status
    INTO v_child_last_indexnow, v_child_last_status
    FROM public.indexing_submissions
    WHERE page_id = p_page_id AND child_item_id = v_entry_key
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_svc_state = 'removed' THEN
      v_child_removed := v_child_removed + 1;
    ELSIF v_svc_state = 'thin' THEN
      v_child_excluded_thin := v_child_excluded_thin + 1;
    ELSIF v_is_indexable THEN
      v_svc_state := 'eligible';
      v_child_eligible := v_child_eligible + 1;
    ELSE
      v_svc_state := 'parent_not_indexable';
    END IF;

    v_child_details := v_child_details || jsonb_build_array(jsonb_build_object(
      'id', v_entry_key,
      'title', v_svc_title,
      'slug', v_svc_slug,
      'state', v_svc_state,
      'url', 'https://lnkmx.my/' || v_page.slug || '/services/' || v_svc_slug,
      'last_indexnow_at', v_child_last_indexnow,
      'last_submission_status', v_child_last_status
    ));
  END LOOP;

  SELECT COALESCE(jsonb_agg(sub ORDER BY sub_created DESC), '[]'::jsonb)
  INTO v_recent_submissions
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'target_url', s.target_url,
      'child_type', s.child_type,
      'child_item_id', s.child_item_id,
      'child_slug', s.child_slug,
      'provider', s.provider,
      'action_type', s.action_type,
      'status', s.submission_status,
      'skip_reason', s.skip_reason,
      'http_status', s.http_status,
      'created_at', s.created_at
    ) AS sub, s.created_at AS sub_created
    FROM public.indexing_submissions s
    WHERE s.page_id = p_page_id
    ORDER BY s.created_at DESC
    LIMIT 20
  ) t;

  RETURN jsonb_build_object(
    'page_id', v_page.id,
    'slug', v_page.slug,
    'is_published', v_page.is_published,
    'quality_score', COALESCE(v_page.quality_score, 0),
    'quality_breakdown', v_page.quality_breakdown,
    'index_exclusion_reasons', v_page.index_exclusion_reasons,
    'is_indexable', v_is_indexable,
    'included_in_sitemap', v_is_indexable,
    'last_indexnow_at', v_page.last_indexnow_at,
    'service_slugs', v_page.service_slugs,
    'canonical_url', 'https://lnkmx.my/' || v_page.slug,
    'child_page_count', v_child_total - v_child_removed,
    'child_summary', jsonb_build_object(
      'total', v_child_total,
      'eligible', v_child_eligible,
      'excluded_thin', v_child_excluded_thin,
      'removed', v_child_removed,
      'parent_not_indexable', v_child_total - v_child_eligible - v_child_excluded_thin - v_child_removed
    ),
    'child_details', v_child_details,
    'recent_submissions', v_recent_submissions,
    'diagnostics_at', now()
  );
END;
$$;
