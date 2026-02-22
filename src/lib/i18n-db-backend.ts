import { i18n } from 'i18next';
import { supabase } from '@/integrations/supabase/client';
import { logger } from './utils/logger';

/**
 * Fetches translations for a specific language from Supabase.
 */
export async function fetchTranslationsFromDB(lng: string): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('i18n_translations')
            .select('data')
            .eq('lang_code', lng)
            .maybeSingle();

        if (error) {
            logger.error(`Error fetching translations for ${lng}:`, error);
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
 * This should be called on app initialization or after login.
 */
export async function syncI18nWithDB(i18nInstance: i18n, lng?: string) {
    const languagesToSync = lng ? [lng] : i18nInstance.languages || [i18nInstance.language];

    for (const l of languagesToSync) {
        const dbData = await fetchTranslationsFromDB(l);
        if (dbData) {
            // Deep merge with existing resources to preserve fallback keys not present in DB
            i18nInstance.addResourceBundle(l, 'translation', dbData, true, true);
            logger.info(`Synced i18n ${l} from DB`);
        }
    }
}

/**
 * Migration helper: Push local JSON data to DB.
 * Used once or when explicitly triggered by admin.
 */
export async function upsertToDB(lng: string, jsonData: any) {
    const { error } = await supabase
        .from('i18n_translations')
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
