export type AppErrorCategory =
    | 'network'
    | 'auth'
    | 'validation'
    | 'rate_limit'
    | 'payment'
    | 'not_found'
    | 'unknown';

export interface NormalizedAppError {
    category: AppErrorCategory;
    safeMessage: string;
    i18nKey: string;
    isRecoverable: boolean;
    rawError: unknown;
}

/**
 * Extracts a string message from an unknown error object.
 */
function extractRawMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as any).message);
    }
    return String(error);
}

/**
 * Normalizes any caught error into a safe, standardized AppError object.
 * This prevents raw system strings from showing in the UI.
 */
export function normalizeAppError(error: unknown): NormalizedAppError {
    const rawMessage = extractRawMessage(error);
    const lowerMsg = rawMessage.toLowerCase();

    // 1. Network / Connection Errors
    if (
        lowerMsg.includes('network error') ||
        lowerMsg.includes('failed to fetch') ||
        lowerMsg.includes('timeout') ||
        lowerMsg.includes('connection')
    ) {
        return {
            category: 'network',
            safeMessage: 'Пожалуйста, проверьте подключение к интернету.', // Fallback RU
            i18nKey: 'errors.network',
            isRecoverable: true,
            rawError: error,
        };
    }

    // 2. Auth Errors
    // "invalid claim", "invalid jwt", "Bot domain invalid", "provider/internal/auth" etc.
    if (
        lowerMsg.includes('auth') ||
        lowerMsg.includes('jwt') ||
        lowerMsg.includes('token') ||
        lowerMsg.includes('credential') ||
        lowerMsg.includes('session') ||
        lowerMsg.includes('bot domain invalid') ||
        lowerMsg.includes('unauthorized') ||
        lowerMsg.includes('user not found') ||
        lowerMsg.includes('invalid claim')
    ) {
        return {
            category: 'auth',
            safeMessage: 'Ошибка авторизации. Пожалуйста, войдите снова.',
            i18nKey: 'errors.auth',
            isRecoverable: true,
            rawError: error,
        };
    }

    // 3. User Input / Validation Errors
    if (
        lowerMsg.includes('validation') ||
        lowerMsg.includes('required') ||
        lowerMsg.includes('min length') ||
        lowerMsg.includes('max length') ||
        lowerMsg.includes('invalid format') ||
        lowerMsg.includes('already exists') ||
        lowerMsg.includes('duplicate key') ||
        lowerMsg.includes('at least') ||
        lowerMsg.includes('password must')
    ) {
        return {
            category: 'validation',
            safeMessage: 'Пожалуйста, проверьте правильность введенных данных.',
            i18nKey: 'errors.validation',
            isRecoverable: true,
            rawError: error,
        };
    }

    // 4. Rate Limiting
    if (
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('too many requests') ||
        lowerMsg.includes('429')
    ) {
        return {
            category: 'rate_limit',
            safeMessage: 'Слишком много запросов. Пожалуйста, подождите немного.',
            i18nKey: 'errors.rateLimit',
            isRecoverable: true,
            rawError: error,
        };
    }

    // 5. Payment Errors
    if (
        lowerMsg.includes('payment') ||
        lowerMsg.includes('robokassa') ||
        lowerMsg.includes('card') ||
        lowerMsg.includes('transaction')
    ) {
        return {
            category: 'payment',
            safeMessage: 'Произошла ошибка при обработке платежа. Попробуйте еще раз или используйте другой способ оплаты.',
            i18nKey: 'errors.payment',
            isRecoverable: true,
            rawError: error,
        };
    }

    // 6. Not Found
    if (
        lowerMsg.includes('not found') ||
        lowerMsg.includes('404')
    ) {
        return {
            category: 'not_found',
            safeMessage: 'Запрашиваемые данные не найдены.',
            i18nKey: 'errors.notFound',
            isRecoverable: true,
            rawError: error,
        };
    }

    // Fallback for Unknown/System Errors
    return {
        category: 'unknown',
        safeMessage: 'Произошла непредвиденная ошибка. Мы уже работаем над её устранением.',
        i18nKey: 'errors.unknown',
        isRecoverable: false, // Usually system errors are not recoverable by the user
        rawError: error,
    };
}
