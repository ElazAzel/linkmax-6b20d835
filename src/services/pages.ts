import { supabase } from '@/platform/supabase/client';
import type { AppDatabase } from '@/platform/supabase/extended-types';
import type { PageData, Block, PageTheme, GridConfig, PageExperiment } from '@/types/page';
import { createDefaultPageData } from '@/lib/constants';

import { logger } from '@/lib/utils/logger';

import { isMissingTableError } from './reviews';
import { isMissingSchemaError } from '@/lib/resilience/missing-schema';
import { ensureBlockIds } from '@/lib/blocks/block-ids';

// ============= Block & Page Value Objects =============

export interface BlockStyle {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
  borderColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundOpacity?: number;
  hoverEffect?: 'none' | 'scale' | 'glow' | 'lift' | 'fade';
  animation?: 'none' | 'fade-in' | 'slide-up' | 'scale-in' | 'bounce';
  animationDelay?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export interface BlockSchedule {
  startDate?: string;
  endDate?: string;
}

export interface GridLayoutData {
  gridColumn?: number;
  gridRow?: number;
  gridWidth?: number;
  gridHeight?: number;
}

// ============= Types (exported for backward compatibility) =============
export type DbPage = AppDatabase['public']['Tables']['pages']['Row'] & {
  blocks?: DbBlock[];
  experiments?: RawExperiment[];
  private_page_data?: { chatbot_context?: string | null }[] | { chatbot_context?: string | null } | null;
};

export type DbBlock = AppDatabase['public']['Tables']['blocks']['Row'];

export type RawExperiment = AppDatabase['public']['Tables']['experiments']['Row'] & {
  experiment_variants: RawExperimentVariant[];
};

export type RawExperimentVariant = AppDatabase['public']['Tables']['experiment_variants']['Row'];

export interface SavePageResult {
  data: DbPage | null;
  error: Error | null;
}

export interface LoadPageResult {
  data: PageData | null;
  error: Error | null;
}

export interface LoadUserPageResult {
  data: PageData | null;
  chatbotContext: string | null;
  error: Error | null;
}

export interface PublishPageResult {
  slug: string | null;
  error: Error | null;
}

export interface ExpertDirectoryReviewSummary {
  publishedCount: number;
  averageRating: number | null;
  lastReviewAt: string | null;
}

export interface ExpertDirectoryProfile {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  niche: string | null;
  city: string | null;
  profession: string | null;
  entity_type: string | null;
  view_count: number | null;
  reviewSummary: ExpertDirectoryReviewSummary;
}

export interface FetchExpertDirectoryInput {
  tag?: string | null;
  city?: string | null;
  verifiedOnly?: boolean;
  limit?: number;
}

// ============= Helpers =============

/**
 * Wrap error in standard Error object
 */
function wrapError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error('Unknown error');
}

/**
 * Map raw database experiment data to PageExperiment type
 */
function mapExperimentData(experiments: RawExperiment[]): PageExperiment[] {
  return (experiments || []).map((exp) => ({
    id: exp.id,
    page_id: exp.page_id,
    block_id: (exp as any).block_id || '',
    name: exp.name,
    status: exp.status as PageExperiment['status'],
    started_at: exp.started_at || undefined,
    ended_at: exp.ended_at || undefined,
    variants: (exp.experiment_variants || []).map((v: any) => ({
      id: v.id,
      experiment_id: v.experiment_id,
      variant_key: v.variant_key || '',
      base_block_id: v.base_block_id || '',
      variant_label: v.variant_label || '',
      block_data: (v.block_data as unknown) as Partial<Block>,
      traffic_weight: v.traffic_weight ?? 0,
      created_at: v.created_at || '',
    }))
  })) as PageExperiment[];
}

/**
 * Get user's slug from their profile or generate one
 */
/**
 * Deduplicate blocks by id (keep first occurrence)
 */
function deduplicateBlocks(blocks: DbBlock[]): DbBlock[] {
  const seenIds = new Set<string>();
  return blocks.filter((block) => {
    const content = block.content as unknown as Block | null;
    const blockId = content?.id;
    if (blockId && seenIds.has(blockId)) {
      return false;
    }
    if (blockId) seenIds.add(blockId);
    return true;
  });
}

/**
 * Convert DB blocks to PageData blocks
 */
