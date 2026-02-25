import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminTranslations } from '../useAdminTranslations';
import { upsertToDB } from '@/lib/i18n-db-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock backend
vi.mock('@/lib/i18n-db-backend', () => ({
    upsertToDB: vi.fn()
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn()
}));

const mockT = (key: string) => key;
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: { language: 'ru', changeLanguage: vi.fn() }
    })
}));



describe('useAdminTranslations', () => {
    const mockDbData = {
        'en': { 'key1': 'value1' },
        'ru': { 'key1': 'значение1', 'key2': '' }
    };

    const mockInvalidateQueries = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: mockInvalidateQueries } as any);
        vi.mocked(useQuery).mockReturnValue({ data: mockDbData, isLoading: false } as any);
        vi.mocked(useMutation).mockImplementation((opts: any) => ({
            mutateAsync: opts.mutationFn,
            mutate: opts.mutationFn
        }) as any);
    });

    it('should load translations on mount', () => {
        const { result } = renderHook(() => useAdminTranslations(true));

        expect(result.current.loading).toBe(false);

        expect(result.current.activeLanguages).toContain('en');
        expect(result.current.activeLanguages).toContain('ru');
        expect(result.current.translations['ru']).toEqual(expect.objectContaining({ 'key1': 'значение1' }));
    });

    it('should calculate all keys correctly', () => {
        const { result } = renderHook(() => useAdminTranslations(true));

        expect(result.current.allKeys.all).toContain('key1');
        expect(result.current.allKeys.all).toContain('key2');
        expect(result.current.allKeys.missingCount).toBeGreaterThanOrEqual(1); // key2 is blank in ru, plus any from real json files
    });

    it('should update translation and save to DB', async () => {
        vi.mocked(upsertToDB).mockResolvedValue(undefined as any);
        const { result } = renderHook(() => useAdminTranslations(true));

        await act(async () => {
            await result.current.updateTranslation({ lang: 'ru', key: 'key2', value: 'new value' });
        });

        expect(upsertToDB).toHaveBeenCalledWith('ru', expect.objectContaining({ 'key2': 'new value' }));
    });
});
