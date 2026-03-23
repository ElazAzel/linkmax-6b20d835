import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRoboKassaUrl } from '../robokassa';
import { supabase } from '@/platform/supabase/client';

describe('generateRoboKassaUrl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return url and invId on success', async () => {
        const mockData = { url: 'https://robokassa.ru/123', invId: 'INV123' };
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: mockData,
            error: null
        } as any);

        const params = {
            type: 'subscription' as const,
            amount: 500,
            userId: 'u1'
        };

        const result = await generateRoboKassaUrl(params);

        expect(result).toEqual(mockData);
        expect(supabase.functions.invoke).toHaveBeenCalledWith('robokassa', {
            body: params
        });
    });

    it('should throw error on failure', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: null,
            error: { message: 'Network Error' }
        } as any);

        await expect(generateRoboKassaUrl({
            type: 'payment',
            amount: 100,
            userId: 'u1'
        })).rejects.toThrow('Network Error');
    });
});
