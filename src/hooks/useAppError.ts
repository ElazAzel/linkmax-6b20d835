import { useTranslation } from 'react-i18next';
import { normalizeAppError, NormalizedAppError } from '@/lib/errors/app-error-normalizer';
import { toast } from 'sonner';

interface UseAppErrorReturn {
    normalizeError: (error: unknown) => NormalizedAppError;
    getSafeMessage: (error: unknown) => string;
    handleError: (error: unknown, fallbackMessage?: string) => void;
}

/**
 * Hook to handle application errors uniformly.
 * Translates the normalized error category to a localized, safe user message.
 */
export function useAppError(): UseAppErrorReturn {
    const { t } = useTranslation();

    const normalizeError = (error: unknown): NormalizedAppError => {
        return normalizeAppError(error);
    };

    const getSafeMessage = (error: unknown, fallbackMessage?: string): string => {
        const normalized = normalizeAppError(error);

        // We try to translate using the generated i18nKey.
        // If translation is missing (equals the key), we use the fallbackMessage provided, 
        // or the default safeMessage from the normalizer.
        const translated = t(normalized.i18nKey);
        const hasTranslation = translated !== normalized.i18nKey;

        if (hasTranslation) {
            return translated;
        }

        if (fallbackMessage) {
            return fallbackMessage;
        }

        return normalized.safeMessage;
    };

    const handleError = (error: unknown, fallbackMessage?: string) => {
        const normalized = normalizeAppError(error);

        // Log the raw error for telemetry (but not to the UI)
        console.error('[AppErrorNormalizer]', normalized.category, normalized.rawError);

        // Get the localized safe message
        const displayMessage = getSafeMessage(error, fallbackMessage);

        // Display it to the user
        toast.error(displayMessage);
    };

    return {
        normalizeError,
        getSafeMessage,
        handleError,
    };
}
