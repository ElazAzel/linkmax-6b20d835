/**
 * Unit tests for SavePageUseCase
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavePageUseCase } from '@/use-cases/page/SavePageUseCase';
import { success, failure, isSuccess, isFailure } from '@/domain/value-objects/Result';
import { DEFAULT_THEME, DEFAULT_SEO } from '@/domain/entities/Page';
import type { IPageRepository } from '@/repositories/interfaces/IPageRepository';
import type { PageData } from '@/types/page';

describe('SavePageUseCase', () => {
  let useCase: SavePageUseCase;
  let mockRepository: IPageRepository;

  const mockPageData: PageData = {
    id: 'page-1',
    blocks: [{ id: '1', type: 'profile', name: 'Test', bio: 'Bio' } as any],
    theme: DEFAULT_THEME,
    seo: DEFAULT_SEO,
    editorMode: 'grid',
  };

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(success({ pageId: 'page-1', slug: 'test-user' })),
      loadBySlug: vi.fn(),
      loadUserPage: vi.fn(),
      publish: vi.fn(),
      getUserSlug: vi.fn(),
    };
    useCase = new SavePageUseCase(mockRepository);
  });

  it('should save page successfully', async () => {
    const result = await useCase.execute({
      pageData: mockPageData,
      userId: 'user-123',
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.pageId).toBe('page-1');
      expect(result.data.slug).toBe('test-user');
    }
  });

  it('should fail when userId is missing', async () => {
    const result = await useCase.execute({
      pageData: mockPageData,
      userId: '',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('User ID is required');
    }
  });

  it('should fail when pageData is missing', async () => {
    const result = await useCase.execute({
      pageData: null as any,
      userId: 'user-123',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('Page data is required');
    }
  });

  it('should fail when blocks are empty', async () => {
    const result = await useCase.execute({
      pageData: { ...mockPageData, blocks: [] },
      userId: 'user-123',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('Page must have at least one block');
    }
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');
    mockRepository.save = vi.fn().mockResolvedValue(failure(error));
    useCase = new SavePageUseCase(mockRepository);

    const result = await useCase.execute({
      pageData: mockPageData,
      userId: 'user-123',
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe('Database error');
    }
  });
});
