import { supabase } from '@/platform/supabase/client';
import type { AppDatabase } from '@/platform/supabase/extended-types';
import type { PageData, Block, ProfileBlock, PageTheme, EditorMode, GridConfig, PageExperiment } from '@/types/page';
import { createDefaultPageData } from '@/lib/constants';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { logger } from '@/lib/utils/logger';
import type { Json } from '@/platform/supabase/types';

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
async function getUserSlug(userId: string): Promise<string> {
  // Try to get username from profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.username) {
    return profile.username;
  }

  // Check for existing page slug
  const { data: existingPage } = await supabase
    .from('pages')
    .select('slug')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingPage?.slug) {
    return existingPage.slug;
  }

  // Generate new unique slug
  const baseSlug = `user-${userId.slice(0, 8)}`;
  const { data: generatedSlug } = await supabase.rpc('generate_unique_slug', {
    base_slug: baseSlug.toLowerCase().replace(/[^a-z0-9]/g, ''),
  });

  return generatedSlug || baseSlug;
}

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
  return unique.map((block) => block.content as unknown as Block);
}

/**
 * Extract title from block (handles multilingual strings)
 */
function extractBlockTitle(block: Block, lang: SupportedLanguage = 'ru'): string | null {
  if (!('title' in block) && !('name' in block)) return null;

  const rawTitle = 'title' in block ? block.title : ('name' in block ? (block as ProfileBlock).name : null);
  if (!rawTitle) return null;

  if (typeof rawTitle === 'string') return rawTitle;
  return getI18nText(rawTitle, lang);
}

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
  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

/**
 * Save page to database with atomic operations
 */