function convertDbBlocksToBlocks(dbBlocks: DbBlock[]): Block[] {
  const sorted = [...dbBlocks].sort((a, b) => a.position - b.position);
  const activeOnly = sorted.filter((block) => !block.deleted_at);
  const unique = deduplicateBlocks(activeOnly);
  return ensureBlockIds(unique.map((block) => block.content as unknown as Block));
}

/**
 * Extract title from block (handles multilingual strings)
 */
/**
 * Check if block is currently scheduled to be visible (pure function)
 */
export function isBlockScheduledVisible(schedule?: BlockSchedule, now: Date = new Date()): boolean {
  if (!schedule) return true;

  const { startDate, endDate } = schedule;
  const currentTime = now.getTime();

  if (startDate && new Date(startDate).getTime() > currentTime) {
    return false;
  }

  if (endDate && new Date(endDate).getTime() < currentTime) {
    return false;
  }

  return true;
}

/**
 * Generate a unique block ID (moved from Block entity)
 */
export function generateBlockId(type: string): string {
  const safeType = type.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'block';
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ (Math.random() * 16 >> (Number(c) / 4))).toString(16)
  );
  return `${safeType}-${id}`;
}

/**
 * Validate block structure
 */
export function validateBlock(block: Partial<Block>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!block.id) errors.push('Block ID is required');
  if (!block.type) errors.push('Block type is required');
  return { valid: errors.length === 0, errors };
}

/**
 * Check if page has premium content
 */
export function hasPremiumContent(blocks: Block[]): boolean {
  const PREMIUM_TYPES = ['video', 'carousel', 'custom_code', 'form', 'newsletter', 'testimonial', 'scratch', 'catalog', 'countdown'];
  return blocks.some(block => PREMIUM_TYPES.includes(block.type));
}

/**
 * Check if page can be published
 */
export function canPublishPage(blocks: Block[]): { canPublish: boolean; reason?: string } {
  if (blocks.length === 0) {
    return { canPublish: false, reason: 'Page must have at least one block' };
  }

  const hasProfile = blocks.some(block => block.type === 'profile');
  if (!hasProfile) {
    return { canPublish: false, reason: 'Page must have a profile block' };
  }

  return { canPublish: true };
}

export function normalizeExpertDirectoryFilter(value: string | null | undefined, maxLength = 80): string | null {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function sortExpertDirectoryProfiles(
  profiles: ExpertDirectoryProfile[]
): ExpertDirectoryProfile[] {
  return [...profiles].sort((left, right) => {
    const leftReviewCount = left.reviewSummary.publishedCount;
    const rightReviewCount = right.reviewSummary.publishedCount;
    const leftHasReviews = leftReviewCount > 0;
    const rightHasReviews = rightReviewCount > 0;

    if (leftHasReviews !== rightHasReviews) {
      return leftHasReviews ? -1 : 1;
    }

    if (leftHasReviews && rightHasReviews) {
      const ratingDelta = (right.reviewSummary.averageRating ?? 0) - (left.reviewSummary.averageRating ?? 0);
      if (ratingDelta !== 0) return ratingDelta;

      const countDelta = rightReviewCount - leftReviewCount;
      if (countDelta !== 0) return countDelta;
    }

    return (right.view_count ?? 0) - (left.view_count ?? 0);
  });
}

/**
 * Reorder blocks array by moving a block from one index to another
 */
export function reorderBlocks(blocks: Block[], fromIndex: number, toIndex: number): Block[] {
  if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
    return blocks;
  }

  const result = [...blocks];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  return result;
}

// ============= API Functions =============

type ExpertDirectoryPageRow = Pick<
  AppDatabase['public']['Tables']['pages']['Row'],
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'avatar_url'
  | 'niche'
  | 'city'
  | 'profession'
  | 'entity_type'
  | 'view_count'
>;

type ExpertDirectorySummaryRow = Pick<
  AppDatabase['public']['Tables']['page_review_summaries']['Row'],
  'page_id' | 'published_count' | 'average_rating' | 'last_review_at'
>;

const EXPERT_DIRECTORY_PAGE_SELECT = [
  'id',
  'slug',
  'title',
  'description',
  'avatar_url',
  'niche',
  'city',
  'profession',
  'entity_type',
  'view_count',
].join(', ');

