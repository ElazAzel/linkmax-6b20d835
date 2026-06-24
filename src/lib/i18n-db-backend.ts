import { i18n } from 'i18next';
import { supabase } from '@/platform/supabase/client';
import { logger } from './utils/logger';
import type { Json } from '@/platform/supabase/types';

interface I18nTranslationRow {
    lang_code: string;
    data: Record<string, unknown>;
    updated_at: string;
}

/**
 * Fetches translations for a specific language from Supabase.
 */
export async function fetchTranslationsFromDB(lng: string): Promise<Record<string, unknown> | null> {
    try {
        const { data, error } = await supabase
            .from('i18n_translations' as never)
            .select('data')
            .eq('lang_code', lng)
            .maybeSingle();

        if (error) {
            if (error.code !== 'PGRST205') {
                logger.error(`Error fetching translations for ${lng}:`, error);
            }
            return null;
        }

        return (data as { data: Record<string, unknown> } | null)?.data || null;
    } catch (err) {
        logger.error(`Catch error fetching translations for ${lng}:`, err);
        return null;
    }
}

/**
 * Synchronizes i18next with translations stored in the database.
 */
export async function syncI18nWithDB(i18nInstance: i18n, lng?: string) {
    const languagesToSync = lng ? [lng] : i18nInstance.languages || [i18nInstance.language];

    for (const l of languagesToSync) {
        const dbData = await fetchTranslationsFromDB(l);
        if (dbData) {
            i18nInstance.addResourceBundle(l, 'translation', dbData, true, true);
            logger.info(`Synced i18n ${l} from DB`);
        }
    }
}

/**
 * Migration helper: Push local JSON data to DB.
 */
export async function upsertToDB(lng: string, jsonData: Record<string, unknown>) {
    const { error } = await supabase
        .from('i18n_translations' as never)
        .upsert({
            lang_code: lng,
            data: jsonData as Json,
            updated_at: new Date().toISOString()
        } as never, {
            onConflict: 'lang_code'
        });

    if (error) {
        logger.error(`Failed to push ${lng} to DB:`, error);
        throw error;
    }

    logger.info(`Pushed ${lng} to DB successfully`);
}
