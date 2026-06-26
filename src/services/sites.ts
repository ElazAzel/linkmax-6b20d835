/**
 * Sites service — CRUD for Site containers and helpers for sub-pages.
 * Sprint 1: Multi-Page Foundation.
 */
import { supabase } from '@/platform/supabase/client';
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

/** Rename a sub-page (title) and/or change its URL path. Home page path cannot change. */
export async function updateSubPage(
  pageId: string,
  patch: { title?: string; pagePath?: string },
): Promise<{ ok: boolean; error?: string }> {
  const { data: page } = await supabase
    .from('pages')
    .select('id, is_home, site_id, page_path')
    .eq('id', pageId)
    .maybeSingle();
  if (!page) return { ok: false, error: 'not_found' };
  const isHome = (page as { is_home: boolean }).is_home;

  const update: Record<string, unknown> = {};
  if (typeof patch.title === 'string') update.title = patch.title.trim() || null;

  if (typeof patch.pagePath === 'string' && !isHome) {
    const newPath = patch.pagePath;
    // Uniqueness within the site
    const siteId = (page as { site_id: string }).site_id;
    const { data: clash } = await supabase
      .from('pages')
      .select('id')
      .eq('site_id', siteId)
      .eq('page_path', newPath)
      .neq('id', pageId)
      .maybeSingle();
    if (clash) return { ok: false, error: 'path_taken' };
    update.page_path = newPath;
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase
    .from('pages')
    .update(update as never)
    .eq('id', pageId);
  return { ok: !error, error: error?.message };
}

export interface PageSeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  og_image?: string;
}

export interface PageSettingsPayload {
  seo_meta: PageSeoMeta;
  favicon_url: string | null;
  is_indexable: boolean;
  hide_branding: boolean;
}

/** Fetch SEO + branding settings for a single page (owner only via RLS). */
export async function getPageSettings(pageId: string): Promise<PageSettingsPayload | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('seo_meta, favicon_url, is_indexable, hide_branding')
    .eq('id', pageId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    seo_meta: (row.seo_meta as PageSeoMeta) ?? {},
    favicon_url: (row.favicon_url as string | null) ?? null,
    is_indexable: (row.is_indexable as boolean) ?? true,
    hide_branding: (row.hide_branding as boolean) ?? false,
  };
}

/** Patch SEO + branding settings for a single page. */
export async function updatePageSettings(
  pageId: string,
  patch: Partial<PageSettingsPayload>,
): Promise<boolean> {
  const update: Record<string, unknown> = {};
  if (patch.seo_meta !== undefined) update.seo_meta = patch.seo_meta;
  if (patch.favicon_url !== undefined) update.favicon_url = patch.favicon_url;
  if (patch.is_indexable !== undefined) update.is_indexable = patch.is_indexable;
  if (patch.hide_branding !== undefined) update.hide_branding = patch.hide_branding;
  if (Object.keys(update).length === 0) return true;
  const { error } = await supabase.from('pages').update(update as never).eq('id', pageId);
  return !error;
}

export type SitePageStat = { page_id: string; views: number; clicks: number };

/** Per-page views/clicks for the last N days (default 30). Owner-only via RPC. */
export async function getSitePagesStats(
  siteId: string,
  days = 30,
): Promise<Record<string, SitePageStat>> {
  const { data, error } = await supabase.rpc('get_site_pages_stats' as never, {
    _site_id: siteId,
    _days: days,
  } as never);
  if (error || !Array.isArray(data)) return {};
  const out: Record<string, SitePageStat> = {};
  for (const row of data as Array<{ page_id: string; views: number | string; clicks: number | string }>) {
    out[row.page_id] = {
      page_id: row.page_id,
      views: Number(row.views) || 0,
      clicks: Number(row.clicks) || 0,
    };
  }
  return out;
}

/**
 * Apply a multi-page site template: batch-create sub-pages, each seeded with
 * composed blocks. Skips pages whose path already exists (idempotent re-apply).
 * Returns the number of pages actually created and any path collisions skipped.
 */
export async function applySiteTemplate(input: {
  siteId: string;
  userId: string;
  pages: Array<{ path: string; title: string; seedBlocks: Block[] }>;
}): Promise<{ created: number; skipped: string[] }> {
  const { data: existing } = await supabase
    .from('pages')
    .select('page_path')
    .eq('site_id', input.siteId);
  const taken = new Set(
    (existing as Array<{ page_path: string | null }> | null)
      ?.map((r) => r.page_path)
      .filter((p): p is string => !!p) ?? [],
  );

  let created = 0;
  const skipped: string[] = [];
  for (const p of input.pages) {
    if (taken.has(p.path)) {
      skipped.push(p.path);
      continue;
    }
    const res = await createSubPage({
      siteId: input.siteId,
      userId: input.userId,
      pagePath: p.path,
      title: p.title,
      seedBlocks: p.seedBlocks,
    });
    if (res) {
      created += 1;
      taken.add(p.path);
    }
  }
  return { created, skipped };
}

// ---------- Navigation & Footer settings (stored in site.settings) ----------

export interface SiteNavConfig {
  /** Ordered list of pageIds (subset that overrides default order). Pages not listed go after, in default order. */
  order: string[];
  /** PageIds that should NOT appear in the public nav. Home is always shown. */
  hidden: string[];
}

export interface SiteFooterLink {
  label: string;
  url: string;
}

export interface SiteFooterConfig {
  enabled: boolean;
  text?: string;
  copyright?: string;
  links?: SiteFooterLink[];
}

