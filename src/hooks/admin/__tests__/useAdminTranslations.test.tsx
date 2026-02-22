import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminTranslations } from '../useAdminTranslations';
import { fetchTranslationsFromDB, upsertToDB } from '@/lib/i18n-db-backend';

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
    const mockTranslations = {
        'key1': 'value1',
        'key2': ''
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchTranslationsFromDB).mockResolvedValue(mockTranslations);
    });

    it('should load translations on mount', async () => {
        const { result } = renderHook(() => useAdminTranslations());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.translations).toEqual(mockTranslations);
    });

    it('should filter translations by search query', async () => {
        const { result } = renderHook(() => useAdminTranslations());

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setSearchQuery('key1');
        });

        expect(result.current.allKeys).toContain('key1');
        expect(result.current.allKeys).not.toContain('key2');
    });

    it('should update translation and save to DB', async () => {
        vi.mocked(upsertToDB).mockResolvedValue(undefined as any);
        const { result } = renderHook(() => useAdminTranslations());

        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.updateTranslation('key2', 'new value');
        });

        expect(result.current.translations['key2']).toBe('new value');
        expect(upsertToDB).toHaveBeenCalledWith('ru', expect.objectContaining({ 'key2': 'new value' }));
    });

    it('should show missing only when filter is active', async () => {
        const { result } = renderHook(() => useAdminTranslations());

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setShowMissingOnly(true);
        });

        expect(result.current.allKeys).toContain('key2'); // key2 is empty
        expect(result.current.allKeys).not.toContain('key1'); // key1 is filled
    });
});
