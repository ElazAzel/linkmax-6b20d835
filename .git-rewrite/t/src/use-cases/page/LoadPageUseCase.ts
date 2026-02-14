/**
 * LoadPageUseCase - Application use case for loading pages
 * Handles loading user pages and public pages
 */
import { success, failure, isSuccess, type Result } from '@/domain/value-objects/Result';
import { getPageRepository } from '@/repositories/implementations/SupabasePageRepository';
import type { IPageRepository } from '@/repositories/interfaces/IPageRepository';
import type { PageData, Block } from '@/types/page';
import type { Page } from '@/domain/entities/Page';

export interface LoadUserPageInput {
  userId: string;
}

export interface LoadUserPageOutput {
  pageData: PageData;
  chatbotContext: string | null;
}

export interface LoadPublicPageInput {
  slug: string;
}

export interface LoadPublicPageOutput {
  pageData: PageData;
}

/**
 * Convert Page entity to PageData
 */
function pageToPageData(page: Page<Block>, userId?: string): PageData {
  return {
    id: page.id,
    userId: page.userId || userId,
    blocks: page.blocks,
    theme: page.theme,
    seo: page.seo,
    isPremium: page.isPremium,
    editorMode: page.editorMode,
    gridConfig: page.gridConfig,
  };
}

export class LoadPageUseCase {
  constructor(private readonly pageRepository: IPageRepository = getPageRepository()) {}

  /**
   * Load user's own page for editing
   */
  async loadUserPage(input: LoadUserPageInput): Promise<Result<LoadUserPageOutput, Error>> {
    if (!input.userId) {
      return failure(new Error('User ID is required'));
    }

    const result = await this.pageRepository.loadUserPage({ userId: input.userId });

    if (!isSuccess(result)) {
      return failure(result.error);
    }

    return success({
      pageData: pageToPageData(result.data.page, input.userId),
      chatbotContext: result.data.chatbotContext,
    });
  }

  /**
   * Load public page by slug for viewing
   */
  async loadPublicPage(input: LoadPublicPageInput): Promise<Result<LoadPublicPageOutput, Error>> {
    if (!input.slug) {
      return failure(new Error('Page slug is required'));
    }

    const result = await this.pageRepository.loadBySlug({ slug: input.slug });

    if (!isSuccess(result)) {
      return failure(result.error);
    }

    return success({
      pageData: pageToPageData(result.data.page),
    });
  }
}

// Factory function for easier testing
export function createLoadPageUseCase(
  pageRepository?: IPageRepository
): LoadPageUseCase {
  return new LoadPageUseCase(pageRepository);
}

// Singleton instance
let instance: LoadPageUseCase | null = null;

export function getLoadPageUseCase(): LoadPageUseCase {
  if (!instance) {
    instance = new LoadPageUseCase();
  }
  return instance;
}
