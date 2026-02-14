import { useState, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
            // Parse JSON
            const translations = await parseJSONFile(file);

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Не авторизован');
                return null;
            }

            // Call Edge Function
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
                        translations,
                        action: applyImmediately ? 'apply' : 'validate',
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка загрузки');
            }

            const result: UploadResult = await response.json();
            setValidationResult(result.validation);

            if (result.validation.valid) {
                if (applyImmediately) {
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
            toast.error(error instanceof Error ? error.message : 'Ошибка загрузки файла');
            return null;
        } finally {
            setUploading(false);
        }
    }, [parseJSONFile]);

    // Apply validated language
    const applyLanguage = useCallback(async (
        languageCode: string,
        translations: Record<string, unknown>
    ): Promise<boolean> => {
        setUploading(true);

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
                        translations,
                        action: 'apply',
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка применения');
            }

            const result: UploadResult = await response.json();

            if (result.applied) {
                toast.success(`Язык ${languageCode.toUpperCase()} применён`);
                await loadLanguages(); // Reload languages
                return true;
            }

            return false;

        } catch (error) {
            logger.error('Apply error', error, { context: 'useLanguageUpload' });
            toast.error(error instanceof Error ? error.message : 'Ошибка применения языка');
            return false;
        } finally {
            setUploading(false);
        }
    }, [loadLanguages]);

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
