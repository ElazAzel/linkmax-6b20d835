-- Private editor state. No existing page, block, history, or media is removed.
CREATE SCHEMA IF NOT EXISTS page_draft_internal;
REVOKE ALL ON SCHEMA page_draft_internal FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA page_draft_internal TO authenticated;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS published_revision bigint NOT NULL DEFAULT 0;
GRANT SELECT (published_revision) ON public.pages TO authenticated;
CREATE TABLE public.page_drafts (
  page_id uuid PRIMARY KEY REFERENCES public.pages(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  published_draft_revision bigint NOT NULL DEFAULT 0,
  base_published_revision bigint NOT NULL,
  chatbot_context text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.page_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.page_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.page_drafts TO authenticated;
CREATE POLICY draft_editor_read ON public.page_drafts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_id AND
    (p.user_id = auth.uid() OR public.can_manage_organization_pages(p.organization_id, auth.uid())))
);

-- Definer code stays outside the exposed schema. Explicit authorization is
-- needed to insert drafts and publish several protected tables atomically.
CREATE FUNCTION page_draft_internal.access_page(p_page_id uuid) RETURNS public.pages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p public.pages;
BEGIN
  SELECT * INTO p FROM public.pages WHERE id = p_page_id FOR UPDATE;
  IF auth.uid() IS NULL OR p.id IS NULL OR NOT
    (p.user_id = auth.uid() OR public.can_manage_organization_pages(p.organization_id, auth.uid())) THEN
    RAISE EXCEPTION 'draft_access_denied' USING ERRCODE = '42501';
  END IF;
  RETURN p;
END $$;

