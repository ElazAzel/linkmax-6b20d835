BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
CREATE SCHEMA IF NOT EXISTS profile_refresh_internal;
REVOKE ALL ON SCHEMA profile_refresh_internal FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS profile_refresh_internal.avatar_backups (
  record_kind text NOT NULL, record_id uuid NOT NULL, before_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(record_kind,record_id)
);
REVOKE ALL ON TABLE profile_refresh_internal.avatar_backups FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION pg_temp.standard_avatar(b jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $avatar$
BEGIN
  IF b->>'type'='profile' THEN
    b:=jsonb_set(b,'{avatarShape}','"circle"',true);
    IF jsonb_typeof(b->'content')='object' THEN
      b:=jsonb_set(b,'{content,avatarShape}','"circle"',true);
    END IF;
  ELSIF b->>'type'='avatar' THEN b:=jsonb_set(b,'{shape}','"circle"',true);
  END IF;
  RETURN b;
END $avatar$;

-- Follow the canonical writer's page-first lock order before capturing versions
-- and backups. The small maintenance transaction must see one stable state.
DO $locks$
BEGIN
  PERFORM id FROM public.pages ORDER BY id FOR UPDATE;
  PERFORM page_id FROM public.page_drafts ORDER BY page_id FOR UPDATE;
  PERFORM id FROM public.blocks ORDER BY page_id,id FOR UPDATE;
END $locks$;

CREATE TEMP TABLE avatar_blocks_to_fix ON COMMIT DROP AS
SELECT id,page_id,content FROM public.blocks
WHERE deleted_at IS NULL AND (
  (type='profile' AND (COALESCE(content->>'avatarShape','circle')<>'circle' OR COALESCE(content->'content'->>'avatarShape','circle')<>'circle'))
  OR (type='avatar' AND COALESCE(content->>'shape','circle')<>'circle')
);
CREATE TEMP TABLE avatar_pages_to_fix ON COMMIT DROP AS
SELECT p.id,p.published_revision FROM public.pages p WHERE
  EXISTS(SELECT 1 FROM avatar_blocks_to_fix b WHERE b.page_id=p.id)
  OR COALESCE(p.avatar_style->>'shape','circle')<>'circle';
CREATE TEMP TABLE avatar_drafts_to_fix ON COMMIT DROP AS
SELECT d.page_id FROM public.page_drafts d WHERE
  (jsonb_typeof(d.snapshot->'blocks')='array' AND EXISTS(
    SELECT 1 FROM jsonb_array_elements(d.snapshot->'blocks') b WHERE
      (b->>'type'='profile' AND (COALESCE(b->>'avatarShape','circle')<>'circle' OR COALESCE(b->'content'->>'avatarShape','circle')<>'circle'))
      OR (b->>'type'='avatar' AND COALESCE(b->>'shape','circle')<>'circle')
  )) OR EXISTS(SELECT 1 FROM avatar_pages_to_fix p WHERE p.id=d.page_id AND p.published_revision=d.base_published_revision);

INSERT INTO profile_refresh_internal.avatar_backups(record_kind,record_id,before_value)
SELECT 'block',id,content FROM avatar_blocks_to_fix ON CONFLICT DO NOTHING;
INSERT INTO profile_refresh_internal.avatar_backups(record_kind,record_id,before_value)
SELECT 'page',p.id,jsonb_build_object('avatar_style',p.avatar_style,'published_revision',p.published_revision,'updated_at',p.updated_at)
FROM public.pages p JOIN avatar_pages_to_fix x ON p.id=x.id ON CONFLICT DO NOTHING;
INSERT INTO profile_refresh_internal.avatar_backups(record_kind,record_id,before_value)
SELECT 'draft',d.page_id,to_jsonb(d) FROM public.page_drafts d JOIN avatar_drafts_to_fix x USING(page_id) ON CONFLICT DO NOTHING;

-- Do not let per-block triggers advance a page several times. Advance each
-- affected publication once and rebase only drafts that were current before us.
SELECT set_config('linkmax.publishing_draft','on',true);
UPDATE public.blocks b SET content=pg_temp.standard_avatar(b.content || jsonb_build_object('type',b.type))
FROM avatar_blocks_to_fix x WHERE b.id=x.id;
UPDATE public.pages p SET
  avatar_style=CASE WHEN COALESCE(p.avatar_style->>'shape','circle')<>'circle' THEN jsonb_set(p.avatar_style,'{shape}','"circle"',true) ELSE p.avatar_style END,
  published_revision=p.published_revision+1,updated_at=now()
FROM avatar_pages_to_fix x WHERE p.id=x.id;
UPDATE public.page_drafts d SET
  snapshot=CASE WHEN jsonb_typeof(d.snapshot->'blocks')='array' THEN jsonb_set(d.snapshot,'{blocks}',
    COALESCE((SELECT jsonb_agg(pg_temp.standard_avatar(b) ORDER BY n) FROM jsonb_array_elements(d.snapshot->'blocks') WITH ORDINALITY a(b,n)),'[]'::jsonb),true) ELSE d.snapshot END,
  base_published_revision=CASE WHEN EXISTS(SELECT 1 FROM avatar_pages_to_fix p WHERE p.id=d.page_id AND p.published_revision=d.base_published_revision)
    THEN d.base_published_revision+1 ELSE d.base_published_revision END,
  published_draft_revision=CASE WHEN d.published_draft_revision=d.revision THEN d.revision+1 ELSE d.published_draft_revision END,
  revision=d.revision+1,updated_at=now()
FROM avatar_drafts_to_fix x WHERE d.page_id=x.page_id;
SELECT set_config('linkmax.publishing_draft','off',true);
COMMIT;
SELECT record_kind,count(*) AS backed_up_records FROM profile_refresh_internal.avatar_backups GROUP BY record_kind ORDER BY record_kind;
