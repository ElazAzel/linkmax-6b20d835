-- The existing /demo_nails route redirects to /demo-nails. Preserve the page
-- identity, services and bookings while bringing the old seed into alignment.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $repair$
DECLARE p public.pages; d public.page_drafts;
BEGIN
  SELECT * INTO p FROM public.pages WHERE id='3229befa-752c-4032-9eac-4e4f63e7ade0' FOR UPDATE;
  IF p.slug='demo-nails' THEN RETURN; END IF;
  IF p.slug IS DISTINCT FROM 'demo_nails' OR NOT EXISTS(
    SELECT 1 FROM auth.users WHERE id=p.user_id AND email='demoaccount1@gmail.com'
  ) THEN RAISE EXCEPTION 'demo_address_owner_mismatch'; END IF;
  IF EXISTS(SELECT 1 FROM public.pages WHERE slug='demo-nails') THEN RAISE EXCEPTION 'demo_address_already_taken'; END IF;
  SELECT * INTO d FROM public.page_drafts WHERE page_id=p.id FOR UPDATE;
  IF d.page_id IS NULL OR d.revision<>d.published_draft_revision OR d.base_published_revision<>p.published_revision THEN
    RAISE EXCEPTION 'demo_address_draft_conflict';
  END IF;
  INSERT INTO profile_refresh_internal.page_backups(run_key,page_id,payload)
  VALUES('canonical-demo-nails-2026-10-21',p.id,jsonb_build_object('page',to_jsonb(p),'draft',to_jsonb(d))) ON CONFLICT DO NOTHING;
  PERFORM set_config('linkmax.publishing_draft','on',true);
  UPDATE public.pages SET slug='demo-nails',published_revision=published_revision+1,updated_at=now() WHERE id=p.id;
  UPDATE public.page_drafts SET snapshot=jsonb_set(snapshot,'{slug}','"demo-nails"'),
    revision=revision+1,published_draft_revision=published_draft_revision+1,
    base_published_revision=base_published_revision+1,updated_at=now() WHERE page_id=p.id;
  UPDATE profile_refresh_internal.page_backups SET applied_at=now()
    WHERE run_key='canonical-demo-nails-2026-10-21' AND page_id=p.id;
END $repair$;
COMMIT;
SELECT slug,published_revision FROM public.pages WHERE id='3229befa-752c-4032-9eac-4e4f63e7ade0';