CREATE FUNCTION page_draft_internal.load(p_page_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p public.pages; d public.page_drafts;
BEGIN
  p := page_draft_internal.access_page(p_page_id);
  SELECT * INTO d FROM public.page_drafts WHERE page_id = p.id;
  IF d.page_id IS NULL THEN
    -- Loading does not bootstrap from browser data: use the current publication.
    INSERT INTO public.page_drafts(page_id, snapshot, base_published_revision, chatbot_context)
    VALUES(p.id, jsonb_build_object('id',p.id,'userId',p.user_id,'slug',p.slug,
      'blocks',COALESCE((SELECT jsonb_agg(content ORDER BY position) FROM public.blocks WHERE page_id=p.id AND deleted_at IS NULL),'[]'::jsonb),
      'theme',p.theme_settings,'seo',p.seo_meta,'isPublished',p.is_published,
      'editorMode',p.editor_mode,'gridConfig',p.grid_config,'integrations',p.integrations,
      'favicon_url',p.favicon_url,'hideBranding',p.hide_branding,'isIndexable',p.is_indexable,
      'organization_id',p.organization_id,'niche',p.niche,'city',p.city,'profession',p.profession,
      'entity_type',p.entity_type,'contact_email',p.contact_email,'contact_phone',p.contact_phone,
      'contact_whatsapp',p.contact_whatsapp,'country_code',p.country_code,
      'webhook_url',p.webhook_url,'webhook_secret',p.webhook_secret),
      p.published_revision,COALESCE((SELECT chatbot_context FROM public.private_page_data WHERE page_id=p.id),'')) RETURNING * INTO d;
  END IF;
  RETURN to_jsonb(d);
END $$;

CREATE FUNCTION page_draft_internal.save(p_page_id uuid, p_snapshot jsonb, p_expected_revision bigint, p_base_published_revision bigint, p_chatbot_context text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p public.pages; d public.page_drafts;
BEGIN
  p := page_draft_internal.access_page(p_page_id);
  IF jsonb_typeof(p_snapshot) IS DISTINCT FROM 'object' OR jsonb_typeof(p_snapshot->'blocks') IS DISTINCT FROM 'array'
    OR p_snapshot->>'id' IS DISTINCT FROM p.id::text THEN
    RAISE EXCEPTION 'invalid_draft_snapshot' USING ERRCODE='22023';
  END IF;
  PERFORM page_draft_internal.load(p.id);
  UPDATE public.page_drafts SET snapshot=p_snapshot, revision=revision+1,
    chatbot_context=COALESCE(p_chatbot_context,''), updated_at=now()
  WHERE page_id=p.id AND revision=p_expected_revision AND base_published_revision=p_base_published_revision
    AND p.published_revision=p_base_published_revision RETURNING * INTO d;
  IF d.page_id IS NULL THEN RAISE EXCEPTION 'draft_conflict' USING ERRCODE='40001'; END IF;
  RETURN to_jsonb(d);
END $$;

-- Preserve the canonical block normalization, quality scoring, service URL and
-- soft-delete behavior. The private copy broadens only its ownership predicate.
DO $$ DECLARE source text; updated text; BEGIN
  source := pg_get_functiondef('public.save_page_blocks(uuid,jsonb,boolean)'::regprocedure);
  updated := replace(source, 'public.save_page_blocks(', 'page_draft_internal.save_page_blocks(');
  updated := replace(updated, 'id = p_page_id AND user_id = auth.uid()',
    'id = p_page_id AND (user_id = auth.uid() OR public.can_manage_organization_pages(organization_id, auth.uid()))');
  IF updated = source OR position('can_manage_organization_pages' in updated)=0 THEN
    RAISE EXCEPTION 'Review canonical save_page_blocks before installing page drafts';
  END IF;
  EXECUTE updated;
  -- Suppress intermediate legacy snapshots during this atomic publisher only.
  source := pg_get_functiondef('public.create_page_snapshot()'::regprocedure);
  EXECUTE regexp_replace(source, 'BEGIN', 'BEGIN
    IF current_setting(''linkmax.publishing_draft'', true) = ''on'' THEN RETURN NEW; END IF;', 'i');
END $$;

CREATE FUNCTION page_draft_internal.publish(p_page_id uuid,p_expected_revision bigint,p_base_published_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p public.pages; d public.page_drafts; s jsonb; profile jsonb; prepared jsonb; event jsonb;
BEGIN
  p := page_draft_internal.access_page(p_page_id);
  SELECT * INTO d FROM public.page_drafts WHERE page_id=p.id FOR UPDATE;
  IF d.page_id IS NULL OR d.revision<>p_expected_revision OR d.base_published_revision<>p_base_published_revision
     OR p.published_revision<>p_base_published_revision THEN
    RAISE EXCEPTION 'draft_conflict' USING ERRCODE='40001';
  END IF;
  s := d.snapshot;
  SELECT value INTO profile FROM jsonb_array_elements(s->'blocks') WHERE value->>'type'='profile' LIMIT 1;
  IF profile IS NULL THEN RAISE EXCEPTION 'draft_profile_required' USING ERRCODE='22023'; END IF;
  PERFORM set_config('linkmax.publishing_draft','on',true);
  -- Reuse database block IDs by authored ID so analytics and media references survive.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',COALESCE((SELECT id FROM public.blocks WHERE page_id=p.id AND content->>'id'=b.value->>'id' ORDER BY deleted_at NULLS FIRST LIMIT 1),gen_random_uuid()),
    'type',b.value->>'type','position',b.ordinality-1,'title',b.value->>'title',
    'content',b.value,'style','{}'::jsonb,'schedule',b.value->'schedule')), '[]'::jsonb)
  INTO prepared FROM jsonb_array_elements(s->'blocks') WITH ORDINALITY b;
  UPDATE public.pages SET
    title=COALESCE(profile->>'name',profile->>'title',title), description=COALESCE(profile->>'bio',description),
    avatar_url=COALESCE(profile->>'avatar',avatar_url), theme_settings=s->'theme',seo_meta=s->'seo',
    editor_mode=COALESCE(s->>'editorMode',editor_mode),grid_config=s->'gridConfig',integrations=s->'integrations',
    favicon_url=s->>'favicon_url',hide_branding=COALESCE((s->>'hideBranding')::boolean,false),
    is_indexable=COALESCE((s->>'isIndexable')::boolean,is_indexable),niche=s->>'niche',city=s->>'city',
    profession=s->>'profession',entity_type=COALESCE(s->>'entity_type',entity_type),
    contact_email=s->>'contact_email',contact_phone=s->>'contact_phone',contact_whatsapp=s->>'contact_whatsapp',country_code=s->>'country_code',
    webhook_url=s->>'webhook_url',webhook_secret=s->>'webhook_secret',
    is_published=true,updated_at=now(),published_revision=published_revision+1
  WHERE id=p.id;
  PERFORM page_draft_internal.save_page_blocks(p.id,prepared,false);
  -- Event registration data becomes visible only with its published block.
  -- Removed blocks hide the event without deleting registrations or payments.
  UPDATE public.events SET status='draft' WHERE page_id=p.id AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(s->'blocks') b WHERE b->>'type'='event' AND b->>'eventId'=events.id::text
  );
  FOR event IN SELECT value FROM jsonb_array_elements(s->'blocks') WHERE value->>'type'='event' AND nullif(value->>'eventId','') IS NOT NULL LOOP
    IF EXISTS(SELECT 1 FROM public.events WHERE id=(event->>'eventId')::uuid AND page_id<>p.id) THEN
      RAISE EXCEPTION 'draft_event_access_denied' USING ERRCODE='42501';
    END IF;
    INSERT INTO public.events(id,block_id,page_id,owner_id,title_i18n_json,description_i18n_json,cover_url,start_at,end_at,timezone,
      registration_closes_at,location_type,location_value,is_paid,price_amount,currency,capacity,status,form_schema_json,settings_json)
    VALUES((event->>'eventId')::uuid,event->>'id',p.id,p.user_id,COALESCE(event->'title','{}'),COALESCE(event->'description','{}'),event->>'coverUrl',
      nullif(event->>'startAt','')::timestamptz,nullif(event->>'endAt','')::timestamptz,event->>'timezone',nullif(event->>'registrationClosesAt','')::timestamptz,
      event->>'locationType',event->>'locationValue',COALESCE((event->>'isPaid')::boolean,false),(event->>'price')::numeric,event->>'currency',
      (event->>'capacity')::integer,COALESCE(event->>'status','draft'),COALESCE(event->'formFields','[]'),COALESCE(event->'settings','{}'))
    ON CONFLICT(id) DO UPDATE SET block_id=EXCLUDED.block_id,title_i18n_json=EXCLUDED.title_i18n_json,description_i18n_json=EXCLUDED.description_i18n_json,
      cover_url=EXCLUDED.cover_url,start_at=EXCLUDED.start_at,end_at=EXCLUDED.end_at,timezone=EXCLUDED.timezone,registration_closes_at=EXCLUDED.registration_closes_at,
      location_type=EXCLUDED.location_type,location_value=EXCLUDED.location_value,is_paid=EXCLUDED.is_paid,price_amount=EXCLUDED.price_amount,
      currency=EXCLUDED.currency,capacity=EXCLUDED.capacity,status=EXCLUDED.status,form_schema_json=EXCLUDED.form_schema_json,settings_json=EXCLUDED.settings_json,updated_at=now();
  END LOOP;
  INSERT INTO public.private_page_data(page_id,chatbot_context) VALUES(p.id,d.chatbot_context)
    ON CONFLICT(page_id) DO UPDATE SET chatbot_context=EXCLUDED.chatbot_context;
  INSERT INTO public.page_snapshots(page_id,version_id,content_hash,blocks_json,theme_json,seo_json)
  VALUES(p.id,'draft-'||(p.published_revision+1),substr(md5(s::text),1,16),s->'blocks',s->'theme',s->'seo');
  UPDATE public.page_drafts SET base_published_revision=p.published_revision+1,published_draft_revision=revision,
    snapshot=jsonb_set(snapshot,'{isPublished}','true'),updated_at=now() WHERE page_id=p.id RETURNING * INTO d;
  PERFORM set_config('linkmax.publishing_draft','off',true);
  RETURN to_jsonb(d)||jsonb_build_object('slug',p.slug);
