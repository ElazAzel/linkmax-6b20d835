-- Preserve block ownership across UPSERT conflicts, including concurrent inserts.
DO $$ DECLARE signature text; source text; updated text; BEGIN
  FOREACH signature IN ARRAY ARRAY['public.save_page_blocks(uuid,jsonb,boolean)', 'page_draft_internal.save_page_blocks(uuid,jsonb,boolean)'] LOOP
    source := pg_get_functiondef(signature::regprocedure);
    updated := replace(source, 'deleted_at = NULL;',
      'deleted_at = NULL WHERE public.blocks.page_id = EXCLUDED.page_id;
    IF NOT FOUND THEN RAISE EXCEPTION ''block_page_mismatch'' USING ERRCODE = ''42501''; END IF;');
    IF updated = source THEN RAISE EXCEPTION 'Review block writer before applying ownership guard: %', signature; END IF;
    EXECUTE updated;
  END LOOP;
  source := pg_get_functiondef('page_draft_internal.publish(uuid,bigint,bigint)'::regprocedure);
  updated := replace(replace(replace(source,
    'd.revision<>p_expected_revision', 'd.revision IS DISTINCT FROM p_expected_revision'),
    'd.base_published_revision<>p_base_published_revision', 'd.base_published_revision IS DISTINCT FROM p_base_published_revision'),
    'p.published_revision<>p_base_published_revision', 'p.published_revision IS DISTINCT FROM p_base_published_revision');
  IF updated = source THEN RAISE EXCEPTION 'Review publisher before applying revision guard'; END IF;
  EXECUTE updated;
END $$;

-- Keep the existing owner/admin policies. Public readers only see active blocks.
ALTER POLICY "Anyone can view blocks of published pages" ON public.blocks
USING (deleted_at IS NULL AND EXISTS (
  SELECT 1 FROM public.pages p WHERE p.id = blocks.page_id
    AND (p.is_published = true OR p.user_id = auth.uid())
));
CREATE INDEX IF NOT EXISTS blocks_active_page_position ON public.blocks(page_id,position) WHERE deleted_at IS NULL;
