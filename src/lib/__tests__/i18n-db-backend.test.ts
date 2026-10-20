import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    applyTranslationsToI18n,
    fetchTranslationsFromDB,
    normalizeTranslationPayload,
    syncI18nWithDB,
    upsertToDB,
    unwrapTranslationPayload,
} from '../i18n-db-backend';
import { supabase } from '@/platform/supabase/client';
import i18next from 'i18next';

vi.mock('i18next', () => ({
    default: {
        addResourceBundle: vi.fn(),
        changeLanguage: vi.fn(),
        language: 'ru'
    }
}));

vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        from: vi.fn()
    }
}));

vi.mock('@/lib/utils/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

describe('i18n-db-backend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchTranslationsFromDB', () => {
        it('should return data from supabase', async () => {
            const mockData = { data: { hello: 'привет' } };
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null })
            } as any);

            const result = await fetchTranslationsFromDB('ru');
            expect(result).toEqual({ hello: 'привет' });
            expect(mockFrom).toHaveBeenCalledWith('i18n_translations');
        });

        it('should return null on error', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
            } as any);

            const result = await fetchTranslationsFromDB('ru');
            expect(result).toBeNull();
        });

        it('propagates failures to the synchronizer so the locale can be retried', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'offline' } }),
            } as any);
            await expect(syncI18nWithDB(i18next as any, 'ru')).rejects.toEqual({ message: 'offline' });
        });

        it('reads previously uploaded files from the legacy language table', async () => {
            const query = (data: unknown) => ({
                select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
            });
            vi.mocked(supabase.from).mockReturnValueOnce(query(null) as any)
                .mockReturnValueOnce(query({ translations: { common: { save: 'Existing upload' } } }) as any);
            expect(await fetchTranslationsFromDB('en')).toEqual({ common: { save: 'Existing upload' } });
            expect(supabase.from).toHaveBeenLastCalledWith('languages');
        });
    });

    describe('upsertToDB', () => {
        it('should call supabase upsert with correct data', async () => {
            const langCode = 'en';
            const data = { welcome: 'Welcome' };
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValue({
                upsert: vi.fn().mockResolvedValue({ error: null })
            } as any);

            await upsertToDB(langCode, data);
            expect(mockFrom).toHaveBeenCalledWith('i18n_translations');
        });
    });

    describe('syncI18nWithDB', () => {
        it('should add resource bundles to i18next', async () => {
            const mockData = { key: 'значение' };
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { data: mockData }, error: null })
            } as any);

            await syncI18nWithDB(i18next as any, 'ru');

            expect(i18next.addResourceBundle).toHaveBeenCalledWith('ru', 'translation', mockData, true, true);
            expect(i18next.changeLanguage).toHaveBeenCalledWith('ru');
        });
    });

    describe('normalizeTranslationPayload', () => {
        it('unwraps admin keys without hiding intentionally empty values', () => {
            expect(unwrapTranslationPayload({ translation: { common: { save: '' } }, common: { cancel: 'Cancel' } }))
                .toEqual({ common: { save: '', cancel: 'Cancel' } });
        });
        it('should merge legacy translation namespace with top-level keys', () => {
            const result = normalizeTranslationPayload({
                translation: { common: { save: 'Save' }, oldOnly: 'old' },
                common: { cancel: 'Cancel' },
            });

            expect(result).toEqual({
                common: { save: 'Save', cancel: 'Cancel' },
                oldOnly: 'old',
            });
        });

        it('should ignore corrupted database strings and preserve valid siblings', () => {
            const result = normalizeTranslationPayload({
                landing: {
                    title: '???????? ????????',
                    subtitle: 'Valid subtitle',
                },
                common: {
                    save: '\uFFFD\uFFFD\uFFFD',
                    cancel: 'Cancel',
                },
            });

            expect(result).toEqual({
                landing: { subtitle: 'Valid subtitle' },
                common: { cancel: 'Cancel' },
            });
        });
    });

    describe('applyTranslationsToI18n', () => {
        it('should refresh the active language after applying admin changes', async () => {
            await applyTranslationsToI18n(i18next as any, 'ru', { common: { save: 'Сохранить' } });

            expect(i18next.addResourceBundle).toHaveBeenCalledWith(
                'ru',
                'translation',
                { common: { save: 'Сохранить' } },
                true,
                true
            );
            expect(i18next.changeLanguage).toHaveBeenCalledWith('ru');
        });
    });
});