END $$;

CREATE FUNCTION public.load_page_draft(p_page_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT page_draft_internal.load(p_page_id)$$;
CREATE FUNCTION public.save_page_draft(p_page_id uuid,p_snapshot jsonb,p_expected_revision bigint,p_base_published_revision bigint,p_chatbot_context text DEFAULT '') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT page_draft_internal.save(p_page_id,p_snapshot,p_expected_revision,p_base_published_revision,p_chatbot_context)$$;
CREATE FUNCTION public.publish_page_draft(p_page_id uuid,p_expected_revision bigint,p_base_published_revision bigint) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT page_draft_internal.publish(p_page_id,p_expected_revision,p_base_published_revision)$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA page_draft_internal FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION page_draft_internal.load(uuid),page_draft_internal.save(uuid,jsonb,bigint,bigint,text),page_draft_internal.publish(uuid,bigint,bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.load_page_draft(uuid),public.save_page_draft(uuid,jsonb,bigint,bigint,text),public.publish_page_draft(uuid,bigint,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.load_page_draft(uuid),public.save_page_draft(uuid,jsonb,bigint,bigint,text),public.publish_page_draft(uuid,bigint,bigint) TO authenticated;

-- Existing external integrations remain supported. Their content writes also
-- advance the publication revision, so an older editor cannot overwrite them.
CREATE FUNCTION page_draft_internal.track_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF current_setting('linkmax.publishing_draft',true) IS DISTINCT FROM 'on' AND
    (NEW.theme_settings,NEW.seo_meta,NEW.title,NEW.description,NEW.avatar_url,NEW.editor_mode,NEW.grid_config,NEW.integrations,NEW.is_published,NEW.slug,
     NEW.niche,NEW.city,NEW.profession,NEW.entity_type,NEW.contact_email,NEW.contact_phone,NEW.contact_whatsapp,NEW.country_code,
     NEW.favicon_url,NEW.hide_branding,NEW.is_indexable,NEW.webhook_url,NEW.webhook_secret)
    IS DISTINCT FROM
    (OLD.theme_settings,OLD.seo_meta,OLD.title,OLD.description,OLD.avatar_url,OLD.editor_mode,OLD.grid_config,OLD.integrations,OLD.is_published,OLD.slug,
     OLD.niche,OLD.city,OLD.profession,OLD.entity_type,OLD.contact_email,OLD.contact_phone,OLD.contact_whatsapp,OLD.country_code,
     OLD.favicon_url,OLD.hide_branding,OLD.is_indexable,OLD.webhook_url,OLD.webhook_secret) THEN
    NEW.published_revision := OLD.published_revision+1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER page_draft_track_publication BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION page_draft_internal.track_publication();
CREATE FUNCTION page_draft_internal.track_blocks() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF current_setting('linkmax.publishing_draft',true) IS DISTINCT FROM 'on' THEN
    IF TG_OP='DELETE' THEN UPDATE public.pages SET published_revision=published_revision+1 WHERE id=OLD.page_id;
    ELSIF TG_OP='INSERT' OR (NEW.content,NEW.position,NEW.deleted_at) IS DISTINCT FROM (OLD.content,OLD.position,OLD.deleted_at) THEN
      UPDATE public.pages SET published_revision=published_revision+1 WHERE id=NEW.page_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER page_draft_track_blocks AFTER INSERT OR UPDATE OR DELETE ON public.blocks FOR EACH ROW EXECUTE FUNCTION page_draft_internal.track_blocks();
REVOKE ALL ON FUNCTION page_draft_internal.track_publication(),page_draft_internal.track_blocks() FROM PUBLIC,anon,authenticated;
CREATE POLICY draft_editors_read_history ON public.page_snapshots FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.pages p WHERE p.id=page_id AND (p.user_id=auth.uid() OR public.can_manage_organization_pages(p.organization_id,auth.uid())))
);

-- Recovery copies are private, retained independently of the active draft.
CREATE TABLE page_draft_internal.recovery_backups (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
 draft jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON page_draft_internal.recovery_backups FROM PUBLIC,anon,authenticated;
CREATE FUNCTION page_draft_internal.reload(p_page_id uuid,p_expected_revision bigint,p_base_published_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.pages; d public.page_drafts; recovered public.page_drafts;
BEGIN
 p := page_draft_internal.access_page(p_page_id);
 SELECT * INTO d FROM public.page_drafts WHERE page_id=p.id FOR UPDATE;
 IF d.page_id IS NULL OR d.revision IS DISTINCT FROM p_expected_revision
    OR d.base_published_revision IS DISTINCT FROM p_base_published_revision THEN
   RAISE EXCEPTION 'draft_conflict' USING ERRCODE='40001';
 END IF;
 -- A private-draft conflict simply reloads the latest private version. Only
 -- explicit recovery of an obsolete publication base replaces that version.
 IF d.base_published_revision=p.published_revision THEN RETURN to_jsonb(d); END IF;
 INSERT INTO page_draft_internal.recovery_backups(page_id,draft) VALUES(p.id,to_jsonb(d));
 DELETE FROM public.page_drafts WHERE page_id=p.id;
 PERFORM page_draft_internal.load(p.id);
 UPDATE public.page_drafts SET revision=d.revision+1,published_draft_revision=d.revision+1
 WHERE page_id=p.id RETURNING * INTO recovered;
 RETURN to_jsonb(recovered);
END $$;
CREATE FUNCTION public.reload_page_draft(p_page_id uuid,p_expected_revision bigint,p_base_published_revision bigint)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT page_draft_internal.reload(p_page_id,p_expected_revision,p_base_published_revision)$$;
REVOKE ALL ON FUNCTION page_draft_internal.reload(uuid,bigint,bigint),public.reload_page_draft(uuid,bigint,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION page_draft_internal.reload(uuid,bigint,bigint),public.reload_page_draft(uuid,bigint,bigint) TO authenticated;
