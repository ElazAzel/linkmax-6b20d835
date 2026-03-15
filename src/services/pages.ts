/**
 * Page service - handles all page-related API operations
 */
import { supabase } from '@/platform/supabase/client';
import type { PageData, Block, ProfileBlock, PageTheme, EditorMode, GridConfig, PageExperiment } from '@/types/page';
import { createDefaultPageData } from '@/lib/constants';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { Json } from '@/platform/supabase/types';
import { logger } from '@/lib/utils/logger';

// ============= Types (exported for backward compatibility) =============
export interface DbPage {
  id: string;
  user_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  avatar_style: Json;
  theme_settings: Json;
  seo_meta: Json;
  is_published: boolean;
  view_count: number;
  favicon_url: string | null;
  hide_branding: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  preview_url: string | null;
  experiments?: any[];
}

export interface DbBlock {
  id: string;
  page_id: string;
  type: string;
  position: number;
  title: string | null;
  content: Json;
  style: Json;
  is_premium: boolean;
  click_count: number;
  created_at: string;
  schedule?: Json;
}

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
function mapExperimentData(experiments: any[]): PageExperiment[] {
  return (experiments || []).map((exp: any) => ({
    id: exp.id,
    page_id: exp.page_id,
    name: exp.name,
    status: exp.status,
    started_at: exp.started_at,
    ended_at: exp.ended_at,
    variants: exp.experiment_variants || []
  }));
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
  const unique = deduplicateBlocks(sorted);
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
    const bioText = typeof profileBio === 'string' ? profileBio : (profileBio ? getI18nText(profileBio, 'ru') : null);

    // Upsert page atomically
    const { data: pageId, error: upsertError } = await supabase.rpc('upsert_user_page', {
      p_user_id: userId,
      p_slug: slug,
      p_title: profileName || 'My Page',
      p_description: bioText,
      p_avatar_url: profileBlock?.avatar || null,
      p_avatar_style: { type: 'default', color: '#000000' } as unknown as Json,
      p_theme_settings: pageData.theme as unknown as Json,
      p_seo_meta: pageData.seo as unknown as Json,
      p_editor_mode: pageData.editorMode || 'linear',
      p_grid_config: (pageData.gridConfig || null) as unknown as Json,
      p_integrations: (pageData.integrations || null) as unknown as Json,
      p_favicon_url: pageData.favicon_url || null,
      p_hide_branding: pageData.hideBranding || false,
      p_organization_id: (pageData.organization_id && pageData.organization_id.length > 0) ? pageData.organization_id : null,
    });

    if (upsertError) {
      logger.error('Error upserting page', upsertError, { context: 'pages', data: { userId, slug } });
      return { data: null, error: wrapError(upsertError) };
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
      p_page_id: pageId,
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
        .eq('id', pageId);
    }

    // Save chatbot context if provided
    if (chatbotContext !== undefined) {
      await supabase.from('private_page_data').upsert(
        {
          page_id: pageId,
          chatbot_context: chatbotContext || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id' }
      );
    }

    // Fetch and return the saved page
    const { data: page, error: fetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
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
      .select('*, blocks(*)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (pageError) {
      return { data: null, error: wrapError(pageError) };
    }

    if (pageError) return { data: null, error: wrapError(pageError) };
    if (!page) return { data: null, error: null };

    const pg = page as any;

    // Increment view count (fire and forget)
    void supabase.rpc('increment_view_count', { page_slug: pg.slug });

    const blocks = pg.blocks || [];
    const experiments = mapExperimentData(pg.experiments || []);

    const pageData: PageData = {
      id: pg.id,
      userId: pg.user_id,
      slug: pg.slug,
      custom_domain: pg.custom_domain || undefined,
      blocks: convertDbBlocksToBlocks(blocks),
      theme: pg.theme_settings as unknown as PageTheme,
      seo: pg.seo_meta as unknown as PageData['seo'],
      isPremium: blocks.some((b: any) => b.is_premium),
      isPublished: pg.is_published || false,
      viewCount: pg.view_count || 0,
      editorMode: 'grid',
      gridConfig: pg.grid_config || undefined,
      niche: pg.niche || 'other',
      previewUrl: pg.preview_url || undefined,
      integrations: pg.integrations || undefined,
      favicon_url: pg.favicon_url || undefined,
      hideBranding: pg.hide_branding || false,
      organization_id: pg.organization_id || undefined,
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
    const { data: page, error: pageError } = await (supabase as any)
      .from('pages')
      .select('*, blocks(*), private_page_data(*)')
      .eq('custom_domain', domain)
      .eq('is_published', true)
      .maybeSingle();

    if (pageError) return { data: null, error: wrapError(pageError) };
    if (!page) return { data: null, error: null };

    const pg = page as any;

    // Increment view count (fire and forget)
    void supabase.rpc('increment_view_count', { page_slug: pg.slug });

    const blocks = pg.blocks || [];
    const experiments = mapExperimentData(pg.experiments || []);

    const pageData: PageData = {
      id: pg.id,
      userId: pg.user_id,
      slug: pg.slug,
      custom_domain: pg.custom_domain || undefined,
      blocks: convertDbBlocksToBlocks(blocks),
      theme: pg.theme_settings as unknown as PageTheme,
      seo: pg.seo_meta as unknown as PageData['seo'],
      isPremium: blocks.some((b: any) => b.is_premium),
      isPublished: pg.is_published || false,
      viewCount: pg.view_count || 0,
      editorMode: 'grid',
      gridConfig: pg.grid_config || undefined,
      niche: pg.niche || 'other',
      previewUrl: pg.preview_url || undefined,
      integrations: pg.integrations || undefined,
      favicon_url: pg.favicon_url || undefined,
      hideBranding: pg.hide_branding || false,
      organization_id: pg.organization_id || undefined,
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
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*, blocks(*), private_page_data(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (pageError) {
      if (pageError.code === 'PGRST116') {
        return {
          data: createDefaultPageData(userId),
          chatbotContext: null,
          error: null,
        };
      }
      return { data: null, chatbotContext: null, error: wrapError(pageError) };
    }

    if (!page) {
      return {
        data: createDefaultPageData(userId),
        chatbotContext: null,
        error: null,
      };
    }

    const pg = page as any;
    const blocks = pg.blocks as unknown as DbBlock[];

    // Map experiments and variants
    const experiments: PageExperiment[] = (pg.experiments || []).map((exp: any) => ({
      id: exp.id,
      page_id: exp.page_id,
      name: exp.name,
      status: exp.status,
      started_at: exp.started_at,
      ended_at: exp.ended_at,
      variants: exp.experiment_variants || []
    }));

    const pageData: PageData = {
      id: pg.id,
      userId: pg.user_id,
      slug: pg.slug,
      blocks: convertDbBlocksToBlocks(blocks),
      theme: pg.theme_settings as unknown as PageTheme,
      seo: pg.seo_meta as unknown as PageData['seo'],
      isPremium: blocks.some((b) => b.is_premium),
      isPublished: pg.is_published || false,
      viewCount: pg.view_count || 0,
      editorMode: 'grid',
      gridConfig: (pg as unknown as { grid_config?: GridConfig }).grid_config || undefined,
      niche: (pg as unknown as { niche?: string }).niche || 'other',
      previewUrl: (pg as unknown as { preview_url?: string }).preview_url || undefined,
      integrations: (pg as unknown as { integrations?: Record<string, string> }).integrations || undefined,
      favicon_url: pg.favicon_url || undefined,
      hideBranding: pg.hide_branding || false,
      organization_id: pg.organization_id || undefined,
      updatedAt: pg.updated_at || null,
      experiments,
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
        quality_breakdown: pg.quality_breakdown || {},
        index_exclusion_reasons: pg.index_exclusion_reasons || [],
        last_indexnow_at: pg.last_indexnow_at || null,
        service_slugs: pg.service_slugs || {},
      },
    };

    // Extract chatbot context
    const privateData = pg.private_page_data as unknown as { chatbot_context?: string }[] | { chatbot_context?: string } | null;
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

  return data || [];
}
