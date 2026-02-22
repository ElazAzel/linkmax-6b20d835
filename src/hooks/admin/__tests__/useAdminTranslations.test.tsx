import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminTranslations } from '../useAdminTranslations';
import { fetchTranslationsFromDB, upsertToDB } from '@/lib/i18n-db-backend';
import { supabase } from '@/integrations/supabase/client';

// Mock backend
vi.mock('@/lib/i18n-db-backend', () => ({
    fetchTranslationsFromDB: vi.fn(),
    upsertToDB: vi.fn(),
    syncI18nWithDB: vi.fn()
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

describe('useAdminTranslations', () => {
    const mockDbData = [
        { lang_code: 'en', data: { 'key1': 'value1' } },
        { lang_code: 'ru', data: { 'key1': 'значение1', 'key2': '' } }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock supabase response
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: mockDbData, error: null })
        };
        vi.mocked(supabase.from).mockImplementation(mockSupabase.from as any);
    });

    it('should load translations on mount', async () => {
        const { result } = renderHook(() => useAdminTranslations(true));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.activeLanguages).toContain('en');
        expect(result.current.activeLanguages).toContain('ru');
        expect(result.current.translations['ru']).toEqual(expect.objectContaining({ 'key1': 'значение1' }));
    });

    it('should calculate all keys correctly', async () => {
        const { result } = renderHook(() => useAdminTranslations(true));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.allKeys.all).toContain('key1');
        expect(result.current.allKeys.all).toContain('key2');
        expect(result.current.allKeys.missingCount).toBe(1); // key2 is empty for 'ru'
    });

    it('should update translation and save to DB', async () => {
        vi.mocked(upsertToDB).mockResolvedValue(undefined as any);
        const { result } = renderHook(() => useAdminTranslations(true));

        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.updateTranslation({ lang: 'ru', key: 'key2', value: 'new value' });
        });

        expect(upsertToDB).toHaveBeenCalledWith('ru', expect.objectContaining({ 'key2': 'new value' }));
    });
});
