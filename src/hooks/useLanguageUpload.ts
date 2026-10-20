import { useState, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import { logger } from '@/lib/utils/logger';
import i18n, { SUPPORTED_LANGUAGES } from '@/i18n/config';
import { applyTranslationsToI18n, upsertToDB, unwrapTranslationPayload } from '@/lib/i18n-db-backend';
import { validateTranslationUpload } from '@/lib/translation-validation';

export interface ValidationError {
    key: string;
    issue: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    stats: {
        totalKeys: number;
        missingKeys: number;
        extraKeys: number;
        emptyValues: number;
    };
}

export interface UploadResult {
    success: boolean;
    languageCode: string;
    validation: ValidationResult;
    applied: boolean;
}

interface Language {
    id: string;
    language_code: string;
    language_name: string;
    flag_emoji?: string;
    region?: string;
    translations: Record<string, unknown>;
    is_active: boolean;
    version: number;
    created_at: string;
    updated_at: string;
}

export function useLanguageUpload() {
    const [uploading, setUploading] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const { handleError } = useAppError();

    // Load all languages from database using RPC or edge function
    const loadLanguages = useCallback(async () => {
        setLoadingLanguages(true);
        try {
            // Use edge function since 'languages' table might not exist yet
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/language-upload`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({ action: 'list' }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setLanguages(data.languages || []);
            } else {
                // Fallback to empty
                setLanguages([]);
            }
        } catch (error) {
            logger.error('Error loading languages', error, { context: 'useLanguageUpload' });
            // Keep languages empty on error
            setLanguages([]);
        } finally {
            setLoadingLanguages(false);
        }
    }, []);

    // Parse and validate JSON file on client side
    const parseJSONFile = useCallback(async (file: File): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const json = JSON.parse(content);

                    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
                        throw new Error('Некорректный формат JSON. Ожидается объект.');
                    }

                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }, []);

    // Upload language file with validation
    const uploadLanguageFile = useCallback(async (
        file: File,
        languageCode: string,
        applyImmediately = false
    ): Promise<UploadResult | null> => {
        setUploading(true);
        setValidationResult(null);

        try {
            if (!SUPPORTED_LANGUAGES.includes(languageCode as typeof SUPPORTED_LANGUAGES[number])) {
                throw new Error('Этот язык пока не поддерживается интерфейсом');
            }
            // Parse JSON
            const translations = unwrapTranslationPayload(await parseJSONFile(file));
            if (!translations) throw new Error('Некорректный формат JSON');

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Не авторизован');
                return null;
            }

            const reference = unwrapTranslationPayload((await import('@/i18n/locales/en.json')).default) || {};
            const validation = validateTranslationUpload(translations, reference);
            const result: UploadResult = { success: validation.valid, languageCode, validation, applied: false };
            setValidationResult(result.validation);

            if (result.validation.valid) {
                if (applyImmediately) {
                    await upsertToDB(languageCode, translations);
                    await applyTranslationsToI18n(i18n, languageCode, translations);
                    result.applied = true;
                    toast.success(`Язык ${languageCode.toUpperCase()} успешно ${result.applied ? 'применён' : 'загружен'}`);
                } else {
                    toast.success('Валидация пройдена успешно');
                }
            } else {
                toast.warning(`Найдено ошибок: ${result.validation.errors.length}`);
            }

            return result;

        } catch (error) {
            logger.error('Upload error', error, { context: 'useLanguageUpload' });
            handleError(error, 'Ошибка загрузки файла');
            return null;
        } finally {
            setUploading(false);
        }
    }, [parseJSONFile, handleError]);

    // Apply validated language
    const applyLanguage = useCallback(async (
        languageCode: string,
        translations: Record<string, unknown>
    ): Promise<boolean> => {
        setUploading(true);

        try {
            if (!SUPPORTED_LANGUAGES.includes(languageCode as typeof SUPPORTED_LANGUAGES[number])) {
                throw new Error('Этот язык пока не поддерживается интерфейсом');
            }
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Не авторизован');
                return false;
            }

            const normalized = unwrapTranslationPayload(translations);
            if (!normalized) throw new Error('Некорректный формат JSON');
            const reference = unwrapTranslationPayload((await import('@/i18n/locales/en.json')).default) || {};
            const validation = validateTranslationUpload(normalized, reference);
            if (!validation.valid) throw new Error('Проверьте ошибки в файле переводов');
            // Use the same canonical table as the inline translation editor.
            // RLS remains responsible for admin authorization on the write.
            await upsertToDB(languageCode, normalized);
            await applyTranslationsToI18n(i18n, languageCode, normalized);
            toast.success(`Язык ${languageCode.toUpperCase()} применён`);
            return true;

        } catch (error) {
            logger.error('Apply error', error, { context: 'useLanguageUpload' });
            handleError(error, 'Ошибка применения языка');
            return false;
        } finally {
            setUploading(false);
        }
    }, [handleError]);

    // Delete language
    const deleteLanguage = useCallback(async (languageCode: string): Promise<boolean> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Не авторизован');
                return false;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/language-upload`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        languageCode,
                        action: 'delete',
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка удаления');
            }

            toast.success(`Язык ${languageCode.toUpperCase()} удалён`);
            await loadLanguages();
            return true;

        } catch (error) {
            logger.error('Delete error', error, { context: 'useLanguageUpload' });
            toast.error('Ошибка удаления языка');
            return false;
        }
    }, [loadLanguages]);

    return {
        uploading,
        validationResult,
        languages,
        loadingLanguages,
        uploadLanguageFile,
        applyLanguage,
        deleteLanguage,
        loadLanguages,
        setValidationResult,
    };
}
