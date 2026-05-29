import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../admin';
import { supabase } from '@/platform/supabase/client';

vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        rpc: vi.fn(),
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
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: {
                    userDistribution: [
                        { name: 'free', value: 10, color: '#6b7280' },
                        { name: 'premium', value: 5, color: '#eab308' },
                        { name: 'trial', value: 3, color: '#3b82f6' }
                    ]
                },
                error: null
            } as any);

            const result = await AdminService.getUserStatusDistribution();
            expect(result).toHaveLength(3);
        });

        it('should get daily growth', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: {
                    dailyGrowth: [{ date: '2026-05-19', users: 1, pages: 1, views: 1, clicks: 1, shares: 1, blocks: 1, friendships: 0, collabs: 0 }]
                },
                error: null
            } as any);

            const result = await AdminService.getDailyGrowth(1);
            expect(result).toBeDefined();
        });

        it('should get social stats', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: {
                    socialStats: [{ name: 'instagram', total: 5, accepted: 3 }]
                },
                error: null
            } as any);

            const result = await AdminService.getSocialStats();
            expect(result).toBeDefined();
        });

        it('should get event distribution', async () => {
             vi.mocked(supabase.rpc).mockResolvedValue({
                 data: {
                     eventDistribution: [{ name: 'view', count: 10, color: '#06b6d4' }]
                 },
                 error: null
             } as any);
 
             const result = await AdminService.getEventDistribution();
             expect(result).toBeDefined();
        });

        it('should get block type stats', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: {
                    blockTypeStats: [{ name: 'text', count: 5 }]
                },
                error: null
            } as any);

            const result = await AdminService.getBlockTypeStats();
            expect(result).toBeDefined();
        });

        it('should get cumulative users', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: {
                    cumulativeUsers: [{ date: '2026-05-19', total: 10 }]
                },
                error: null
            } as any);

            const result = await AdminService.getCumulativeUsers();
            expect(result).toBeDefined();
        });
    });
});
