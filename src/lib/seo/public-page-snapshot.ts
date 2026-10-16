/**
 * Public page snapshot for SSR — fetched with a plain REST call so it runs the
 * same on the server and in the browser (no auth session, no view counting).
 * The client still loads the page through usePublicPage, which counts the view.
 */
import type { Block, GridConfig, PageData, PageTheme } from '@/types/page';
import { ensureBlockIds } from '@/lib/blocks/block-ids';

/** PageData plus the page-record fields SEO falls back to. */
export type PublicPageData = PageData & {
  title?: string;
  description?: string;
  avatar_url?: string;
  createdAt?: string;
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
  blocks: SnapshotBlockRow[] | null;
}

const PAGE_COLUMNS = [
  'id', 'user_id', 'slug', 'title', 'description', 'avatar_url', 'theme_settings', 'seo_meta',
  'is_published', 'is_indexable', 'created_at', 'updated_at', 'grid_config', 'niche', 'preview_url',
  'integrations', 'favicon_url', 'hide_branding', 'organization_id', 'custom_domain', 'city',
  'profession', 'entity_type', 'blocks(position,deleted_at,content)',
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
  };
}

export async function fetchPublicPageSnapshot(
  slug: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<PublicPageSnapshot> {
  if (!SLUG_RE.test(slug)) return { status: 'missing' };
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
