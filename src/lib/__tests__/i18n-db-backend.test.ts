import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTranslationsFromDB, upsertToDB, syncI18nWithDB } from '../i18n-db-backend';
import { supabase } from '@/integrations/supabase/client';
import i18next from 'i18next';

vi.mock('i18next', () => ({
    default: {
        addResourceBundle: vi.fn(),
        changeLanguage: vi.fn(),
        language: 'ru'
    }
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn()
    }
}));

vi.mock('@/lib/utils/logger', () => ({
    logger: { error: vi.fn(), info: vi.fn() }
}));

describe('i18n-db-backend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchTranslationsFromDB', () => {
        it('should return data from supabase', async () => {
            const mockData = { data: { hello: 'привет' } };
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null })
                    })
                })
            } as any);

            const result = await fetchTranslationsFromDB('ru');
            expect(result).toEqual(mockData.data);
        });

        it('should return null on error', async () => {
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
                    })
                })
            } as any);

            const result = await fetchTranslationsFromDB('ru');
            expect(result).toBeNull();
        });
    });

    describe('upsertToDB', () => {
        it('should call supabase upsert with correct data', async () => {
            const langCode = 'en';
            const data = { welcome: 'Welcome' };
            vi.mocked(supabase.from).mockReturnValueOnce({
                upsert: vi.fn().mockResolvedValue({ error: null })
            } as any);

            await upsertToDB(langCode, data);
            expect(supabase.from).toHaveBeenCalledWith('i18n_translations');
        });
    });

    describe('syncI18nWithDB', () => {
        it('should add resource bundles to i18next', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: { data: { key: 'значение' } }, error: null })
                    })
                })
            } as any);

            await syncI18nWithDB(i18next as any, 'ru');

            expect(i18next.addResourceBundle).toHaveBeenCalledWith('ru', 'translation', { key: 'значение' }, true, true);
        });
    });
});
