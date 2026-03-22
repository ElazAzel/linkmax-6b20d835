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
            
            mockFrom.mockReturnValueOnce({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockPageData, error: null })
            } as any);

            const result = await pagesService.publishPage('test-user-id');

            expect(result.error).toBeNull();
            expect(result.slug).toEqual('test-slug');
            
            const updateCall = vi.mocked(mockFrom).mock.results[0].value.update;
            expect(updateCall).toHaveBeenCalledWith({ is_published: true });
        });
    });
});
