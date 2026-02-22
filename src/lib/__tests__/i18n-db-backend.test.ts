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
        });
    });
});
