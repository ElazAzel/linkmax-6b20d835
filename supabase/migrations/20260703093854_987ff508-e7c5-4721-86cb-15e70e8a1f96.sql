
-- Object graph consolidation (P0 — OSS Benchmark 2026)
-- Unifies personal leads (solo creators) and B2B zone contacts under one
-- read-only view so analytics and CRM UIs can query a single pipeline surface.

CREATE OR REPLACE VIEW public.unified_pipeline_contacts
WITH (security_invoker = true)
AS
SELECT
  l.id                                              AS id,
  'lead'::text                                      AS source_object_type,
  l.id                                              AS source_object_id,
  l.user_id                                         AS owner_user_id,
  NULL::uuid                                        AS zone_id,
  l.name                                            AS name,
  l.email                                           AS email,
  l.phone                                           AS phone,
  NULL::text                                        AS company,
  NULLIF(l.source::text, '')                        AS source,
  NULLIF(l.status::text, '')                        AS status,
  l.metadata                                        AS metadata,
  l.created_at                                      AS created_at,
  l.updated_at                                      AS updated_at
FROM public.leads l
UNION ALL
SELECT
  zc.id                                             AS id,
  'contact'::text                                   AS source_object_type,
  zc.id                                             AS source_object_id,
  zc.owner_user_id                                  AS owner_user_id,
  zc.zone_id                                        AS zone_id,
  zc.name                                           AS name,
  zc.email                                          AS email,
  zc.phone                                          AS phone,
  zc.company                                        AS company,
  zc.source                                         AS source,
  NULL::text                                        AS status,
  COALESCE(zc.custom_fields, '{}'::jsonb)           AS metadata,
  zc.created_at                                     AS created_at,
  zc.updated_at                                     AS updated_at
FROM public.zone_contacts zc
WHERE zc.deleted_at IS NULL;

GRANT SELECT ON public.unified_pipeline_contacts TO authenticated;
GRANT SELECT ON public.unified_pipeline_contacts TO service_role;

COMMENT ON VIEW public.unified_pipeline_contacts IS
  'P0 object-graph consolidation: единый read-only surface для leads (solo) и zone_contacts (B2B). security_invoker=true — RLS исходных таблиц применяется автоматически.';

-- Индекс для быстрого поиска событий/автоматизаций по source_object_id,
-- который аналитический слой пишет в metadata (см. event-taxonomy.ts).
CREATE INDEX IF NOT EXISTS analytics_source_object_id_idx
  ON public.analytics ((metadata->>'source_object_id'))
  WHERE metadata ? 'source_object_id';

CREATE INDEX IF NOT EXISTS analytics_canonical_event_idx
  ON public.analytics ((metadata->>'event'))
  WHERE metadata ? 'event';
