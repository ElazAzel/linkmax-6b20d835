/**
 * Public page snapshot for SSR — fetched with a plain REST call so it runs the
 * same on the server and in the browser (no auth session, no view counting).
 * The client still loads the page through usePublicPage, which counts the view.
 */
import type { Block, GridConfig, PageData, PageTheme } from '@/types/page';
import { ensureBlockIds } from '@/lib/blocks/block-ids';
import type { ServiceSlugsMap } from './service-resolver';

/** PageData plus the page-record fields SEO falls back to. */
export type PublicPageData = PageData & {
  title?: string;
  description?: string;
  avatar_url?: string;
  createdAt?: string;
  serviceSlugs?: ServiceSlugsMap | null;
};

export type PublicPageSnapshot =
  | { status: 'ok'; page: PublicPageData }
  | { status: 'missing' }
  | { status: 'error' };

interface SnapshotBlockRow {
  position: number | null;
  deleted_at?: string | null;
  content: unknown;
}

interface SnapshotPageRow {
  id: string;
  user_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  theme_settings: unknown;
  seo_meta: unknown;
  is_published: boolean | null;
  is_indexable: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  grid_config: unknown;
  niche: string | null;
  preview_url: string | null;
  integrations: unknown;
  favicon_url: string | null;
  hide_branding: boolean | null;
  organization_id: string | null;
  custom_domain: string | null;
  city: string | null;
  profession: string | null;
  entity_type: string | null;
  service_slugs?: ServiceSlugsMap | null;
  blocks: SnapshotBlockRow[] | null;
}

const PAGE_COLUMNS = [
  'id', 'user_id', 'slug', 'title', 'description', 'avatar_url', 'theme_settings', 'seo_meta',
  'is_published', 'is_indexable', 'created_at', 'updated_at', 'grid_config', 'niche', 'preview_url',
  'integrations', 'favicon_url', 'hide_branding', 'organization_id', 'custom_domain', 'city',
  'profession', 'entity_type', 'service_slugs', 'blocks(position,deleted_at,content)',
].join(',');

/** Slugs are user-chosen; anything outside this shape cannot be a page. */
const SLUG_RE = /^[\p{L}\p{N}._-]{1,64}$/u;

export function snapshotBlocks(rows: SnapshotBlockRow[] | null | undefined): Block[] {
  const seen = new Set<string>();
  const blocks = [...(rows || [])]
    .filter((row) => !row.deleted_at && row.content && typeof row.content === 'object')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((row) => row.content as Block)
    .filter((block) => {
      if (!block.id) return true;
      if (seen.has(block.id)) return false;
      seen.add(block.id);
      return true;
    });
  return ensureBlockIds(blocks);
}

export function snapshotRowToPageData(row: SnapshotPageRow): PublicPageData {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title || undefined,
    description: row.description || undefined,
    avatar_url: row.avatar_url || undefined,
    custom_domain: row.custom_domain || undefined,
    blocks: snapshotBlocks(row.blocks),
    theme: row.theme_settings as PageTheme,
    seo: row.seo_meta as PageData['seo'],
    isPublished: row.is_published ?? false,
    isIndexable: row.is_indexable ?? true,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || null,
    editorMode: 'grid',
    gridConfig: (row.grid_config as GridConfig) || undefined,
    niche: row.niche || 'other',
    previewUrl: row.preview_url || undefined,
    integrations: (row.integrations as PageData['integrations']) || undefined,
    favicon_url: row.favicon_url || undefined,
    hideBranding: row.hide_branding || false,
    organization_id: row.organization_id || undefined,
    city: row.city || undefined,
    profession: row.profession || undefined,
    entity_type: row.entity_type === 'organization' ? 'organization' : 'person',
    serviceSlugs: row.service_slugs,
  };
}

/**
 * Server-side snapshot cache. Every crawler hit used to pay a full REST round
 * trip to Supabase before the worker could render, which put first byte at
 * several seconds; bots give up or index a half page. Successful snapshots are
 * kept for SNAPSHOT_TTL_MS in the isolate's memory and, on Cloudflare, in the
 * colo's Cache API so cold isolates share them. Browsers never use it.
 */
const SNAPSHOT_TTL_MS = 60_000;
const memoryCache = new Map<string, { at: number; snapshot: PublicPageSnapshot }>();
const MEMORY_CACHE_LIMIT = 200;

type EdgeCache = { match(key: string): Promise<Response | undefined>; put(key: string, value: Response): Promise<void> };
function edgeCache(): EdgeCache | undefined {
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return store?.default;
}
const edgeKey = (slug: string) => `https://snapshot.lnkmx.internal/v1/${encodeURIComponent(slug.toLowerCase())}`;

async function readCachedSnapshot(slug: string): Promise<PublicPageSnapshot | undefined> {
  const hit = memoryCache.get(slug);
  if (hit && Date.now() - hit.at < SNAPSHOT_TTL_MS) return hit.snapshot;
  try {
    const cached = await edgeCache()?.match(edgeKey(slug));
    if (!cached) return undefined;
    const snapshot = (await cached.json()) as PublicPageSnapshot;
    memoryCache.set(slug, { at: Date.now(), snapshot });
    return snapshot;
  } catch {
    return undefined;
  }
}

async function writeCachedSnapshot(slug: string, snapshot: PublicPageSnapshot): Promise<void> {
  if (memoryCache.size >= MEMORY_CACHE_LIMIT) memoryCache.delete(memoryCache.keys().next().value as string);
  memoryCache.set(slug, { at: Date.now(), snapshot });
  try {
    await edgeCache()?.put(edgeKey(slug), new Response(JSON.stringify(snapshot), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${SNAPSHOT_TTL_MS / 1000}` },
    }));
  } catch {
    // Cache API missing or full: the snapshot is still served.
  }
}

export async function fetchPublicPageSnapshot(
  slug: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<PublicPageSnapshot> {
  if (!SLUG_RE.test(slug)) return { status: 'missing' };
  // Only the server caches: in the browser a just-published page must show at once.
  const useCache = typeof window === 'undefined' && !options.fetchImpl;
  if (useCache) {
    const cached = await readCachedSnapshot(slug);
    if (cached) return cached;
  }
  const snapshot = await fetchSnapshotFromRest(slug, options);
  if (useCache && snapshot.status !== 'error') await writeCachedSnapshot(slug, snapshot);
  return snapshot;
}

async function fetchSnapshotFromRest(
  slug: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number },
): Promise<PublicPageSnapshot> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!baseUrl || !key) return { status: 'error' };

  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/pages?select=${encodeURIComponent(PAGE_COLUMNS)}`
    + `&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`;
  // One retry: a cold connection must not cost a crawler the whole page.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(options.timeoutMs ?? 3500),
      });
      if (response.status >= 500 && attempt === 0) continue;
      if (!response.ok) return { status: 'error' };
      const rows = (await response.json()) as SnapshotPageRow[];
      if (!Array.isArray(rows) || rows.length === 0) return { status: 'missing' };
      return { status: 'ok', page: snapshotRowToPageData(rows[0]) };
    } catch {
      // Timeout or network error: retry once.
    }
  }
  return { status: 'error' };
}