function mapExpertDirectoryProfile(
  page: ExpertDirectoryPageRow,
  summariesByPageId: Map<string, ExpertDirectorySummaryRow>
): ExpertDirectoryProfile {
  const summary = summariesByPageId.get(page.id);

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    avatar_url: page.avatar_url,
    niche: page.niche,
    city: page.city,
    profession: page.profession,
    entity_type: page.entity_type,
    view_count: page.view_count,
    reviewSummary: {
      publishedCount: summary?.published_count ?? 0,
      averageRating: summary?.average_rating ?? null,
      lastReviewAt: summary?.last_review_at ?? null,
    },
  };
}

export async function fetchExpertDirectoryProfiles(
  input: FetchExpertDirectoryInput = {}
): Promise<ExpertDirectoryProfile[]> {
  const safeLimit = Math.min(Math.max(Math.floor(input.limit ?? 100), 1), 100);
  const tag = normalizeExpertDirectoryFilter(input.tag, 80);
  const city = normalizeExpertDirectoryFilter(input.city, 80);

  let query = supabase
    .from('pages')
    .select(EXPERT_DIRECTORY_PAGE_SELECT)
    .eq('is_published', true)
    .eq('is_indexable', true);

  if (tag) {
    query = query.eq('niche', tag);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  const { data: pageRows, error: pageError } = await query
    .order('view_count', { ascending: false })
    .limit(safeLimit);

  if (pageError) throw wrapError(pageError);

  const PLACEHOLDER_TITLES = new Set(['your name', 'ваше имя', 'имя', 'name', 'profile', 'my page', 'моя страница', '']);
  // Hide empty/template pages so the directory only links to real profiles.
  const pages = ((pageRows || []) as unknown as ExpertDirectoryPageRow[]).filter(
    (page) => !PLACEHOLDER_TITLES.has((page.title || '').trim().toLowerCase()),
  );
  const pageIds = pages.map((page) => page.id);
  const summariesByPageId = new Map<string, ExpertDirectorySummaryRow>();

  if (pageIds.length > 0) {
    let summaryRows = null;
    let summaryError = null;

    try {
      const result = await supabase
        .from('page_review_summaries')
        .select('page_id, published_count, average_rating, last_review_at')
        .in('page_id', pageIds);
      summaryRows = result.data;
      summaryError = result.error;
    } catch (err) {
      summaryError = err;
    }

    if (summaryError) {
      if (isMissingTableError(summaryError)) {
        logger.info('page_review_summaries table not found or not accessible. Gracefully skipping summaries.');
      } else {
        throw wrapError(summaryError);
      }
    } else {
      for (const summary of (summaryRows || []) as unknown as ExpertDirectorySummaryRow[]) {
        summariesByPageId.set(summary.page_id, summary);
      }
    }
  }

  const profiles = pages
    .map((page) => mapExpertDirectoryProfile(page, summariesByPageId))
    .filter((profile) => !input.verifiedOnly || profile.reviewSummary.publishedCount > 0);

  return sortExpertDirectoryProfiles(profiles);
}

/**
 * Save page to database with atomic operations
 */
/** @deprecated Use savePageDraft with an explicit revision in editor sessions. */
export async function savePage(pageData: PageData, _userId: string, chatbotContext?: string): Promise<SavePageResult> {
  try {
    const { loadPageDraft, savePageDraft } = await import('./page-drafts');
    const draft = await loadPageDraft(pageData.id);
    await savePageDraft(pageData, draft.revision, draft.base_published_revision, chatbotContext);
    return { data: null, error: null };
  } catch (error) { return { data: null, error: wrapError(error) }; }
}
export async function loadPageBySlug(slug: string): Promise<LoadPageResult> {
  try {
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select(`
        id, user_id, slug, title, description, avatar_url, avatar_style,
        theme_settings, seo_meta, is_published, view_count, created_at, updated_at,
        editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes,
        niche, preview_url, quality_score, is_indexable, last_snapshot_at,
        is_paid, is_primary_paid, page_type, integrations, favicon_url,
        hide_branding, organization_id, custom_domain, city, country_code,
        profession, entity_type,
        blocks(*)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (pageError) {
      return { data: null, error: wrapError(pageError) };
    }

    if (pageError) return { data: null, error: wrapError(pageError) };
    if (!page) return { data: null, error: null };

    const pg = page as unknown as DbPage;

    // Increment view count (fire and forget)
    void supabase.rpc('increment_view_count', { page_slug: pg.slug });

    const activeBlocks = (pg.blocks as unknown as DbBlock[] || []).filter((b: DbBlock) => !b.deleted_at);
    const experiments = mapExperimentData(pg.experiments || []);

    const pageData: PageData = {
      id: pg.id,
      userId: pg.user_id,
      slug: pg.slug,
      custom_domain: pg.custom_domain || undefined,
      blocks: convertDbBlocksToBlocks(activeBlocks),
      theme: pg.theme_settings as unknown as PageTheme,
      seo: pg.seo_meta as unknown as PageData['seo'],
      isPremium: activeBlocks.some((b: DbBlock) => b.is_premium),
      isPublished: pg.is_published || false,
      isIndexable: pg.is_indexable ?? true,
      updatedAt: pg.updated_at || null,
      viewCount: pg.view_count || 0,
      editorMode: 'grid',
      gridConfig: (pg.grid_config as unknown as GridConfig) || undefined,
      niche: pg.niche || 'other',
      previewUrl: pg.preview_url || undefined,
      integrations: (pg.integrations as unknown as PageData['integrations']) || undefined,
      favicon_url: pg.favicon_url || undefined,
      hideBranding: pg.hide_branding || false,
      organization_id: pg.organization_id || undefined,
      city: pg.city || undefined,
      profession: pg.profession || undefined,
      entity_type: pg.entity_type === 'organization' ? 'organization' : 'person',
      // contact_* are owner PII — not exposed to anonymous viewers
      quality_score: pg.quality_score ?? undefined,
      experiments
    };

    return { data: pageData, error: null };
  } catch (error) {
    return { data: null, error: wrapError(error) };
  }
}

/**
 * Load public page by custom domain
 */
export async function loadPageByCustomDomain(domain: string): Promise<{ data: PageData | null; error: Error | null }> {
  try {
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select(`
        id, user_id, slug, title, description, avatar_url, avatar_style,
        theme_settings, seo_meta, is_published, view_count, created_at, updated_at,
        editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes,
        niche, preview_url, quality_score, is_indexable, last_snapshot_at,
        is_paid, is_primary_paid, page_type, integrations, favicon_url,
        hide_branding, organization_id, custom_domain, city, country_code,
        profession, entity_type,
        blocks(*), private_page_data(*)
      `)
      .eq('custom_domain', domain)
      .eq('is_published', true)
      .maybeSingle();

    if (pageError) return { data: null, error: wrapError(pageError) };
    if (!page) return { data: null, error: null };

    const pg = page as unknown as DbPage;

    // Increment view count (fire and forget)
    void supabase.rpc('increment_view_count', { page_slug: pg.slug });

    const activeBlocks = (pg.blocks as unknown as DbBlock[] || []).filter((b: DbBlock) => !b.deleted_at);
    const experiments = mapExperimentData(pg.experiments || []);

    const pageData: PageData = {
      id: pg.id,
      userId: pg.user_id,
      slug: pg.slug,
      custom_domain: pg.custom_domain || undefined,
      blocks: convertDbBlocksToBlocks(activeBlocks),
      theme: pg.theme_settings as unknown as PageTheme,
      seo: pg.seo_meta as unknown as PageData['seo'],
      isPremium: activeBlocks.some((b: DbBlock) => b.is_premium),
      isPublished: pg.is_published || false,
      isIndexable: pg.is_indexable ?? true,
      updatedAt: pg.updated_at || null,
      viewCount: pg.view_count || 0,
      editorMode: 'grid',
      gridConfig: (pg.grid_config as unknown as GridConfig) || undefined,
      niche: pg.niche || 'other',
      previewUrl: pg.preview_url || undefined,
      integrations: (pg.integrations as unknown as PageData['integrations']) || undefined,
      favicon_url: pg.favicon_url || undefined,
      hideBranding: pg.hide_branding || false,
      organization_id: pg.organization_id || undefined,
      city: pg.city || undefined,
      profession: pg.profession || undefined,
      entity_type: pg.entity_type === 'organization' ? 'organization' : 'person',
      // contact_* are owner PII — not exposed to anonymous viewers
      quality_score: pg.quality_score ?? undefined,
      experiments
    };

    return { data: pageData, error: null };
  } catch (error) {
    return { data: null, error: wrapError(error) };
  }
}

/**
 * Load user's own page
 */
// Columns `authenticated` may SELECT directly (see 20260620131736). Sensitive
// ones (webhook_*, contact_*, diagnostics) are only returned by get_my_full_page.
const OWNER_PAGE_SAFE_COLUMNS =
  'id, user_id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, ' +
  'is_published, view_count, created_at, updated_at, editor_mode, grid_config, is_in_gallery, ' +
  'gallery_featured_at, gallery_likes, niche, preview_url, quality_score, is_indexable, ' +
  'last_snapshot_at, is_paid, is_primary_paid, page_type, integrations, favicon_url, hide_branding, ' +
  'organization_id, custom_domain, city, country_code, profession, entity_type, service_slugs, ' +
  'last_indexnow_at';
/** Multi-page site columns — from a later migration, may be missing. */
const OWNER_PAGE_SITE_COLUMNS = ', site_id, page_path, is_home';

/**
 * Load one of the user's own pages.
 *
 * `pageId` selects which page: get_my_full_page returns a single, arbitrary row
 * (LIMIT 1 without ORDER BY), so without an id a user with several pages could
 * get any of them in the editor.
 */
export async function loadUserPage(userId: string, pageId?: string | null): Promise<LoadUserPageResult> {
  try {
    // Fetch the owner's full row (including sensitive columns) via SECURITY DEFINER RPC.
    // Direct SELECT on contact_email / contact_phone / contact_whatsapp / webhook_url /
    // webhook_secret / quality_breakdown / index_exclusion_reasons is no longer granted
    // to the `authenticated` role; the RPC is the owner-only access path.
    const callRpc = supabase.rpc.bind(supabase) as unknown as (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;
    const { data: rpcRows, error: rpcError } = await callRpc('get_my_full_page', { p_user_id: userId });

    if (rpcError) {
      return { data: null, chatbotContext: null, error: wrapError(rpcError) };
    }

    let ownerRow = Array.isArray(rpcRows) ? (rpcRows[0] as Record<string, unknown> | undefined) : null;

    if (pageId && ownerRow?.id !== pageId) {
      // Preferred: the full row including owner-only columns (webhook_*,
      // contact_*). Until that RPC is deployed, fall back to the columns
      // `authenticated` may select directly.
      const { data: fullRows, error: fullError } = await callRpc('get_my_full_page_by_id', { p_page_id: pageId });
      const fullRow = !fullError && Array.isArray(fullRows)
        ? (fullRows[0] as Record<string, unknown> | undefined)
        : undefined;
      if (fullRow) {
        ownerRow = fullRow;
      }
    }

    if (pageId && ownerRow?.id !== pageId) {
      const selectRequested = (columns: string) => supabase
        .from('pages')
        .select(columns)
        .eq('id', pageId)
        .eq('user_id', userId)
        .maybeSingle();
      let { data: requested, error: requestedError } = await selectRequested(OWNER_PAGE_SAFE_COLUMNS + OWNER_PAGE_SITE_COLUMNS);
      if (requestedError && isMissingSchemaError(requestedError)) {
        ({ data: requested, error: requestedError } = await selectRequested(OWNER_PAGE_SAFE_COLUMNS));
      }
      if (requestedError) {
        return { data: null, chatbotContext: null, error: wrapError(requestedError) };
      }
      // Unknown or foreign id (deleted page, stale localStorage) — fall back to
      // the primary page instead of showing an empty editor.
      if (requested) ownerRow = requested as unknown as Record<string, unknown>;
    }

    if (!ownerRow) {
      return {
        data: null,
        chatbotContext: null,
        error: null,
      };
    }

    // Fetch blocks + private_page_data separately (these tables have their own RLS).
    const [{ data: blocksData }, { data: privateRows }] = await Promise.all([
      supabase.from('blocks').select('*').eq('page_id', ownerRow.id as string),
      supabase.from('private_page_data').select('*').eq('page_id', ownerRow.id as string),
    ]);

    const page = {
      ...ownerRow,
      blocks: blocksData ?? [],
      private_page_data: privateRows ?? [],
    };

    const pg = page as unknown as DbPage;
    const activeBlocks = (pg.blocks as unknown as DbBlock[] || []).filter(b => !b.deleted_at);

    const pageData: PageData = {
      id: pg.id,
      userId: pg.user_id,
      slug: pg.slug,
      blocks: convertDbBlocksToBlocks(activeBlocks),
      theme: pg.theme_settings as unknown as PageTheme,
      seo: pg.seo_meta as unknown as PageData['seo'],
      isPremium: activeBlocks.some((b) => b.is_premium),
      isPublished: pg.is_published || false,
      viewCount: pg.view_count || 0,
      editorMode: 'grid',
      gridConfig: (pg.grid_config as unknown as GridConfig) || undefined,
      niche: pg.niche || 'other',
      previewUrl: pg.preview_url || undefined,
      integrations: (pg.integrations as unknown as Record<string, string>) || undefined,
      favicon_url: pg.favicon_url || undefined,
      hideBranding: pg.hide_branding || false,
      webhook_url: pg.webhook_url || undefined,
      webhook_secret: pg.webhook_secret || undefined,
      organization_id: pg.organization_id || undefined,
      isIndexable: pg.is_indexable ?? true,
      updatedAt: pg.updated_at || null,
      experiments: mapExperimentData(pg.experiments || []),
      // Entity fields
      city: pg.city || undefined,
      profession: pg.profession || undefined,
      entity_type: pg.entity_type === 'organization' ? 'organization' : 'person',
      contact_email: pg.contact_email || undefined,
      contact_phone: pg.contact_phone || undefined,
      contact_whatsapp: pg.contact_whatsapp || undefined,
      country_code: ((ownerRow as Record<string, unknown>).country_code as string | null) || undefined,
      quality_score: pg.quality_score ?? undefined,
      // Diagnostics fields
      _diagnostics: {
        quality_breakdown: (pg.quality_breakdown as unknown as Record<string, { passed: boolean; points: number; count?: number }>) || {},
        index_exclusion_reasons: pg.index_exclusion_reasons || [],
        last_indexnow_at: pg.last_indexnow_at || null,
        service_slugs: (pg.service_slugs as unknown as Record<string, string>) || {},
      },
    };

    // Extract chatbot context
    const privateData = pg.private_page_data;
    const chatbotContext = Array.isArray(privateData)
      ? privateData[0]?.chatbot_context
      : privateData?.chatbot_context;

    return { data: pageData, chatbotContext: chatbotContext || null, error: null };
  } catch (error) {
    return { data: null, chatbotContext: null, error: wrapError(error) };
  }
}

/**
 * Publish one of the user's pages.
 *
 * Previously this updated `is_published` for every page of the user, so each
 * autosave re-published draft sub-pages the owner had hidden.
 */
/** @deprecated Publication requires the revision reviewed in the editor. */
export async function publishPage(_userId: string, _pageId?: string | null): Promise<PublishPageResult> {
  return { slug: null, error: new Error('Open the page editor and use Publish to publish the reviewed private draft.') };
}
/**
 * Update page niche
 */
export async function updatePageNiche(userId: string, niche: string, pageId?: string | null): Promise<{ error: Error | null }> {
  try {
    // Scope to one page: filtering by user_id alone rewrote the niche of all pages.
    let query = supabase
      .from('pages')
      .update({ niche })
      .eq('user_id', userId);
    if (pageId) query = query.eq('id', pageId);
    const { error } = await query;

    if (error) return { error: wrapError(error) };
    return { error: null };
  } catch (error) {
    return { error: wrapError(error) };
  }
}

// Note: trackEvent has been moved to src/services/analytics.ts
// with enhanced functionality including visitor tracking and metadata enrichment

/**
 * Update entity fields on a page (city, profession, entity_type, contacts)
 */
export async function updatePageEntityFields(
  userId: string,
  fields: {
    city?: string;
    profession?: string;
    entity_type?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    country_code?: string;
  },
  pageId?: string | null,
): Promise<{ error: Error | null }> {
  try {
    // Scope to one page: filtering by user_id alone rewrote contacts of all pages.
    let query = supabase
      .from('pages')
      .update(fields)
      .eq('user_id', userId);
    if (pageId) query = query.eq('id', pageId);
    const { error } = await query;

    if (error) return { error: wrapError(error) };
    return { error: null };
  } catch (error) {
    return { error: wrapError(error) };
  }
}

/**
 * Get all public pages for sitemap generation
 */
export async function getPublicPages(): Promise<{ slug: string; updated_at: string }[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('slug, updated_at')
    .eq('is_published', true);

  if (error) {
    logger.error('Error fetching public pages', error, { context: 'sitemap' });
    return [];
  }

  return (data || []).map(p => ({
    slug: p.slug,
    updated_at: p.updated_at || new Date().toISOString()
  }));
}
