import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminTranslations } from '../useAdminTranslations';
import { upsertToDB } from '@/lib/i18n-db-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

vi.mock('@/platform/supabase/client', () => ({ supabase: { from: vi.fn() } }));

// Mock backend
vi.mock('@/lib/i18n-db-backend', async (importOriginal) => ({
    ...await importOriginal<typeof import('@/lib/i18n-db-backend')>(),
    upsertToDB: vi.fn(),
    applyTranslationsToI18n: async () => undefined,
    syncI18nWithDB: async () => undefined,
}));

vi.mock('@/i18n/config', () => ({
    default: { language: 'ru' },
    SUPPORTED_LANGUAGES: ['en', 'ru', 'kk', 'uz'],
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn()
}));

const mockT = (key: string) => key;
vi.mock('react-i18next', () => ({
    initReactI18next: { type: '3rdParty', init: vi.fn() },
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
        vi.mocked(useQuery).mockReturnValue({ data: {
            bundled: { en: { common: { save: 'Save', cancel: 'Cancel' } }, ru: {}, kk: {}, uz: {} },
            remote: mockDbData,
        }, isLoading: false } as any);
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

    it('saves only the edited override without copying bundled translations into the database', async () => {
        const { result } = renderHook(() => useAdminTranslations(true));
        await act(async () => {
            await result.current.updateTranslation({ lang: 'en', key: 'common.save', value: 'Saved override' });
        });
        expect(upsertToDB).toHaveBeenCalledWith('en', {
            common: { save: 'Saved override' }, key1: 'value1',
        });
        expect(result.current.allKeys.all).not.toContain('translation.common.save');
        expect(result.current.activeLanguages).toContain('uz');
    });

    it('does not overwrite translations when the database read failed', async () => {
        vi.mocked(useQuery).mockReturnValue({ data: undefined, error: new Error('offline'), isLoading: false } as any);
        const { result } = renderHook(() => useAdminTranslations(true));
        await expect(result.current.updateTranslation({ lang: 'ru', key: 'common.save', value: 'x' })).rejects.toThrow();
        await expect(result.current.upsertFullTranslations([{ lang: 'ru', data: {} }])).rejects.toThrow();
        await expect(result.current.deleteKey('common.save')).rejects.toThrow();
        expect(upsertToDB).not.toHaveBeenCalled();
    });

    it('does not write without admin access', async () => {
        const { result } = renderHook(() => useAdminTranslations(false));
        await expect(result.current.updateTranslation({ lang: 'ru', key: 'key1', value: 'x' })).rejects.toThrow();
        expect(upsertToDB).not.toHaveBeenCalled();
    });

    it('distinguishes saved values and empty DB entries from bundled fallback coverage', () => {
        const { result } = renderHook(() => useAdminTranslations(true));
        expect(result.current.sourceStats.en).toEqual({ saved: true, storedFilled: 1, storedEmpty: 0, fallbackFilled: 2 });
        expect(result.current.sourceStats.ru.storedEmpty).toBe(1);
        expect(result.current.sourceStats.uz.saved).toBe(false);
    });

    it('loads normalized saved keys and gives canonical records priority over legacy uploads', async () => {
        vi.mocked(supabase.from).mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({ data: [{ lang_code: 'en', data: { translation: { common: { save: 'Saved in admin' } } } }], error: null }),
        } as any).mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ language_code: 'en', translations: { common: { save: 'Old upload' } } }], error: null }),
        } as any);
        renderHook(() => useAdminTranslations(true));
        const options = vi.mocked(useQuery).mock.calls[0][0];
        const result = await (options.queryFn as () => Promise<any>)();
        expect(result.remote.en).toEqual({ common: { save: 'Saved in admin' } });
        expect(result.bundled.en.translation).toBeUndefined();
        expect(result.bundled.uz).toBeDefined();
    });
});
