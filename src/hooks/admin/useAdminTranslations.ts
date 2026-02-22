import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { upsertToDB } from '@/lib/i18n-db-backend';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Static fallbacks
import ru from '@/i18n/locales/ru.json';
import en from '@/i18n/locales/en.json';
import kk from '@/i18n/locales/kk.json';

type TranslationData = Record<string, unknown>;

const TRANSLATIONS_QUERY_KEY = ['admin_translations'];

// Flatten nested JSON object to dot notation keys
export function flattenObject(obj: TranslationData, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj) return result;

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
    const queryClient = useQueryClient();

    const { data: dbTranslations, isLoading: loading } = useQuery({
        queryKey: TRANSLATIONS_QUERY_KEY,
        queryFn: async () => {
            // Use explicit casting as any to bypass lint errors for custom table not yet in generated types
            const { data, error } = await (supabase.from('i18n_translations' as any) as any)
                .select('lang_code, data');

            if (error) throw error;

            const result: Record<string, TranslationData> = {};
            (data as any[])?.forEach(item => {
                result[item.lang_code] = item.data;
            });
            return result;
        },
        enabled: isAdmin,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const translations = useMemo(() => {
        return {
            ru: JSON.parse(JSON.stringify(ru)),
            en: JSON.parse(JSON.stringify(en)),
            kk: JSON.parse(JSON.stringify(kk)),
            ...(dbTranslations || {})
        } as Record<string, TranslationData>;
    }, [dbTranslations]);

    const activeLanguages = useMemo(() => {
        const baseLangs = ['en', 'ru', 'kk'];
        const dbLangs = dbTranslations ? Object.keys(dbTranslations) : [];
        return Array.from(new Set([...baseLangs, ...dbLangs]));
    }, [dbTranslations]);

    const updateMutation = useMutation({
        mutationFn: async ({ lang, key, value }: { lang: string; key: string; value: string }) => {
            const updatedLangData = JSON.parse(JSON.stringify(translations[lang] || {}));
            setNestedValue(updatedLangData, key, value);
            await upsertToDB(lang, updatedLangData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY });
            toast.success('Сохранено в БД');
        },
        onError: (error) => {
            logger.error('Failed to update translation', error);
            toast.error('Ошибка сохранения');
        }
    });

    const multiUpsertMutation = useMutation({
        mutationFn: async (payload: { lang: string; data: TranslationData }[]) => {
            for (const item of payload) {
                await upsertToDB(item.lang, item.data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY });
            toast.success('Данные успешно синхронизированы');
        },
        onError: (error) => {
            logger.error('Failed multi upsert', error);
            toast.error('Ошибка синхронизации');
        }
    });

    const deleteKeyMutation = useMutation({
        mutationFn: async (key: string) => {
            const parts = key.split('.');
            for (const lang of activeLanguages) {
                const langObj = JSON.parse(JSON.stringify(translations[lang] || {}));
                let current: any = langObj;
                let found = true;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) {
                        found = false;
                        break;
                    }
                    current = current[parts[i]];
                }
                if (found && current[parts[parts.length - 1]] !== undefined) {
                    delete current[parts[parts.length - 1]];
                    await upsertToDB(lang, langObj);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY });
            toast.success('Ключ удалён отовсюду');
        },
        onError: (error) => {
            logger.error('Failed to delete key', error);
            toast.error('Ошибка при удалении ключа');
        }
    });

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

    return {
        translations,
        activeLanguages,
        allKeys,
        loading,
        saving: updateMutation.isPending || multiUpsertMutation.isPending || deleteKeyMutation.isPending,
        updateTranslation: updateMutation.mutateAsync,
        upsertFullTranslations: multiUpsertMutation.mutateAsync,
        deleteKey: deleteKeyMutation.mutateAsync,
        addLanguage: async (langCode: string, initialData: TranslationData) => {
            await multiUpsertMutation.mutateAsync([{ lang: langCode, data: initialData }]);
        }
    };
}
