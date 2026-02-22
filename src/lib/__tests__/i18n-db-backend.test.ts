import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTranslationsFromDB, upsertToDB, syncI18nWithDB } from '../i18n-db-backend';
import { supabase } from '@/platform/supabase/client';
import i18next from 'i18next';

// Mock i18next
vi.mock('i18next', () => ({
    default: {
        addResourceBundle: vi.fn(),
        changeLanguage: vi.fn(),
        language: 'ru'
    }
}));

describe('i18n-db-backend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchTranslationsFromDB', () => {
        it('should return data from supabase', async () => {
            const mockData = [{ lang_code: 'ru', data: { hello: 'привет' } }];
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            } as any);

            const result = await fetchTranslationsFromDB();
            expect(result).toEqual(mockData);
            expect(mockFrom).toHaveBeenCalledWith('i18n_translations');
        });

        it('should return empty array on error', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
            } as any);

            const result = await fetchTranslationsFromDB();
            expect(result).toEqual([]);
        });
    });

    describe('upsertToDB', () => {
        it('should call supabase upsert with correct data', async () => {
            const langCode = 'en';
            const data = { welcome: 'Welcome' };
            const mockFrom = vi.mocked(supabase.from);

            mockFrom.mockReturnValueOnce({
                upsert: vi.fn().mockResolvedValue({ error: null })
            } as any);

            const result = await upsertToDB(langCode, data);
            expect(result).toBe(true);
            expect(mockFrom).toHaveBeenCalledWith('i18n_translations');
        });
    });

    describe('syncI18nWithDB', () => {
        it('should add resource bundles to i18next', async () => {
            const mockTranslations = [
                { lang_code: 'ru', data: { key: 'значение' } },
                { lang_code: 'en', data: { key: 'value' } }
            ];

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockResolvedValue({ data: mockTranslations, error: null })
            } as any);

            await syncI18nWithDB();

            expect(i18next.addResourceBundle).toHaveBeenCalledTimes(2);
            expect(i18next.addResourceBundle).toHaveBeenCalledWith('ru', 'translation', { key: 'значение' }, true, true);
            expect(i18next.addResourceBundle).toHaveBeenCalledWith('en', 'translation', { key: 'value' }, true, true);
        });
    });
});