export function readSiteNav(settings: Record<string, unknown> | null | undefined): SiteNavConfig {
  const nav = (settings as { nav?: Partial<SiteNavConfig> } | null | undefined)?.nav ?? {};
  return {
    order: Array.isArray(nav.order) ? nav.order.filter((x): x is string => typeof x === 'string') : [],
    hidden: Array.isArray(nav.hidden) ? nav.hidden.filter((x): x is string => typeof x === 'string') : [],
  };
}

export function readSiteFooter(settings: Record<string, unknown> | null | undefined): SiteFooterConfig {
  const footer = (settings as { footer?: Partial<SiteFooterConfig> } | null | undefined)?.footer ?? {};
  return {
    enabled: !!footer.enabled,
    text: typeof footer.text === 'string' ? footer.text : '',
    copyright: typeof footer.copyright === 'string' ? footer.copyright : '',
    links: Array.isArray(footer.links)
      ? footer.links
          .filter(
            (l): l is SiteFooterLink =>
              !!l && typeof (l as SiteFooterLink).label === 'string' && typeof (l as SiteFooterLink).url === 'string',
          )
          .slice(0, 8)
      : [],
  };
}

/** Patch `site.settings.nav` (shallow merge). */
export async function updateSiteNav(siteId: string, patch: Partial<SiteNavConfig>): Promise<boolean> {
  const { data: row } = await supabase
    .from('sites' as never)
    .select('settings')
    .eq('id', siteId)
    .maybeSingle();
  const settings = ((row as { settings?: Record<string, unknown> } | null)?.settings ?? {}) as Record<string, unknown>;
  const current = readSiteNav(settings);
  const next: SiteNavConfig = { ...current, ...patch };
  const { error } = await supabase
    .from('sites' as never)
    .update({ settings: { ...settings, nav: next } } as never)
    .eq('id', siteId);
  return !error;
}

/** Patch `site.settings.footer` (shallow merge). */
export async function updateSiteFooter(siteId: string, patch: Partial<SiteFooterConfig>): Promise<boolean> {
  const { data: row } = await supabase
    .from('sites' as never)
    .select('settings')
    .eq('id', siteId)
    .maybeSingle();
  const settings = ((row as { settings?: Record<string, unknown> } | null)?.settings ?? {}) as Record<string, unknown>;
  const current = readSiteFooter(settings);
  const next: SiteFooterConfig = { ...current, ...patch };
  const { error } = await supabase
    .from('sites' as never)
    .update({ settings: { ...settings, footer: next } } as never)
    .eq('id', siteId);
  return !error;
}

// ---------- Redirects (stored in site.settings.redirects) ----------

export interface SiteRedirect {
  /** Source path matched against the request, with or without leading slash. e.g. "old-about" or "/p/old". */
  from: string;
  /** Destination. Internal path ("/p/about") or absolute URL ("https://…"). */
  to: string;
  /** 301 (permanent, default) or 302 (temporary). */
  code?: 301 | 302;
}

export function readSiteRedirects(
  settings: Record<string, unknown> | null | undefined,
): SiteRedirect[] {
  const arr = (settings as { redirects?: unknown } | null | undefined)?.redirects;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(
      (r): r is SiteRedirect =>
        !!r &&
        typeof (r as SiteRedirect).from === 'string' &&
        typeof (r as SiteRedirect).to === 'string',
    )
    .map((r) => ({
      from: r.from.trim(),
      to: r.to.trim(),
      code: (r.code === 302 ? 302 : 301) as 301 | 302,
    }))
    .filter((r) => r.from && r.to)
    .slice(0, 50);
}

function normalizeRedirectFrom(s: string): string {
  let v = (s || '').trim().toLowerCase();
  if (!v) return '';
  if (v.startsWith('/')) v = v.slice(1);
  if (v.startsWith('p/')) v = v.slice(2);
  if (v.endsWith('/')) v = v.slice(0, -1);
  return v;
}

/** Find the first redirect matching the given sub-page path. */
export function matchRedirect(
  redirects: SiteRedirect[],
  pagePath: string | undefined | null,
): SiteRedirect | null {
  if (!pagePath) return null;
  const needle = normalizeRedirectFrom(pagePath);
  if (!needle) return null;
  for (const r of redirects) {
    if (normalizeRedirectFrom(r.from) === needle) return r;
  }
  return null;
}

/** Replace `site.settings.redirects` entirely (cleaned + capped). */
export async function updateSiteRedirects(
  siteId: string,
  redirects: SiteRedirect[],
): Promise<boolean> {
  const { data: row } = await supabase
    .from('sites' as never)
    .select('settings')
    .eq('id', siteId)
    .maybeSingle();
  const settings = ((row as { settings?: Record<string, unknown> } | null)?.settings ?? {}) as Record<string, unknown>;
  const cleaned = readSiteRedirects({ redirects });
  const { error } = await supabase
    .from('sites' as never)
    .update({ settings: { ...settings, redirects: cleaned } } as never)
    .eq('id', siteId);
  return !error;
}

/** Load a site's settings.redirects directly by home slug — for public runtime use. */
export async function loadSiteRedirectsByHomeSlug(
  homeSlug: string,
): Promise<SiteRedirect[]> {
  const { data: home } = await supabase
    .from('pages')
    .select('site_id')
    .eq('slug', homeSlug)
    .eq('is_published', true)
    .maybeSingle();
  const siteId = (home as { site_id?: string } | null)?.site_id;
  if (!siteId) return [];
  const { data: row } = await supabase
    .from('sites' as never)
    .select('settings')
    .eq('id', siteId)
    .maybeSingle();
  const settings = ((row as { settings?: Record<string, unknown> } | null)?.settings ?? {}) as Record<string, unknown>;
  return readSiteRedirects(settings);
}


