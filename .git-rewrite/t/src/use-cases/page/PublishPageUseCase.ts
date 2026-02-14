/**
 * PublishPageUseCase - Application use case for publishing pages
 * Makes user's page publicly accessible
 */
import { success, failure, isSuccess, type Result } from '@/domain/value-objects/Result';
import { getPageRepository } from '@/repositories/implementations/SupabasePageRepository';
import type { IPageRepository } from '@/repositories/interfaces/IPageRepository';

export interface PublishPageInput {
  userId: string;
}

export interface PublishPageOutput {
  slug: string;
}

export class PublishPageUseCase {
  constructor(private readonly pageRepository: IPageRepository = getPageRepository()) {}

  async execute(input: PublishPageInput): Promise<Result<PublishPageOutput, Error>> {
    if (!input.userId) {
      return failure(new Error('User ID is required'));
    }

    const result = await this.pageRepository.publish({ userId: input.userId });

    if (!isSuccess(result)) {
      return failure(result.error);
    }

    return success({
      slug: result.data.slug,
    });
  }
}

// Factory function for easier testing
export function createPublishPageUseCase(
  pageRepository?: IPageRepository
): PublishPageUseCase {
  return new PublishPageUseCase(pageRepository);
}

// Singleton instance
let instance: PublishPageUseCase | null = null;

export function getPublishPageUseCase(): PublishPageUseCase {
  if (!instance) {
    instance = new PublishPageUseCase();
  }
  return instance;
}
