import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pagesService from '../pages';
import type { ExpertDirectoryProfile } from '../pages';
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

        describe('expert directory helpers', () => {
            const expertProfile = (
                id: string,
                averageRating: number | null,
                publishedCount: number,
                viewCount: number
            ): ExpertDirectoryProfile => ({
                id,
                slug: id,
                title: id,
                description: null,
                avatar_url: null,
                niche: null,
                city: null,
                profession: null,
                entity_type: 'person',
                view_count: viewCount,
                reviewSummary: {
                    averageRating,
                    publishedCount,
                    lastReviewAt: null,
                },
            });

            it('normalizes expert directory filters for URL state', () => {
                expect(pagesService.normalizeExpertDirectoryFilter('  Almaty\ncenter  ')).toBe('Almaty center');
                expect(pagesService.normalizeExpertDirectoryFilter('   ')).toBeNull();
                expect(pagesService.normalizeExpertDirectoryFilter('abcdef', 3)).toBe('abc');
            });

            it('sorts verified expert profiles before view-only profiles', () => {
                const sorted = pagesService.sortExpertDirectoryProfiles([
                    expertProfile('popular-without-reviews', null, 0, 5000),
                    expertProfile('highest-rating', 4.9, 2, 100),
                    expertProfile('same-rating-more-reviews', 4.8, 10, 90),
                    expertProfile('same-rating-fewer-reviews', 4.8, 3, 1000),
                ]);

                expect(sorted.map((profile) => profile.id)).toEqual([
                    'highest-rating',
                    'same-rating-more-reviews',
                    'same-rating-fewer-reviews',
                    'popular-without-reviews',
                ]);
            });
        });
    });

    describe('savePage legacy adapter', () => {
        it('writes only a private draft with CAS', async () => {
            const rpc = vi.mocked(supabase.rpc);
            rpc.mockResolvedValueOnce({ data: { revision: 2, base_published_revision: 1 }, error: null } as any);
            rpc.mockResolvedValueOnce({ data: { revision: 3 }, error: null } as any);
            const pageInput = { id: 'page-123', blocks: [], theme: {} } as any;
            const result = await pagesService.savePage(pageInput, 'test-user-id');
            expect(result.error).toBeNull();
            expect(rpc).toHaveBeenLastCalledWith('save_page_draft', expect.objectContaining({ p_expected_revision: 2, p_base_published_revision: 1 }));
            expect(supabase.from).not.toHaveBeenCalled();
        });
        it('missing migration never falls back to public writes', async () => {
            vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { code: 'PGRST202' } } as any);
            const result = await pagesService.savePage({ id: 'page-123', blocks: [] } as any, 'test-user-id');
            expect(result.error?.message).toContain('migration');
            expect(supabase.from).not.toHaveBeenCalled();
            expect(supabase.rpc).toHaveBeenCalledTimes(1);
        });
    });
    describe('loadUserPage', () => {
        it('should fetch a page for the current user', async () => {
            const mockPageData = { id: 'page-123', slug: 'test-page', blocks: [] };
            const mockFrom = vi.mocked(supabase.from);
            const mockRpc = vi.mocked(supabase.rpc);

            // get_my_full_page RPC
            mockRpc.mockResolvedValueOnce({ data: [mockPageData], error: null } as any);

            // blocks fetch
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [], error: null })
            } as any);

            // private_page_data fetch
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            } as any);

            const result = await pagesService.loadUserPage('test-user-id');

            expect(result.error).toBeNull();
            expect(result.data?.id).toEqual('page-123');
            expect(mockRpc).toHaveBeenCalledWith('get_my_full_page', { p_user_id: 'test-user-id' });
        });
    });
    describe('publishPage legacy adapter', () => {
        it('requires a reviewed editor draft and never writes public state', async () => {
            const result = await pagesService.publishPage('test-user-id', 'page-2');
            expect(result.error?.message).toContain('Publish');
            expect(result.slug).toBeNull();
            expect(supabase.from).not.toHaveBeenCalled();
            expect(supabase.rpc).not.toHaveBeenCalled();
        });
    });
    describe('loadUserPage with a page id', () => {
        it('uses the full-row RPC for a secondary page', async () => {
            const mockFrom = vi.mocked(supabase.from);
            const mockRpc = vi.mocked(supabase.rpc);
            mockRpc
                .mockResolvedValueOnce({ data: [{ id: 'primary', slug: 'main', user_id: 'u1' }], error: null } as any)
                .mockResolvedValueOnce({ data: [{ id: 'second', slug: 'second', user_id: 'u1', webhook_url: 'https://hook.example' }], error: null } as any);
            mockFrom
                .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) } as any)
                .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) } as any);

            const result = await pagesService.loadUserPage('u1', 'second');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('second');
            expect(mockRpc).toHaveBeenCalledWith('get_my_full_page_by_id', { p_page_id: 'second' });
            // Bound call: an unbound supabase.rpc throws at runtime.
            expect(mockRpc.mock.contexts[1]).toBe(supabase);
        });

        it('loads the requested page when get_my_full_page returns a different one', async () => {
            const mockFrom = vi.mocked(supabase.from);
            const mockRpc = vi.mocked(supabase.rpc);
            mockRpc
                .mockResolvedValueOnce({ data: [{ id: 'primary', slug: 'main', user_id: 'u1' }], error: null } as any)
                // get_my_full_page_by_id not deployed yet
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST202', message: 'not found' } } as any);

            const requested = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'second', slug: 'second', user_id: 'u1' }, error: null }),
            };
            mockFrom
                .mockReturnValueOnce(requested as any)
                .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) } as any)
                .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) } as any);

            const result = await pagesService.loadUserPage('u1', 'second');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('second');
            expect(result.data?.slug).toBe('second');
            expect(requested.eq).toHaveBeenCalledWith('id', 'second');
            expect(requested.eq).toHaveBeenCalledWith('user_id', 'u1');
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

        it('scopes the update to one page when a page id is given', async () => {
            const mockFrom = vi.mocked(supabase.from);
            const chain: any = { update: vi.fn(), eq: vi.fn() };
            chain.update.mockReturnValue(chain);
            let calls = 0;
            chain.eq.mockImplementation(() => (++calls < 2 ? chain : Promise.resolve({ error: null })));
            mockFrom.mockReturnValueOnce(chain);

            const result = await pagesService.updatePageNiche('u1', 'beauty', 'page-7');
            expect(result.error).toBeNull();
            expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
            expect(chain.eq).toHaveBeenCalledWith('id', 'page-7');
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
