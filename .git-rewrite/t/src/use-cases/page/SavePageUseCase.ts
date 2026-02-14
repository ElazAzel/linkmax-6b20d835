/**
 * SavePageUseCase - Application use case for saving user pages
 * Orchestrates page saving with validation and error handling
 */
import { success, failure, isSuccess, type Result } from '@/domain/value-objects/Result';
import { getPageRepository } from '@/repositories/implementations/SupabasePageRepository';
import type { IPageRepository } from '@/repositories/interfaces/IPageRepository';
import type { PageData, Block } from '@/types/page';
import type { Page } from '@/domain/entities/Page';

export interface SavePageInput {
  pageData: PageData;
  userId: string;
  chatbotContext?: string;
}

export interface SavePageOutput {
  pageId: string;
  slug: string;
}

export class SavePageUseCase {
  constructor(private readonly pageRepository: IPageRepository = getPageRepository()) {}

  async execute(input: SavePageInput): Promise<Result<SavePageOutput, Error>> {
    // Validate input
    if (!input.userId) {
      return failure(new Error('User ID is required'));
    }

    if (!input.pageData) {
      return failure(new Error('Page data is required'));
    }

    if (!input.pageData.blocks || input.pageData.blocks.length === 0) {
      return failure(new Error('Page must have at least one block'));
    }

    // Convert PageData to Page entity format
    const page: Page<Block> = {
      id: input.pageData.id,
      userId: input.userId,
      blocks: input.pageData.blocks,
      theme: input.pageData.theme,
      seo: input.pageData.seo,
      isPremium: input.pageData.isPremium,
      editorMode: input.pageData.editorMode,
      gridConfig: input.pageData.gridConfig,
    };

    // Execute save operation
    const result = await this.pageRepository.save({
      pageData: page,
      userId: input.userId,
      chatbotContext: input.chatbotContext,
    });

    if (!isSuccess(result)) {
      return failure(result.error);
    }

    return success({
      pageId: result.data.pageId,
      slug: result.data.slug,
    });
  }
}

// Factory function for easier testing
export function createSavePageUseCase(
  pageRepository?: IPageRepository
): SavePageUseCase {
  return new SavePageUseCase(pageRepository);
}

// Singleton instance
let instance: SavePageUseCase | null = null;

export function getSavePageUseCase(): SavePageUseCase {
  if (!instance) {
    instance = new SavePageUseCase();
  }
  return instance;
}
