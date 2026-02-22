import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { upsertToDB } from '@/lib/i18n-db-backend';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Static fallbacks
import ru from '@/i18n/locales/ru.json';
import en from '@/i18n/locales/en.json';
import kk from '@/i18n/locales/kk.json';

type TranslationData = Record<string, unknown>;

// Flatten nested JSON object to dot notation keys
export function flattenObject(obj: TranslationData, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value as TranslationData, newKey));
        } else {
            result[newKey] = String(value ?? '');
        }
    }
    return result;
}

// Set nested value by dot notation key
export function setNestedValue(obj: TranslationData, key: string, value: string): void {
    const parts = key.split('.');
    let current: TranslationData = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]] as TranslationData;
    }
    current[parts[parts.length - 1]] = value;
}

export function useAdminTranslations(isAdmin: boolean) {
    const [translations, setTranslations] = useState<Record<string, TranslationData>>({
        ru: JSON.parse(JSON.stringify(ru)),
        en: JSON.parse(JSON.stringify(en)),
        kk: JSON.parse(JSON.stringify(kk)),
    });
    const [activeLanguages, setActiveLanguages] = useState<string[]>(['en', 'ru', 'kk']);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;

        const loadFromDB = async () => {
            try {
                const { data, error } = await supabase.from('i18n_translations').select('lang_code, data');
                if (error) throw error;

                if (data && data.length > 0) {
                    const dbTranslations: Record<string, TranslationData> = {};
                    data.forEach(item => {
                        dbTranslations[item.lang_code] = item.data;
                    });
                    setTranslations(prev => ({ ...prev, ...dbTranslations }));
                    setActiveLanguages(prev => Array.from(new Set([...prev, ...data.map(d => d.lang_code)])));
                }
            } catch (err) {
                logger.error('Failed to load translations from DB', err);
            } finally {
                setLoading(false);
            }
        };

        loadFromDB();
    }, [isAdmin]);

    const allKeys = useMemo(() => {
        const keySet = new Set<string>();
        activeLanguages.forEach(lang => {
            if (translations[lang]) {
                Object.keys(flattenObject(translations[lang])).forEach(k => keySet.add(k));
            }
        });

        const sortedKeys = Array.from(keySet).sort();
        const missingKeys: string[] = [];
        const fullKeys: string[] = [];

        sortedKeys.forEach(key => {
            const isMissingSomewhere = activeLanguages.some(lang => {
                const flat = flattenObject(translations[lang] || {});
                return !flat[key]?.trim();
            });
            if (isMissingSomewhere) missingKeys.push(key);
            else fullKeys.push(key);
        });

        return { all: [...missingKeys, ...fullKeys], missingCount: missingKeys.length };
    }, [translations, activeLanguages]);

    const updateTranslation = async (lang: string, key: string, value: string) => {
        try {
            setSaving(true);
            const updatedLangData = JSON.parse(JSON.stringify(translations[lang] || {}));
            setNestedValue(updatedLangData, key, value);

            setTranslations(prev => ({ ...prev, [lang]: updatedLangData }));
            await upsertToDB(lang, updatedLangData);
            toast.success('Сохранено в БД');
        } catch (err) {
            toast.error('Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    return {
        translations,
        activeLanguages,
        setActiveLanguages,
        allKeys,
        loading,
        saving,
        setSaving,
        updateTranslation,
        setTranslations
    };
}
