import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pagesService from '../pages';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    }
}));

// Provide basic mocks for the auth context if needed
vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } as any }, error: null })
        },
        rpc: vi.fn()
    }
}));

describe('pagesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabase.from).mockReset();
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'test-user-id' } as any }, error: null });
    });

    describe('Pure Logic Functions', () => {
        describe('isBlockScheduledVisible', () => {
            it('should return true when no schedule is set', () => {
                expect(pagesService.isBlockScheduledVisible()).toBe(true);
            });

            it('should return false when start date is in the future', () => {
                const futureDate = new Date(Date.now() + 86400000);
                expect(pagesService.isBlockScheduledVisible({ startDate: futureDate.toISOString() })).toBe(false);
            });

            it('should return true when current time is within schedule range', () => {
                const pastDate = new Date(Date.now() - 86400000).toISOString();
                const futureDate = new Date(Date.now() + 86400000).toISOString();
                expect(pagesService.isBlockScheduledVisible({ startDate: pastDate, endDate: futureDate })).toBe(true);
            });
        });

        describe('generateBlockId', () => {
            it('should generate unique IDs starting with type', () => {
                const id = pagesService.generateBlockId('link');
                expect(id).toContain('link-');
                expect(pagesService.generateBlockId('link')).not.toBe(id);
            });
        });

        describe('validateBlock', () => {
            it('should return valid for correct block', () => {
                const result = pagesService.validateBlock({ id: '1', type: 'link' });
                expect(result.valid).toBe(true);
            });

            it('should return error for missing type', () => {
                const result = pagesService.validateBlock({ id: '1' });
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Block type is required');
            });
        });

        describe('canPublishPage', () => {
            it('should return false for empty blocks', () => {
                const result = pagesService.canPublishPage([]);
                expect(result.canPublish).toBe(false);
            });

            it('should return true if profile block is present', () => {
                const result = pagesService.canPublishPage([{ id: '1', type: 'profile' } as any]);
                expect(result.canPublish).toBe(true);
            });
        });
    });

    describe('savePage (create/update)', () => {
        it('should save page successfully', async () => {
            const mockPageData = {
                id: 'page-123',
                title: 'Test Page',
                slug: 'test-page'
            };

            const mockFrom = vi.mocked(supabase.from);
            const mockRpc = vi.mocked(supabase.rpc);
            
            // getUserSlug -> user_profiles maybeSingle
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { username: 'test-user-slug' }, error: null })
            } as any);

            // savePage -> upsert_user_page
            mockRpc.mockResolvedValueOnce({ data: 'page-123', error: null } as any);
            // savePage -> save_page_blocks
            mockRpc.mockResolvedValueOnce({ data: null, error: null } as any);
            
            // savePage -> fetch final page
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockPageData, error: null })
            } as any);

            const pageInput = { blocks: [], theme: 'light' } as any;
            const result = await pagesService.savePage(pageInput, 'test-user-id');

            expect(result.error).toBeNull();
            expect(result.data).toEqual(mockPageData);
            expect(supabase.rpc).toHaveBeenCalledWith('upsert_user_page', expect.any(Object));
        });

        it('should handle creation error gracefully', async () => {
            const mockFrom = vi.mocked(supabase.from);
            const mockRpc = vi.mocked(supabase.rpc);
            
            // getUserSlug -> user_profiles maybeSingle
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { username: 'test-user-slug' }, error: null })
            } as any);

            const dbError = new Error('Database error');
            // savePage -> upsert_user_page fails
            mockRpc.mockResolvedValueOnce({ data: null, error: dbError } as any);

            const pageInput = { blocks: [] } as any;
            const result = await pagesService.savePage(pageInput, 'test-user-id');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(dbError);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('loadUserPage', () => {
        it('should fetch a page for the current user', async () => {
            const mockPageData = { id: 'page-123', slug: 'test-page', blocks: [] };
            const mockFrom = vi.mocked(supabase.from);
            
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockPageData, error: null })
            } as any);

            const result = await pagesService.loadUserPage('test-user-id');

            expect(result.error).toBeNull();
            expect(result.data?.id).toEqual('page-123');
            
            const eqCall = vi.mocked(mockFrom).mock.results[0].value.eq;
            expect(eqCall).toHaveBeenCalledWith('user_id', 'test-user-id');
        });
    });
    describe('publishPage', () => {
        it('should update is_published to true and return slug', async () => {
            const mockPageData = { slug: 'test-slug' };
            const mockFrom = vi.mocked(supabase.from);
            
            // 1. load page id
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'page-123' }, error: null })
            } as any);

            // 2. load blocks content
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [{ content: { id: '1', type: 'profile' } }], error: null })
            } as any);

            // 3. update page is_published
            mockFrom.mockReturnValueOnce({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockPageData, error: null })
            } as any);

            const result = await pagesService.publishPage('test-user-id');

            expect(result.error).toBeNull();
            expect(result.slug).toEqual('test-slug');
            
            const updateCall = vi.mocked(mockFrom).mock.results[2].value.update;
            expect(updateCall).toHaveBeenCalledWith({ is_published: true });
        });
    });

    describe('loadPageBySlug', () => {
        it('should load public page by slug', async () => {
            const mockPage = { id: 'p1', slug: 's1', is_published: true, view_count: 5 };
            const mockFrom = vi.mocked(supabase.from);
            
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockPage, error: null })
            } as any);

            const result = await pagesService.loadPageBySlug('s1');
            expect(result.data?.slug).toBe('s1');
            expect(supabase.rpc).toHaveBeenCalledWith('increment_view_count', { page_slug: 's1' });
        });
    });

    describe('updatePageNiche', () => {
        it('should update page niche', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            } as any);

            const result = await pagesService.updatePageNiche('u1', 'e-commerce');
            expect(result.error).toBeNull();
        });
    });

    describe('updatePageEntityFields', () => {
        it('should update entity fields', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            } as any);

            const result = await pagesService.updatePageEntityFields('u1', { city: 'Almaty' });
            expect(result.error).toBeNull();
        });
    });

    describe('getPublicPages', () => {
        it('should return list of slugs', async () => {
            const mockData = [{ slug: 'p1', updated_at: '2024-01-01' }];
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: mockData, error: null })
            } as any);

            const result = await pagesService.getPublicPages();
            expect(result).toHaveLength(1);
            expect(result[0].slug).toBe('p1');
        });
    });
});
