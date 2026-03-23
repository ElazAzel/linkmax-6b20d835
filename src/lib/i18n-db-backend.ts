import { i18n } from 'i18next';
import { supabase } from '@/platform/supabase/client';
import { logger } from './utils/logger';

/**
 * Fetches translations for a specific language from Supabase.
 */
export async function fetchTranslationsFromDB(lng: string): Promise<any> {
    try {
        const { data, error } = await (supabase
            .from('i18n_translations' as any) as any)
            .select('data')
            .eq('lang_code', lng)
            .maybeSingle();

        if (error) {
            // PGRST205 = table not found — expected when i18n_translations table hasn't been created
            if (error.code !== 'PGRST205') {
                logger.error(`Error fetching translations for ${lng}:`, error);
            }
            return null;
        }

        return data?.data || null;
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
export async function upsertToDB(lng: string, jsonData: any) {
    const { error } = await (supabase
        .from('i18n_translations' as any) as any)
        .upsert({
            lang_code: lng,
            data: jsonData,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'lang_code'
        });

    if (error) {
        logger.error(`Failed to push ${lng} to DB:`, error);
        throw error;
    }

    logger.info(`Pushed ${lng} to DB successfully`);
}
