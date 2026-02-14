/**
 * Page Repository Interface - Contract for page data operations
 * Part of the Repository pattern (Clean Architecture)
 */

import type { Result } from '@/domain/value-objects/Result';
import type { Page, PageTheme, PageSeo, GridConfig, EditorMode } from '@/domain/entities/Page';
import type { Block } from '@/types/page';

// ============= DTOs =============

export interface SavePageDTO {
  pageData: Page<Block>;
  userId: string;
  chatbotContext?: string;
}

export interface LoadPageBySlugDTO {
  slug: string;
}

export interface LoadUserPageDTO {
  userId: string;
}

export interface PublishPageDTO {
  userId: string;
}

// ============= Response Types =============

export interface SavePageResponse {
  pageId: string;
  slug: string;
}

export interface LoadPageResponse {
  page: Page<Block>;
}

export interface LoadUserPageResponse {
  page: Page<Block>;
  chatbotContext: string | null;
}

export interface PublishPageResponse {
  slug: string;
}

// ============= Repository Interface =============

/**
 * Page Repository Interface
 * Defines the contract for page data access
 */
export interface IPageRepository {
  /**
   * Save a page with all its blocks
   */
  save(dto: SavePageDTO): Promise<Result<SavePageResponse, Error>>;

  /**
   * Load a published page by its slug
   */
  loadBySlug(dto: LoadPageBySlugDTO): Promise<Result<LoadPageResponse, Error>>;

  /**
   * Load user's own page
   */
  loadUserPage(dto: LoadUserPageDTO): Promise<Result<LoadUserPageResponse, Error>>;

  /**
   * Publish user's page
   */
  publish(dto: PublishPageDTO): Promise<Result<PublishPageResponse, Error>>;

  /**
   * Get user's slug (from username or generate new one)
   */
  getUserSlug(userId: string): Promise<Result<string, Error>>;
}
