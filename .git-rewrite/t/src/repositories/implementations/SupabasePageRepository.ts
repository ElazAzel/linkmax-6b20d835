/**
 * Supabase Page Repository - Implementation of IPageRepository
 * Infrastructure layer - handles actual data access
 */

import { supabase } from '@/platform/supabase/client';
import { success, failure, tryCatchAsync, type Result } from '@/domain/value-objects/Result';
import type { Page } from '@/domain/entities/Page';
import type { Block, ProfileBlock, EditorMode, GridConfig, PageTheme } from '@/types/page';
import type {
  IPageRepository,
  SavePageDTO,
  SavePageResponse,
  LoadPageBySlugDTO,
  LoadPageResponse,
  LoadUserPageDTO,
  LoadUserPageResponse,
  PublishPageDTO,
  PublishPageResponse,
} from '../interfaces/IPageRepository';
import { createDefaultPageData, DEFAULT_THEME, DEFAULT_SEO } from '@/lib/constants';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { Json } from '@/platform/supabase/types';

// ============= Helpers =============

interface DbBlock {
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

function convertDbBlocksToBlocks(dbBlocks: DbBlock[]): Block[] {
  const sorted = [...dbBlocks].sort((a, b) => a.position - b.position);
  const unique = deduplicateBlocks(sorted);
  return unique.map((block) => block.content as unknown as Block);
}

function extractBlockTitle(block: Block, lang: SupportedLanguage = 'ru'): string | null {
  if (!('title' in block) && !('name' in block)) return null;
  
  const rawTitle = 'title' in block ? block.title : ('name' in block ? (block as ProfileBlock).name : null);
  if (!rawTitle) return null;
  
  if (typeof rawTitle === 'string') return rawTitle;
  return getTranslatedString(rawTitle, lang);
}

// ============= Implementation =============

export class SupabasePageRepository implements IPageRepository {
  async getUserSlug(userId: string): Promise<Result<string, Error>> {
    return tryCatchAsync(async () => {
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
    });
  }

  async save(dto: SavePageDTO): Promise<Result<SavePageResponse, Error>> {
    return tryCatchAsync(async () => {
      const { pageData, userId, chatbotContext } = dto;
      
      const slugResult = await this.getUserSlug(userId);
      if (!slugResult.success) {
        throw (slugResult as { success: false; error: Error }).error;
      }
      const slug = (slugResult as { success: true; data: string }).data;

      // Extract profile block data
      const profileBlock = pageData.blocks.find((b) => b.type === 'profile') as ProfileBlock | undefined;
      const profileName = profileBlock ? extractBlockTitle(profileBlock) : 'My Page';
      const profileBio = profileBlock?.bio;
      const bioText = typeof profileBio === 'string' ? profileBio : (profileBio ? getTranslatedString(profileBio, 'ru') : null);

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
      });

      if (upsertError) {
        throw upsertError;
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
        throw blocksError;
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

      return { pageId, slug };
    });
  }

  async loadBySlug(dto: LoadPageBySlugDTO): Promise<Result<LoadPageResponse, Error>> {
    return tryCatchAsync(async () => {
      const { slug } = dto;

      const { data: pageRow, error: pageError } = await supabase
        .from('pages')
        .select('*, blocks(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (pageError) {
        throw pageError;
      }

      if (!pageRow) {
        throw new Error('Page not found');
      }

      // Increment view count (fire and forget)
      void supabase.rpc('increment_view_count', { page_slug: slug });

      const blocks = pageRow.blocks as unknown as DbBlock[];
      const page: Page<Block> = {
        id: pageRow.id,
        userId: pageRow.user_id,
        slug: pageRow.slug,
        blocks: convertDbBlocksToBlocks(blocks),
        theme: pageRow.theme_settings as unknown as PageTheme,
        seo: pageRow.seo_meta as unknown as Page['seo'],
        isPremium: blocks.some((b) => b.is_premium),
        isPublished: pageRow.is_published ?? false,
        editorMode: 'grid',
        gridConfig: (pageRow as unknown as { grid_config?: GridConfig }).grid_config || undefined,
        viewCount: pageRow.view_count ?? 0,
      };

      return { page };
    });
  }

  async loadUserPage(dto: LoadUserPageDTO): Promise<Result<LoadUserPageResponse, Error>> {
    return tryCatchAsync(async () => {
      const { userId } = dto;

      const { data: pageRow, error: pageError } = await supabase
        .from('pages')
        .select('*, blocks(*), private_page_data(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (pageError && pageError.code !== 'PGRST116') {
        throw pageError;
      }

      if (!pageRow) {
        return {
          page: createDefaultPageData(userId) as Page<Block>,
          chatbotContext: null,
        };
      }

      const blocks = pageRow.blocks as unknown as DbBlock[];
      const page: Page<Block> = {
        id: pageRow.id,
        userId: pageRow.user_id,
        slug: pageRow.slug,
        blocks: convertDbBlocksToBlocks(blocks),
        theme: pageRow.theme_settings as unknown as PageTheme,
        seo: pageRow.seo_meta as unknown as Page['seo'],
        isPremium: blocks.some((b) => b.is_premium),
        isPublished: pageRow.is_published ?? false,
        editorMode: 'grid',
        gridConfig: (pageRow as unknown as { grid_config?: GridConfig }).grid_config || undefined,
      };

      // Extract chatbot context
      const privateData = pageRow.private_page_data as unknown as { chatbot_context?: string }[] | { chatbot_context?: string } | null;
      const chatbotContext = Array.isArray(privateData)
        ? privateData[0]?.chatbot_context
        : privateData?.chatbot_context;

      return { page, chatbotContext: chatbotContext || null };
    });
  }

  async publish(dto: PublishPageDTO): Promise<Result<PublishPageResponse, Error>> {
    return tryCatchAsync(async () => {
      const { userId } = dto;

      const { data, error } = await supabase
        .from('pages')
        .update({ is_published: true })
        .eq('user_id', userId)
        .select('slug')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Page not found');
      }

      return { slug: data.slug };
    });
  }
}

// ============= Singleton Instance =============

let pageRepositoryInstance: SupabasePageRepository | null = null;

export function getPageRepository(): IPageRepository {
  if (!pageRepositoryInstance) {
    pageRepositoryInstance = new SupabasePageRepository();
  }
  return pageRepositoryInstance;
}
