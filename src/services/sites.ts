/**
 * Sites service — CRUD for Site containers and helpers for sub-pages.
 * Sprint 1: Multi-Page Foundation.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Site, SitePageSummary } from '@/types/site';
import type { Block } from '@/types/blocks';

function asBlocks(v: unknown): Block[] {
  return Array.isArray(v) ? (v as Block[]) : [];
}

function mapSite(row: Record<string, unknown>): Site {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: (row.name as string) ?? 'My Site',
    primary_page_id: (row.primary_page_id as string | null) ?? null,
    settings: (row.settings as Record<string, unknown>) ?? {},
    header_blocks: asBlocks(row.header_blocks),
    footer_blocks: asBlocks(row.footer_blocks),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/** Get the current user's primary site (the first one). */
export async function getMySite(userId: string): Promise<Site | null> {
  const { data, error } = await supabase
    .from('sites' as never)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapSite(data as Record<string, unknown>);
}

/** Ensure the user has at least one site; create if missing. */
export async function ensureSiteForUser(userId: string, defaultName = 'My Site'): Promise<Site | null> {
  const existing = await getMySite(userId);
  if (existing) return existing;
  const { data, error } = await (supabase.from('sites' as never) as any)
    .insert({ user_id: userId, name: defaultName })
    .select('*')
    .single();
  if (error || !data) return null;
  return mapSite(data as Record<string, unknown>);
}

/** List all pages belonging to a site (incl. unpublished, for owner). */
export async function listSitePages(siteId: string): Promise<SitePageSummary[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, page_path, is_home, title, is_published, updated_at')
    .eq('site_id', siteId)
    .order('is_home', { ascending: false })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as unknown as SitePageSummary[];
}

/** Resolve a sub-page by home-page slug + page_path (public, published only). */
export async function loadSitePageByPath(
  homeSlug: string,
  pagePath: string,
): Promise<{ id: string; site_id: string } | null> {
  // 1) Find the home page → site_id
  const { data: home, error: homeErr } = await supabase
    .from('pages')
    .select('id, site_id')
    .eq('slug', homeSlug)
    .eq('is_published', true)
    .maybeSingle();
  if (homeErr || !home || !home.site_id) return null;

  // 2) Find the sub-page by site + path
  const { data: sub, error: subErr } = await supabase
    .from('pages')
    .select('id, site_id')
    .eq('site_id', home.site_id)
    .eq('page_path', pagePath)
    .eq('is_published', true)
    .maybeSingle();
  if (subErr || !sub) return null;
  return sub as { id: string; site_id: string };
}

/** Update site header/footer/settings. */
export async function updateSite(
  siteId: string,
  patch: Partial<Pick<Site, 'name' | 'settings' | 'header_blocks' | 'footer_blocks' | 'primary_page_id'>>,
): Promise<Site | null> {
  const { data, error } = await supabase
    .from('sites' as never)
    .update(patch as never)
    .eq('id', siteId)
    .select('*')
    .single();
  if (error || !data) return null;
  return mapSite(data as Record<string, unknown>);
}

/** Add a new sub-page to a site, optionally seeded with starter blocks. */
export async function createSubPage(input: {
  siteId: string;
  userId: string;
  pagePath: string;
  title: string;
  seedBlocks?: Block[];
}): Promise<{ id: string } | null> {
  const slug = `${input.siteId.slice(0, 8)}-${input.pagePath}`;
  const { data, error } = await supabase
    .from('pages')
    .insert({
      user_id: input.userId,
      site_id: input.siteId,
      slug,
      page_path: input.pagePath,
      title: input.title,
      is_home: false,
      is_published: false,
    } as never)
    .select('id')
    .single();
  if (error || !data) return null;

  const pageId = (data as { id: string }).id;

  if (input.seedBlocks && input.seedBlocks.length > 0) {
    const rows = input.seedBlocks.map((block, position) => ({
      page_id: pageId,
      type: block.type,
      position,
      content: block as unknown as Record<string, unknown>,
    }));
    await (supabase.from('blocks') as any).insert(rows);
  }

  return { id: pageId };
}

/** Delete a sub-page (refuses to delete the home page). */
export async function deleteSubPage(pageId: string): Promise<boolean> {
  const { data: page, error: getErr } = await supabase
    .from('pages')
    .select('id, is_home')
    .eq('id', pageId)
    .maybeSingle();
  if (getErr || !page) return false;
  if ((page as { is_home: boolean }).is_home) return false;

  // Best-effort cleanup of related blocks (FK cascade may also handle this).
  await supabase.from('blocks').delete().eq('page_id', pageId);

  const { error } = await supabase.from('pages').delete().eq('id', pageId);
  return !error;
}

/** Toggle (or explicitly set) the published state of a page. */
export async function setPagePublished(
  pageId: string,
  isPublished: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from('pages')
    .update({ is_published: isPublished } as never)
    .eq('id', pageId);
  return !error;
}
