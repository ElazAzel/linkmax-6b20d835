import { i18n } from 'i18next';
import { supabase } from '@/platform/supabase/client';
import { logger } from './utils/logger';

type TranslationPayload = Record<string, unknown>;

const isPlainObject = (value: unknown): value is TranslationPayload =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

function deepMerge(base: TranslationPayload, override: TranslationPayload): TranslationPayload {
    const out: TranslationPayload = { ...base };
    for (const [key, value] of Object.entries(override)) {
        const baseValue = out[key];
        if (isPlainObject(baseValue) && isPlainObject(value)) {
            out[key] = deepMerge(baseValue, value);
        } else {
            out[key] = value;
        }
    }
    return out;
}

export function normalizeTranslationPayload(payload: unknown): TranslationPayload | null {
    if (!isPlainObject(payload)) return null;

    const { translation, ...rest } = payload as TranslationPayload & {
        translation?: unknown;
    };

    if (isPlainObject(translation)) {
        return deepMerge(translation, rest);
    }

    return rest;
}

export async function applyTranslationsToI18n(
    i18nInstance: i18n,
    lng: string,
    payload: unknown
) {
    const normalized = normalizeTranslationPayload(payload);
    if (!normalized) return;

    i18nInstance.addResourceBundle(lng, 'translation', normalized, true, true);

    const activeLanguage = i18nInstance.language;
    if (activeLanguage === lng || activeLanguage?.startsWith(`${lng}-`)) {
        await i18nInstance.changeLanguage(activeLanguage);
    }
}

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
    const languagesToSync = lng
        ? [lng]
        : Array.from(new Set([i18nInstance.language, ...(i18nInstance.languages || [])].filter(Boolean)));

    for (const l of languagesToSync) {
        const dbData = await fetchTranslationsFromDB(l);
        if (dbData) {
            await applyTranslationsToI18n(i18nInstance, l, dbData);
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
