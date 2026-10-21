-- Legacy seed stored the KZT symbol inside a field rendered with its own symbol.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $prices$
DECLARE p public.pages; d public.page_drafts; saved jsonb; next_blocks jsonb;
  previous_sub text:=current_setting('request.jwt.claim.sub',true);
BEGIN
  SELECT * INTO p FROM public.pages WHERE id='3229befa-752c-4032-9eac-4e4f63e7ade0' FOR UPDATE;
  IF p.slug IS DISTINCT FROM 'demo-nails' OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p.user_id AND email='demoaccount1@gmail.com') THEN
    RAISE EXCEPTION 'demo_price_owner_mismatch';
  END IF;
  SELECT * INTO d FROM public.page_drafts WHERE page_id=p.id FOR UPDATE;
  IF d.page_id IS NULL OR d.revision<>d.published_draft_revision OR d.base_published_revision<>p.published_revision THEN
    RAISE EXCEPTION 'demo_price_draft_conflict';
  END IF;
  SELECT jsonb_agg(CASE WHEN b->>'type'='pricing' THEN jsonb_set(b,'{items}',
    (SELECT jsonb_agg(CASE WHEN item->>'price' ~ '^[0-9[:space:]]+₸$' THEN
      jsonb_set(item,'{price}',to_jsonb(regexp_replace(item->>'price','[^0-9]','','g')::numeric)) ELSE item END ORDER BY i)
     FROM jsonb_array_elements(b->'items') WITH ORDINALITY a(item,i))) ELSE b END ORDER BY n)
  INTO next_blocks FROM jsonb_array_elements(d.snapshot->'blocks') WITH ORDINALITY a(b,n);
  IF next_blocks IS NOT DISTINCT FROM d.snapshot->'blocks' THEN RETURN; END IF;
  INSERT INTO profile_refresh_internal.page_backups(run_key,page_id,payload)
  VALUES('demo-nails-prices-2026-10-21',p.id,jsonb_build_object('page',to_jsonb(p),'draft',to_jsonb(d),
    'blocks',(SELECT jsonb_agg(to_jsonb(b)) FROM public.blocks b WHERE page_id=p.id))) ON CONFLICT DO NOTHING;
  PERFORM set_config('request.jwt.claim.sub',p.user_id::text,true);
  SELECT public.save_page_draft(p.id,jsonb_set(d.snapshot,'{blocks}',next_blocks),d.revision,d.base_published_revision,d.chatbot_context) INTO saved;
  PERFORM public.publish_page_draft(p.id,(saved->>'revision')::bigint,d.base_published_revision);
  PERFORM set_config('request.jwt.claim.sub',COALESCE(previous_sub,''),true);
  UPDATE profile_refresh_internal.page_backups SET applied_at=now() WHERE run_key='demo-nails-prices-2026-10-21' AND page_id=p.id;
END $prices$;
COMMIT;
SELECT slug,published_revision FROM public.pages WHERE id='3229befa-752c-4032-9eac-4e4f63e7ade0';
