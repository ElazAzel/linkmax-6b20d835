import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import i18n, { SUPPORTED_LANGUAGES, reloadLanguageResources } from '@/i18n/config';
import { applyTranslationsToI18n, upsertToDB, unwrapTranslationPayload, mergeTranslationPayloads } from '@/lib/i18n-db-backend';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Only the admin query loads the full catalog; public pages stay lazy.
const localeFiles = import.meta.glob('../../i18n/locales/*.json', { import: 'default' });

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

    const { data: resources, isLoading: loading, error, refetch, isFetching } = useQuery({
        queryKey: TRANSLATIONS_QUERY_KEY,
        queryFn: async () => {
            const [canonical, legacy, bundledEntries] = await Promise.all([
                (supabase.from('i18n_translations' as any) as any).select('lang_code, data'),
                (supabase.from('languages' as any) as any).select('language_code, translations').eq('is_active', true),
                Promise.all(SUPPORTED_LANGUAGES.map(async lang => {
                    const load = localeFiles[`../../i18n/locales/${lang}.json`];
                    return [lang, unwrapTranslationPayload(await load()) || {}] as const;
                })),
            ]);
            if (canonical.error) throw canonical.error;
            if (legacy.error && legacy.error.code !== 'PGRST205') throw legacy.error;
            const remote: Record<string, TranslationData> = {};
            for (const row of legacy.data || []) {
                remote[row.language_code] = unwrapTranslationPayload(row.translations) || {};
            }
            for (const row of canonical.data || []) {
                remote[row.lang_code] = unwrapTranslationPayload(row.data) || {};
            }
            return { bundled: Object.fromEntries(bundledEntries), remote };
        },
        enabled: isAdmin,
        staleTime: 60_000,
    });

    const translations = useMemo(() => {
        const result: Record<string, TranslationData> = {};
        for (const lang of new Set([...SUPPORTED_LANGUAGES, ...Object.keys(resources?.remote || {})])) {
            result[lang] = mergeTranslationPayloads(resources?.bundled[lang] || {}, resources?.remote[lang] || {});
        }
        return result;
    }, [resources]);

    const activeLanguages = useMemo(() => {
        return Object.keys(translations);
    }, [translations]);

    const sourceStats = useMemo(() => Object.fromEntries(activeLanguages.map(lang => {
        const remote = flattenObject(resources?.remote[lang] || {});
        const bundled = flattenObject(resources?.bundled[lang] || {});
        return [lang, {
            saved: Boolean(resources?.remote[lang]),
            storedFilled: Object.values(remote).filter(value => value.trim()).length,
            storedEmpty: Object.values(remote).filter(value => !value.trim()).length,
            fallbackFilled: Object.keys(bundled).filter(key => !remote[key]?.trim() && bundled[key]?.trim()).length,
        }];
    })), [activeLanguages, resources]);

    const ensureWritable = () => {
        if (!isAdmin || loading || error || !resources) {
            throw new Error('Сначала загрузите сохранённые переводы из базы данных');
        }
    };

    const flattenedTranslations = useMemo(() => {
        const result: Record<string, Record<string, string>> = {};
        for (const lang of activeLanguages) {
            if (translations[lang]) {
                result[lang] = flattenObject(translations[lang]);
            } else {
                result[lang] = {};
            }
        }
        return result;
    }, [translations, activeLanguages]);

    const updateMutation = useMutation({
        mutationFn: async ({ lang, key, value }: { lang: string; key: string; value: string }) => {
            ensureWritable();
            const updatedLangData = JSON.parse(JSON.stringify(resources?.remote[lang] || {}));
            setNestedValue(updatedLangData, key, value);
            await upsertToDB(lang, updatedLangData);
            return { lang, data: updatedLangData };
        },
        onSuccess: async ({ lang, data }) => {
            await applyTranslationsToI18n(i18n, lang, data);
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
            ensureWritable();
            for (const item of payload) {
                await upsertToDB(item.lang, item.data);
            }
            return payload;
        },
        onSuccess: async (payload) => {
            await Promise.all(payload.map((item) => applyTranslationsToI18n(i18n, item.lang, item.data)));
            queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY });
            toast.success('Данные успешно синхронизированы');
        },
        onError: (error) => {
            logger.error('Failed multi upsert', error);
            toast.error('Ошибка синхронизации');
        },
        // Earlier records may already have been saved when a later write fails.
        onSettled: () => queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY }),
    });

    const deleteKeyMutation = useMutation({
        mutationFn: async (key: string) => {
            ensureWritable();
            const updatedPayload: { lang: string; data: TranslationData }[] = [];
            const parts = key.split('.');
            for (const lang of activeLanguages) {
                const langObj = JSON.parse(JSON.stringify(resources?.remote[lang] || {}));
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
                    updatedPayload.push({ lang, data: langObj });
                }
            }
            return updatedPayload;
        },
        onSuccess: async (payload) => {
            await Promise.all(payload.map((item) => reloadLanguageResources(item.lang)));
            queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY });
            toast.success('Переопределение удалено. Встроенный перевод сохранён');
        },
        onError: (error) => {
            logger.error('Failed to delete key', error);
            toast.error('Ошибка при удалении ключа');
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: TRANSLATIONS_QUERY_KEY }),
    });

    const allKeys = useMemo(() => {
        const keySet = new Set<string>();
        activeLanguages.forEach(lang => {
            Object.keys(flattenedTranslations[lang] || {}).forEach(k => keySet.add(k));
        });

        const sortedKeys = Array.from(keySet).sort();
        const missingKeys: string[] = [];
        const fullKeys: string[] = [];

        sortedKeys.forEach(key => {
            const isMissingSomewhere = activeLanguages.some(lang => {
                return !flattenedTranslations[lang]?.[key]?.trim();
            });
            if (isMissingSomewhere) missingKeys.push(key);
            else fullKeys.push(key);
        });

        return { all: [...missingKeys, ...fullKeys], missingCount: missingKeys.length };
    }, [flattenedTranslations, activeLanguages]);

    return {
        translations,
        flattenedTranslations,
        activeLanguages,
        sourceStats,
        allKeys,
        loading,
        error,
        refetch,
        isFetching,
        saving: updateMutation.isPending || multiUpsertMutation.isPending || deleteKeyMutation.isPending,
        updateTranslation: updateMutation.mutateAsync,
        upsertFullTranslations: multiUpsertMutation.mutateAsync,
        deleteKey: deleteKeyMutation.mutateAsync,
        addLanguage: async (langCode: string, initialData: TranslationData) => {
            await multiUpsertMutation.mutateAsync([{ lang: langCode, data: initialData }]);
        }
    };
}