export async function savePage(
  pageData: PageData,
  userId: string,
  chatbotContext?: string
): Promise<SavePageResult> {
  try {
    const slug = await getUserSlug(userId);

    // Extract profile block data
    const profileBlock = pageData.blocks.find((b) => b.type === 'profile') as ProfileBlock | undefined;
    const profileName = profileBlock ? extractBlockTitle(profileBlock) : 'My Page';
    const profileBio = profileBlock?.bio;
    const bioText = typeof profileBio === 'string' ? profileBio : (profileBio ? getI18nText(profileBio, 'ru') : undefined);

    // Upsert page atomically
    let { data: pageId, error: upsertError } = await supabase.rpc('upsert_user_page', {
      p_user_id: userId,
      p_slug: slug,
      p_title: profileName || 'My Page',
      p_description: (bioText ?? '') as string,
      p_avatar_url: (profileBlock?.avatar ?? '') as string,
      p_avatar_style: { type: 'default', color: '#000000' } as unknown as Json,
      p_theme_settings: pageData.theme as unknown as Json,
      p_seo_meta: pageData.seo as unknown as Json,
      p_editor_mode: pageData.editorMode || 'linear',
      p_grid_config: (pageData.gridConfig ?? null) as unknown as Json,
      p_integrations: (pageData.integrations ?? null) as unknown as Json,
      p_favicon_url: (pageData.favicon_url ?? '') as string,
      p_hide_branding: pageData.hideBranding || false,
      p_organization_id: (pageData.organization_id && pageData.organization_id.length > 0) ? pageData.organization_id : (null as unknown as string),
      p_webhook_url: (pageData.webhook_url ?? null) as unknown as string,
      p_webhook_secret: (pageData.webhook_secret ?? null) as unknown as string,
    });

    // Fallback for legacy RPC if the new one with webhooks parameters is not yet deployed
    if (upsertError && (upsertError.code === 'PGRST202' || upsertError.message?.includes('p_webhook_url'))) {
      logger.info('Retrying with legacy upsert_user_page RPC (fallback)');
      const fallbackResult = await supabase.rpc('upsert_user_page', {
        p_user_id: userId,
        p_slug: slug,
        p_title: profileName || 'My Page',
        p_description: bioText || '',
        p_avatar_url: profileBlock?.avatar || '',
        p_avatar_style: { type: 'default', color: '#000000' } as unknown as Json,
        p_theme_settings: pageData.theme as unknown as Json,
        p_seo_meta: pageData.seo as unknown as Json,
        p_editor_mode: pageData.editorMode || 'linear',
        p_grid_config: (pageData.gridConfig || null) as unknown as Json,
        p_integrations: (pageData.integrations || null) as unknown as Json,
        p_favicon_url: pageData.favicon_url || undefined,
        p_hide_branding: pageData.hideBranding || false,
        p_organization_id: (pageData.organization_id && pageData.organization_id.length > 0) ? pageData.organization_id : undefined,
      });
      pageId = fallbackResult.data;
      upsertError = fallbackResult.error;
    }

    if (upsertError) {
      logger.error('Error upserting page', upsertError, { context: 'pages', data: { userId, slug } });
      return { data: null, error: wrapError(upsertError) };
    }

    if (typeof pageData.isIndexable === 'boolean') {
      const { error: visibilityError } = await supabase
        .from('pages')
        .update({ is_indexable: pageData.isIndexable })
        .eq('id', pageId as string)
        .eq('user_id', userId);

      if (visibilityError) {
        logger.error('Error saving search visibility', visibilityError, { context: 'pages', data: { pageId, userId } });
        return { data: null, error: wrapError(visibilityError) };
      }
    }

    // Prepare blocks for atomic save
    const blocksData = pageData.blocks.map((block, index) => ({
      type: block.type,
      position: index,
      title: extractBlockTitle(block),
      content: JSON.parse(JSON.stringify(block)),
      style: {},
      schedule: 'schedule' in block ? block.schedule : null,
    }));

    // Save blocks atomically
    const { error: blocksError } = await supabase.rpc('save_page_blocks', {
      p_page_id: pageId as string,
      p_blocks: JSON.parse(JSON.stringify(blocksData)) as Json,
      p_is_premium: pageData.isPremium || false,
    });

    if (blocksError) {
      logger.error('Error saving blocks', blocksError, { context: 'pages', data: { pageId } });
      return { data: null, error: wrapError(blocksError) };
    }

    // Save preview_url if provided
    if (pageData.previewUrl !== undefined) {
      await supabase
        .from('pages')
        .update({ preview_url: pageData.previewUrl || null })
        .eq('id', pageId as string);
    }

    // Save chatbot context if provided
    if (chatbotContext !== undefined) {
      await supabase.from('private_page_data').upsert(
        {
          page_id: pageId as string,
          chatbot_context: (chatbotContext || null) as unknown as string,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id' }
      );
    }

    // Fetch and return the saved page
    const { data: page, error: fetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId as string)
      .single();

    if (fetchError) {
      return { data: null, error: wrapError(fetchError) };
    }

    return { data: page as unknown as DbPage, error: null };
  } catch (error) {
    logger.error('Error saving page', error, { context: 'pages', data: { userId } });
    return { data: null, error: wrapError(error) };
  }
}

/**
 * Load public page by slug
 */
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
export async function loadUserPage(userId: string): Promise<LoadUserPageResult> {
  try {
    // Fetch the owner's full row (including sensitive columns) via SECURITY DEFINER RPC.
    // Direct SELECT on contact_email / contact_phone / contact_whatsapp / webhook_url /
    // webhook_secret / quality_breakdown / index_exclusion_reasons is no longer granted
    // to the `authenticated` role; the RPC is the owner-only access path.
    const { data: rpcRows, error: rpcError } = await (supabase.rpc as unknown as (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>)(
      'get_my_full_page',
      { p_user_id: userId },
    );

    if (rpcError) {
      return { data: null, chatbotContext: null, error: wrapError(rpcError) };
    }

    const ownerRow = Array.isArray(rpcRows) ? (rpcRows[0] as Record<string, unknown> | undefined) : null;

    if (!ownerRow) {
      return {
        data: createDefaultPageData(userId),
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
 * Publish user's page
 */
export async function publishPage(userId: string): Promise<PublishPageResult> {
  try {
    const { data, error } = await supabase
      .from('pages')
      .update({ is_published: true })
      .eq('user_id', userId)
      .select('slug')
      .maybeSingle();

    if (error) return { slug: null, error: wrapError(error) };
    if (!data) return { slug: null, error: new Error('Page not found') };

    return { slug: data.slug, error: null };
  } catch (error) {
    return { slug: null, error: wrapError(error) };
  }
}

/**
 * Update page niche
 */
export async function updatePageNiche(userId: string, niche: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('pages')
      .update({ niche })
      .eq('user_id', userId);

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
  }
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('pages')
      .update(fields)
      .eq('user_id', userId);

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
