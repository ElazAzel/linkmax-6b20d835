import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as analyticsService from '../analytics';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }
}));

// Mock Supabase
vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
    }
}));

// Mock window/navigator properties for enrichment
const originalNavigator = { ...global.navigator };
const originalScreen = { ...global.screen };
const originalDocument = { ...global.document };

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.rpc).mockReset();

    // Setup global mocks
    Object.defineProperty(global, 'navigator', {
        value: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            language: 'en-US',
            sendBeacon: vi.fn(),
        },
        writable: true,
    });

    Object.defineProperty(global, 'screen', {
        value: { width: 1920, height: 1080 },
        writable: true,
    });

    Object.defineProperty(global, 'document', {
        value: { referrer: 'https://google.com' },
        writable: true,
    });

    // Mock fetch for geo APIs
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            country_name: 'United States',
            country_code: 'US',
            city: 'New York',
            region: 'NY'
        })
    });
});

afterEach(() => {
    Object.defineProperty(global, 'navigator', { value: originalNavigator });
    Object.defineProperty(global, 'screen', { value: originalScreen });
    Object.defineProperty(global, 'document', { value: originalDocument });
});

describe('analyticsService', () => {
    describe('trackEvent', () => {
        it('should insert an enriched analytics event', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockResolvedValue({ data: null, error: null })
            } as any);

            await analyticsService.trackEvent({
                pageId: 'page-123',
                eventType: 'view',
                metadata: { customField: 'test' }
            });

            expect(mockFrom).toHaveBeenCalledWith('analytics');
            const insertCall = vi.mocked(mockFrom).mock.results[0].value.insert;
            expect(insertCall).toHaveBeenCalledWith(
                expect.objectContaining({
                    page_id: 'page-123',
                    event_type: 'view',
                    metadata: expect.objectContaining({
                        customField: 'test',
                        source: 'google',
                        medium: 'organic',
                        device: 'desktop',
                        country: 'US',
                    })
                })
            );
        });

        it('should fail silently without throwing exceptions', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockRejectedValue(new Error('Network error'))
            } as any);

            // Should not throw
            await analyticsService.trackEvent({
                pageId: 'page-123',
                eventType: 'click'
            });

            expect(logger.debug).toHaveBeenCalledWith('Analytics tracking failed', expect.any(Object));
        });
    });

    describe('trackPageView', () => {
        it('should increment view count via RPC and track event', async () => {
            const mockFrom = vi.mocked(supabase.from);
            const mockRpc = vi.mocked(supabase.rpc);

            // Mock to get slug
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { slug: 'test-slug' }, error: null })
            } as any);

            // Mock for trackEvent
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockResolvedValue({ data: null, error: null })
            } as any);

            mockRpc.mockResolvedValueOnce({ data: null, error: null } as any);

            await analyticsService.trackPageView('page-123');

            expect(mockRpc).toHaveBeenCalledWith('increment_view_count', { page_slug: 'test-slug' });
            expect(mockFrom).toHaveBeenCalledWith('analytics'); // tracking insert
        });
    });

    describe('fetchPageAnalytics', () => {
        it('should fetch analytics data successfully', async () => {
            const mockData = [
                { id: '1', page_id: 'page-123', event_type: 'view', created_at: '2023-10-01T00:00:00Z' }
            ];
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockData, error: null })
            } as any);

            const startDate = new Date('2023-10-01');
            const endDate = new Date('2023-10-31');
            
            const result = await analyticsService.fetchPageAnalytics('page-123', startDate, endDate);

            expect(result).toEqual(mockData);
            
            const gteCall = vi.mocked(mockFrom).mock.results[0].value.gte;
            expect(gteCall).toHaveBeenCalledWith('created_at', expect.any(String));
        });

        it('should return empty array on fetch error', async () => {
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
            } as any);

            const result = await analyticsService.fetchPageAnalytics('page-123', new Date(), new Date());

            expect(result).toEqual([]);
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
