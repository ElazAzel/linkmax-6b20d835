import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../admin';
import { supabase } from '@/platform/supabase/client';

vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
        })),
        rpc: vi.fn().mockResolvedValue({ data: {
            dailyGrowth: [],
            userDistribution: [],
            eventDistribution: [],
            cumulativeUsers: [],
            socialStats: [],
            blockTypeStats: [],
        }, error: null }),
    },
}));

describe('AdminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Partners CRUD', () => {
        it('should get partners', async () => {
            const mockPartners = [{ id: '1', name: 'Partner 1' }];
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockPartners, error: null }),
            } as any);

            const result = await AdminService.getPartners();
            expect(result).toEqual(mockPartners);
        });

        it('should create partner', async () => {
            const partnerData = { name: 'New Partner', logo_url: 'url', website_url: 'site', sort_order: 1, is_active: true };
            vi.mocked(supabase.from).mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            await expect(AdminService.createPartner(partnerData)).resolves.not.toThrow();
        });

        it('should update partner', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            await expect(AdminService.updatePartner('1', { name: 'Updated' } as any)).resolves.not.toThrow();
        });

        it('should delete partner', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            await expect(AdminService.deletePartner('1')).resolves.not.toThrow();
        });
    });

    describe('Statistics', () => {
        it('should get user status distribution', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: {
                dailyGrowth: [],
                userDistribution: [
                    { status: 'active', user_count: 10 },
                    { status: 'inactive', user_count: 5 },
                    { status: 'banned', user_count: 1 },
                ],
                eventDistribution: [],
                cumulativeUsers: [],
                socialStats: [],
                blockTypeStats: [],
            }, error: null, count: null, status: 200, statusText: 'OK' } as any);

            const result = await AdminService.getUserStatusDistribution();
            expect(result).toHaveLength(3);
        });

        it('should get daily growth', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                gte: vi.fn().mockResolvedValue({ data: [{ created_at: new Date().toISOString() }], error: null }),
            } as any);

            const result = await AdminService.getDailyGrowth(1);
            expect(result).toBeDefined();
        });

        it('should get social stats', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
            } as any);

            const result = await AdminService.getSocialStats();
            expect(result).toBeDefined();
        });

        it('should get event distribution', async () => {
             vi.mocked(supabase.from).mockReturnValue({
                 select: vi.fn().mockResolvedValue({ data: [{ event_type: 'view' }], error: null }),
             } as any);
 
             const result = await AdminService.getEventDistribution();
             expect(result).toBeDefined();
        });

        it('should get block type stats', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: [{ type: 'text' }, { type: 'link' }], error: null }),
            } as any);

            const result = await AdminService.getBlockTypeStats();
            expect(result).toBeDefined();
        });

        it('should get cumulative users', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [{ created_at: new Date().toISOString() }], error: null }),
            } as any);

            const result = await AdminService.getCumulativeUsers();
            expect(result).toBeDefined();
        });
    });
});
